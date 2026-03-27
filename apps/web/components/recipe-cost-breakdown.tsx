import type { ExpandedMaterial } from "@betterforgeprofits/forge-core/types";

function formatCoins(value: number | null): string {
  if (value === null) {
    return "N/A";
  }
  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: value >= 100 ? 0 : 2,
  }).format(value);
}

export function RecipeCostBreakdown({
  materials,
}: {
  materials: ExpandedMaterial[];
}) {
  return (
    <details className="group">
      <summary className="flex cursor-pointer list-none items-center justify-between border border-[var(--border)] bg-[var(--bg)]/45 px-4 py-3 text-[var(--accent)] text-xs uppercase tracking-[0.2em] transition hover:border-[var(--accent)]/50">
        <span>Raw material breakdown</span>
        <span className="text-[10px] text-[var(--text-faint)] tracking-[0.24em] transition group-open:rotate-180">
          ▾
        </span>
      </summary>
      <div className="mt-4 grid gap-3">
        {materials.map((material) => (
          <div
            className="grid gap-2 border border-[var(--border)] bg-[var(--bg)]/60 px-4 py-3 text-[var(--text-soft)] text-sm sm:grid-cols-[1.4fr_0.8fr_0.9fr_0.9fr]"
            key={`${material.source}-${material.name}`}
          >
            <span>{material.name}</span>
            <span>
              {new Intl.NumberFormat("en-US").format(material.quantity)}
            </span>
            <span className="text-[var(--text-faint)] uppercase tracking-wide">
              {material.source}
            </span>
            <span>{formatCoins(material.totalCost)}</span>
          </div>
        ))}
      </div>
    </details>
  );
}
