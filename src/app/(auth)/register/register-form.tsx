"use client";

import { useActionState } from "react";
import { register } from "@/app/actions/auth";
import { Field, FormAlert, SubmitButton } from "@/components/forms";

export function RegisterForm({ inviteCode }: { inviteCode: string }) {
  const [state, action] = useActionState(register, null);
  return (
    <form action={action} className="mt-6 space-y-4">
      <Field label="Ad, soyad">
        <input name="name" required autoComplete="name" className="input" />
      </Field>
      <Field label="E-poçt">
        <input name="email" type="email" required autoComplete="email" className="input" />
      </Field>
      <Field label="Telefon (istəyə bağlı)">
        <input name="phone" type="tel" autoComplete="tel" placeholder="+994 50 000 00 00" className="input" />
      </Field>
      <Field label="Şifrə" hint="Ən azı 8 simvol">
        <input name="password" type="password" required minLength={8} autoComplete="new-password" className="input" />
      </Field>
      <div className="rounded-xl border border-dashed border-stone-300 bg-stone-50 p-4">
        <Field label="Şirkət dəvət kodu (istəyə bağlı)" hint="Şirkətiniz Naharim ilə müqavilə bağlayıbsa, HR-dan aldığınız kodu daxil edin">
          <input name="inviteCode" defaultValue={inviteCode} className="input font-mono uppercase" placeholder="DEMO2026" />
        </Field>
      </div>
      <FormAlert state={state} />
      <SubmitButton className="btn-primary w-full">Hesab yarat</SubmitButton>
    </form>
  );
}
