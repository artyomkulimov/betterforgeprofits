"use client";

import { Check, LoaderCircle } from "lucide-react";

type CalculationStatusTone = "analysis" | "profile" | "success";

interface CalculationStatusToastProps {
  tone: CalculationStatusTone | null;
}

const TOAST_COPY: Record<
  CalculationStatusTone,
  { title: string; toneLabel: string }
> = {
  profile: {
    toneLabel: "Profile",
    title: "Loading player context",
  },
  analysis: {
    toneLabel: "Analysis",
    title: "Calculating forge routes",
  },
  success: {
    toneLabel: "Updated",
    title: "Analysis updated",
  },
};

export function CalculationStatusToast({ tone }: CalculationStatusToastProps) {
  if (tone === null) {
    return null;
  }

  const copy = TOAST_COPY[tone];
  const Icon = tone === "success" ? Check : LoaderCircle;

  return (
    <div className="pointer-events-none fixed top-0 left-1/2 z-50 w-[min(28rem,calc(100vw-1rem))] -translate-x-1/2 px-2 pt-3 sm:w-[min(32rem,calc(100vw-2rem))] sm:pt-4">
      <div className="animate-[panel-rise_220ms_ease-out] border border-[var(--border)] bg-[linear-gradient(180deg,rgba(35,28,22,0.96),rgba(26,21,16,0.94))] px-4 py-3 shadow-[0_12px_30px_rgba(0,0,0,0.18)] backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center text-[var(--accent)]">
            <Icon
              className={
                tone === "success" ? "h-4 w-4" : "h-4 w-4 animate-spin"
              }
            />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] text-[var(--text-faint)] uppercase tracking-[0.24em]">
              {copy.toneLabel}
            </p>
            <p className="mt-1 text-[var(--text-main)] text-sm">{copy.title}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
