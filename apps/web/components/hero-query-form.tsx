"use client";

import {
  isLowForgeTimeRow,
  isSuspiciousForgeRow,
  LOW_FORGE_TIME_THRESHOLD_MS,
  SUSPICIOUS_PROFIT_MULTIPLIER_THRESHOLD,
  sortForgeRows,
} from "@betterforgeprofits/forge-core/presentation";
import type {
  ForgeAnalysisResponse,
  ForgeProfileSummary,
  MaterialPricingMode,
  OutputPricingMode,
  SortMode,
} from "@betterforgeprofits/forge-core/types";
import { useDeferredValue, useEffect, useMemo, useRef, useState } from "react";

import { CalculationStatusToast } from "@/components/calculation-status-toast";
import { CustomSelect } from "@/components/custom-select";
import { ForgeResultsTable } from "@/components/forge-results-table";
import { ProfilePicker } from "@/components/profile-picker";
import { ProfileSummary } from "@/components/profile-summary";

interface ProfilesPayload {
  player: { username: string; uuid: string };
  profile: ForgeProfileSummary;
  profiles: ForgeProfileSummary[];
  selectedProfileId: string;
}

const RECENT_PLAYERS_KEY = "froge_recent_players";
const MAX_RECENT_PLAYERS = 6;
const clientProfilesCache = new Map<string, ProfilesPayload>();

const sortOptions = [
  {
    value: "profit_per_hour",
    label: "Profit / Hr",
    detail: "Best ongoing forge value",
  },
  {
    value: "profit_per_craft",
    label: "Profit / Craft",
    detail: "Most coins per finished item",
  },
  {
    value: "forge_time",
    label: "Fastest Forge Time",
    detail: "Shortest effective forge duration",
  },
] as const;

const materialOptions = [
  {
    value: "instant_buy",
    label: "Instant Buy",
    detail: "Use instant-buy pricing for materials",
  },
  {
    value: "buy_order",
    label: "Buy Order",
    detail: "Use buy-order pricing for materials",
  },
] as const;

const outputOptions = [
  {
    value: "sell_offer",
    label: "Sell Offer",
    detail: "Use sell-offer pricing for forged output",
  },
  {
    value: "instant_sell",
    label: "Instant Sell",
    detail: "Use instant-sell pricing for forged output",
  },
] as const;

const slotOptions = Array.from({ length: 7 }, (_, index) => {
  const value = String(index + 1);
  return { value, label: `${value} Slot${value === "1" ? "" : "s"}` };
});

const hotmOptions = Array.from({ length: 10 }, (_, index) => {
  const value = String(index + 1);
  return { value, label: `HOTM ${value}`, detail: "Manual profile override" };
});

const quickForgeOptions = Array.from({ length: 21 }, (_, index) => {
  const value = String(index);
  return { value, label: `Level ${value}`, detail: "Manual perk override" };
});

async function fetchJson<T>(url: string): Promise<T> {
  const response = await fetch(url);
  const payload = (await response.json()) as T & { error?: string };
  if (!response.ok) {
    throw new Error(payload.error || "Request failed.");
  }
  return payload;
}

function getCalculationToastTone(
  isProfileLoading: boolean,
  isAnalysisLoading: boolean,
  showAnalysisUpdatedToast: boolean
) {
  if (isProfileLoading) {
    return "profile" as const;
  }

  if (isAnalysisLoading) {
    return "analysis" as const;
  }

  if (showAnalysisUpdatedToast) {
    return "success" as const;
  }

  return null;
}

function getSubmitLabel(isProfileLoading: boolean, isAnalysisLoading: boolean) {
  if (isProfileLoading) {
    return "Loading profile...";
  }

  if (isAnalysisLoading) {
    return "Calculating...";
  }

  return "Load profile";
}

