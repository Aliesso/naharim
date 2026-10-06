import Link from "next/link";
import { db } from "@/lib/db";
import { RestaurantCard } from "@/components/restaurant-card";

const steps = [
  { n: "1", title: "Abunə ol", text: "Fərdi plan seç və ya şirkətinin verdiyi kodla qoşul." },
  { n: "2", title: "Restoran seç", text: "Nahar saatlarında aktiv olan partnyor restoranı tap." },
  { n: "3", title: "Kodu göstər", text: "Bir toxunuşla 6 simvollu kupon al, kassada göstər — endirim dərhal tətbiq olunur." },
];

export default async function Home() {
  const [restaurants, restaurantCount, maxDiscount, cheapestCorporate] = await Promise.all([
    db.restaurant.findMany({ where: { active: true }, orderBy: { discountPercent: "desc" }, take: 4 }),
    db.restaurant.count({ where: { active: true } }),
    db.restaurant.aggregate({ where: { active: true }, _max: { discountPercent: true } }),
    db.plan.findFirst({ where: { type: "CORPORATE", active: true }, orderBy: { priceMonthly: "asc" } }),
  ]);

  return (
    <>
      <section className="bg-linear-to-b from-brand-50 to-stone-50">
        <div className="container-page grid items-center gap-10 py-16 md:grid-cols-2 md:py-24">
          <div className="space-y-6">
            <span className="badge bg-brand-100 text-brand-700">Bakıda {restaurantCount} partnyor restoran</span>
            <h1 className="text-4xl font-extrabold leading-tight tracking-tight md:text-5xl">
              Nahar vaxtı <span className="text-brand-500">{maxDiscount._max.discountPercent ?? 30}%-ə qədər</span> endirim
            </h1>
            <p className="max-w-lg text-lg text-stone-600">
              Naharim abunəçiləri partnyor restoranlarda nahar saatlarında endirimli yemək yeyir.
              Şirkətlər isə işçiləri üçün korporativ müqavilə bağlayaraq bu imkanı bonus kimi təqdim edir.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link href="/plans" className="btn-primary px-6 py-3 text-base">
                Abunə ol
              </Link>
              <Link href="/corporate" className="btn-outline px-6 py-3 text-base">
                Şirkətim üçün
              </Link>
            </div>
          </div>

          <div className="card relative mx-auto w-full max-w-sm rotate-1 p-6">
            <p className="text-xs font-semibold uppercase tracking-wide text-stone-500">Bugünkü kuponunuz</p>
            <p className="mt-3 font-mono text-4xl font-extrabold tracking-[0.3em]">K7M2QX</p>
            <div className="mt-5 flex items-center justify-between border-t border-dashed border-stone-200 pt-4 text-sm">
              <span className="text-stone-600">Ocaq Evi</span>
              <span className="font-bold text-brand-600">−20%</span>
            </div>
            <p className="mt-2 text-xs text-stone-500">30 dəqiqə ərzində keçərlidir</p>
          </div>
        </div>
      </section>

      <section className="container-page py-16">
        <h2 className="text-2xl font-bold">Necə işləyir?</h2>
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {steps.map((s) => (
            <div key={s.n} className="card">
              <span className="grid h-9 w-9 place-items-center rounded-full bg-brand-500 font-bold text-white">{s.n}</span>
              <h3 className="mt-4 font-bold">{s.title}</h3>
              <p className="mt-1 text-sm text-stone-600">{s.text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="container-page pb-16">
        <div className="flex items-end justify-between">
          <h2 className="text-2xl font-bold">Ən yüksək endirimlər</h2>
          <Link href="/restaurants" className="text-sm font-semibold text-brand-600 hover:underline">
            Hamısına bax →
          </Link>
        </div>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {restaurants.map((r) => (
            <RestaurantCard key={r.id} restaurant={r} />
          ))}
        </div>
      </section>

      <section className="container-page">
        <div className="grid gap-8 rounded-3xl bg-ink p-8 text-white md:grid-cols-[1.4fr_1fr] md:p-12">
          <div className="space-y-4">
            <h2 className="text-3xl font-bold">İşçilərinizə nahar bonusu verin</h2>
            <p className="text-stone-300">
              Şirkətinizlə korporativ müqavilə bağlayırıq: işçi başına sabit aylıq ödəniş, bir dəvət kodu ilə
              qoşulma və aylıq istifadə hesabatı. Nahar xərclərini azaldın, komandanızı motivasiya edin.
            </p>
            <Link href="/corporate" className="btn-primary">
              Korporativ təklif al
            </Link>
          </div>
          <ul className="space-y-3 text-sm text-stone-300">
            {[`İşçi başına aylıq ${cheapestCorporate?.priceMonthly.toFixed(2) ?? "—"} AZN-dən`, "VÖEN ilə rəsmi müqavilə və hesab-faktura", "Dəvət kodu ilə dəqiqələr içində qoşulma", "İstifadə və qənaət statistikası"].map((t) => (
              <li key={t} className="flex gap-2">
                <span className="text-brand-500">✓</span> {t}
              </li>
            ))}
          </ul>
        </div>
      </section>
    </>
  );
}
