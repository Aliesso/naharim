// Real şəkillər əlavə olunana qədər mətbəx növünə görə rəngli örtük
const PALETTES: Record<string, [string, string, string]> = {
  Azərbaycan: ["#fed7aa", "#fb923c", "🥘"],
  Kabab: ["#fecaca", "#ef4444", "🍢"],
  "Sağlam qida": ["#bbf7d0", "#22c55e", "🥗"],
  İtalyan: ["#fde68a", "#f59e0b", "🍝"],
  Yapon: ["#e9d5ff", "#a855f7", "🍣"],
  "Fast food": ["#fef08a", "#eab308", "🍔"],
};

export function CuisineArt({ cuisine, className = "" }: { cuisine: string; className?: string }) {
  const [from, to, emoji] = PALETTES[cuisine] ?? ["#e7e5e4", "#a8a29e", "🍽️"];
  return (
    <div
      className={`grid place-items-center ${className}`}
      style={{ background: `linear-gradient(135deg, ${from}, ${to})` }}
      aria-hidden
    >
      <span className="text-5xl drop-shadow-sm">{emoji}</span>
    </div>
  );
}
