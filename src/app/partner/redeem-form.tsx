"use client";

import { useActionState, useEffect, useRef } from "react";
import { redeem } from "@/app/actions/partner";
import { Field, SubmitButton } from "@/components/forms";

export function RedeemForm() {
  const [state, action] = useActionState(redeem, null);
  const formRef = useRef<HTMLFormElement>(null);
  const success = state && "payAmount" in state ? state : null;

  // Uğurlu təsdiqdən sonra növbəti müştəri üçün formu təmizləyirik
  useEffect(() => {
    if (success) formRef.current?.reset();
  }, [success]);

  return (
    <div className="mt-5 space-y-4">
      <form ref={formRef} action={action} className="grid gap-3 sm:grid-cols-[1.3fr_1fr]">
        <Field label="Kupon kodu">
          <input
            name="code"
            required
            maxLength={8}
            autoComplete="off"
            autoFocus
            placeholder="K7M2QX"
            className="input font-mono text-lg uppercase tracking-[0.3em]"
          />
        </Field>
        <Field label="Hesab (AZN)">
          <input name="billAmount" required inputMode="decimal" placeholder="18.50" className="input text-lg" />
        </Field>
        <div className="sm:col-span-2">
          <SubmitButton className="btn-primary w-full py-3 text-base" pendingText="Yoxlanılır...">
            Təsdiqlə və endirimi tətbiq et
          </SubmitButton>
        </div>
      </form>

      {state && "error" in state && (
        <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700">
          ✕ {state.error}
        </p>
      )}
      {success && (
        <div className="rounded-xl border border-emerald-300 bg-emerald-50 p-4">
          <p className="font-semibold text-emerald-800">✓ Kupon təsdiqləndi — {success.customer}</p>
          <dl className="mt-3 grid grid-cols-3 gap-2 text-sm">
            <div>
              <dt className="text-emerald-700">Hesab</dt>
              <dd className="font-semibold">{success.billAmount.toFixed(2)} ₼</dd>
            </div>
            <div>
              <dt className="text-emerald-700">Endirim ({success.discountPercent}%)</dt>
              <dd className="font-semibold">−{success.discountAmount.toFixed(2)} ₼</dd>
            </div>
            <div>
              <dt className="text-emerald-700">Ödəniləcək</dt>
              <dd className="text-xl font-extrabold">{success.payAmount.toFixed(2)} ₼</dd>
            </div>
          </dl>
        </div>
      )}
    </div>
  );
}
