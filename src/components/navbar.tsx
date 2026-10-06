import Link from "next/link";
import { getCurrentUser } from "@/lib/session";
import { ROLE_HOME, ROLE_LABELS } from "@/lib/constants";
import { logout } from "@/app/actions/auth";
import { Logo } from "./logo";

const links = [
  { href: "/restaurants", label: "Restoranlar" },
  { href: "/plans", label: "Planlar" },
  { href: "/corporate", label: "Şirkətlər üçün" },
];

export async function Navbar() {
  const user = await getCurrentUser();

  return (
    <header className="sticky top-0 z-30 border-b border-stone-200 bg-white/90 backdrop-blur">
      <div className="container-page flex h-16 items-center justify-between gap-4">
        <div className="flex items-center gap-8">
          <Logo />
          <nav className="hidden items-center gap-6 md:flex">
            {links.map((l) => (
              <Link key={l.href} href={l.href} className="text-sm font-medium text-stone-600 hover:text-ink">
                {l.label}
              </Link>
            ))}
          </nav>
        </div>

        {user ? (
          <div className="flex items-center gap-2">
            <Link href={ROLE_HOME[user.role] ?? "/dashboard"} className="btn-outline btn-sm">
              <span className="max-w-32 truncate">{user.name.split(" ")[0]}</span>
              <span className="hidden text-stone-400 sm:inline">· {ROLE_LABELS[user.role]}</span>
            </Link>
            <form action={logout}>
              <button className="btn btn-sm text-stone-500 hover:text-ink">Çıxış</button>
            </form>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <Link href="/login" className="btn btn-sm text-stone-600 hover:text-ink">
              Giriş
            </Link>
            <Link href="/register" className="btn-primary btn-sm">
              Qeydiyyat
            </Link>
          </div>
        )}
      </div>
      <nav className="container-page flex gap-5 overflow-x-auto pb-3 md:hidden">
        {links.map((l) => (
          <Link key={l.href} href={l.href} className="whitespace-nowrap text-sm font-medium text-stone-600">
            {l.label}
          </Link>
        ))}
      </nav>
    </header>
  );
}
