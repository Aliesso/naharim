"use client";

import { useActionState } from "react";
import { approveCompanyRequest } from "@/app/actions/admin";
import { Field, FormAlert, SubmitButton } from "@/components/forms";

export function ApproveRequestForm({
  requestId,
  employeeCount,
  plans,
}: {
  requestId: string;
  employeeCount: number;
  plans: { id: string; label: string }[];
}) {
  const [state, action] = useActionState(approveCompanyRequest, null);
  return (
    <form action={action} className="space-y-3 rounded-xl bg-stone-50 p-4">
      <input type="hidden" name="requestId" value={requestId} />
      <p className="text-sm font-semibold">Müqavilə şərtləri</p>
      <Field label="Plan">
        <select name="planId" className="input">
          {plans.map((p) => (
            <option key={p.id} value={p.id}>
              {p.label}
            </option>
          ))}
        </select>
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="İşçi limiti">
          <input name="employeeLimit" type="number" min={1} defaultValue={employeeCount} className="input" />
        </Field>
        <Field label="Müddət (ay)">
          <input name="months" type="number" min={1} max={36} defaultValue={12} className="input" />
        </Field>
      </div>
      <FormAlert state={state} />
      {!state?.message && <SubmitButton className="btn-primary w-full">Təsdiqlə və müqavilə yarat</SubmitButton>}
    </form>
  );
}
