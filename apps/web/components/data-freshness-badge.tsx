"use client";

function formatStamp(value: number | null): string {
  if (!value) {
    return "Unavailable";
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(value);
}

export function DataFreshnessBadge({
  ageSeconds,
  label,
  timestamp,
}: {
  ageSeconds?: number | null;
  label: string;
  timestamp: number | null;
}) {
  const ageMinutes =
    ageSeconds !== null && ageSeconds !== undefined
      ? Math.max(0, Math.round(ageSeconds / 60))
      : null;

  return (
    <div className="flex items-start justify-between gap-4 py-4 first:pt-1 last:pb-1">
      <div className="min-w-0 border-[var(--accent)]/35 border-l-2 pl-3">
        <p className="font-semibold text-[11px] text-[var(--accent)] uppercase tracking-[0.28em]">
          {label}
        </p>
        <p className="mt-2 text-[var(--text-soft)] text-base tabular-nums tracking-tight">
          {formatStamp(timestamp)}
        </p>
      </div>
      {ageMinutes === null ? null : (
        <span className="mt-0.5 shrink-0 rounded-full border border-[var(--accent)]/30 bg-[var(--bg)]/50 px-2.5 py-1 text-[11px] text-[var(--accent-soft)] uppercase tracking-[0.18em]">
          {ageMinutes}m ago
        </span>
      )}
    </div>
  );
}
