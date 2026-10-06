import type { Metadata } from "next";
import Link from "next/link";
import QRCode from "qrcode";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { getActiveSubscription } from "@/lib/subscriptions";
import { countTodayVouchers, expireStaleVouchers } from "@/lib/vouchers";
import { formatDate, formatDateTime } from "@/lib/time";
import { cancelSubscription } from "@/app/actions/subscriber";
import { Countdown } from "./countdown";
import { JoinCompanyForm } from "./join-company-form";

export const metadata: Metadata = { title: "Panelim" };

const STATUS: Record<string, [string, string]> = {
  USED: ["İstifadə olunub", "bg-emerald-100 text-emerald-800"],
  EXPIRED: ["Vaxtı bitib", "bg-stone-100 text-stone-500"],
  ACTIVE: ["Aktiv", "bg-brand-100 text-brand-700"],
};

export default async function DashboardPage({ searchParams }: PageProps<"/dashboard">) {
  const user = await requireUser("USER");
  const { welcome, joinError } = await searchParams;

  await expireStaleVouchers({ userId: user.id });
  const [sub, active, history, usedToday, totals] = await Promise.all([
    getActiveSubscription(user.id),
    db.voucher.findFirst({ where: { userId: user.id, status: "ACTIVE" }, include: { restaurant: true } }),
    db.voucher.findMany({
      where: { userId: user.id },
      include: { restaurant: true },
      orderBy: { createdAt: "desc" },
      take: 15,
    }),
    countTodayVouchers(user.id),
    db.voucher.aggregate({
      where: { userId: user.id, status: "USED" },
      _sum: { discountAmount: true },
      _count: true,
    }),
  ]);
  const qr = active ? await QRCode.toDataURL(active.code, { margin: 1, width: 220 }) : null;

  return (
    <div className="container-page space-y-6 py-10">
      <div>
        <h1 className="text-3xl font-bold">Salam, {user.name.split(" ")[0]} 👋</h1>
        <p className="text-stone-600">Bu gün nahar harada olacaq?</p>
      </div>

      {welcome === "company" && <Notice tone="ok">Şirkətinizə uğurla qoşuldunuz — korporativ abunəliyiniz aktivdir.</Notice>}
      {welcome === "plan" && <Notice tone="ok">Abunəliyiniz aktivləşdi. Nuş olsun!</Notice>}
      {typeof joinError === "string" && <Notice tone="error">Şirkətə qoşulmaq alınmadı: {joinError}</Notice>}

      {active && qr && (
        <section id="kupon" className="card scroll-mt-24 border-brand-500 ring-4 ring-brand-100">
          <div className="flex flex-col items-center gap-6 sm:flex-row">
            {/* eslint-disable-next-line @next/next/no-img-element -- data URL */}
            <img src={qr} alt="Kupon QR kodu" className="h-44 w-44 rounded-xl border border-stone-200" />
            <div className="flex-1 space-y-2 text-center sm:text-left">
              <p className="text-sm text-stone-500">Aktiv kupon · {active.restaurant.name}</p>
              <p className="font-mono text-5xl font-extrabold tracking-[0.25em]">{active.code}</p>
              <p className="text-lg font-bold text-brand-600">−{active.discountPercent}% endirim</p>
              <Countdown expiresAt={active.expiresAt.toISOString()} />
              <p className="text-xs text-stone-500">Kodu kassada göstərin və ya deyin.</p>
            </div>
          </div>
        </section>
      )}

      <div className="grid gap-4 md:grid-cols-3">
        <div className="card md:col-span-2">
          <p className="text-sm text-stone-500">Abunəlik</p>
          {sub ? (
            <div className="mt-2 flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="text-2xl font-bold">
                  {sub.plan.name}{" "}
                  {sub.source === "COMPANY" && (
                    <span className="badge bg-ink align-middle text-white">{sub.company?.name}</span>
                  )}
                </p>
                <p className="text-sm text-stone-600">
                  {sub.plan.discountPercent}%-ə qədər endirim · gündə {sub.plan.dailyLimit} nahar · {formatDate(sub.endsAt)}-dək
                </p>
                <p className="mt-2 text-sm">
                  Bu gün: <b>{usedToday}</b> / {sub.plan.dailyLimit} istifadə
                </p>
              </div>
              <div className="flex gap-2">
                <Link href="/restaurants?open=1" className="btn-primary">İndi aktiv restoranlar</Link>
                {sub.source === "INDIVIDUAL" && (
                  <form action={cancelSubscription}>
                    <button className="btn-danger">Ləğv et</button>
                  </form>
                )}
              </div>
            </div>
          ) : (
            <div className="mt-2 flex flex-wrap items-center justify-between gap-4">
              <p className="text-stone-600">Aktiv abunəliyiniz yoxdur.</p>
              <Link href="/plans" className="btn-primary">Plan seç</Link>
            </div>
          )}
        </div>

        <div className="card">
          <p className="text-sm text-stone-500">Ümumi qənaət</p>
          <p className="mt-2 text-3xl font-extrabold text-emerald-600">
            {(totals._sum.discountAmount ?? 0).toFixed(2)} AZN
          </p>
          <p className="text-sm text-stone-500">{totals._count} endirimli nahar</p>
        </div>
      </div>

      {!user.companyId && (
        <div className="card">
          <h2 className="font-bold">Şirkətiniz Naharim ilə əməkdaşlıq edir?</h2>
          <p className="text-sm text-stone-600">HR-dan aldığınız dəvət kodunu daxil edin — abunəlik pulsuz olacaq.</p>
          <JoinCompanyForm />
        </div>
      )}

      <section className="card overflow-x-auto p-0">
        <h2 className="p-5 pb-2 font-bold">Son kuponlar</h2>
        {history.length ? (
          <table className="table">
            <thead>
              <tr>
                <th>Tarix</th>
                <th>Restoran</th>
                <th>Kod</th>
                <th>Hesab</th>
                <th>Qənaət</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {history.map((v) => (
                <tr key={v.id}>
                  <td className="whitespace-nowrap">{formatDateTime(v.createdAt)}</td>
                  <td>{v.restaurant.name}</td>
                  <td className="font-mono">{v.code}</td>
                  <td>{v.billAmount != null ? `${v.billAmount.toFixed(2)} ₼` : "—"}</td>
                  <td className="font-semibold text-emerald-700">
                    {v.discountAmount != null ? `${v.discountAmount.toFixed(2)} ₼` : "—"}
                  </td>
                  <td>
                    <span className={`badge ${STATUS[v.status]?.[1]}`}>{STATUS[v.status]?.[0] ?? v.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="p-5 pt-0 text-sm text-stone-500">Hələ kupon istifadə etməmisiniz.</p>
        )}
      </section>
    </div>
  );
}

function Notice({ tone, children }: { tone: "ok" | "error"; children: React.ReactNode }) {
  return (
    <p
      className={`rounded-xl border p-4 text-sm ${
        tone === "ok" ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-red-200 bg-red-50 text-red-700"
      }`}
    >
      {children}
    </p>
  );
}
