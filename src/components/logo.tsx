import Link from "next/link";

export function Logo() {
  return (
    <Link href="/" className="flex items-center gap-2 text-lg font-extrabold tracking-tight">
      <span className="grid h-8 w-8 place-items-center rounded-lg bg-brand-500 text-white">
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round">
          <path d="M4 13a8 8 0 0 0 16 0H4Z" />
          <path d="M9 8c0-1.5 1-2 1-3.5M14 8c0-1.5 1-2 1-3.5" />
        </svg>
      </span>
      naharim
    </Link>
  );
}
