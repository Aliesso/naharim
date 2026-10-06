"use client";

import { useActionState } from "react";
import { joinCompany } from "@/app/actions/subscriber";
import { FormAlert, SubmitButton } from "@/components/forms";

export function JoinCompanyForm() {
  const [state, action] = useActionState(joinCompany, null);
  return (
    <form action={action} className="mt-4 space-y-3">
      <div className="flex max-w-md gap-2">
        <input name="inviteCode" required placeholder="Dəvət kodu" className="input font-mono uppercase" />
        <SubmitButton className="btn-dark shrink-0">Qoşul</SubmitButton>
      </div>
      <FormAlert state={state} />
    </form>
  );
}
