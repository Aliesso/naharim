import { DAY_LABELS } from "@/lib/constants";

export function WorkDaysInput({ selected = [1, 2, 3, 4, 5] }: { selected?: number[] }) {
  return (
    <fieldset>
      <legend className="label">İş günləri</legend>
      <div className="flex flex-wrap gap-2">
        {Object.entries(DAY_LABELS).map(([d, label]) => (
          <label
            key={d}
            className="cursor-pointer rounded-lg border border-stone-300 px-3 py-1.5 text-sm has-checked:border-brand-500 has-checked:bg-brand-50 has-checked:text-brand-700"
          >
            <input
              type="checkbox"
              name="workDays"
              value={d}
              defaultChecked={selected.includes(Number(d))}
              className="sr-only"
            />
            {label}
          </label>
        ))}
      </div>
    </fieldset>
  );
}
