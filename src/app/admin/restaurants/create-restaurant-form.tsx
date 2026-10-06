"use client";

import { useActionState } from "react";
import { createRestaurant } from "@/app/actions/admin";
import { DISTRICTS } from "@/lib/constants";
import { Field, FormAlert, SubmitButton } from "@/components/forms";
import { WorkDaysInput } from "@/components/work-days-input";

export function CreateRestaurantForm() {
  const [state, action] = useActionState(createRestaurant, null);
  return (
    <form action={action} className="mt-4 space-y-3">
      <Field label="Ad">
        <input name="name" required className="input" />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Mətbəx">
          <input name="cuisine" placeholder="Azərbaycan" className="input" />
        </Field>
        <Field label="Rayon">
          <select name="district" className="input">
            {DISTRICTS.map((d) => (
              <option key={d}>{d}</option>
            ))}
          </select>
        </Field>
      </div>
      <Field label="Ünvan">
        <input name="address" required className="input" />
      </Field>
      <Field label="Telefon">
        <input name="phone" type="tel" required className="input" />
      </Field>
      <Field label="Təsvir">
        <textarea name="description" rows={2} className="input" />
      </Field>
      <div className="grid grid-cols-3 gap-3">
        <Field label="Başlayır">
          <input name="lunchStart" type="time" defaultValue="12:00" className="input" />
        </Field>
        <Field label="Bitir">
          <input name="lunchEnd" type="time" defaultValue="15:00" className="input" />
        </Field>
        <Field label="Endirim %">
          <input name="discountPercent" type="number" min={1} max={90} defaultValue={20} className="input" />
        </Field>
      </div>
      <WorkDaysInput />
      <Field label="Kassir e-poçtu (istəyə bağlı)" hint="Restoran paneli üçün hesab və müvəqqəti şifrə yaradılacaq">
        <input name="cashierEmail" type="email" className="input" />
      </Field>
      <FormAlert state={state} />
      <SubmitButton className="btn-primary w-full">Restoran əlavə et</SubmitButton>
    </form>
  );
}
