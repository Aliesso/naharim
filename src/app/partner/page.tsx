import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { expireStaleVouchers } from "@/lib/vouchers";
import { bakuClock, bakuStartOfMonth, formatTime, isLunchOpen, parseWorkDays } from "@/lib/time";
import { StatCard } from "@/components/stat-card";
import { RedeemForm } from "./redeem-form";
import { SettingsForm } from "./settings-form";

export const metadata: Metadata = { title: "Restoran paneli" };

export default async function PartnerPage() {
  const user = await requireUser("RESTAURANT");
  if (!user.restaurantId) notFound();

  await expireStaleVouchers({ restaurantId: user.restaurantId });
  const today = bakuClock().startOfDay;
  const monthStart = bakuStartOfMonth();

  const [restaurant, todayUsed, month, pending] = await Promise.all([
    db.restaurant.findUniqueOrThrow({ where: { id: user.restaurantId } }),
    db.voucher.findMany({
      where: { restaurantId: user.restaurantId, status: "USED", usedAt: { gte: today } },
      include: { user: { select: { name: true } } },
      orderBy: { usedAt: "desc" },
    }),
    db.voucher.aggregate({
      where: { restaurantId: user.restaurantId, status: "USED", usedAt: { gte: monthStart } },
      _count: true,
      _sum: { billAmount: true, discountAmount: true },
    }),
    db.voucher.count({ where: { restaurantId: user.restaurantId, status: "ACTIVE" } }),
  ]);

  const todayRevenue = todayUsed.reduce((s, v) => s + (v.billAmount ?? 0) - (v.discountAmount ?? 0), 0);
  const open = isLunchOpen(restaurant);

  return (
    <div className="container-page space-y-6 py-10">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm text-stone-500">Restoran paneli</p>
          <h1 className="text-3xl font-bold">{restaurant.name}</h1>
        </div>
        <span className={`badge text-sm ${open ? "bg-emerald-100 text-emerald-800" : "bg-stone-200 text-stone-600"}`}>
          {open ? "Nahar endirimi aktivdir" : `Nahar saatı: ${restaurant.lunchStart}–${restaurant.lunchEnd}`}
        </span>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.1fr_1fr]">
        <div className="card p-6">
          <h2 className="text-lg font-bold">Kuponu təsdiqlə</h2>
          <p className="text-sm text-stone-500">Müştərinin göstərdiyi 6 simvollu kodu və hesabın məbləğini daxil edin.</p>
          <RedeemForm />
        </div>
        <div className="grid content-start gap-4 sm:grid-cols-2">
          <StatCard label="Bu gün qəbul edilən" value={todayUsed.length.toString()} hint={`${pending} gözləyən kupon`} />
          <StatCard label="Bu gün dövriyyə" value={`${todayRevenue.toFixed(2)} ₼`} hint="endirimdən sonra" />
          <StatCard label="Bu ay qonaq" value={month._count.toString()} />
          <StatCard
            label="Bu ay dövriyyə"
            value={`${((month._sum.billAmount ?? 0) - (month._sum.discountAmount ?? 0)).toFixed(2)} ₼`}
            hint={`${(month._sum.discountAmount ?? 0).toFixed(2)} ₼ endirim verilib`}
            tone="green"
          />
        </div>
      </div>

      <section className="card overflow-x-auto p-0">
        <h2 className="p-5 pb-2 font-bold">Bu günün kuponları</h2>
        {todayUsed.length ? (
          <table className="table">
            <thead>
              <tr>
                <th>Saat</th>
                <th>Kod</th>
                <th>Müştəri</th>
                <th>Hesab</th>
                <th>Endirim</th>
                <th>Ödənilib</th>
              </tr>
            </thead>
            <tbody>
              {todayUsed.map((v) => (
                <tr key={v.id}>
                  <td>{v.usedAt ? formatTime(v.usedAt) : "—"}</td>
                  <td className="font-mono">{v.code}</td>
                  <td>{v.user.name}</td>
                  <td>{v.billAmount?.toFixed(2)} ₼</td>
                  <td>
                    −{v.discountAmount?.toFixed(2)} ₼ <span className="text-stone-400">({v.discountPercent}%)</span>
                  </td>
                  <td className="font-semibold">{((v.billAmount ?? 0) - (v.discountAmount ?? 0)).toFixed(2)} ₼</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="p-5 pt-0 text-sm text-stone-500">Bu gün hələ kupon qəbul olunmayıb.</p>
        )}
      </section>

      <section className="card p-6">
        <h2 className="text-lg font-bold">Nahar endirimi parametrləri</h2>
        <SettingsForm
          lunchStart={restaurant.lunchStart}
          lunchEnd={restaurant.lunchEnd}
          discountPercent={restaurant.discountPercent}
          workDays={parseWorkDays(restaurant.workDays)}
        />
      </section>
    </div>
  );
}
