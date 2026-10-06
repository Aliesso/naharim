import type { Metadata } from "next";
import Link from "next/link";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import { getActiveSubscription } from "@/lib/subscriptions";
import { SubscribeButton } from "./subscribe-button";

export const metadata: Metadata = { title: "Abunəlik planları" };

export default async function PlansPage({ searchParams }: PageProps<"/plans">) {
  const { welcome } = await searchParams;
  const [plans, user] = await Promise.all([
    db.plan.findMany({ where: { active: true }, orderBy: { sortOrder: "asc" } }),
    getCurrentUser(),
  ]);
  const sub = user?.role === "USER" ? await getActiveSubscription(user.id) : null;
  const individual = plans.filter((p) => p.type === "INDIVIDUAL");
  const corporate = plans.filter((p) => p.type === "CORPORATE");

  return (
    <div className="container-page py-10">
      {welcome && (
        <p className="mb-6 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-800">
          Xoş gəldiniz! Endirimlərdən istifadə üçün plan seçin və ya şirkətinizin kodu ilə{" "}
          <Link href="/dashboard" className="font-semibold underline">panelinizdən</Link> qoşulun.
        </p>
      )}

      <div className="max-w-2xl">
        <h1 className="text-3xl font-bold">Abunəlik planları</h1>
        <p className="mt-2 text-stone-600">
          Aylıq abunəlik — istənilən vaxt ləğv edə bilərsiniz. Tətbiq olunan endirim restoranın endirimi ilə planınızın
          maksimum endiriminin kiçiyidir.
        </p>
      </div>

      <h2 className="mt-10 text-lg font-bold">Fərdi</h2>
      <div className="mt-4 grid gap-4 md:grid-cols-2">
        {individual.map((p, i) => (
          <div key={p.id} className={`card flex flex-col p-6 ${i === 1 ? "border-brand-500 ring-4 ring-brand-100" : ""}`}>
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold">{p.name}</h3>
              {i === 1 && <span className="badge bg-brand-500 text-white">Populyar</span>}
            </div>
            <p className="mt-1 text-sm text-stone-600">{p.description}</p>
            <p className="mt-5">
              <span className="text-4xl font-extrabold">{p.priceMonthly.toFixed(2)}</span>
              <span className="text-stone-500"> AZN / ay</span>
            </p>
            <ul className="mt-5 flex-1 space-y-2 text-sm">
              <li>✓ {p.discountPercent}%-ə qədər endirim</li>
              <li>✓ Gündə {p.dailyLimit} endirimli nahar</li>
              <li>✓ Bütün partnyor restoranlar</li>
            </ul>
            <div className="mt-6">
              {!user ? (
                <Link href="/register" className="btn-primary w-full">Qeydiyyatdan keç</Link>
              ) : user.role !== "USER" ? (
                <p className="text-center text-sm text-stone-500">Abunəçi hesabı tələb olunur</p>
              ) : sub ? (
                <p className="rounded-xl bg-stone-100 p-3 text-center text-sm text-stone-600">
                  {sub.planId === p.id ? "Cari planınız" : "Aktiv abunəliyiniz var"}
                </p>
              ) : (
                <SubscribeButton planId={p.id} price={p.priceMonthly} />
              )}
            </div>
          </div>
        ))}
      </div>

      <h2 className="mt-12 text-lg font-bold">Korporativ</h2>
      <div className="mt-4 grid gap-4 md:grid-cols-2">
        {corporate.map((p) => (
          <div key={p.id} className="card flex flex-col bg-stone-900 p-6 text-white">
            <h3 className="text-xl font-bold">{p.name}</h3>
            <p className="mt-1 text-sm text-stone-400">{p.description}</p>
            <p className="mt-5">
              <span className="text-4xl font-extrabold">{p.priceMonthly.toFixed(2)}</span>
              <span className="text-stone-400"> AZN / işçi / ay</span>
            </p>
            <ul className="mt-5 flex-1 space-y-2 text-sm text-stone-300">
              <li>✓ {p.discountPercent}%-ə qədər endirim</li>
              <li>✓ Gündə {p.dailyLimit} endirimli nahar</li>
              <li>✓ Şirkət paneli və aylıq hesabat</li>
            </ul>
            <Link href="/corporate#muraciet" className="btn-primary mt-6 w-full">Müqavilə üçün müraciət</Link>
          </div>
        ))}
      </div>
    </div>
  );
}
