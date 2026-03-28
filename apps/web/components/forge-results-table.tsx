import { getForgeBatchMetrics } from "@betterforgeprofits/forge-core/presentation";
import type { ForgeAnalysisRow } from "@betterforgeprofits/forge-core/types";
import Image from "next/image";
import { CraftPricingPopover } from "@/components/craft-pricing-popover";
import { RecipeCostBreakdown } from "@/components/recipe-cost-breakdown";
import { getForgeItemImage } from "@/lib/forge-item-images";

const DESKTOP_LOADING_ROWS = [
  "desktop-row-1",
  "desktop-row-2",
  "desktop-row-3",
  "desktop-row-4",
] as const;
const DESKTOP_LOADING_CELLS = [
  "desktop-cell-1",
  "desktop-cell-2",
  "desktop-cell-3",
  "desktop-cell-4",
  "desktop-cell-5",
  "desktop-cell-6",
] as const;
const MOBILE_LOADING_ROWS = [
  "mobile-row-1",
  "mobile-row-2",
  "mobile-row-3",
] as const;
const MOBILE_LOADING_METRICS = [
  "mobile-metric-1",
  "mobile-metric-2",
  "mobile-metric-3",
  "mobile-metric-4",
  "mobile-metric-5",
  "mobile-metric-6",
] as const;

function DesktopTableColGroup() {
  return (
    <colgroup>
      <col className="w-[40%] min-w-0" />
      <col className="w-[7%]" />
      <col className="w-[13%]" />
      <col className="w-[10%]" />
      <col className="w-[10%]" />
      <col className="w-[10%]" />
      <col className="w-[10%]" />
    </colgroup>
  );
}

function formatCoins(value: number | null): string {
  if (value === null) {
    return "N/A";
  }
  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: value >= 100 ? 0 : 2,
  }).format(value);
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

