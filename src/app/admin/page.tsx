import type { Metadata } from "next";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { bakuStartOfMonth, formatDateTime } from "@/lib/time";
import { rejectCompanyRequest } from "@/app/actions/admin";
import { StatCard } from "@/components/stat-card";
import { ApproveRequestForm } from "./approve-request-form";

export const metadata: Metadata = { title: "Admin" };

export default async function AdminPage() {
  // Layout yoxlayır, amma səhifə layout-dan asılı olmadan da qorunmalıdır
  await requireUser("ADMIN");
  const now = new Date();
  const monthStart = bakuStartOfMonth();

  const [companies, subscribers, restaurants, month, requests, corporatePlans, revenue] = await Promise.all([
    db.company.count({ where: { status: "ACTIVE" } }),
    db.subscription.count({ where: { status: "ACTIVE", endsAt: { gt: now } } }),
    db.restaurant.count({ where: { active: true } }),
    db.voucher.aggregate({
      where: { status: "USED", usedAt: { gte: monthStart } },
      _count: true,
      _sum: { billAmount: true },
    }),
    db.companyRequest.findMany({ where: { status: "NEW" }, orderBy: { createdAt: "desc" } }),
    db.plan.findMany({ where: { type: "CORPORATE", active: true }, orderBy: { sortOrder: "asc" } }),
    db.subscription.findMany({
      where: { status: "ACTIVE", endsAt: { gt: now } },
      select: { plan: { select: { priceMonthly: true } } },
    }),
  ]);
  const mrr = revenue.reduce((s, r) => s + r.plan.priceMonthly, 0);
  const voenTaken = new Set(
    (await db.company.findMany({ where: { voen: { in: requests.map((r) => r.voen) } }, select: { voen: true } })).map(
      (c) => c.voen,
    ),
  );

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <StatCard label="Aktiv abunəlik" value={subscribers.toString()} />
        <StatCard label="Aylıq gəlir (MRR)" value={`${mrr.toFixed(2)} ₼`} tone="green" />
        <StatCard label="Korporativ müştəri" value={companies.toString()} />
        <StatCard label="Partnyor restoran" value={restaurants.toString()} />
        <StatCard
          label="Bu ay nahar"
          value={month._count.toString()}
          hint={`${(month._sum.billAmount ?? 0).toFixed(0)} ₼ restoranlara dövriyyə`}
        />
      </div>

      <section className="space-y-3">
        <h2 className="text-lg font-bold">Yeni korporativ müraciətlər ({requests.length})</h2>
        {requests.length === 0 && <p className="card text-sm text-stone-500">Yeni müraciət yoxdur.</p>}
        {requests.map((r) => (
          <div key={r.id} className="card grid gap-5 lg:grid-cols-[1fr_1.2fr]">
            <div className="space-y-1 text-sm">
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-base font-bold">{r.companyName}</p>
                {voenTaken.has(r.voen) && <span className="badge bg-blue-100 text-blue-800">Mövcud müştəri</span>}
              </div>
              <p className="text-stone-500">VÖEN {r.voen} · {formatDateTime(r.createdAt)}</p>
              <p>
                {r.contactName} · {r.contactEmail} · {r.contactPhone}
              </p>
              <p>
                İşçi sayı: <b>{r.employeeCount}</b>
              </p>
              {r.message && <p className="rounded-lg bg-stone-50 p-2 text-stone-600">{r.message}</p>}
              <form action={rejectCompanyRequest} className="pt-2">
                <input type="hidden" name="requestId" value={r.id} />
                <button className="btn-danger btn-sm">Rədd et</button>
              </form>
            </div>
            <ApproveRequestForm
              requestId={r.id}
              employeeCount={r.employeeCount}
              plans={corporatePlans.map((p) => ({ id: p.id, label: `${p.name} — ${p.priceMonthly.toFixed(2)} ₼/işçi` }))}
            />
          </div>
        ))}
      </section>
    </div>
  );
}
