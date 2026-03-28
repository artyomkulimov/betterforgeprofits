/** @vitest-environment jsdom */

import type {
  ForgeAnalysisResponse,
  ForgeProfileSummary,
} from "@betterforgeprofits/forge-core/types";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { HeroQueryForm } from "@/components/hero-query-form";

vi.mock("@/components/calculation-status-toast", () => ({
  CalculationStatusToast: () =>
    React.createElement("div", { "data-testid": "toast" }),
}));

vi.mock("@/components/custom-select", () => ({
  CustomSelect: ({
    onChange,
    options,
    value,
    placeholder,
    disabled,
  }: {
    disabled?: boolean;
    onChange: (value: string) => void;
    options: Array<{ label: string; value: string }>;
    placeholder?: string;
    value: string;
  }) =>
    React.createElement(
      "select",
      {
        "aria-label": placeholder ?? "custom-select",
        disabled,
        onChange: (event: React.ChangeEvent<HTMLSelectElement>) =>
          onChange(event.target.value),
        value,
      },
      React.createElement("option", { value: "" }, placeholder ?? "Select"),
      ...options.map((option) =>
        React.createElement(
          "option",
          { key: option.value, value: option.value },
          option.label
        )
      )
    ),
}));

vi.mock("@/components/forge-results-table", () => ({
  ForgeResultsTable: ({
    rows,
    emptyMessage,
    isLoading,
  }: {
    emptyMessage: string;
    isLoading?: boolean;
    rows: Array<{ name: string }>;
  }) => {
    let content = emptyMessage;

    if (isLoading) {
      content = "loading";
    } else if (rows.length > 0) {
      content = rows.map((row) => row.name).join(", ");
    }

    return React.createElement("div", { "data-testid": "results" }, content);
  },
}));

vi.mock("@/components/profile-picker", () => ({
  ProfilePicker: ({
    onChange,
    profiles,
    value,
  }: {
    onChange: (value: string) => void;
    profiles: ForgeProfileSummary[];
    value: string;
  }) =>
    React.createElement(
      "select",
      {
        "aria-label": "profile-picker",
        onChange: (event: React.ChangeEvent<HTMLSelectElement>) =>
          onChange(event.target.value),
        value,
      },
      React.createElement("option", { value: "" }, "Select"),
      ...profiles.map((profile) =>
        React.createElement(
          "option",
          { key: profile.profileId, value: profile.profileId },
          profile.cuteName ?? profile.profileId
        )
      )
    ),
}));

vi.mock("@/components/profile-summary", () => ({
  ProfileSummary: () =>
    React.createElement("div", { "data-testid": "profile-summary" }),
}));

const fetchMock = vi.fn<typeof fetch>();
const INCLUDE_AH_LABEL = /include ah/i;

function createProfileSummary(): ForgeProfileSummary {
  return {
    cuteName: "Apple",
    hotmTier: 5,
    lastSave: 1_700_000_000_000,
    profileId: "profile-1",
    quickForgeLevel: 6,
    quickForgeReduction: 0.13,
    selected: true,
  };
}

function createAnalysisResponse(): ForgeAnalysisResponse {
  return {
    pricingMeta: {
      auctionSnapshotFetchedAt: 1,
      bazaarSnapshotFetchedAt: 1,
      snapshotAgeSeconds: 0,
    },
    profile: createProfileSummary(),
    rows: [
      {
        baseDurationMs: 60_000,
        baseMaterialCost: 100,
        category: "Forging",
        craftTree: [],
        effectiveDurationMs: 60_000,
        hasForgeDependencies: false,
        hotmRequired: null,
        materialPriceDetails: [],
        materialPricingMode: "instant_buy",
        name: "Refined Mithril",
        otherRequirements: [],
        outputCount: 1,
        outputPrice: { matchedId: "A", source: "bazaar", unitPrice: 150 },
        outputPriceDetail: null,
        outputPricingMode: "sell_offer",
        priceCoverage: "complete",
        profitPerCraft: 50,
        profitPerHour: 3000,
        quickForgeLevel: 6,
        quickForgeReduction: 0.13,
        rawMaterials: [],
        recipeId: "refined_mithril",
        recursiveBaseDurationMs: 60_000,
        recursiveEffectiveDurationMs: 60_000,
        usesAhPricing: false,
      },
    ],
  };
}

