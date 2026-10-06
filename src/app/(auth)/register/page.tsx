import type { Metadata } from "next";
import Link from "next/link";
import { RegisterForm } from "./register-form";

export const metadata: Metadata = { title: "Qeydiyyat" };

export default async function RegisterPage({ searchParams }: PageProps<"/register">) {
  const { code } = await searchParams;
  return (
    <div className="container-page max-w-lg py-12">
      <div className="card p-8">
        <h1 className="text-2xl font-bold">Qeydiyyat</h1>
        <p className="mt-1 text-sm text-stone-500">
          Artıq hesabınız var? <Link href="/login" className="font-semibold text-brand-600">Daxil olun</Link>
        </p>
        <RegisterForm inviteCode={typeof code === "string" ? code : ""} />
      </div>
    </div>
  );
}
