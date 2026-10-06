import type { Metadata } from "next";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { bakuStartOfMonth, daysUntil, formatDate } from "@/lib/time";
import { regenerateInviteCode, removeEmployee } from "@/app/actions/company";
import { StatCard } from "@/components/stat-card";
import { LimitRequestForm } from "./limit-request-form";

export const metadata: Metadata = { title: "Şirkət paneli" };

const COMPANY_STATUS: Record<string, [string, string]> = {
  ACTIVE: ["Aktiv", "bg-emerald-100 text-emerald-800"],
  SUSPENDED: ["Dayandırılıb", "bg-red-100 text-red-700"],
  ENDED: ["Bitib", "bg-stone-100 text-stone-600"],
};

export default async function CompanyPage() {
  const admin = await requireUser("COMPANY_ADMIN");
  if (!admin.companyId) notFound();

  const monthStart = bakuStartOfMonth();
  const company = await db.company.findUniqueOrThrow({
    where: { id: admin.companyId },
    include: {
      plan: true,
      employees: {
        where: { role: "USER" },
        orderBy: { name: "asc" },
        include: {
          vouchers: { where: { status: "USED", usedAt: { gte: monthStart } }, select: { discountAmount: true } },
        },
      },
    },
  });

  const employees = company.employees.map((e) => ({
    ...e,
    monthCount: e.vouchers.length,
    monthSaved: e.vouchers.reduce((s, v) => s + (v.discountAmount ?? 0), 0),
  }));
  const monthMeals = employees.reduce((s, e) => s + e.monthCount, 0);
  const monthSaved = employees.reduce((s, e) => s + e.monthSaved, 0);
  const activeUsers = employees.filter((e) => e.monthCount > 0).length;
  const invoice = employees.length * company.plan.priceMonthly;
  const daysLeft = daysUntil(company.contractEnd);

  const h = await headers();
  const origin = `${h.get("x-forwarded-proto") ?? "http"}://${h.get("host")}`;
  const inviteLink = `${origin}/register?code=${company.inviteCode}`;
  const [statusLabel, statusClass] = COMPANY_STATUS[company.status] ?? [company.status, ""];

  return (
    <div className="container-page space-y-6 py-10">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm text-stone-500">Şirkət paneli</p>
          <h1 className="text-3xl font-bold">{company.name}</h1>
          <p className="text-sm text-stone-500">VÖEN {company.voen}</p>
        </div>
        <span className={`badge ${statusClass} text-sm`}>{statusLabel}</span>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Qoşulmuş işçilər" value={`${employees.length} / ${company.employeeLimit}`} />
        <StatCard label="Bu ay endirimli nahar" value={monthMeals.toString()} hint={`${activeUsers} aktiv işçi`} />
        <StatCard label="İşçilərin bu ay qənaəti" value={`${monthSaved.toFixed(2)} ₼`} tone="green" />
        <StatCard
          label="Aylıq hesab (təxmini)"
          value={`${invoice.toFixed(2)} ₼`}
          hint={`${employees.length} × ${company.plan.priceMonthly.toFixed(2)} ₼`}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="card space-y-3">
          <h2 className="font-bold">Müqavilə</h2>
          <dl className="grid grid-cols-2 gap-3 text-sm">
            <Item label="Müqavilə №" value={company.contractNo} mono />
            <Item label="Plan" value={`${company.plan.name} · ${company.plan.discountPercent}%`} />
            <Item label="Başlama" value={formatDate(company.contractStart)} />
            <Item label="Bitmə" value={`${formatDate(company.contractEnd)} (${daysLeft} gün)`} />
          </dl>
          <details className="border-t border-stone-100 pt-3">
            <summary className="cursor-pointer text-sm font-semibold text-brand-600">
              Limit artırılması / müqavilənin uzadılması
            </summary>
            <LimitRequestForm current={company.employeeLimit} />
          </details>
        </div>

        <div className="card space-y-3">
          <h2 className="font-bold">İşçiləri dəvət edin</h2>
          <p className="text-sm text-stone-600">
            İşçilər qeydiyyat zamanı bu kodu daxil etməklə və ya linkə keçməklə şirkətə qoşulur.
          </p>
          <div className="flex items-center justify-between rounded-xl bg-stone-100 p-4">
            <span className="font-mono text-2xl font-extrabold tracking-widest">{company.inviteCode}</span>
            <form action={regenerateInviteCode}>
              <button className="btn-outline btn-sm" title="Köhnə kod dərhal etibarsız olacaq">
                Yeni kod
              </button>
            </form>
          </div>
          <input readOnly value={inviteLink} className="input font-mono text-xs" aria-label="Dəvət linki" />
        </div>
      </div>

      <section className="card overflow-x-auto p-0">
        <h2 className="p-5 pb-2 font-bold">İşçilər</h2>
        {employees.length ? (
          <table className="table">
            <thead>
              <tr>
                <th>Ad</th>
                <th>E-poçt</th>
                <th>Bu ay nahar</th>
                <th>Bu ay qənaət</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {employees.map((e) => (
                <tr key={e.id}>
                  <td className="font-medium">{e.name}</td>
                  <td className="text-stone-600">{e.email}</td>
                  <td>{e.monthCount}</td>
                  <td>{e.monthSaved.toFixed(2)} ₼</td>
                  <td className="text-right">
                    <form action={removeEmployee}>
                      <input type="hidden" name="employeeId" value={e.id} />
                      <button className="btn-danger btn-sm">Çıxar</button>
                    </form>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="p-5 pt-0 text-sm text-stone-500">Hələ heç bir işçi qoşulmayıb. Dəvət kodunu paylaşın.</p>
        )}
      </section>
    </div>
  );
}

function Item({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <dt className="text-stone-500">{label}</dt>
      <dd className={`font-medium ${mono ? "font-mono" : ""}`}>{value}</dd>
    </div>
  );
}
