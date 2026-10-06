"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/session";
import { normalizeCode } from "@/lib/codes";
import { redeemVoucher } from "@/lib/vouchers";
import { db } from "@/lib/db";
import { isValidHHmm, parseWorkDays } from "@/lib/time";
import { num, str, type ActionState } from "@/lib/action-state";

export type RedeemState =
  | null
  | { error: string }
  | { customer: string; billAmount: number; discountAmount: number; payAmount: number; discountPercent: number };

export async function redeem(_prev: RedeemState, form: FormData): Promise<RedeemState> {
  const user = await getCurrentUser();
  if (!user || user.role !== "RESTAURANT" || !user.restaurantId) {
    return { error: "Bu əməliyyat yalnız restoran hesabı üçündür" };
  }

  const code = normalizeCode(str(form, "code"));
  if (code.length !== 6) return { error: "Kod 6 simvoldan ibarət olmalıdır" };

  const res = await redeemVoucher(user.restaurantId, code, num(form, "billAmount"));
  if (!res.ok) return { error: res.error };

  revalidatePath("/partner");
  const { customer, billAmount, discountAmount, payAmount, discountPercent } = res;
  return { customer, billAmount, discountAmount, payAmount, discountPercent };
}

export async function updateRestaurantSettings(_prev: ActionState, form: FormData): Promise<ActionState> {
  const user = await getCurrentUser();
  if (!user || user.role !== "RESTAURANT" || !user.restaurantId) return { error: "İcazə yoxdur" };

  const lunchStart = str(form, "lunchStart");
  const lunchEnd = str(form, "lunchEnd");
  const discountPercent = num(form, "discountPercent");
  const workDays = parseWorkDays(form.getAll("workDays").map(String).join(","));

  if (!isValidHHmm(lunchStart) || !isValidHHmm(lunchEnd) || lunchStart >= lunchEnd) {
    return { error: "Nahar saatları düzgün deyil" };
  }
  if (!Number.isInteger(discountPercent) || discountPercent < 1 || discountPercent > 90) {
    return { error: "Endirim 1–90% arası olmalıdır" };
  }
  if (!workDays.length) return { error: "Ən azı bir iş günü seçin" };

  await db.restaurant.update({
    where: { id: user.restaurantId },
    data: { lunchStart, lunchEnd, discountPercent, workDays: workDays.join(",") },
  });
  revalidatePath("/partner");
  return { message: "Parametrlər yadda saxlanıldı" };
}
