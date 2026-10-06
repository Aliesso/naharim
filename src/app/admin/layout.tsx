import Link from "next/link";
import { requireUser } from "@/lib/session";

const tabs = [
  { href: "/admin", label: "Ümumi baxış" },
  { href: "/admin/companies", label: "Şirkətlər" },
  { href: "/admin/restaurants", label: "Restoranlar" },
];

export default async function AdminLayout({ children }: LayoutProps<"/admin">) {
  await requireUser("ADMIN");
  return (
    <div className="container-page py-10">
      <p className="text-sm text-stone-500">Platforma admini</p>
      <nav className="mt-2 flex gap-1 overflow-x-auto border-b border-stone-200">
        {tabs.map((t) => (
          <Link key={t.href} href={t.href} className="whitespace-nowrap px-4 py-2.5 text-sm font-semibold text-stone-600 hover:text-ink">
            {t.label}
          </Link>
        ))}
      </nav>
      <div className="mt-6">{children}</div>
    </div>
  );
}
