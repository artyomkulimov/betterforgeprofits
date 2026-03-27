"use client";

import type {
  CraftTreeNode,
  PriceQuote,
} from "@betterforgeprofits/forge-core/types";
import type { CSSProperties } from "react";

function formatCoins(value: number | null): string {
  if (value === null) {
    return "N/A";
  }

  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: value >= 100 ? 0 : 2,
  }).format(value);
}

function formatQuantity(value: number): string {
  return new Intl.NumberFormat("en-US").format(value);
}

function formatDuration(ms: number): string {
  const totalMinutes = Math.round(ms / 60_000);
  const days = Math.floor(totalMinutes / (60 * 24));
  const hours = Math.floor((totalMinutes % (60 * 24)) / 60);
  const minutes = totalMinutes % 60;
  const parts: string[] = [];

  if (days) {
    parts.push(`${days}d`);
  }
  if (hours) {
    parts.push(`${hours}h`);
  }
  if (minutes || parts.length === 0) {
    parts.push(`${minutes}m`);
  }

  return parts.join(" ");
}

function scaleNode(node: CraftTreeNode, craftsNeeded: number): CraftTreeNode {
  return {
    ...node,
    quantity: node.quantity * craftsNeeded,
    subtotalCost:
      node.subtotalCost === null ? null : node.subtotalCost * craftsNeeded,
    leafPriceDetail: node.leafPriceDetail
      ? {
          ...node.leafPriceDetail,
          totalCost:
            node.leafPriceDetail.totalCost === null
              ? null
              : node.leafPriceDetail.totalCost * craftsNeeded,
        }
      : null,
    children: node.children.map((child) => scaleNode(child, craftsNeeded)),
  };
}

function SourcePill({ source }: { source: PriceQuote["source"] | "unknown" }) {
  let className =
    "border-[var(--border)] bg-[var(--bg)]/60 text-[var(--text-muted)]";

  if (source === "auction") {
    className =
      "border-[var(--accent)]/40 bg-[var(--panel-strong)] text-[var(--accent)]";
  } else if (source === "coins") {
    className =
      "border-[var(--border)] bg-[var(--panel)]/55 text-[var(--text-main)]";
  } else if (source === "unknown") {
    className =
      "border-[var(--border)] bg-[var(--bg)]/60 text-[var(--text-faint)]";
  }

  return (
    <span
      className={`rounded-sm border px-2 py-1 text-[10px] uppercase tracking-[0.18em] ${className}`}
    >
      {source}
    </span>
  );
}

function CraftTreeBranch({
  depth = 0,
  node,
}: {
  depth?: number;
  node: CraftTreeNode;
}) {
  const isLeaf = node.children.length === 0;
  const paddingLeft = Math.min(depth * 16, 64);
  const forgeStepTotalDurationMs =
    node.effectiveForgeDurationMs === null
      ? null
      : node.effectiveForgeDurationMs * node.quantity;
  let branchTone = "border-[var(--border)] bg-[var(--panel)]/55";

  if (isLeaf) {
    branchTone = "border-[var(--border)] bg-[var(--bg)]/55";
  } else if (depth === 0) {
    branchTone = "border-[var(--accent)]/22 bg-[var(--panel)]/72";
  }

  return (
    <div className="space-y-3">
      <div className="relative" style={{ paddingLeft }}>
        {depth > 0 ? (
          <>
            <div className="pointer-events-none absolute top-0 left-[calc(var(--tree-indent)-12px)] h-full w-px bg-[var(--border)]/80" />
            <div className="pointer-events-none absolute top-6 left-[calc(var(--tree-indent)-12px)] h-px w-3 bg-[var(--accent)]/35" />
          </>
        ) : null}
        <div
          className={`relative border px-4 py-3 ${branchTone}`}
          style={
            {
              "--tree-indent": `${paddingLeft}px`,
            } as CSSProperties
          }
        >
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <p className="break-words text-[var(--text-main)] text-base">
                  {node.name}
                </p>
                {node.isCraftable ? (
                  <span className="rounded-sm border border-[var(--accent)]/25 bg-[var(--panel)]/55 px-2 py-1 text-[10px] text-[var(--accent)] uppercase tracking-[0.18em]">
                    Forge step
                  </span>
                ) : null}
                {node.leafPriceDetail ? (
                  <SourcePill source={node.leafPriceDetail.source} />
                ) : null}
              </div>
              <p className="mt-2 text-[10px] text-[var(--text-faint)] uppercase tracking-[0.2em]">
                Qty · {formatQuantity(node.quantity)}
              </p>
              {node.effectiveForgeDurationMs === null ? null : (
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <span className="rounded-sm border border-[var(--accent)]/25 bg-[var(--panel-strong)]/55 px-2 py-1 text-[10px] text-[var(--accent)] uppercase tracking-[0.18em]">
                    Forge Time · {formatDuration(node.effectiveForgeDurationMs)}
                  </span>
                  {node.quantity > 1 && forgeStepTotalDurationMs !== null ? (
                    <span className="rounded-sm border border-[var(--border)] bg-[var(--bg)]/65 px-2 py-1 text-[10px] text-[var(--text-muted)] uppercase tracking-[0.16em]">
                      Step Total · {formatDuration(forgeStepTotalDurationMs)}
                    </span>
                  ) : null}
                </div>
              )}
              {node.leafPriceDetail?.matchedId ? (
                <p className="mt-1 break-all text-[10px] text-[var(--text-faint)] uppercase tracking-[0.16em]">
                  Match: {node.leafPriceDetail.matchedId}
                </p>
              ) : null}
              {node.leafPriceDetail ? (
                <p className="mt-2 text-[var(--text-muted)] text-xs">
                  Unit {formatCoins(node.leafPriceDetail.unitPrice)}
                </p>
              ) : null}
            </div>
            <div className="shrink-0 sm:text-right">
              <p className="text-[10px] text-[var(--text-faint)] uppercase tracking-[0.2em]">
                Subtotal
              </p>
              <p className="mt-1 text-[var(--text-soft)] text-base">
                {formatCoins(node.subtotalCost)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {node.children.length > 0 ? (
        <div className="space-y-3">
          <div
            className="ml-3 border-[var(--accent)]/18 border-l pl-4"
            style={{ marginLeft: `${paddingLeft + 10}px` }}
          >
            <p className="mb-3 text-[10px] text-[var(--accent)] uppercase tracking-[0.26em]">
              Requires
            </p>
            <div className="space-y-3">
              {node.children.map((child) => (
                <CraftTreeBranch
                  depth={depth + 1}
                  key={child.nodeId}
                  node={child}
                />
              ))}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export function CraftTreeView({
  craftsNeeded,
  nodes,
}: {
  craftsNeeded: number;
  nodes: CraftTreeNode[];
}) {
  const scaledNodes = nodes.map((node) => scaleNode(node, craftsNeeded));

  return (
    <div className="space-y-3">
      {scaledNodes.map((node) => (
        <CraftTreeBranch key={node.nodeId} node={node} />
      ))}
    </div>
  );
}
