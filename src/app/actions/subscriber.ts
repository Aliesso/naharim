"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import { getActiveSubscription, joinCompanyByInviteCode } from "@/lib/subscriptions";
import { issueVoucher } from "@/lib/vouchers";
import { INDIVIDUAL_SUBSCRIPTION_DAYS } from "@/lib/constants";
import { addDays } from "@/lib/time";
import { str, type ActionState } from "@/lib/action-state";

async function requireSubscriber() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role !== "USER") throw new Error("Yalnız abunəçi hesabları üçün");
  return user;
}

/**
 * Fərdi abunəlik. MVP-də ödəniş simulyasiya olunur —
 * real inteqrasiyada (məs. bank POS / kart ödənişi) uğurlu callback-dən sonra yaradılmalıdır.
 */
export async function subscribe(_prev: ActionState, form: FormData): Promise<ActionState> {
  const user = await requireSubscriber();
  const plan = await db.plan.findUnique({ where: { id: str(form, "planId") } });
  if (!plan || !plan.active || plan.type !== "INDIVIDUAL") return { error: "Plan tapılmadı" };

  const current = await getActiveSubscription(user.id);
  if (current) {
    return {
      error:
        current.source === "COMPANY"
          ? "Şirkətiniz sizin üçün artıq abunəlik təmin edir"
          : "Artıq aktiv abunəliyiniz var",
    };
  }

  const now = new Date();
  await db.subscription.create({
    data: {
      userId: user.id,
      planId: plan.id,
      source: "INDIVIDUAL",
      startsAt: now,
      endsAt: addDays(now, INDIVIDUAL_SUBSCRIPTION_DAYS),
    },
  });
  redirect("/dashboard?welcome=plan");
}

export async function cancelSubscription() {
  const user = await requireSubscriber();
  // Yalnız fərdi abunəlik ləğv edilə bilər; korporativ abunəliyi şirkət idarə edir
  await db.subscription.updateMany({
    where: { userId: user.id, status: "ACTIVE", source: "INDIVIDUAL" },
    data: { status: "CANCELLED", endsAt: new Date() },
  });
  revalidatePath("/dashboard");
}

export async function joinCompany(_prev: ActionState, form: FormData): Promise<ActionState> {
  const user = await requireSubscriber();
  const res = await joinCompanyByInviteCode(user.id, str(form, "inviteCode"));
  if (!res.ok) return { error: res.error };

  // Fərdi abunəlik varsa, onu dayandırırıq ki, iki dəfə ödəniş olmasın
  await db.subscription.updateMany({
    where: { userId: user.id, status: "ACTIVE", source: "INDIVIDUAL" },
    data: { status: "CANCELLED", endsAt: new Date() },
  });
  revalidatePath("/dashboard");
  return { message: `${res.companyName} şirkətinə qoşuldunuz` };
}

export async function getVoucher(_prev: ActionState, form: FormData): Promise<ActionState> {
  const user = await getCurrentUser();
  if (!user) redirect(`/login?next=${encodeURIComponent(str(form, "returnTo") || "/restaurants")}`);
  if (user.role !== "USER") return { error: "Kupon yalnız abunəçi hesabı ilə alına bilər" };

  const res = await issueVoucher(user.id, str(form, "restaurantId"));
  if (!res.ok) return { error: res.error };
  redirect("/dashboard#kupon");
}
