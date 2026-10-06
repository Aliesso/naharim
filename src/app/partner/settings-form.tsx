"use client";

import { useActionState } from "react";
import { updateRestaurantSettings } from "@/app/actions/partner";
import { Field, FormAlert, SubmitButton } from "@/components/forms";
import { WorkDaysInput } from "@/components/work-days-input";

export function SettingsForm(props: {
  lunchStart: string;
  lunchEnd: string;
  discountPercent: number;
  workDays: number[];
}) {
  const [state, action] = useActionState(updateRestaurantSettings, null);
  return (
    <form action={action} className="mt-4 space-y-4">
      <div className="grid gap-3 sm:grid-cols-3">
        <Field label="Nahar başlayır">
          <input name="lunchStart" type="time" defaultValue={props.lunchStart} required className="input" />
        </Field>
        <Field label="Nahar bitir">
          <input name="lunchEnd" type="time" defaultValue={props.lunchEnd} required className="input" />
        </Field>
        <Field label="Endirim (%)" hint="Abunəçinin planındakı maksimumu keçmir">
          <input name="discountPercent" type="number" min={1} max={90} defaultValue={props.discountPercent} required className="input" />
        </Field>
      </div>
      <WorkDaysInput selected={props.workDays} />
      <FormAlert state={state} />
      <SubmitButton className="btn-dark">Yadda saxla</SubmitButton>
    </form>
  );
}