export function HeroQueryForm() {
  const [username, setUsername] = useState("");
  const [recentPlayers, setRecentPlayers] = useState<string[]>([]);
  const [playerName, setPlayerName] = useState<string | null>(null);
  const [profiles, setProfiles] = useState<ForgeProfileSummary[]>([]);
  const [contextProfile, setContextProfile] =
    useState<ForgeProfileSummary | null>(null);
  const [selectedProfileId, setSelectedProfileId] = useState("");
  const [analysis, setAnalysis] = useState<ForgeAnalysisResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [hasRequestedWorkspace, setHasRequestedWorkspace] = useState(false);
  const [isProfileLoading, setIsProfileLoading] = useState(false);
  const [isAnalysisLoading, setIsAnalysisLoading] = useState(false);
  const [showAnalysisUpdatedToast, setShowAnalysisUpdatedToast] =
    useState(false);
  const [sortMode, setSortMode] = useState<SortMode>("profit_per_hour");
  const [allowAh, setAllowAh] = useState(false);
  const [hideLowForgeTimeItems, setHideLowForgeTimeItems] = useState(false);
  const [hideSuspiciousItems, setHideSuspiciousItems] = useState(false);
  const [materialPricing, setMaterialPricing] =
    useState<MaterialPricingMode>("instant_buy");
  const [outputPricing, setOutputPricing] =
    useState<OutputPricingMode>("sell_offer");
  const [hotmLevel, setHotmLevel] = useState("0");
  const [quickForgeLevel, setQuickForgeLevel] = useState("0");
  const [targetAmount, setTargetAmount] = useState("1");
  const [slotCount, setSlotCount] = useState("1");
  const analysisRequestRef = useRef(0);

  const deferredRows = useDeferredValue(analysis?.rows ?? []);
  const isBusy = isProfileLoading || isAnalysisLoading;
  const workspaceVisible =
    hasRequestedWorkspace || profiles.length > 0 || analysis !== null;
  const submitLabel = getSubmitLabel(isProfileLoading, isAnalysisLoading);
  const parsedTargetAmount = useMemo(
    () => Math.max(1, Number.parseInt(targetAmount, 10) || 1),
    [targetAmount]
  );
  const parsedSlotCount = useMemo(
    () => Math.min(7, Math.max(1, Number.parseInt(slotCount, 10) || 1)),
    [slotCount]
  );
  const visibleRows = useMemo(() => {
    return deferredRows.filter((row) => {
      const settings = {
        targetAmount: parsedTargetAmount,
        slotCount: parsedSlotCount,
      };

      if (hideSuspiciousItems && isSuspiciousForgeRow(row, settings)) {
        return false;
      }

      if (hideLowForgeTimeItems && isLowForgeTimeRow(row, settings)) {
        return false;
      }

      return true;
    });
  }, [
    deferredRows,
    hideLowForgeTimeItems,
    hideSuspiciousItems,
    parsedSlotCount,
    parsedTargetAmount,
  ]);
  const displayRows = useMemo(
    () =>
      sortForgeRows(visibleRows, sortMode, {
        targetAmount: parsedTargetAmount,
        slotCount: parsedSlotCount,
      }),
    [parsedSlotCount, parsedTargetAmount, sortMode, visibleRows]
  );
  const recentPlayerOptions = useMemo(
    () =>
      recentPlayers.map((recentPlayer) => ({
        value: recentPlayer,
        label: recentPlayer,
        detail: "Reload this player instantly",
      })),
    [recentPlayers]
  );

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(RECENT_PLAYERS_KEY);
      if (!stored) {
        return;
      }

      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed)) {
        setRecentPlayers(
          parsed
            .filter((entry): entry is string => typeof entry === "string")
            .slice(0, MAX_RECENT_PLAYERS)
        );
      }
    } catch {
      window.localStorage.removeItem(RECENT_PLAYERS_KEY);
    }
  }, []);

  useEffect(() => {
    if (isProfileLoading || isAnalysisLoading || analysis === null || error) {
      setShowAnalysisUpdatedToast(false);
      return;
    }

    setShowAnalysisUpdatedToast(true);
    const timeoutId = window.setTimeout(() => {
      setShowAnalysisUpdatedToast(false);
    }, 1500);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [analysis, error, isAnalysisLoading, isProfileLoading]);

  const toastTone = getCalculationToastTone(
    isProfileLoading,
    isAnalysisLoading,
    showAnalysisUpdatedToast
  );

  function persistRecentPlayer(nextPlayer: string) {
    const normalized = nextPlayer.trim();
    if (!normalized) {
      return;
    }

    setRecentPlayers((current) => {
      const next = [
        normalized,
        ...current.filter(
          (entry) => entry.toLowerCase() !== normalized.toLowerCase()
        ),
      ].slice(0, MAX_RECENT_PLAYERS);

      window.localStorage.setItem(RECENT_PLAYERS_KEY, JSON.stringify(next));
      return next;
    });
  }

  function applyProfilesPayload(profilesPayload: ProfilesPayload) {
    setPlayerName(profilesPayload.player.username);
    setProfiles(profilesPayload.profiles);
    setSelectedProfileId(profilesPayload.selectedProfileId);
    setContextProfile(profilesPayload.profile);

    const selected =
      profilesPayload.profiles.find(
        (profile) => profile.profileId === profilesPayload.selectedProfileId
      ) ?? profilesPayload.profiles[0];

    setHotmLevel(String(selected?.hotmTier ?? 0));
    setQuickForgeLevel(String(selected?.quickForgeLevel ?? 0));
    persistRecentPlayer(profilesPayload.player.username);

    return {
      username: profilesPayload.player.username,
      profileId: profilesPayload.selectedProfileId,
      allowAh,
      materialPricing,
      outputPricing,
      hotmLevel: String(selected?.hotmTier ?? 0),
      quickForgeLevel: String(selected?.quickForgeLevel ?? 0),
    };
  }

  async function fetchProfiles(targetUsername: string) {
    const trimmed = targetUsername.trim();
    if (!trimmed) {
      throw new Error("Enter a Minecraft username.");
    }

    const cacheKey = trimmed.toLowerCase();
    const cached = clientProfilesCache.get(cacheKey);
    if (cached) {
      return applyProfilesPayload(cached);
    }

    setIsProfileLoading(true);
    const profilesPayload = await fetchJson<ProfilesPayload>(
      `/api/skyblock/context?username=${encodeURIComponent(trimmed)}`
    );
    clientProfilesCache.set(cacheKey, profilesPayload);
    return applyProfilesPayload(profilesPayload);
  }

  async function fetchAnalysisWithSettings(
    targetUsername: string,
    profileId: string,
    settings: {
      allowAh: boolean;
      materialPricing: MaterialPricingMode;
      outputPricing: OutputPricingMode;
      hotmLevel: string;
      quickForgeLevel: string;
    }
  ) {
    const requestId = ++analysisRequestRef.current;
    setIsAnalysisLoading(true);
    setAnalysis(null);
    const params = new URLSearchParams({
      username: targetUsername,
      profileId,
      allowAh: String(settings.allowAh),
      materialPricing: settings.materialPricing,
      outputPricing: settings.outputPricing,
      hotmOverride: settings.hotmLevel,
      quickForgeOverride: settings.quickForgeLevel,
    });

    try {
      const analysisPayload = await fetchJson<ForgeAnalysisResponse>(
        `/api/forge/analysis?${params.toString()}`
      );
      if (requestId !== analysisRequestRef.current) {
        return false;
      }

      setAnalysis(analysisPayload);
      return true;
    } catch (error) {
      if (requestId !== analysisRequestRef.current) {
        return false;
      }

      throw error;
    } finally {
      if (requestId === analysisRequestRef.current) {
        setIsAnalysisLoading(false);
      }
    }
  }

  function loadPlayer(targetUsername: string) {
    setError(null);
    setHasRequestedWorkspace(true);
    setProfiles([]);
    setContextProfile(null);
    setSelectedProfileId("");
    setAnalysis(null);
    setIsProfileLoading(true);
    setIsAnalysisLoading(true);

    fetchProfiles(targetUsername)
      .then(({ username: resolvedUsername, profileId, ...settings }) => {
        setIsProfileLoading(false);
        return fetchAnalysisWithSettings(resolvedUsername, profileId, settings);
      })
      .catch((submissionError) => {
        setAnalysis(null);
        setProfiles([]);
        setContextProfile(null);
        setSelectedProfileId("");
        setPlayerName(null);
        setIsProfileLoading(false);
        setIsAnalysisLoading(false);
        setError(
          submissionError instanceof Error
            ? submissionError.message
            : "Analysis failed."
        );
        setIsProfileLoading(false);
      });
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    loadPlayer(username);
  }

  function rerunAnalysis(
    profileId: string,
    nextSettings?: Partial<{
      allowAh: boolean;
      materialPricing: MaterialPricingMode;
      outputPricing: OutputPricingMode;
      hotmLevel: string;
      quickForgeLevel: string;
    }>
  ) {
    const activeUsername = playerName || username;
    if (!(activeUsername && profileId)) {
      return;
    }

    setError(null);
    fetchAnalysisWithSettings(activeUsername, profileId, {
      allowAh: nextSettings?.allowAh ?? allowAh,
      materialPricing: nextSettings?.materialPricing ?? materialPricing,
      outputPricing: nextSettings?.outputPricing ?? outputPricing,
      hotmLevel: nextSettings?.hotmLevel ?? hotmLevel,
      quickForgeLevel: nextSettings?.quickForgeLevel ?? quickForgeLevel,
    }).catch((submissionError) => {
      setError(
        submissionError instanceof Error
          ? submissionError.message
          : "Recalculation failed."
      );
    });
  }

  function handleProfileChange(profileId: string) {
    setSelectedProfileId(profileId);
    const selected = profiles.find(
      (profile) => profile.profileId === profileId
    );
    if (selected) {
      const nextHotm = String(selected.hotmTier ?? 0);
      const nextQuickForge = String(selected.quickForgeLevel ?? 0);
      setContextProfile(selected);
      setHotmLevel(nextHotm);
      setQuickForgeLevel(nextQuickForge);
      rerunAnalysis(profileId, {
        hotmLevel: nextHotm,
        quickForgeLevel: nextQuickForge,
      });
    }
  }

  return (
    <main className="mx-auto max-w-7xl space-y-16 px-6 pt-12 pb-28 lg:pt-16">
      <CalculationStatusToast tone={toastTone} />

      <div className="max-w-4xl">
        {/*<p className="text-[var(--accent)] text-xs uppercase tracking-[0.4em]">
          Hypixel SkyBlock
        </p>*/}
        <h1 className="mt-5 font-[family-name:var(--font-atlas-serif)] font-normal text-5xl leading-[1.05] tracking-tight sm:text-6xl lg:text-7xl">
          Forge profit,
          <span className="mt-5 block text-[var(--text-main)] italic sm:mt-6">
            ranked your way.
          </span>
        </h1>
        <p className="mt-5 max-w-3xl text-[var(--text-soft)] text-base leading-relaxed">
          Enter a player, tweak HOTM / Quick Forge and bazaar pricing, get one
          sorted list of crafts.
        </p>

        <form
          className="mt-8 grid gap-4 border border-[var(--border)] bg-[var(--panel)]/60 p-5 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end"
          onSubmit={handleSubmit}
        >
          <label className="block">
            <span className="mb-2 block text-[11px] text-[var(--text-faint)] uppercase tracking-[0.26em]">
              Minecraft username
            </span>
            <input
              className="w-full border border-[var(--border)] bg-[var(--bg)]/70 px-4 py-3 text-[var(--text-main)] text-sm outline-none transition placeholder:text-[var(--text-faint)] focus:border-[var(--accent)]"
              onChange={(event) => setUsername(event.target.value)}
              placeholder="e.g. Refraction"
              value={username}
            />
          </label>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            {recentPlayerOptions.length > 0 ? (
              <div className="min-w-64">
                <span className="mb-2 block text-[11px] text-[var(--text-faint)] uppercase tracking-[0.26em]">
                  Recently visited
                </span>
                <CustomSelect
                  buttonClassName="flex min-h-[46px] w-full items-center justify-between gap-3 border border-[var(--border)] bg-[var(--bg)]/70 px-4 py-3 text-left text-sm text-[var(--text-main)] transition hover:border-[var(--accent)]/60 disabled:cursor-not-allowed disabled:opacity-60"
                  disabled={isBusy}
                  onChange={(value: string) => {
                    setUsername(value);
                  }}
                  options={recentPlayerOptions}
                  placeholder="Recent players"
                  value=""
                />
              </div>
            ) : null}

            <button
              className="inline-flex items-center justify-center border border-[var(--accent)] bg-[var(--accent)] px-8 py-3 font-semibold text-[var(--bg)] text-sm tracking-wide transition hover:bg-transparent hover:text-[var(--accent)] disabled:cursor-wait disabled:opacity-60"
              disabled={isBusy}
              type="submit"
            >
              {submitLabel}
            </button>
          </div>

          {workspaceVisible ? (
            <div className="sm:col-span-2">
              <ProfilePicker
                disabled={isProfileLoading || profiles.length === 0}
                onChange={handleProfileChange}
                placeholder={
                  isProfileLoading ? "Loading profiles..." : "Select a profile"
                }
                profiles={profiles}
                value={selectedProfileId}
              />
            </div>
          ) : null}
        </form>

        {error ? (
          <div className="mt-4 border-[var(--accent)] border-l-2 bg-[var(--panel)]/60 px-4 py-3 text-[var(--text-soft)] text-sm">
            {error}
          </div>
        ) : null}
      </div>

      {workspaceVisible ? (
        <>
          <div className="space-y-6">
            <div className="animate-[panel-rise_420ms_ease-out]">
              <ProfileSummary
                analysis={analysis}
                isLoading={
                  isProfileLoading || (analysis === null && error === null)
                }
                profile={contextProfile}
              />
            </div>
            <div className="animate-[panel-rise_480ms_ease-out]">
              <details className="group">
                <summary className="flex cursor-pointer list-none items-center justify-between border border-[var(--border)] bg-[var(--bg)]/45 px-4 py-3 text-[var(--accent)] text-sm uppercase tracking-[0.2em] transition hover:border-[var(--accent)]/50">
                  <span>Advanced — HOTM & Quick Forge</span>
                  <span className="text-[11px] text-[var(--text-faint)] tracking-[0.24em] transition group-open:rotate-180">
                    ▾
                  </span>
                </summary>
                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  <div className="block min-w-0">
                    <span className="mb-2 block text-[11px] text-[var(--text-faint)] uppercase tracking-[0.22em]">
                      HOTM
                    </span>
                    <CustomSelect
                      disabled={isAnalysisLoading}
                      onChange={(value: string) => {
                        setHotmLevel(value);
                        rerunAnalysis(selectedProfileId, { hotmLevel: value });
                      }}
                      options={hotmOptions}
                      value={hotmLevel}
                    />
                  </div>
                  <div className="block min-w-0">
                    <span className="mb-2 block text-[11px] text-[var(--text-faint)] uppercase tracking-[0.22em]">
                      Quick Forge
                    </span>
                    <CustomSelect
                      disabled={isAnalysisLoading}
                      onChange={(value: string) => {
                        setQuickForgeLevel(value);
                        rerunAnalysis(selectedProfileId, {
                          quickForgeLevel: value,
                        });
                      }}
                      options={quickForgeOptions}
                      value={quickForgeLevel}
                    />
                  </div>
                </div>
              </details>
            </div>
          </div>

          <section className="mt-10 animate-[panel-rise_520ms_ease-out] space-y-8 border-[var(--border)] border-t pt-12">
            <div className="grid gap-6 lg:grid-cols-3">
              <div className="border border-[var(--border)] bg-[var(--panel)]/40 p-4">
                <span className="mb-3 block text-[11px] text-[var(--text-faint)] uppercase tracking-[0.22em]">
                  Sort by
                </span>
                <div className="block min-w-0">
                  <span className="mb-2 block text-[11px] text-[var(--text-faint)] uppercase tracking-[0.22em]">
                    Order
                  </span>
                  <CustomSelect
                    disabled={isAnalysisLoading}
                    onChange={(value: string) => setSortMode(value as SortMode)}
                    options={sortOptions}
                    value={sortMode}
                  />
                </div>
              </div>

              <div className="border border-[var(--border)] bg-[var(--panel)]/40 p-4">
                <span className="mb-3 block text-[11px] text-[var(--text-faint)] uppercase tracking-[0.22em]">
                  Batch
                </span>
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="block min-w-0">
                    <span className="mb-2 block text-[11px] text-[var(--text-faint)] uppercase tracking-[0.22em]">
                      Target amount
                    </span>
                    <input
                      className="min-h-[46px] w-full border border-[var(--border)] bg-[var(--panel)]/90 px-4 py-3 text-[var(--text-main)] text-sm outline-none transition focus:border-[var(--accent)] disabled:cursor-wait disabled:opacity-60"
                      disabled={isAnalysisLoading}
                      min={1}
                      onChange={(event) => setTargetAmount(event.target.value)}
                      step={1}
                      type="number"
                      value={targetAmount}
                    />
                  </label>
                  <div className="block min-w-0">
                    <span className="mb-2 block text-[11px] text-[var(--text-faint)] uppercase tracking-[0.22em]">
                      Forge slots
                    </span>
                    <CustomSelect
                      disabled={isAnalysisLoading}
                      onChange={(value: string) => setSlotCount(value)}
                      options={slotOptions}
                      value={slotCount}
                    />
                  </div>
                </div>
              </div>

              <div className="border border-[var(--border)] bg-[var(--panel)]/40 p-4">
                <span className="mb-3 block text-[11px] text-[var(--text-faint)] uppercase tracking-[0.22em]">
                  Bazaar pricing
                </span>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="block min-w-0">
                    <span className="mb-2 block text-[11px] text-[var(--text-faint)] uppercase tracking-[0.22em]">
                      Materials
                    </span>
                    <CustomSelect
                      disabled={isAnalysisLoading}
                      onChange={(value: string) => {
                        const nextValue = value as MaterialPricingMode;
                        setMaterialPricing(nextValue);
                        rerunAnalysis(selectedProfileId, {
                          materialPricing: nextValue,
                        });
                      }}
                      options={materialOptions}
                      value={materialPricing}
                    />
                  </div>
                  <div className="block min-w-0">
                    <span className="mb-2 block text-[11px] text-[var(--text-faint)] uppercase tracking-[0.22em]">
                      Forged item
                    </span>
                    <CustomSelect
                      disabled={isAnalysisLoading}
                      onChange={(value: string) => {
                        const nextValue = value as OutputPricingMode;
                        setOutputPricing(nextValue);
                        rerunAnalysis(selectedProfileId, {
                          outputPricing: nextValue,
                        });
                      }}
                      options={outputOptions}
                      value={outputPricing}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="border border-[var(--border)] bg-[var(--panel)]/50 p-4">
              <span className="mb-3 block text-[11px] text-[var(--text-faint)] uppercase tracking-[0.22em]">
                Options
              </span>
              <div className="grid gap-3 lg:grid-cols-3">
                <label className="flex min-h-[46px] cursor-pointer items-center justify-between gap-3 border border-[var(--border)] bg-[var(--panel)]/90 px-4 py-3 text-[var(--text-main)] text-sm">
                  <span className="min-w-0">
                    <span className="block">Include AH</span>
                    <span className="mt-0.5 block text-[11px] text-[var(--text-faint)] uppercase tracking-[0.16em]">
                      Recalc with auction prices
                    </span>
                  </span>
                  <input
                    checked={allowAh}
                    className="h-4 w-4 shrink-0 accent-[var(--accent)]"
                    disabled={isAnalysisLoading}
                    onChange={(event) => {
                      const value = event.target.checked;
                      setAllowAh(value);
                      rerunAnalysis(selectedProfileId, { allowAh: value });
                    }}
                    type="checkbox"
                  />
                </label>
                <label className="flex min-h-[46px] cursor-pointer items-center justify-between gap-3 border border-[var(--border)] bg-[var(--panel)]/90 px-4 py-3 text-[var(--text-main)] text-sm">
                  <span className="min-w-0">
                    <span className="block">Hide suspicious items</span>
                    <span className="mt-0.5 block text-[11px] text-[var(--text-faint)] uppercase tracking-[0.16em]">
                      Above{" "}
                      {Math.round(SUSPICIOUS_PROFIT_MULTIPLIER_THRESHOLD * 100)}
                      % profit vs mats
                    </span>
                  </span>
                  <input
                    checked={hideSuspiciousItems}
                    className="h-4 w-4 shrink-0 accent-[var(--accent)]"
                    disabled={isAnalysisLoading}
                    onChange={(event) =>
                      setHideSuspiciousItems(event.target.checked)
                    }
                    type="checkbox"
                  />
                </label>
                <label className="flex min-h-[46px] cursor-pointer items-center justify-between gap-3 border border-[var(--border)] bg-[var(--panel)]/90 px-4 py-3 text-[var(--text-main)] text-sm">
                  <span className="min-w-0">
                    <span className="block">Hide low forge time</span>
                    <span className="mt-0.5 block text-[11px] text-[var(--text-faint)] uppercase tracking-[0.16em]">
                      Under {Math.round(LOW_FORGE_TIME_THRESHOLD_MS / 60_000)}{" "}
                      min chain time
                    </span>
                  </span>
                  <input
                    checked={hideLowForgeTimeItems}
                    className="h-4 w-4 shrink-0 accent-[var(--accent)]"
                    disabled={isAnalysisLoading}
                    onChange={(event) =>
                      setHideLowForgeTimeItems(event.target.checked)
                    }
                    type="checkbox"
                  />
                </label>
              </div>
            </div>

            <ForgeResultsTable
              emptyMessage={
                hideSuspiciousItems || hideLowForgeTimeItems
                  ? "No profitable recipes matched the current pricing and filter settings after applying the active visibility filters."
                  : "No profitable recipes matched the current pricing and filter settings."
              }
              isLoading={
                isAnalysisLoading || (analysis === null && error === null)
              }
              rows={displayRows}
              slotCount={parsedSlotCount}
              targetAmount={parsedTargetAmount}
            />
          </section>
        </>
      ) : null}
    </main>
  );
}
