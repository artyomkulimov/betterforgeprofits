"use client";

import { getForgeBatchMetrics } from "@betterforgeprofits/forge-core/presentation";
import type {
  CraftTreeNode,
  ForgeAnalysisRow,
  PriceQuote,
} from "@betterforgeprofits/forge-core/types";
import Image from "next/image";
import type { CSSProperties } from "react";
import { useState } from "react";
import { getForgeItemImage } from "@/lib/forge-item-images";

const LOADING_ROWS = ["row-1", "row-2", "row-3", "row-4"] as const;
const METRIC_KEYS = [
  "HOTM",
  "Total Time",
  "Total Mats",
  "Total Revenue",
  "Total Profit",
  "Profit / Hr",
] as const;

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

function ForgeItemThumbnail({
  name,
  usesAh,
}: {
  name: string;
  usesAh?: boolean;
}) {
  const image = getForgeItemImage(name);
  const sourceTitle = usesAh
    ? "Auction house pricing used for this row"
    : "Bazaar pricing for this row";

  if (!image) {
    return (
      <span className="flex h-11 w-11 shrink-0 items-center justify-center border border-[var(--border)] bg-[var(--panel)]/72 text-[var(--text-faint)] text-sm">
        ?
      </span>
    );
  }

  return (
    <div className="relative shrink-0" title={sourceTitle}>
      <div
        className={
          usesAh
            ? "flex h-11 w-11 items-center justify-center border border-[var(--accent)]/55 bg-[var(--panel)]/72 p-1.5 ring-1 ring-[var(--accent)]/35 backdrop-blur-sm"
            : "flex h-11 w-11 items-center justify-center border border-[var(--border)] bg-[var(--panel)]/72 p-1.5 backdrop-blur-sm"
        }
      >
        <Image
          alt={image.alt}
          className="h-auto w-full object-contain"
          height={40}
          priority={false}
          src={image.src}
          unoptimized={image.src.endsWith(".gif")}
          width={40}
        />
      </div>
      <span
        className={
          usesAh
            ? "absolute -right-px -bottom-px flex min-w-[1.625rem] items-center justify-center rounded-tl-sm border border-[var(--accent)]/45 bg-[var(--panel-strong)] px-1.5 py-0.5 font-semibold text-[12px] text-[var(--accent)] uppercase leading-none tracking-wide"
            : "absolute -right-px -bottom-px flex min-w-[1.625rem] items-center justify-center rounded-tl-sm border border-[var(--border)] bg-[var(--bg)]/90 px-1.5 py-0.5 font-semibold text-[12px] text-[var(--text-muted)] uppercase leading-none tracking-wide"
        }
      >
        {usesAh ? "AH" : "BZ"}
      </span>
    </div>
  );
}

function InlineItem({ name, quantity }: { name: string; quantity: number }) {
  const image = getForgeItemImage(name);

  return (
    <span className="inline-flex min-w-0 items-center gap-2 align-middle">
      <span className="shrink-0 font-semibold text-[var(--text-main)]">
        {formatQuantity(quantity)}x
      </span>
      {image ? (
        <Image
          alt={image.alt}
          className="h-6 w-6 shrink-0 object-contain"
          height={24}
          src={image.src}
          unoptimized={image.src.endsWith(".gif")}
          width={24}
        />
      ) : null}
      <span className="break-words font-semibold text-[var(--accent)]">
        {name}
      </span>
    </span>
  );
}

