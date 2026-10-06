"use client";

import { useActionState } from "react";
import { subscribe } from "@/app/actions/subscriber";
import { FormAlert, SubmitButton } from "@/components/forms";

export function SubscribeButton({ planId, price }: { planId: string; price: number }) {
  const [state, action] = useActionState(subscribe, null);
  return (
    <form action={action} className="space-y-3">
      <input type="hidden" name="planId" value={planId} />
      <SubmitButton className="btn-primary w-full" pendingText="Ödəniş emal olunur...">
        {price.toFixed(2)} AZN ödə və abunə ol
      </SubmitButton>
      <p className="text-center text-xs text-stone-400">Demo rejim: real ödəniş alınmır</p>
      <FormAlert state={state} />
    </form>
  );
}
