"use client";

import { useActionState } from "react";
import { requestLimitChange } from "@/app/actions/company";
import { Field, FormAlert, SubmitButton } from "@/components/forms";

export function LimitRequestForm({ current }: { current: number }) {
  const [state, action] = useActionState(requestLimitChange, null);
  if (state?.message) return <div className="mt-3"><FormAlert state={state} /></div>;
  return (
    <form action={action} className="mt-3 space-y-3">
      <Field label="Yeni işçi limiti">
        <input name="employeeCount" type="number" min={1} defaultValue={current} required className="input" />
      </Field>
      <Field label="Qeyd">
        <textarea name="message" rows={2} className="input" placeholder="Məs. müqaviləni 12 ay uzatmaq istəyirik" />
      </Field>
      <FormAlert state={state} />
      <SubmitButton className="btn-dark btn-sm">Müraciət göndər</SubmitButton>
    </form>
  );
}
