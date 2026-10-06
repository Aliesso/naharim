import Link from "next/link";

export function Footer() {
  return (
    <footer className="mt-16 border-t border-stone-200 bg-white">
      <div className="container-page flex flex-col gap-4 py-8 text-sm text-stone-500 sm:flex-row sm:items-center sm:justify-between">
        <p>© {new Date().getFullYear()} Naharim. Nahar vaxtı daha sərfəli.</p>
        <div className="flex gap-5">
          <Link href="/restaurants" className="hover:text-ink">Restoranlar</Link>
          <Link href="/plans" className="hover:text-ink">Planlar</Link>
          <Link href="/corporate" className="hover:text-ink">Korporativ müqavilə</Link>
          <Link href="/corporate#restoranlar" className="hover:text-ink">Restoran partnyorluğu</Link>
        </div>
      </div>
    </footer>
  );
}
