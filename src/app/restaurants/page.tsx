import type { Metadata } from "next";
import Link from "next/link";
import { db } from "@/lib/db";
import { isLunchOpen } from "@/lib/time";
import { RestaurantCard } from "@/components/restaurant-card";

export const metadata: Metadata = { title: "Partnyor restoranlar" };

export default async function RestaurantsPage({ searchParams }: PageProps<"/restaurants">) {
  const sp = await searchParams;
  const q = typeof sp.q === "string" ? sp.q.trim() : "";
  const district = typeof sp.district === "string" ? sp.district : "";
  const cuisine = typeof sp.cuisine === "string" ? sp.cuisine : "";
  const openOnly = sp.open === "1";

  const all = await db.restaurant.findMany({ where: { active: true }, orderBy: { name: "asc" } });
  const districts = [...new Set(all.map((r) => r.district))].sort();
  const cuisines = [...new Set(all.map((r) => r.cuisine))].sort();

  // SQLite-da Azərbaycan hərfləri üçün case-insensitive axtarış zəifdir, ona görə filtri JS-də edirik
  const needle = q.toLocaleLowerCase("az");
  const restaurants = all.filter(
    (r) =>
      (!needle || `${r.name} ${r.cuisine} ${r.address}`.toLocaleLowerCase("az").includes(needle)) &&
      (!district || r.district === district) &&
      (!cuisine || r.cuisine === cuisine) &&
      (!openOnly || isLunchOpen(r)),
  );

  return (
    <div className="container-page py-10">
      <h1 className="text-3xl font-bold">Partnyor restoranlar</h1>
      <p className="mt-1 text-stone-600">Endirimlər yalnız göstərilən nahar saatlarında (Bakı vaxtı) keçərlidir.</p>

      <form className="card mt-6 grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-[2fr_1fr_1fr_auto_auto]">
        <input name="q" defaultValue={q} placeholder="Restoran, mətbəx və ya ünvan..." className="input" />
        <select name="district" defaultValue={district} className="input">
          <option value="">Bütün rayonlar</option>
          {districts.map((d) => (
            <option key={d}>{d}</option>
          ))}
        </select>
        <select name="cuisine" defaultValue={cuisine} className="input">
          <option value="">Bütün mətbəxlər</option>
          {cuisines.map((c) => (
            <option key={c}>{c}</option>
          ))}
        </select>
        <label className="flex items-center gap-2 px-1 text-sm font-medium">
          <input type="checkbox" name="open" value="1" defaultChecked={openOnly} className="h-4 w-4 accent-brand-500" />
          İndi aktiv
        </label>
        <button className="btn-dark">Axtar</button>
      </form>

      {restaurants.length ? (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {restaurants.map((r) => (
            <RestaurantCard key={r.id} restaurant={r} />
          ))}
        </div>
      ) : (
        <div className="card mt-6 text-center text-stone-600">
          Uyğun restoran tapılmadı.{" "}
          <Link href="/restaurants" className="font-semibold text-brand-600">
            Filtrləri sıfırla
          </Link>
        </div>
      )}
    </div>
  );
}
