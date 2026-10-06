import Link from "next/link";
import type { Restaurant } from "@prisma/client";
import { isLunchOpen } from "@/lib/time";
import { CuisineArt } from "./cuisine-art";

export function LunchBadge({ restaurant }: { restaurant: Restaurant }) {
  const open = isLunchOpen(restaurant);
  return open ? (
    <span className="badge bg-emerald-100 text-emerald-800">
      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Endirim aktivdir
    </span>
  ) : (
    <span className="badge bg-stone-100 text-stone-600">
      {restaurant.lunchStart}–{restaurant.lunchEnd}
    </span>
  );
}

export function RestaurantCard({ restaurant }: { restaurant: Restaurant }) {
  return (
    <Link
      href={`/restaurants/${restaurant.slug}`}
      className="group overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
    >
      <div className="relative">
        <CuisineArt cuisine={restaurant.cuisine} className="h-36" />
        <span className="absolute right-3 top-3 rounded-full bg-white/95 px-3 py-1 text-sm font-extrabold text-brand-600 shadow-sm">
          −{restaurant.discountPercent}%
        </span>
      </div>
      <div className="space-y-2 p-4">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-bold group-hover:text-brand-600">{restaurant.name}</h3>
          <LunchBadge restaurant={restaurant} />
        </div>
        <p className="text-sm text-stone-500">
          {restaurant.cuisine} · {restaurant.district}
        </p>
      </div>
    </Link>
  );
}
