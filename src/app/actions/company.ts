"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import { randomCode } from "@/lib/codes";
import { num, str, type ActionState } from "@/lib/action-state";

async function requireCompanyAdmin() {
  const user = await getCurrentUser();
  if (!user || user.role !== "COMPANY_ADMIN" || !user.companyId) throw new Error("İcazə yoxdur");
  return { ...user, companyId: user.companyId };
}

export async function removeEmployee(form: FormData) {
  const admin = await requireCompanyAdmin();
  const employeeId = str(form, "employeeId");

  const employee = await db.user.findUnique({ where: { id: employeeId } });
  // Başqa şirkətin işçisini və ya özünü silə bilməsin
  if (!employee || employee.companyId !== admin.companyId || employee.role !== "USER") return;

  await db.$transaction([
    db.subscription.updateMany({
      where: { userId: employee.id, companyId: admin.companyId, status: "ACTIVE" },
      data: { status: "CANCELLED", endsAt: new Date() },
    }),
    db.user.update({ where: { id: employee.id }, data: { companyId: null } }),
  ]);
  revalidatePath("/company");
}

export async function regenerateInviteCode() {
  const admin = await requireCompanyAdmin();
  for (let i = 0; i < 5; i++) {
    try {
      await db.company.update({ where: { id: admin.companyId }, data: { inviteCode: randomCode(8) } });
      break;
    } catch (e) {
      if (i === 4) throw e;
    }
  }
  revalidatePath("/company");
}

/** Şirkət əlavə işçi limiti və ya plan dəyişikliyi üçün müraciət göndərir */
export async function requestLimitChange(_prev: ActionState, form: FormData): Promise<ActionState> {
  const admin = await requireCompanyAdmin();
  const company = await db.company.findUniqueOrThrow({ where: { id: admin.companyId } });
  const employeeCount = num(form, "employeeCount");
  if (!Number.isInteger(employeeCount) || employeeCount <= 0) return { error: "İşçi sayını düzgün daxil edin" };

  await db.companyRequest.create({
    data: {
      companyName: company.name,
      voen: company.voen,
      contactName: admin.name,
      contactEmail: admin.email,
      contactPhone: company.contactPhone,
      employeeCount,
      message: `[Mövcud müştəri · ${company.contractNo}] ${str(form, "message") || "Limit artırılması"}`,
    },
  });
  return { message: "Müraciətiniz göndərildi. Menecerimiz sizinlə əlaqə saxlayacaq." };
}
