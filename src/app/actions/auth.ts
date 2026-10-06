"use server";

import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { createSession, deleteSession } from "@/lib/session";
import { ROLE_HOME } from "@/lib/constants";
import { EMAIL_RE, str, type ActionState } from "@/lib/action-state";
import { joinCompanyByInviteCode } from "@/lib/subscriptions";

export async function login(_prev: ActionState, form: FormData): Promise<ActionState> {
  const email = str(form, "email").toLowerCase();
  const password = str(form, "password");
  if (!email || !password) return { error: "E-poçt və şifrəni daxil edin" };

  const user = await db.user.findUnique({ where: { email } });
  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    return { error: "E-poçt və ya şifrə yanlışdır" };
  }

  await createSession(user.id);
  redirect(safeNext(str(form, "next")) ?? ROLE_HOME[user.role] ?? "/dashboard");
}

export async function register(_prev: ActionState, form: FormData): Promise<ActionState> {
  const name = str(form, "name");
  const email = str(form, "email").toLowerCase();
  const phone = str(form, "phone");
  const password = str(form, "password");
  const inviteCode = str(form, "inviteCode");

  if (name.length < 2) return { error: "Ad və soyadı daxil edin" };
  if (!EMAIL_RE.test(email)) return { error: "E-poçt ünvanı düzgün deyil" };
  if (password.length < 8) return { error: "Şifrə ən azı 8 simvol olmalıdır" };

  if (await db.user.findUnique({ where: { email } })) {
    return { error: "Bu e-poçt ilə artıq hesab var" };
  }

  // Dəvət kodu səhvdirsə, hesab yaratmadan əvvəl xəbər veririk
  if (inviteCode) {
    const company = await db.company.findUnique({ where: { inviteCode: inviteCode.toUpperCase() } });
    if (!company) return { error: "Şirkət kodu tapılmadı" };
  }

  const user = await db.user.create({
    data: { name, email, phone: phone || null, passwordHash: await bcrypt.hash(password, 10) },
  });
  await createSession(user.id);

  if (inviteCode) {
    const res = await joinCompanyByInviteCode(user.id, inviteCode);
    if (!res.ok) redirect(`/dashboard?joinError=${encodeURIComponent(res.error)}`);
    redirect("/dashboard?welcome=company");
  }
  redirect("/plans?welcome=1");
}

export async function logout() {
  await deleteSession();
  redirect("/");
}

/** Yalnız sayt daxili yolları qəbul edirik (open redirect olmasın) */
function safeNext(next: string): string | null {
  return next.startsWith("/") && !next.startsWith("//") ? next : null;
}
