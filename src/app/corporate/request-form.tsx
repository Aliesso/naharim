"use client";

import { useActionState } from "react";
import { submitCompanyRequest } from "@/app/actions/public";
import { Field, FormAlert, SubmitButton } from "@/components/forms";

export function CompanyRequestForm() {
  const [state, action] = useActionState(submitCompanyRequest, null);

  if (state?.message) return <FormAlert state={state} />;

  return (
    <form action={action} className="grid gap-4 sm:grid-cols-2">
      <div className="sm:col-span-2">
        <Field label="Şirkətin adı">
          <input name="companyName" required className="input" />
        </Field>
      </div>
      <Field label="VÖEN">
        <input name="voen" required inputMode="numeric" pattern="\d{10}" maxLength={10} className="input font-mono" />
      </Field>
      <Field label="İşçi sayı">
        <input name="employeeCount" type="number" min={1} required className="input" />
      </Field>
      <Field label="Əlaqə şəxsi">
        <input name="contactName" required className="input" />
      </Field>
      <Field label="Telefon">
        <input name="contactPhone" type="tel" required className="input" />
      </Field>
      <div className="sm:col-span-2">
        <Field label="E-poçt">
          <input name="contactEmail" type="email" required className="input" />
        </Field>
      </div>
      <div className="sm:col-span-2">
        <Field label="Əlavə qeyd (istəyə bağlı)">
          <textarea name="message" rows={3} className="input" placeholder="Ofisin yeri, maraqlandığınız plan..." />
        </Field>
      </div>
      <div className="space-y-3 sm:col-span-2">
        <FormAlert state={state} />
        <SubmitButton className="btn-primary w-full">Müraciət göndər</SubmitButton>
      </div>
    </form>
  );
}