function SourcePill({ source }: { source: PriceQuote["source"] | "unknown" }) {
  let className = "border-emerald-400/35 bg-emerald-500/10 text-emerald-300";

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
      className={`rounded-sm border px-2 py-1 text-[11px] uppercase tracking-[0.16em] ${className}`}
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
  const paddingLeft = Math.min(depth * 20, 80);

  return (
    <div className="space-y-1.5">
      <div
        className="relative"
        style={{
          paddingLeft,
        }}
      >
        {depth > 0 ? (
          <>
            <span className="pointer-events-none absolute top-0 left-[calc(var(--tree-indent)-13px)] h-full w-px bg-[var(--border)]" />
            <span className="pointer-events-none absolute top-1/2 left-[calc(var(--tree-indent)-13px)] h-px w-3 bg-[var(--accent)]/45" />
          </>
        ) : null}
        <div
          className="grid gap-2 border border-[var(--border)] bg-[var(--bg)]/45 px-4 py-3 text-sm sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center"
          style={
            {
              "--tree-indent": `${paddingLeft}px`,
            } as CSSProperties
          }
        >
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
              <span className="text-[var(--accent)]">{isLeaf ? "*" : "v"}</span>
              <InlineItem name={node.name} quantity={node.quantity} />
              {node.children.length > 0 ? (
                <>
                  <span className="font-semibold text-[var(--text-faint)]">
                    =
                  </span>
                  {node.children.map((child, index) => (
                    <span
                      className="inline-flex min-w-0 items-center gap-2"
                      key={child.nodeId}
                    >
                      {index > 0 ? (
                        <span className="text-[var(--text-faint)]">+</span>
                      ) : null}
                      <InlineItem name={child.name} quantity={child.quantity} />
                    </span>
                  ))}
                </>
              ) : (
                <span className="rounded-sm border border-emerald-400/30 bg-emerald-500/10 px-2 py-0.5 text-emerald-300 text-xs">
                  Direct
                </span>
              )}
            </div>
            {node.effectiveForgeDurationMs === null ? null : (
              <p className="mt-2 text-[11px] text-[var(--text-faint)] uppercase tracking-[0.18em]">
                Forge time: {formatDuration(node.effectiveForgeDurationMs)}
              </p>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-2 sm:justify-end">
            {node.leafPriceDetail ? (
              <SourcePill source={node.leafPriceDetail.source} />
            ) : null}
            <span className="text-[var(--text-muted)] tabular-nums">
              {formatCoins(node.subtotalCost)}
            </span>
          </div>
        </div>
      </div>

      {node.children.length > 0 ? (
        <div className="space-y-1.5">
          {node.children.map((child) => (
            <CraftTreeBranch
              depth={depth + 1}
              key={child.nodeId}
              node={child}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}

function CraftTreePanel({
  craftsNeeded,
  metrics,
  row,
}: {
  craftsNeeded: number;
  metrics: ReturnType<typeof getForgeBatchMetrics>;
  row: ForgeAnalysisRow;
}) {
  const rootNode: CraftTreeNode = {
    children: row.craftTree.map((node) => scaleNode(node, craftsNeeded)),
    effectiveForgeDurationMs: row.effectiveDurationMs,
    forgeDurationMs: row.baseDurationMs,
    isCraftable: true,
    itemId: row.outputPriceDetail?.itemId ?? row.outputPrice?.matchedId ?? null,
    kind: "item",
    leafPriceDetail: null,
    name: row.name,
    nodeId: `${row.recipeId}.output`,
    quantity: row.outputCount * craftsNeeded,
    recipeId: row.recipeId,
    subtotalCost: metrics.totalMaterialCost,
  };

  return (
    <div className="border border-[var(--accent)]/30 bg-[var(--panel)]/70 p-4">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-[var(--border)] border-b pb-3">
        <div>
          <p className="text-[11px] text-[var(--accent)] uppercase tracking-[0.28em]">
            Craft Tree
          </p>
          <p className="mt-1 text-[var(--text-faint)] text-xs uppercase tracking-[0.18em]">
            Batch-scaled to {formatQuantity(craftsNeeded)} craft
            {craftsNeeded === 1 ? "" : "s"}
          </p>
        </div>
        <div className="flex flex-wrap gap-2 text-[11px] uppercase tracking-[0.16em]">
          <span className="rounded-sm border border-[var(--border)] bg-[var(--bg)]/50 px-2 py-1 text-[var(--text-muted)]">
            {row.priceCoverage}
          </span>
          {row.usesAhPricing ? (
            <span className="rounded-sm border border-[var(--accent)]/40 bg-[var(--panel-strong)] px-2 py-1 text-[var(--accent)]">
              AH pricing
            </span>
          ) : null}
        </div>
      </div>
      <CraftTreeBranch node={rootNode} />
    </div>
  );
}

function MetricTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 border border-[var(--border)] bg-[var(--bg)]/35 px-3 py-3">
      <p className="text-[10px] text-[var(--text-faint)] uppercase tracking-[0.18em]">
        {label}
      </p>
      <p className="mt-2 truncate text-[var(--text-soft)] text-sm tabular-nums">
        {value}
      </p>
    </div>
  );
}

function ResultCard({
  isOpen,
  onToggle,
  row,
  slotCount,
  targetAmount,
}: {
  isOpen: boolean;
  onToggle: () => void;
  row: ForgeAnalysisRow;
  slotCount: number;
  targetAmount: number;
}) {
  const metrics = getForgeBatchMetrics(row, {
    targetAmount,
    slotCount,
  });
  const showForgeChainTime =
    metrics.totalRecursiveDurationMs !== metrics.totalDurationMs;

  return (
    <article className="border border-[var(--border)] bg-[var(--panel)]/68 backdrop-blur-sm">
      <button
        aria-expanded={isOpen}
        className="grid w-full gap-4 px-4 py-5 text-left transition hover:bg-[var(--panel-strong)]/35 md:grid-cols-[minmax(16rem,1.4fr)_minmax(0,2fr)] md:items-center"
        onClick={onToggle}
        type="button"
      >
        <div className="grid min-w-0 grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3">
          <ForgeItemThumbnail name={row.name} usesAh={row.usesAhPricing} />
          <div className="min-w-0">
            <p className="break-words font-[family-name:var(--font-atlas-serif)] text-2xl text-[var(--text-main)]">
              {row.name}
            </p>
            <p className="mt-1 break-words text-[var(--text-faint)] text-xs uppercase tracking-[0.18em]">
              {row.category}
            </p>
          </div>
          <span className="shrink-0 rounded-sm border border-[var(--border)] bg-[var(--bg)]/50 px-3 py-1.5 text-[var(--accent)] text-xs uppercase tracking-[0.18em]">
            {isOpen ? "Close" : "Tree"}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2 lg:grid-cols-6">
          <MetricTile label="HOTM" value={String(row.hotmRequired ?? "N/A")} />
          <MetricTile
            label="Total Time"
            value={formatDuration(metrics.totalDurationMs)}
          />
          <MetricTile
            label="Total Mats"
            value={formatCoins(metrics.totalMaterialCost)}
          />
          <MetricTile
            label="Revenue"
            value={formatCoins(metrics.totalOutputValue)}
          />
          <MetricTile label="Profit" value={formatCoins(metrics.totalProfit)} />
          <MetricTile
            label="Profit / Hr"
            value={formatCoins(metrics.totalProfitPerHour)}
          />
        </div>
      </button>

      {showForgeChainTime ? (
        <div className="border-[var(--border)] border-t px-4 py-2 text-[11px] text-[var(--text-faint)] uppercase tracking-[0.18em]">
          Forge chain: {formatDuration(metrics.totalRecursiveDurationMs)}
        </div>
      ) : null}

      {isOpen ? (
        <div className="border-[var(--border)] border-t p-4">
          <CraftTreePanel
            craftsNeeded={metrics.craftsNeeded}
            metrics={metrics}
            row={row}
          />
        </div>
      ) : null}
    </article>
  );
}

export function ForgeResultsTable({
  rows,
  targetAmount,
  slotCount,
  emptyMessage,
  isLoading,
}: {
  rows: ForgeAnalysisRow[];
  targetAmount: number;
  slotCount: number;
  emptyMessage: string;
  isLoading?: boolean;
}) {
  const [openRecipeId, setOpenRecipeId] = useState<string | null>(null);

  if (isLoading) {
    return (
      <div className="grid gap-4">
        {LOADING_ROWS.map((rowKey) => (
          <article
            className="border border-[var(--border)] bg-[var(--panel)]/68 p-5"
            key={rowKey}
          >
            <div className="grid gap-4 md:grid-cols-[minmax(16rem,1.4fr)_minmax(0,2fr)] md:items-center">
              <div className="grid min-w-0 grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3">
                <span className="h-11 w-11 shrink-0 animate-pulse rounded-sm border border-[var(--border)] bg-[var(--panel-strong)]/90" />
                <div className="min-w-0 space-y-2">
                  <span className="block h-6 max-w-full animate-pulse rounded-sm bg-[var(--panel-strong)]/90" />
                  <span className="block h-3 w-24 animate-pulse rounded-sm bg-[var(--panel-strong)]/70" />
                </div>
                <span className="h-7 w-14 shrink-0 animate-pulse rounded-sm bg-[var(--panel-strong)]/90" />
              </div>
              <div className="grid grid-cols-2 gap-2 lg:grid-cols-6">
                {METRIC_KEYS.map((key) => (
                  <span
                    className="h-16 animate-pulse rounded-sm border border-[var(--border)] bg-[var(--panel-strong)]/70"
                    key={`${rowKey}-${key}`}
                  />
                ))}
              </div>
            </div>
          </article>
        ))}
      </div>
    );
  }

  if (rows.length === 0) {
    return (
      <div className="border border-[var(--border)] bg-[var(--panel)]/40 p-8 text-[var(--text-muted)] text-sm leading-relaxed">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className="grid gap-4">
      {rows.map((row) => (
        <ResultCard
          isOpen={openRecipeId === row.recipeId}
          key={row.recipeId}
          onToggle={() =>
            setOpenRecipeId((current) =>
              current === row.recipeId ? null : row.recipeId
            )
          }
          row={row}
          slotCount={slotCount}
          targetAmount={targetAmount}
        />
      ))}
    </div>
  );
}
