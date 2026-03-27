"use client";

import type {
  CraftTreeNode,
  ExpandedMaterial,
} from "@betterforgeprofits/forge-core/types";
import { useId, useState } from "react";

import { CraftTreeView } from "@/components/craft-tree-view";

function formatCoins(value: number | null): string {
  if (value === null) {
    return "N/A";
  }
  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: value >= 100 ? 0 : 2,
  }).format(value);
}

type BreakdownTab = "raw_materials" | "craft_tree";

function RawMaterialsPanel({ materials }: { materials: ExpandedMaterial[] }) {
  return (
    <div className="mt-4 grid gap-3">
      {materials.map((material) => (
        <div
          className="grid gap-2 border border-[var(--border)] bg-[var(--bg)]/60 px-4 py-3 text-[var(--text-soft)] text-sm sm:grid-cols-[1.4fr_0.8fr_0.9fr_0.9fr]"
          key={`${material.source}-${material.name}`}
        >
          <span className="break-words">{material.name}</span>
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
  );
}

function BreakdownTabButton({
  controls,
  isActive,
  label,
  onClick,
}: {
  controls: string;
  isActive: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      aria-controls={controls}
      aria-pressed={isActive}
      className={`border px-3 py-2 text-[11px] uppercase tracking-[0.22em] transition ${
        isActive
          ? "border-[var(--accent)]/40 bg-[var(--panel)]/70 text-[var(--accent)]"
          : "border-[var(--border)] bg-[var(--bg)]/35 text-[var(--text-faint)] hover:border-[var(--accent)]/30 hover:text-[var(--text-soft)]"
      }`}
      onClick={onClick}
      type="button"
    >
      {label}
    </button>
  );
}

export function RecipeCostBreakdown({
  craftsNeeded,
  materials,
  tree,
}: {
  craftsNeeded: number;
  materials: ExpandedMaterial[];
  tree: CraftTreeNode[];
}) {
  const [activeTab, setActiveTab] = useState<BreakdownTab>("raw_materials");
  const rawPanelId = useId();
  const treePanelId = useId();

  return (
    <details className="group">
      <summary className="flex cursor-pointer list-none items-center justify-between border border-[var(--border)] bg-[var(--bg)]/45 px-4 py-3 text-[var(--accent)] text-sm uppercase tracking-[0.2em] transition hover:border-[var(--accent)]/50">
        <span>Material breakdown</span>
        <span className="text-[11px] text-[var(--text-faint)] tracking-[0.24em] transition group-open:rotate-180">
          ▾
        </span>
      </summary>

      <div className="mt-4 space-y-4">
        <div className="flex flex-wrap gap-2">
          <BreakdownTabButton
            controls={rawPanelId}
            isActive={activeTab === "raw_materials"}
            label="Raw Materials"
            onClick={() => setActiveTab("raw_materials")}
          />
          <BreakdownTabButton
            controls={treePanelId}
            isActive={activeTab === "craft_tree"}
            label="Craft Tree"
            onClick={() => setActiveTab("craft_tree")}
          />
        </div>

        <div hidden={activeTab !== "raw_materials"} id={rawPanelId}>
          <RawMaterialsPanel materials={materials} />
        </div>

        <div hidden={activeTab !== "craft_tree"} id={treePanelId}>
          <div className="mb-3 text-[11px] text-[var(--text-faint)] uppercase tracking-[0.2em]">
            Batch-scaled to{" "}
            {new Intl.NumberFormat("en-US").format(craftsNeeded)} craft
            {craftsNeeded === 1 ? "" : "s"}
          </div>
          <CraftTreeView craftsNeeded={craftsNeeded} nodes={tree} />
        </div>
      </div>
    </details>
  );
}