function createAhAnalysisResponse(): ForgeAnalysisResponse {
  return {
    pricingMeta: {
      auctionSnapshotFetchedAt: 1,
      bazaarSnapshotFetchedAt: 1,
      snapshotAgeSeconds: 0,
    },
    profile: createProfileSummary(),
    rows: [
      {
        baseDurationMs: 60_000,
        baseMaterialCost: 100,
        category: "Forging",
        craftTree: [],
        effectiveDurationMs: 60_000,
        hasForgeDependencies: false,
        hotmRequired: null,
        materialPriceDetails: [],
        materialPricingMode: "instant_buy",
        name: "Bazaar Item",
        otherRequirements: [],
        outputCount: 1,
        outputPrice: { matchedId: "A", source: "bazaar", unitPrice: 150 },
        outputPriceDetail: null,
        outputPricingMode: "sell_offer",
        priceCoverage: "complete",
        profitPerCraft: 50,
        profitPerHour: 3000,
        quickForgeLevel: 6,
        quickForgeReduction: 0.13,
        rawMaterials: [],
        recipeId: "bazaar_item",
        recursiveBaseDurationMs: 60_000,
        recursiveEffectiveDurationMs: 60_000,
        usesAhPricing: false,
      },
      {
        baseDurationMs: 60_000,
        baseMaterialCost: 100,
        category: "Forging",
        craftTree: [],
        effectiveDurationMs: 60_000,
        hasForgeDependencies: false,
        hotmRequired: null,
        materialPriceDetails: [],
        materialPricingMode: "instant_buy",
        name: "Auction Item",
        otherRequirements: [],
        outputCount: 1,
        outputPrice: { matchedId: "B", source: "auction", unitPrice: 150 },
        outputPriceDetail: null,
        outputPricingMode: "sell_offer",
        priceCoverage: "complete",
        profitPerCraft: 50,
        profitPerHour: 3000,
        quickForgeLevel: 6,
        quickForgeReduction: 0.13,
        rawMaterials: [],
        recipeId: "auction_item",
        recursiveBaseDurationMs: 60_000,
        recursiveEffectiveDurationMs: 60_000,
        usesAhPricing: true,
      },
    ],
  };
}

describe("HeroQueryForm", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    window.localStorage.clear();
    fetchMock.mockReset();
    vi.stubGlobal("fetch", fetchMock);
    vi.spyOn(console, "info").mockImplementation(() => undefined);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("shows a local validation error when submitted without a username", async () => {
    render(React.createElement(HeroQueryForm));

    fireEvent.click(screen.getByRole("button", { name: "Load profile" }));

    await waitFor(() => {
      expect(screen.getByText("Enter a Minecraft username.")).toBeTruthy();
    });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("loads profile and analysis data and stores the recent player", async () => {
    const profile = createProfileSummary();
    const contextPayload = {
      player: { username: "Notch", uuid: "player-uuid" },
      profile,
      profiles: [profile],
      selectedProfileId: "profile-1",
    };
    const analysisPayload = createAnalysisResponse();

    fetchMock
      .mockResolvedValueOnce(
        new Response(JSON.stringify(contextPayload), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        })
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify(analysisPayload), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        })
      );

    render(React.createElement(HeroQueryForm));

    fireEvent.change(screen.getByPlaceholderText("e.g. Refraction"), {
      target: { value: "Notch" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Load profile" }));

    await waitFor(() => {
      expect(screen.getByTestId("results").textContent).toContain(
        "Refined Mithril"
      );
    });

    expect(fetchMock).toHaveBeenNthCalledWith(
      1,
      "/api/skyblock/context?username=Notch"
    );
    expect(fetchMock.mock.calls[1]?.[0]).toContain(
      "/api/forge/analysis?username=Notch"
    );
    expect(fetchMock.mock.calls[1]?.[0]).toContain("allowAh=true");
    expect(
      window.localStorage.getItem("better_forge_recent_players")
    ).toContain("Notch");
  });

  it("hides AH-backed rows by default without refetching when toggled", async () => {
    const profile = createProfileSummary();
    const contextPayload = {
      player: { username: "Technoblade", uuid: "player-uuid" },
      profile,
      profiles: [profile],
      selectedProfileId: "profile-1",
    };
    const analysisPayload = createAhAnalysisResponse();

    fetchMock
      .mockResolvedValueOnce(
        new Response(JSON.stringify(contextPayload), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        })
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify(analysisPayload), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        })
      );

    render(React.createElement(HeroQueryForm));

    fireEvent.change(screen.getByPlaceholderText("e.g. Refraction"), {
      target: { value: "Technoblade" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Load profile" }));

    await waitFor(() => {
      expect(screen.getByTestId("results").textContent).toContain(
        "Bazaar Item"
      );
    });

    expect(screen.getByTestId("results").textContent).not.toContain(
      "Auction Item"
    );

    const includeAhToggle = screen.getByRole("checkbox", {
      name: INCLUDE_AH_LABEL,
    }) as HTMLInputElement;
    expect(includeAhToggle.checked).toBe(false);

    fireEvent.click(includeAhToggle);

    await waitFor(() => {
      expect(screen.getByTestId("results").textContent).toContain(
        "Auction Item"
      );
    });

    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});
