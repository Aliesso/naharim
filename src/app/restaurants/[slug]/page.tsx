import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import { effectiveDiscount, getActiveSubscription } from "@/lib/subscriptions";
import { isLunchOpen, parseWorkDays } from "@/lib/time";
import { DAY_LABELS } from "@/lib/constants";
import { CuisineArt } from "@/components/cuisine-art";
import { LunchBadge } from "@/components/restaurant-card";
import { VoucherButton } from "./voucher-button";

async function getRestaurant(slug: string) {
  return db.restaurant.findUnique({ where: { slug } });
}

export async function generateMetadata({ params }: PageProps<"/restaurants/[slug]">): Promise<Metadata> {
  const r = await getRestaurant((await params).slug);
  return { title: r?.name ?? "Restoran" };
}

export default async function RestaurantPage({ params }: PageProps<"/restaurants/[slug]">) {
  const { slug } = await params;
  const restaurant = await getRestaurant(slug);
  if (!restaurant || !restaurant.active) notFound();

  const user = await getCurrentUser();
  const sub = user?.role === "USER" ? await getActiveSubscription(user.id) : null;
  const open = isLunchOpen(restaurant);
  const workDays = parseWorkDays(restaurant.workDays);

  return (
    <div className="container-page py-10">
      <Link href="/restaurants" className="text-sm text-stone-500 hover:text-ink">
        ← Restoranlar
      </Link>

      <div className="mt-4 grid gap-6 lg:grid-cols-[1.5fr_1fr]">
        <div className="overflow-hidden rounded-3xl border border-stone-200 bg-white">
          <CuisineArt cuisine={restaurant.cuisine} className="h-56" />
          <div className="space-y-4 p-6">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-3xl font-bold">{restaurant.name}</h1>
              <LunchBadge restaurant={restaurant} />
            </div>
            <p className="text-stone-600">{restaurant.description}</p>
            <dl className="grid gap-4 border-t border-stone-100 pt-4 text-sm sm:grid-cols-2">
              <Info label="Mətbəx" value={restaurant.cuisine} />
              <Info label="Ünvan" value={`${restaurant.address}, ${restaurant.district}`} />
              <Info label="Nahar saatları" value={`${restaurant.lunchStart} – ${restaurant.lunchEnd}`} />
              <Info label="İş günləri" value={workDays.map((d) => DAY_LABELS[d]).join(", ")} />
              <Info label="Telefon" value={restaurant.phone} />
            </dl>
          </div>
        </div>

        <aside className="card h-fit space-y-4 p-6 lg:sticky lg:top-24">
          <p className="text-sm text-stone-500">Abunəçilər üçün endirim</p>
          <p className="text-5xl font-extrabold text-brand-600">−{sub ? effectiveDiscount(sub.plan.discountPercent, restaurant.discountPercent) : restaurant.discountPercent}%</p>
          {sub && sub.plan.discountPercent < restaurant.discountPercent && (
            <p className="text-xs text-stone-500">
              Planınızın maksimum endirimi {sub.plan.discountPercent}%-dir.
            </p>
          )}

          {!user ? (
            <>
              <Link href={`/login?next=/restaurants/${restaurant.slug}`} className="btn-primary w-full">
                Kupon almaq üçün daxil ol
              </Link>
              <p className="text-center text-xs text-stone-500">
                Hesabın yoxdur? <Link href="/register" className="font-semibold text-brand-600">Qeydiyyat</Link>
              </p>
            </>
          ) : user.role !== "USER" ? (
            <p className="rounded-xl bg-stone-100 p-3 text-sm text-stone-600">
              Kupon yalnız abunəçi hesabı ilə alına bilər.
            </p>
          ) : !sub ? (
            <Link href="/plans" className="btn-primary w-full">
              Abunə ol və endirim qazan
            </Link>
          ) : (
            <VoucherButton restaurantId={restaurant.id} slug={restaurant.slug} disabled={!open} />
          )}

          {!open && (
            <p className="text-sm text-stone-500">
              Endirim hazırda aktiv deyil. Kuponu {restaurant.lunchStart}–{restaurant.lunchEnd} arası ala bilərsiniz.
            </p>
          )}
          <p className="border-t border-stone-100 pt-4 text-xs text-stone-500">
            Kupon 30 dəqiqə etibarlıdır. Kassada kodu göstərin — endirim hesabın ümumi məbləğinə tətbiq olunur.
          </p>
        </aside>
      </div>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-stone-500">{label}</dt>
      <dd className="font-medium">{value}</dd>
    </div>
  );
}
