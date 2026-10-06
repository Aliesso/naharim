"use client";

import { useFormStatus } from "react-dom";
import type { ActionState } from "@/lib/action-state";

export function SubmitButton({
  children,
  pendingText = "Gözləyin...",
  className = "btn-primary",
}: {
  children: React.ReactNode;
  pendingText?: string;
  className?: string;
}) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className={className}>
      {pending ? pendingText : children}
    </button>
  );
}

export function FormAlert({ state }: { state: ActionState }) {
  if (!state) return null;
  return (
    <div className="space-y-2">
      {state.error && (
        <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm text-red-700">
          {state.error}
        </p>
      )}
      {state.message && (
        <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-3.5 py-2.5 text-sm text-emerald-800">
          {state.message}
        </p>
      )}
      {state.secret && (
        <p className="rounded-xl border border-amber-300 bg-amber-50 px-3.5 py-2.5 font-mono text-sm text-amber-900">
          {state.secret}
          <span className="mt-1 block font-sans text-xs text-amber-700">
            Bu məlumat yalnız indi göstərilir — saxlayın və istifadəçiyə təhlükəsiz kanalla ötürün.
          </span>
        </p>
      )}
    </div>
  );
}

export function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="label">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-xs text-stone-500">{hint}</span>}
    </label>
  );
}
