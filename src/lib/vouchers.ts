import "server-only";
import { db } from "./db";
import { randomCode } from "./codes";
import { VOUCHER_TTL_MINUTES } from "./constants";
import { bakuClock, isLunchOpen } from "./time";
import { effectiveDiscount, getActiveSubscription } from "./subscriptions";

/** Vaxtı keçmiş, istifadə olunmamış kuponları EXPIRED edir */
export async function expireStaleVouchers(where: { userId?: string; restaurantId?: string } = {}) {
  await db.voucher.updateMany({
    where: { ...where, status: "ACTIVE", expiresAt: { lte: new Date() } },
    data: { status: "EXPIRED" },
  });
}

/** Bu gün istifadə olunmuş və ya hələ aktiv olan kuponların sayı (vaxtı keçənlər limitə sayılmır) */
export async function countTodayVouchers(userId: string) {
  return db.voucher.count({
    where: {
      userId,
      createdAt: { gte: bakuClock().startOfDay },
      status: { in: ["ACTIVE", "USED"] },
    },
  });
}

export type IssueResult =
  | { ok: true; code: string }
  | { ok: false; error: string };

export async function issueVoucher(userId: string, restaurantId: string): Promise<IssueResult> {
  const restaurant = await db.restaurant.findUnique({ where: { id: restaurantId } });
  if (!restaurant || !restaurant.active) return { ok: false, error: "Restoran tapılmadı" };

  if (!isLunchOpen(restaurant)) {
    return {
      ok: false,
      error: `Endirim yalnız nahar saatlarında (${restaurant.lunchStart}–${restaurant.lunchEnd}) keçərlidir`,
    };
  }

  const sub = await getActiveSubscription(userId);
  if (!sub) return { ok: false, error: "Aktiv abunəliyiniz yoxdur" };

  await expireStaleVouchers({ userId });

  const active = await db.voucher.findFirst({ where: { userId, status: "ACTIVE" } });
  if (active) return { ok: false, error: "Artıq aktiv kuponunuz var. Əvvəlcə onu istifadə edin və ya vaxtının bitməsini gözləyin" };

  const usedToday = await countTodayVouchers(userId);
  if (usedToday >= sub.plan.dailyLimit) {
    return { ok: false, error: `Gündəlik limit (${sub.plan.dailyLimit}) dolub. Sabah yenidən yoxlayın` };
  }

  const expiresAt = new Date(Date.now() + VOUCHER_TTL_MINUTES * 60_000);
  // Kod toqquşması ehtimalı çox aşağıdır, amma unikal indeks pozularsa yenidən cəhd edirik
  for (let attempt = 0; attempt < 5; attempt++) {
    try {
      const v = await db.voucher.create({
        data: {
          code: randomCode(6),
          userId,
          restaurantId,
          discountPercent: effectiveDiscount(sub.plan.discountPercent, restaurant.discountPercent),
          expiresAt,
        },
      });
      return { ok: true, code: v.code };
    } catch (e) {
      if (attempt === 4) throw e;
    }
  }
  return { ok: false, error: "Kupon yaradıla bilmədi" };
}

export type RedeemResult =
  | { ok: true; customer: string; billAmount: number; discountAmount: number; payAmount: number; discountPercent: number }
  | { ok: false; error: string };

/** Restoran kassası: kodu yoxlayır, hesab məbləğinə endirimi tətbiq edir və kuponu bağlayır */
export async function redeemVoucher(
  restaurantId: string,
  code: string,
  billAmount: number,
): Promise<RedeemResult> {
  if (!Number.isFinite(billAmount) || billAmount <= 0) {
    return { ok: false, error: "Hesab məbləğini düzgün daxil edin" };
  }
  await expireStaleVouchers({ restaurantId });

  const voucher = await db.voucher.findUnique({ where: { code }, include: { user: true } });
  if (!voucher || voucher.restaurantId !== restaurantId) return { ok: false, error: "Kod bu restoran üçün tapılmadı" };
  if (voucher.status === "USED") return { ok: false, error: "Bu kod artıq istifadə olunub" };
  if (voucher.status === "EXPIRED") return { ok: false, error: "Kodun vaxtı bitib" };

  const discountAmount = Math.round(billAmount * voucher.discountPercent) / 100;

  // Eyni kodun iki kassada eyni anda istifadəsinin qarşısını almaq üçün status şərti ilə yeniləyirik
  const { count } = await db.voucher.updateMany({
    where: { id: voucher.id, status: "ACTIVE" },
    data: { status: "USED", usedAt: new Date(), billAmount, discountAmount },
  });
  if (count === 0) return { ok: false, error: "Bu kod artıq istifadə olunub" };

  return {
    ok: true,
    customer: voucher.user.name,
    billAmount,
    discountAmount,
    payAmount: Math.round((billAmount - discountAmount) * 100) / 100,
    discountPercent: voucher.discountPercent,
  };
}
