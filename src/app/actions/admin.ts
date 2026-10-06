"use server";

import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import { randomCode, slugify } from "@/lib/codes";
import { addMonths, isValidHHmm, parseWorkDays } from "@/lib/time";
import { EMAIL_RE, num, str, type ActionState } from "@/lib/action-state";

async function requireAdmin() {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") throw new Error("İcazə yoxdur");
  return user;
}

async function uniqueValue(make: () => string, exists: (v: string) => Promise<unknown>) {
  for (let i = 0; i < 10; i++) {
    const v = make();
    if (!(await exists(v))) return v;
  }
  throw new Error("Unikal dəyər yaradıla bilmədi");
}

const tempPassword = () => `Nh-${randomCode(8)}`;

/** Müraciəti təsdiqləyir: şirkət + müqavilə + şirkət admini hesabı yaradılır */
export async function approveCompanyRequest(_prev: ActionState, form: FormData): Promise<ActionState> {
  await requireAdmin();
  const request = await db.companyRequest.findUnique({ where: { id: str(form, "requestId") } });
  if (!request || request.status !== "NEW") return { error: "Müraciət tapılmadı və ya artıq baxılıb" };

  const plan = await db.plan.findUnique({ where: { id: str(form, "planId") } });
  if (!plan || plan.type !== "CORPORATE") return { error: "Korporativ plan seçin" };

  const employeeLimit = num(form, "employeeLimit");
  const months = num(form, "months");
  if (!Number.isInteger(employeeLimit) || employeeLimit < 1) return { error: "İşçi limiti düzgün deyil" };
  if (!Number.isInteger(months) || months < 1 || months > 36) return { error: "Müddət 1–36 ay olmalıdır" };

  const existingCompany = await db.company.findUnique({ where: { voen: request.voen } });

  // Mövcud müştəridən gələn limit artırılması müraciəti
  if (existingCompany) {
    // Müqavilə artıq bitibsə, uzadılma bu gündən hesablanır
    const from = existingCompany.contractEnd > new Date() ? existingCompany.contractEnd : new Date();
    const contractEnd = addMonths(from, months);
    await db.$transaction([
      db.company.update({
        where: { id: existingCompany.id },
        data: {
          employeeLimit,
          planId: plan.id,
          contractEnd,
          status: "ACTIVE",
        },
      }),
      // İşçilərin abunəliyi müqavilənin yeni bitmə tarixinə və yeni plana uyğunlaşdırılır
      db.subscription.updateMany({
        where: { companyId: existingCompany.id, status: "ACTIVE" },
        data: { planId: plan.id, endsAt: contractEnd },
      }),
      db.companyRequest.update({ where: { id: request.id }, data: { status: "APPROVED" } }),
    ]);
    revalidatePath("/admin");
    return { message: `${existingCompany.name} müqaviləsi yeniləndi` };
  }

  const email = request.contactEmail.toLowerCase();
  const existingUser = await db.user.findUnique({ where: { email } });
  if (existingUser && existingUser.role !== "USER") {
    return { error: `${email} artıq başqa rolda istifadə olunur` };
  }

  const now = new Date();
  const inviteCode = await uniqueValue(
    () => randomCode(8),
    (v) => db.company.findUnique({ where: { inviteCode: v } }),
  );
  const contractNo = await uniqueValue(
    () => `NHR-${now.getFullYear()}-${randomCode(4)}`,
    (v) => db.company.findUnique({ where: { contractNo: v } }),
  );
  const password = tempPassword();

  await db.$transaction(async (tx) => {
    const company = await tx.company.create({
      data: {
        name: request.companyName,
        voen: request.voen,
        contactName: request.contactName,
        contactEmail: email,
        contactPhone: request.contactPhone,
        employeeLimit,
        inviteCode,
        planId: plan.id,
        contractNo,
        contractStart: now,
        contractEnd: addMonths(now, months),
      },
    });
    if (existingUser) {
      await tx.user.update({
        where: { id: existingUser.id },
        data: { role: "COMPANY_ADMIN", companyId: company.id },
      });
    } else {
      await tx.user.create({
        data: {
          name: request.contactName,
          email,
          phone: request.contactPhone,
          passwordHash: await bcrypt.hash(password, 10),
          role: "COMPANY_ADMIN",
          companyId: company.id,
        },
      });
    }
    await tx.companyRequest.update({ where: { id: request.id }, data: { status: "APPROVED" } });
  });

  revalidatePath("/admin");
  return {
    message: `Müqavilə ${contractNo} yaradıldı. Dəvət kodu: ${inviteCode}`,
    secret: existingUser ? undefined : `Şirkət admini: ${email} · müvəqqəti şifrə: ${password}`,
  };
}

