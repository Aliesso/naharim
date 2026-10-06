"use client";

import { useActionState } from "react";
import { login } from "@/app/actions/auth";
import { Field, FormAlert, SubmitButton } from "@/components/forms";

export function LoginForm({ next }: { next: string }) {
  const [state, action] = useActionState(login, null);
  return (
    <form action={action} className="mt-6 space-y-4">
      <input type="hidden" name="next" value={next} />
      <Field label="E-poçt">
        <input name="email" type="email" required autoComplete="email" className="input" />
      </Field>
      <Field label="Şifrə">
        <input name="password" type="password" required autoComplete="current-password" className="input" />
      </Field>
      <FormAlert state={state} />
      <SubmitButton className="btn-primary w-full">Daxil ol</SubmitButton>
    </form>
  );
}
