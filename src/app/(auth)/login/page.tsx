import type { Metadata } from "next";
import Link from "next/link";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Giriş" };

const demoAccounts = [
  ["Abunəçi (fərdi)", "aysel@example.com"],
  ["İşçi (korporativ)", "isci1@demo-tech.az"],
  ["Şirkət admini", "hr@demo-tech.az"],
  ["Restoran kassası", "kassa@ocaq-evi.az"],
  ["Platforma admini", "admin@naharim.az"],
];

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const { next } = await searchParams;
  return (
    <div className="container-page grid max-w-4xl gap-6 py-12 md:grid-cols-[1fr_0.8fr]">
      <div className="card p-8">
        <h1 className="text-2xl font-bold">Hesabınıza daxil olun</h1>
        <p className="mt-1 text-sm text-stone-500">
          Hesabınız yoxdur? <Link href="/register" className="font-semibold text-brand-600">Qeydiyyatdan keçin</Link>
        </p>
        <LoginForm next={typeof next === "string" ? next : ""} />
      </div>

      {process.env.NODE_ENV !== "production" && (
        <div className="card h-fit bg-amber-50/60 text-sm">
          <p className="font-semibold">Demo hesablar</p>
          <p className="mt-1 text-xs text-stone-500">Hamısının şifrəsi: <code className="font-mono">demo1234</code></p>
          <ul className="mt-3 space-y-2">
            {demoAccounts.map(([role, email]) => (
              <li key={email}>
                <span className="block text-xs text-stone-500">{role}</span>
                <code className="font-mono">{email}</code>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
