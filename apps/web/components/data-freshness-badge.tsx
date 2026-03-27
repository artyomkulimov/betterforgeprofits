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
  return (
    <span className="rounded-sm border border-[var(--border)] bg-[var(--bg)]/70 px-3 py-2 text-[11px] text-[var(--text-muted)] uppercase tracking-[0.2em]">
      {label}:{" "}
      <span className="text-[var(--text-soft)]">
        {formatStamp(timestamp)}
        {ageSeconds !== null && ageSeconds !== undefined
          ? ` · ${Math.max(0, Math.round(ageSeconds / 60))}m old`
          : ""}
      </span>
    </span>
  );
}