function ForgeItemThumbnail({ row }: { row: ForgeAnalysisRow }) {
  const image = getForgeItemImage(row.name);
  const usesAh = row.usesAhPricing;
  const sourceTitle = usesAh
    ? "Auction house pricing used for this row"
    : "Bazaar pricing for this row";

  if (!image) {
    return null;
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
  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="hidden overflow-hidden border border-[var(--border)] lg:block">
          <table className="w-full min-w-0 table-fixed border-collapse">
            <DesktopTableColGroup />
            <thead className="bg-[var(--panel)]/85 text-[11px] text-[var(--text-faint)] uppercase tracking-[0.24em]">
              <tr>
                <th className="px-4 py-4 text-left">Item</th>
                <th className="px-4 py-4 text-right">HOTM</th>
                <th className="px-4 py-4 text-right">Total Time</th>
                <th className="px-4 py-4 text-right">Total Mats</th>
                <th className="px-4 py-4 text-right">Total Revenue</th>
                <th className="px-4 py-4 text-right">Total Profit</th>
                <th className="px-4 py-4 text-right">Profit / Hr</th>
              </tr>
            </thead>
            <tbody>
              {DESKTOP_LOADING_ROWS.map((rowKey) => (
                <tr
                  className="border-[var(--border)] border-t text-sm"
                  key={rowKey}
                >
                  <td className="min-w-0 px-4 py-5">
                    <div className="grid w-full min-w-0 grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3">
                      <span className="h-11 w-11 shrink-0 animate-pulse rounded-sm border border-[var(--border)] bg-[var(--panel-strong)]/90" />
                      <div className="min-w-0 space-y-2">
                        <span className="block h-6 max-w-full animate-pulse rounded-sm bg-[var(--panel-strong)]/90" />
                        <span className="block h-3 w-24 animate-pulse rounded-sm bg-[var(--panel-strong)]/70" />
                      </div>
                      <span className="h-7 w-14 shrink-0 animate-pulse rounded-sm bg-[var(--panel-strong)]/90" />
                    </div>
                  </td>
                  {DESKTOP_LOADING_CELLS.map((cellKey) => (
                    <td
                      className="px-4 py-5 text-right"
                      key={`${rowKey}-${cellKey}`}
                    >
                      <span className="inline-block h-5 w-20 animate-pulse rounded-sm bg-[var(--panel-strong)]/90 tabular-nums" />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="grid gap-4 lg:hidden">
          {MOBILE_LOADING_ROWS.map((rowKey) => (
            <article
              className="border-[var(--accent)]/60 border-l-2 bg-[var(--panel)]/75 p-5 backdrop-blur-sm"
              key={rowKey}
            >
              <div className="space-y-3">
                <span className="block h-8 w-52 animate-pulse rounded-sm bg-[var(--panel-strong)]/90" />
                <span className="block h-3 w-28 animate-pulse rounded-sm bg-[var(--panel-strong)]/70" />
              </div>
              <div className="mt-5 grid grid-cols-2 gap-4">
                {MOBILE_LOADING_METRICS.map((metricKey) => (
                  <div key={`${rowKey}-${metricKey}`}>
                    <span className="block h-3 w-16 animate-pulse rounded-sm bg-[var(--panel-strong)]/70" />
                    <span className="mt-2 block h-5 w-24 animate-pulse rounded-sm bg-[var(--panel-strong)]/90" />
                  </div>
                ))}
              </div>
            </article>
          ))}
        </div>
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
    <div className="space-y-4">
      <div className="hidden overflow-hidden border border-[var(--border)] lg:block">
        <table className="w-full min-w-0 table-fixed border-collapse">
          <DesktopTableColGroup />
          <thead className="bg-[var(--panel)]/85 text-[11px] text-[var(--text-faint)] uppercase tracking-[0.24em]">
            <tr>
              <th className="px-4 py-4 text-left">Item</th>
              <th className="px-4 py-4 text-right">HOTM</th>
              <th className="px-4 py-4 text-right">Total Time</th>
              <th className="px-4 py-4 text-right">Total Mats</th>
              <th className="px-4 py-4 text-right">Total Revenue</th>
              <th className="px-4 py-4 text-right">Total Profit</th>
              <th className="px-4 py-4 text-right">Profit / Hr</th>
            </tr>
          </thead>
          {rows.map((row) => {
            const metrics = getForgeBatchMetrics(row, {
              targetAmount,
              slotCount,
            });
            const showForgeChainTime =
              metrics.totalRecursiveDurationMs !== metrics.totalDurationMs;

            return (
              <tbody key={row.recipeId}>
                <tr className="border-[var(--border)] border-t align-middle text-[var(--text-soft)] text-sm">
                  <td className="min-w-0 px-4 py-5">
                    <div className="grid w-full min-w-0 grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3">
                      <ForgeItemThumbnail row={row} />
                      <div className="min-w-0">
                        <p className="break-words font-[family-name:var(--font-atlas-serif)] text-[var(--text-main)] text-xl">
                          {row.name}
                        </p>
                        <p className="mt-1 break-words text-[var(--text-faint)] text-sm uppercase tracking-[0.18em]">
                          {row.category}
                        </p>
                      </div>
                      <div className="shrink-0">
                        <CraftPricingPopover panelAlign="end" row={row} />
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-5 text-right tabular-nums">
                    {row.hotmRequired ?? "N/A"}
                  </td>
                  <td className="px-4 py-5 text-right align-middle tabular-nums">
                    <div className="space-y-1">
                      <p>{formatDuration(metrics.totalDurationMs)}</p>
                      <p
                        className={
                          showForgeChainTime
                            ? "text-[11px] text-[var(--text-faint)] uppercase tracking-[0.18em]"
                            : "invisible text-[11px] uppercase tracking-[0.18em]"
                        }
                      >
                        {showForgeChainTime
                          ? `Forge Chain: ${formatDuration(metrics.totalRecursiveDurationMs)}`
                          : "\u00a0"}
                      </p>
                    </div>
                  </td>
                  <td className="px-4 py-5 text-right tabular-nums">
                    {formatCoins(metrics.totalMaterialCost)}
                  </td>
                  <td className="px-4 py-5 text-right tabular-nums">
                    {formatCoins(metrics.totalOutputValue)}
                  </td>
                  <td className="px-4 py-5 text-right tabular-nums">
                    {formatCoins(metrics.totalProfit)}
                  </td>
                  <td className="px-4 py-5 text-right tabular-nums">
                    {formatCoins(metrics.totalProfitPerHour)}
                  </td>
                </tr>
                <tr className="border-[var(--border)]/60 border-t bg-[var(--panel)]/20">
                  <td className="px-4 py-4" colSpan={7}>
                    <RecipeCostBreakdown
                      craftsNeeded={metrics.craftsNeeded}
                      materials={metrics.scaledMaterials}
                      tree={row.craftTree}
                    />
                  </td>
                </tr>
              </tbody>
            );
          })}
        </table>
      </div>

      <div className="grid gap-4 lg:hidden">
        {rows.map((row) => {
          const metrics = getForgeBatchMetrics(row, {
            targetAmount,
            slotCount,
          });
          const showForgeChainTime =
            metrics.totalRecursiveDurationMs !== metrics.totalDurationMs;

          return (
            <article
              className="border-[var(--accent)]/60 border-l-2 bg-[var(--panel)]/75 p-5 backdrop-blur-sm"
              key={row.recipeId}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <p className="font-[family-name:var(--font-atlas-serif)] text-2xl text-[var(--text-main)]">
                    {row.name}
                  </p>
                  <p className="mt-1 text-[11px] text-[var(--text-faint)] uppercase tracking-[0.2em]">
                    {row.category}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <ForgeItemThumbnail row={row} />
                  <CraftPricingPopover panelAlign="end" row={row} />
                </div>
              </div>
              <div className="mt-5 grid grid-cols-2 gap-4 text-[var(--text-soft)] text-sm">
                <div>
                  <p className="text-[11px] text-[var(--text-faint)] uppercase tracking-[0.22em]">
                    HOTM
                  </p>
                  <p className="mt-1">{row.hotmRequired ?? "N/A"}</p>
                </div>
                <div>
                  <p className="text-[11px] text-[var(--text-faint)] uppercase tracking-[0.22em]">
                    Total Time
                  </p>
                  <p className="mt-1">
                    {formatDuration(metrics.totalDurationMs)}
                  </p>
                  {showForgeChainTime ? (
                    <p className="mt-1 text-[11px] text-[var(--text-faint)] uppercase tracking-[0.18em]">
                      Forge Chain:{" "}
                      {formatDuration(metrics.totalRecursiveDurationMs)}
                    </p>
                  ) : null}
                </div>
                <div>
                  <p className="text-[11px] text-[var(--text-faint)] uppercase tracking-[0.22em]">
                    Total Mats
                  </p>
                  <p className="mt-1">
                    {formatCoins(metrics.totalMaterialCost)}
                  </p>
                </div>
                <div>
                  <p className="text-[11px] text-[var(--text-faint)] uppercase tracking-[0.22em]">
                    Profit / Hr
                  </p>
                  <p className="mt-1">
                    {formatCoins(metrics.totalProfitPerHour)}
                  </p>
                </div>
                <div>
                  <p className="text-[11px] text-[var(--text-faint)] uppercase tracking-[0.22em]">
                    Total Revenue
                  </p>
                  <p className="mt-1">
                    {formatCoins(metrics.totalOutputValue)}
                  </p>
                </div>
                <div>
                  <p className="text-[11px] text-[var(--text-faint)] uppercase tracking-[0.22em]">
                    Total Profit
                  </p>
                  <p className="mt-1">{formatCoins(metrics.totalProfit)}</p>
                </div>
              </div>
              <div className="mt-5">
                <RecipeCostBreakdown
                  craftsNeeded={metrics.craftsNeeded}
                  materials={metrics.scaledMaterials}
                  tree={row.craftTree}
                />
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
