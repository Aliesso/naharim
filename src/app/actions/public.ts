"use server";

import { db } from "@/lib/db";
import { EMAIL_RE, num, str, type ActionState } from "@/lib/action-state";

export async function submitCompanyRequest(_prev: ActionState, form: FormData): Promise<ActionState> {
  const data = {
    companyName: str(form, "companyName"),
    voen: str(form, "voen").replace(/\s/g, ""),
    contactName: str(form, "contactName"),
    contactEmail: str(form, "contactEmail").toLowerCase(),
    contactPhone: str(form, "contactPhone"),
    employeeCount: num(form, "employeeCount"),
    message: str(form, "message") || null,
  };

  if (data.companyName.length < 2) return { error: "Şirkət adını daxil edin" };
  if (!/^\d{10}$/.test(data.voen)) return { error: "VÖEN 10 rəqəmdən ibarət olmalıdır" };
  if (data.contactName.length < 2) return { error: "Əlaqə şəxsini daxil edin" };
  if (!EMAIL_RE.test(data.contactEmail)) return { error: "E-poçt ünvanı düzgün deyil" };
  if (data.contactPhone.length < 7) return { error: "Telefon nömrəsini daxil edin" };
  if (!Number.isInteger(data.employeeCount) || data.employeeCount < 1) {
    return { error: "İşçi sayını düzgün daxil edin" };
  }

  await db.companyRequest.create({ data });
  return { message: "Təşəkkürlər! Müraciətiniz qəbul olundu, 1 iş günü ərzində sizinlə əlaqə saxlayacağıq." };
}
