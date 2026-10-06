"use client";

import { useActionState } from "react";
import { getVoucher } from "@/app/actions/subscriber";
import { FormAlert, SubmitButton } from "@/components/forms";

export function VoucherButton({
  restaurantId,
  slug,
  disabled,
}: {
  restaurantId: string;
  slug: string;
  disabled: boolean;
}) {
  const [state, action] = useActionState(getVoucher, null);
  return (
    <form action={action} className="space-y-3">
      <input type="hidden" name="restaurantId" value={restaurantId} />
      <input type="hidden" name="returnTo" value={`/restaurants/${slug}`} />
      {disabled ? (
        <button type="button" disabled className="btn-primary w-full">
          Endirim kuponu al
        </button>
      ) : (
        <SubmitButton className="btn-primary w-full py-3 text-base" pendingText="Kupon yaradılır...">
          Endirim kuponu al
        </SubmitButton>
      )}
      <FormAlert state={state} />
    </form>
  );
}
