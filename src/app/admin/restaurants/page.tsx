import type { Metadata } from "next";
import Link from "next/link";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { bakuStartOfMonth } from "@/lib/time";
import { toggleRestaurant } from "@/app/actions/admin";
import { CreateRestaurantForm } from "./create-restaurant-form";

export const metadata: Metadata = { title: "Restoranlar · Admin" };

export default async function AdminRestaurantsPage() {
  await requireUser("ADMIN");
  const monthStart = bakuStartOfMonth();
  const [restaurants, usage] = await Promise.all([
    db.restaurant.findMany({
      orderBy: { name: "asc" },
      include: { _count: { select: { staff: true } } },
    }),
    db.voucher.groupBy({
      by: ["restaurantId"],
      where: { status: "USED", usedAt: { gte: monthStart } },
      _count: true,
    }),
  ]);
  const usageMap = new Map(usage.map((u) => [u.restaurantId, u._count]));

  return (
    <div className="grid gap-6 xl:grid-cols-[1.6fr_1fr]">
      <section className="card overflow-x-auto p-0">
        <table className="table">
          <thead>
            <tr>
              <th>Restoran</th>
              <th>Nahar</th>
              <th>Endirim</th>
              <th>Bu ay</th>
              <th>Kassir</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {restaurants.map((r) => (
              <tr key={r.id} className={r.active ? "" : "opacity-50"}>
                <td>
                  <Link href={`/restaurants/${r.slug}`} className="font-medium hover:text-brand-600">
                    {r.name}
                  </Link>
                  <p className="text-xs text-stone-500">
                    {r.cuisine} · {r.district}
                  </p>
                </td>
                <td className="whitespace-nowrap">
                  {r.lunchStart}–{r.lunchEnd}
                </td>
                <td className="font-semibold">{r.discountPercent}%</td>
                <td>{usageMap.get(r.id) ?? 0}</td>
                <td>{r._count.staff}</td>
                <td className="text-right">
                  <form action={toggleRestaurant}>
                    <input type="hidden" name="restaurantId" value={r.id} />
                    <button className={r.active ? "btn-danger btn-sm" : "btn-outline btn-sm"}>
                      {r.active ? "Deaktiv et" : "Aktiv et"}
                    </button>
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="card h-fit p-6">
        <h2 className="text-lg font-bold">Yeni partnyor restoran</h2>
        <CreateRestaurantForm />
      </section>
    </div>
  );
}