export async function rejectCompanyRequest(form: FormData) {
  await requireAdmin();
  await db.companyRequest.updateMany({
    where: { id: str(form, "requestId"), status: "NEW" },
    data: { status: "REJECTED" },
  });
  revalidatePath("/admin");
}

export async function setCompanyStatus(form: FormData) {
  await requireAdmin();
  const status = str(form, "status");
  if (!["ACTIVE", "SUSPENDED"].includes(status)) return;
  await db.company.update({ where: { id: str(form, "companyId") }, data: { status } });
  revalidatePath("/admin/companies");
}

export async function createRestaurant(_prev: ActionState, form: FormData): Promise<ActionState> {
  await requireAdmin();
  const name = str(form, "name");
  const lunchStart = str(form, "lunchStart") || "12:00";
  const lunchEnd = str(form, "lunchEnd") || "15:00";
  const discountPercent = num(form, "discountPercent");
  const workDays = form.getAll("workDays").map(String);
  const cashierEmail = str(form, "cashierEmail").toLowerCase();

  if (name.length < 2) return { error: "Restoran adını daxil edin" };
  if (!isValidHHmm(lunchStart) || !isValidHHmm(lunchEnd) || lunchStart >= lunchEnd) {
    return { error: "Nahar saatları düzgün deyil" };
  }
  if (!Number.isInteger(discountPercent) || discountPercent < 1 || discountPercent > 90) {
    return { error: "Endirim 1–90% arası olmalıdır" };
  }
  if (!workDays.length) return { error: "Ən azı bir iş günü seçin" };
  if (cashierEmail && !EMAIL_RE.test(cashierEmail)) return { error: "Kassir e-poçtu düzgün deyil" };
  if (cashierEmail && (await db.user.findUnique({ where: { email: cashierEmail } }))) {
    return { error: "Bu kassir e-poçtu ilə artıq hesab var" };
  }

  const base = slugify(name) || "restoran";
  const slug = await uniqueValue(
    (() => {
      let n = 0;
      return () => (n++ === 0 ? base : `${base}-${n}`);
    })(),
    (v) => db.restaurant.findUnique({ where: { slug: v } }),
  );

  const password = tempPassword();
  await db.$transaction(async (tx) => {
    const r = await tx.restaurant.create({
      data: {
        slug,
        name,
        description: str(form, "description"),
        cuisine: str(form, "cuisine") || "Müxtəlif",
        district: str(form, "district"),
        address: str(form, "address"),
        phone: str(form, "phone"),
        lunchStart,
        lunchEnd,
        discountPercent,
        workDays: parseWorkDays(workDays.join(",")).join(","),
      },
    });
    if (cashierEmail) {
      await tx.user.create({
        data: {
          name: `${name} kassa`,
          email: cashierEmail,
          passwordHash: await bcrypt.hash(password, 10),
          role: "RESTAURANT",
          restaurantId: r.id,
        },
      });
    }
  });

  revalidatePath("/admin/restaurants");
  revalidatePath("/restaurants");
  return {
    message: `${name} əlavə olundu`,
    secret: cashierEmail ? `Kassir hesabı: ${cashierEmail} · müvəqqəti şifrə: ${password}` : undefined,
  };
}

export async function toggleRestaurant(form: FormData) {
  await requireAdmin();
  const r = await db.restaurant.findUnique({ where: { id: str(form, "restaurantId") } });
  if (!r) return;
  await db.restaurant.update({ where: { id: r.id }, data: { active: !r.active } });
  revalidatePath("/admin/restaurants");
  revalidatePath("/restaurants");
}
