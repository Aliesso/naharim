export function StatCard({
  label,
  value,
  hint,
  tone,
}: {
  label: string;
  value: string;
  hint?: string;
  tone?: "green";
}) {
  return (
    <div className="card">
      <p className="text-sm text-stone-500">{label}</p>
      <p className={`mt-1 text-2xl font-extrabold ${tone === "green" ? "text-emerald-600" : ""}`}>{value}</p>
      {hint && <p className="mt-0.5 text-xs text-stone-500">{hint}</p>}
    </div>
  );
}
