import "server-only";
import { db } from "./db";

/** İstifadəçinin hazırda qüvvədə olan abunəliyi (fərdi və ya şirkət hesabına) */
export async function getActiveSubscription(userId: string, now: Date = new Date()) {
  const sub = await db.subscription.findFirst({
    where: { userId, status: "ACTIVE", startsAt: { lte: now }, endsAt: { gt: now } },
    include: { plan: true, company: true },
    orderBy: { endsAt: "desc" },
  });
  // Şirkət müqaviləsi dayandırılıbsa, işçi abunəliyi də işləmir
  if (sub?.company && sub.company.status !== "ACTIVE") return null;
  return sub;
}

export type ActiveSubscription = NonNullable<Awaited<ReturnType<typeof getActiveSubscription>>>;

/** Restoranın verdiyi endirim planın maksimum endirimini keçə bilməz */
export function effectiveDiscount(planPercent: number, restaurantPercent: number) {
  return Math.min(planPercent, restaurantPercent);
}

export type JoinResult = { ok: true; companyName: string } | { ok: false; error: string };

/** İşçini dəvət kodu ilə şirkətə qoşur və müqavilə bitənə qədər korporativ abunəlik yaradır */
export async function joinCompanyByInviteCode(userId: string, rawCode: string): Promise<JoinResult> {
  const code = rawCode.trim().toUpperCase();
  if (!code) return { ok: false, error: "Şirkət kodunu daxil edin" };

  const company = await db.company.findUnique({
    where: { inviteCode: code },
    include: { _count: { select: { employees: { where: { role: "USER" } } } } },
  });
  const now = new Date();
  if (!company) return { ok: false, error: "Şirkət kodu tapılmadı" };
  if (company.status !== "ACTIVE" || company.contractEnd <= now) {
    return { ok: false, error: "Bu şirkətin müqaviləsi aktiv deyil" };
  }
  if (company._count.employees >= company.employeeLimit) {
    return { ok: false, error: "Şirkətin işçi limiti dolub. Şirkət admininə müraciət edin" };
  }

  const user = await db.user.findUniqueOrThrow({ where: { id: userId } });
  if (user.role !== "USER") return { ok: false, error: "Yalnız abunəçi hesabları şirkətə qoşula bilər" };
  if (user.companyId === company.id) return { ok: false, error: "Siz artıq bu şirkətə qoşulmusunuz" };
  if (user.companyId) return { ok: false, error: "Siz artıq başqa şirkətə bağlısınız" };

  await db.$transaction([
    db.user.update({ where: { id: userId }, data: { companyId: company.id } }),
    db.subscription.create({
      data: {
        userId,
        planId: company.planId,
        companyId: company.id,
        source: "COMPANY",
        startsAt: now,
        endsAt: company.contractEnd,
      },
    }),
  ]);
  return { ok: true, companyName: company.name };
}
