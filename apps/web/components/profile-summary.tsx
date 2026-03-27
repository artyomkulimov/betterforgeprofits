import type {
  ForgeAnalysisResponse,
  ForgeProfileSummary,
} from "@betterforgeprofits/forge-core/types";
import { DataFreshnessBadge } from "@/components/data-freshness-badge";

function percent(value: number): string {
  return `${(value * 100).toFixed(1)}%`;
}

export function ProfileSummary({
  analysis,
  profile,
  isLoading,
}: {
  analysis: ForgeAnalysisResponse | null;
  profile: ForgeProfileSummary | null;
  isLoading?: boolean;
}) {
  const resolvedProfile = analysis?.profile ?? profile;
  const pricingMeta = analysis?.pricingMeta;

  return (
    <section className="border-[var(--border)] border-t pt-12">
      <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
        <div className="border-[var(--accent)]/60 border-l-2 bg-[var(--panel)]/75 p-6 backdrop-blur-sm">
          <p className="font-bold text-[13px] text-[var(--accent)] uppercase tracking-[0.3em]">
            Selected profile
          </p>
          <h2 className="mt-3 font-[family-name:var(--font-atlas-serif)] text-3xl text-[var(--text-main)]">
            {isLoading && !resolvedProfile ? (
              <span className="inline-flex h-9 w-52 animate-pulse rounded-sm bg-[var(--panel-strong)]/90" />
            ) : (
              (resolvedProfile?.cuteName ?? "Unnamed Profile")
            )}
          </h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            <div>
              <p className="text-[11px] text-[var(--text-faint)] uppercase tracking-[0.24em]">
                HOTM
              </p>
              <p className="mt-2 text-2xl text-[var(--text-soft)]">
                {isLoading && !resolvedProfile ? (
                  <span className="inline-flex h-8 w-16 animate-pulse rounded-sm bg-[var(--panel-strong)]/90" />
                ) : (
                  (resolvedProfile?.hotmTier ?? "N/A")
                )}
              </p>
            </div>
            <div>
              <p className="text-[11px] text-[var(--text-faint)] uppercase tracking-[0.24em]">
                Quick Forge
              </p>
              <p className="mt-2 text-2xl text-[var(--text-soft)]">
                {isLoading && !resolvedProfile ? (
                  <span className="inline-flex h-8 w-16 animate-pulse rounded-sm bg-[var(--panel-strong)]/90" />
                ) : (
                  (resolvedProfile?.quickForgeLevel ?? "N/A")
                )}
              </p>
            </div>
            <div>
              <p className="text-[11px] text-[var(--text-faint)] uppercase tracking-[0.24em]">
                Time Reduction
              </p>
              <p className="mt-2 text-2xl text-[var(--text-soft)]">
                {isLoading && !resolvedProfile ? (
                  <span className="inline-flex h-8 w-24 animate-pulse rounded-sm bg-[var(--panel-strong)]/90" />
                ) : (
                  percent(resolvedProfile?.quickForgeReduction ?? 0)
                )}
              </p>
            </div>
          </div>
        </div>

        <div className="border-[var(--accent)]/40 border-l-2 bg-[var(--panel)]/75 p-6 backdrop-blur-sm">
          <p className="font-bold text-[13px] text-[var(--accent)] uppercase tracking-[0.3em]">
            Market snapshots
          </p>
          {isLoading && !pricingMeta ? (
            <div className="mt-4 divide-y divide-[var(--border)]">
              <div className="flex items-start justify-between gap-4 py-4 first:pt-1">
                <div className="border-[var(--accent)]/35 border-l-2 pl-3">
                  <span className="inline-flex h-2.5 w-14 animate-pulse rounded-sm bg-[var(--panel-strong)]/90" />
                  <span className="mt-2 block h-4 w-40 animate-pulse rounded-sm bg-[var(--panel-strong)]/90" />
                </div>
                <span className="h-7 w-14 shrink-0 animate-pulse rounded-full bg-[var(--panel-strong)]/90" />
              </div>
              <div className="flex items-start justify-between gap-4 py-4 last:pb-1">
                <div className="border-[var(--accent)]/35 border-l-2 pl-3">
                  <span className="inline-flex h-2.5 w-16 animate-pulse rounded-sm bg-[var(--panel-strong)]/90" />
                  <span className="mt-2 block h-4 w-36 animate-pulse rounded-sm bg-[var(--panel-strong)]/90" />
                </div>
                <span className="h-7 w-14 shrink-0 animate-pulse rounded-full bg-[var(--panel-strong)]/90" />
              </div>
            </div>
          ) : (
            <div className="mt-4 divide-y divide-[var(--border)]">
              <DataFreshnessBadge
                ageSeconds={pricingMeta?.snapshotAgeSeconds ?? null}
                label="Bazaar"
                timestamp={pricingMeta?.bazaarSnapshotFetchedAt ?? null}
              />
              <DataFreshnessBadge
                ageSeconds={pricingMeta?.snapshotAgeSeconds ?? null}
                label="Auction"
                timestamp={pricingMeta?.auctionSnapshotFetchedAt ?? null}
              />
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
