"use client";

import { getForgeBatchMetrics } from "@betterforgeprofits/forge-core/presentation";
import type {
  AppliedPriceDetail,
  ForgeAnalysisRow,
} from "@betterforgeprofits/forge-core/types";
import { useEffect, useId, useRef, useState } from "react";

function formatPricingModeLabel(
  mode:
    | ForgeAnalysisRow["materialPricingMode"]
    | ForgeAnalysisRow["outputPricingMode"]
): string {
  return mode
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
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

function PricingDetailRow({ detail }: { detail: AppliedPriceDetail }) {
  return (
    <div className="grid gap-2 border border-[var(--border)] bg-[var(--bg)]/40 px-4 py-3 text-sm sm:grid-cols-[1.5fr_repeat(4,minmax(0,1fr))]">
      <div className="min-w-0">
        <p className="break-words text-[var(--text-soft)]">{detail.name}</p>
        {detail.matchedId ? (
          <p className="mt-1 break-all text-[11px] text-[var(--text-faint)] uppercase tracking-[0.18em]">
            Match: {detail.matchedId}
          </p>
        ) : null}
      </div>
      <div>
        <p className="text-[11px] text-[var(--text-faint)] uppercase tracking-[0.18em]">
          Qty
        </p>
        <p className="mt-1 text-[var(--text-soft)]">
          {new Intl.NumberFormat("en-US").format(detail.quantity)}
        </p>
      </div>
      <div>
        <p className="text-[11px] text-[var(--text-faint)] uppercase tracking-[0.18em]">
          Unit
        </p>
        <p className="mt-1 text-[var(--text-soft)]">
          {formatCoins(detail.unitPrice)}
        </p>
      </div>
      <div>
        <p className="text-[11px] text-[var(--text-faint)] uppercase tracking-[0.18em]">
          Total
        </p>
        <p className="mt-1 text-[var(--text-soft)]">
          {formatCoins(detail.totalCost)}
        </p>
      </div>
      <div>
        <p className="text-[11px] text-[var(--text-faint)] uppercase tracking-[0.18em]">
          Source
        </p>
        <p className="mt-1 text-[var(--text-soft)] uppercase tracking-[0.12em]">
          {detail.source}
        </p>
      </div>
    </div>
  );
}

export function CraftPricingPopover({
  row,
  panelAlign = "start",
}: {
  row: ForgeAnalysisRow;
  panelAlign?: "start" | "end";
}) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const cardId = useId();
  const metrics = getForgeBatchMetrics(row, {
    targetAmount: 1,
    slotCount: 1,
  });

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    function handlePointerDown(event: MouseEvent) {
      if (!containerRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  return (
    <div className="relative" ref={containerRef}>
      <button
        aria-controls={cardId}
        aria-expanded={isOpen}
        className="rounded-sm border border-[var(--border)] bg-[var(--bg)]/45 px-3 py-1.5 text-[11px] text-[var(--text-soft)] uppercase tracking-[0.2em] transition hover:border-[var(--accent)]/50 hover:text-[var(--accent)]"
        onClick={() => setIsOpen((current) => !current)}
        type="button"
      >
        Info
      </button>
      {isOpen ? (
        <div
          className={`absolute top-[calc(100%+0.75rem)] z-30 w-[min(42rem,calc(100vw-3rem))] border border-[var(--accent)]/30 bg-[var(--panel)]/95 p-4 shadow-[0_20px_60px_rgba(0,0,0,0.28)] backdrop-blur-sm ${panelAlign === "end" ? "right-0" : "left-0"}`}
          id={cardId}
          role="dialog"
        >
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-[11px] text-[var(--accent)] uppercase tracking-[0.3em]">
                Pricing Used
              </p>
              <h3 className="mt-2 font-[family-name:var(--font-atlas-serif)] text-2xl text-[var(--text-main)]">
                {row.name}
              </h3>
              <p className="mt-2 text-[12px] text-[var(--text-faint)] uppercase tracking-[0.22em]">
                One craft · current route calculation
              </p>
            </div>
            <button
              className="text-[var(--text-faint)] text-sm uppercase tracking-[0.22em] transition hover:text-[var(--accent)]"
              onClick={() => setIsOpen(false)}
              type="button"
            >
              Close
            </button>
          </div>

          {row.usesAhPricing ? (
            <div className="mt-4 border border-[var(--accent)]/25 bg-[var(--bg)]/35 px-3 py-2 text-[12px] text-[var(--text-soft)] uppercase tracking-[0.18em]">
              Auction pricing was used for at least part of this craft.
            </div>
          ) : null}

          <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <div className="border border-[var(--border)] bg-[var(--bg)]/35 px-4 py-3">
              <p className="text-[11px] text-[var(--text-faint)] uppercase tracking-[0.2em]">
                Output Unit Price
              </p>
              <p className="mt-2 text-[var(--text-main)] text-lg">
                {formatCoins(row.outputPriceDetail?.unitPrice ?? null)}
              </p>
              <p className="mt-1 text-[11px] text-[var(--text-muted)] uppercase tracking-[0.18em]">
                {row.outputPriceDetail?.source ?? "Unavailable"}
              </p>
            </div>
            <div className="border border-[var(--border)] bg-[var(--bg)]/35 px-4 py-3">
              <p className="text-[11px] text-[var(--text-faint)] uppercase tracking-[0.2em]">
                Base Mats
              </p>
              <p className="mt-2 text-[var(--text-main)] text-lg">
                {formatCoins(row.baseMaterialCost)}
              </p>
            </div>
            <div className="border border-[var(--border)] bg-[var(--bg)]/35 px-4 py-3">
              <p className="text-[11px] text-[var(--text-faint)] uppercase tracking-[0.2em]">
                Profit / Craft
              </p>
              <p className="mt-2 text-[var(--text-main)] text-lg">
                {formatCoins(row.profitPerCraft)}
              </p>
            </div>
            <div className="border border-[var(--border)] bg-[var(--bg)]/35 px-4 py-3">
              <p className="text-[11px] text-[var(--text-faint)] uppercase tracking-[0.2em]">
                Profit / Hr
              </p>
              <p className="mt-2 text-[var(--text-main)] text-lg">
                {formatCoins(metrics.totalProfitPerHour)}
              </p>
            </div>
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <div className="border border-[var(--border)] bg-[var(--bg)]/30 px-4 py-3">
              <p className="text-[11px] text-[var(--text-faint)] uppercase tracking-[0.2em]">
                Material Mode
              </p>
              <p className="mt-2 text-[var(--text-soft)] uppercase tracking-[0.14em]">
                {formatPricingModeLabel(row.materialPricingMode)}
              </p>
            </div>
            <div className="border border-[var(--border)] bg-[var(--bg)]/30 px-4 py-3">
              <p className="text-[11px] text-[var(--text-faint)] uppercase tracking-[0.2em]">
                Output Total
              </p>
              <p className="mt-2 text-[var(--text-soft)]">
                {formatCoins(row.outputPriceDetail?.totalCost ?? null)}
              </p>
            </div>
            <div className="border border-[var(--border)] bg-[var(--bg)]/30 px-4 py-3">
              <p className="text-[11px] text-[var(--text-faint)] uppercase tracking-[0.2em]">
                Output Mode
              </p>
              <p className="mt-2 text-[var(--text-soft)] uppercase tracking-[0.14em]">
                {formatPricingModeLabel(row.outputPricingMode)}
              </p>
            </div>
            <div className="border border-[var(--border)] bg-[var(--bg)]/30 px-4 py-3">
              <p className="text-[11px] text-[var(--text-faint)] uppercase tracking-[0.2em]">
                Top-Level Forge Time
              </p>
              <p className="mt-2 text-[var(--text-soft)]">
                {formatDuration(row.effectiveDurationMs)}
              </p>
            </div>
            <div className="border border-[var(--border)] bg-[var(--bg)]/30 px-4 py-3">
              <p className="text-[11px] text-[var(--text-faint)] uppercase tracking-[0.2em]">
                Forge Chain Time
              </p>
              <p className="mt-2 text-[var(--text-soft)]">
                {formatDuration(row.recursiveEffectiveDurationMs)}
              </p>
            </div>
            <div className="border border-[var(--border)] bg-[var(--bg)]/30 px-4 py-3 sm:col-span-2 xl:col-span-1">
              <p className="text-[11px] text-[var(--text-faint)] uppercase tracking-[0.2em]">
                Output Match
              </p>
              <p className="mt-2 break-all text-[var(--text-soft)] text-sm">
                {row.outputPriceDetail?.matchedId ?? "Unavailable"}
              </p>
            </div>
            <div className="border border-[var(--border)] bg-[var(--bg)]/30 px-4 py-3">
              <p className="text-[11px] text-[var(--text-faint)] uppercase tracking-[0.2em]">
                Coverage
              </p>
              <p className="mt-2 text-[var(--text-soft)] uppercase tracking-[0.14em]">
                {row.priceCoverage}
              </p>
            </div>
          </div>

          <div className="mt-5">
            <div className="flex items-center justify-between gap-4">
              <p className="text-[11px] text-[var(--text-faint)] uppercase tracking-[0.26em]">
                Raw Material Prices
              </p>
              <p className="text-[11px] text-[var(--text-muted)] uppercase tracking-[0.18em]">
                Current craft only
              </p>
            </div>
            <div className="mt-3 grid gap-3">
              {row.materialPriceDetails.map((detail) => (
                <PricingDetailRow
                  detail={detail}
                  key={`${detail.source}-${detail.name}-${detail.matchedId ?? "none"}`}
                />
              ))}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
