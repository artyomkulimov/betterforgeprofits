import type { CurrentPricingSnapshot } from "@betterforgeprofits/forge-core/types";
import { afterEach, describe, expect, it, vi } from "vitest";
import { readJson, resetTestState } from "@/test/test-helpers";

const getSkyBlockProfiles = vi.fn();
const resolveMinecraftUsername = vi.fn();
const preloadCurrentPricing = vi.fn<() => Promise<CurrentPricingSnapshot>>();

vi.mock("@/lib/api/hypixel", () => ({
  getSkyBlockProfiles,
}));

vi.mock("@/lib/api/mojang", () => ({
  resolveMinecraftUsername,
}));

vi.mock("@betterforgeprofits/db/repository", async () => {
  const actual = await vi.importActual<
    typeof import("@betterforgeprofits/db/repository")
  >("@betterforgeprofits/db/repository");

  class MockPostgresPriceRepository {
    preloadCurrentPricing() {
      return preloadCurrentPricing();
    }
  }

  return {
    ...actual,
    PostgresPriceRepository: MockPostgresPriceRepository,
  };
});

function createAnalysisProfile(overrides?: Record<string, unknown>) {
  return {
    profile_id: "profile-1",
    cute_name: "Apple",
    selected: true,
    members: {
      "player-uuid": {
        last_save: 1_700_000_000_000,
        mining_core: {
          nodes: { quick_forge: 6 },
          tier: 5,
        },
        player_data: {
          unlocked_coll_tiers: [],
        },
      },
    },
    ...overrides,
  };
}

function createSnapshot(): CurrentPricingSnapshot {
  return {
    aliases: [],
    auction: [],
    bazaar: [],
    freshnessMeta: {
      auctionSnapshotFetchedAt: 1,
      bazaarSnapshotFetchedAt: 1,
      snapshotAgeSeconds: 0,
    },
  };
}

describe("GET /api/forge/analysis", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    resetTestState();
    getSkyBlockProfiles.mockReset();
    resolveMinecraftUsername.mockReset();
    preloadCurrentPricing.mockReset();
  });

  it("rejects missing usernames", async () => {
    const { GET } = await import("./route");
    const response = await GET(
      new Request("http://localhost/api/forge/analysis")
    );

    expect(response.status).toBe(400);
    expect((await readJson<{ code: string }>(response)).code).toBe(
      "bad_request"
    );
  });

  it("rejects malformed usernames", async () => {
    const { GET } = await import("./route");
    const response = await GET(
      new Request("http://localhost/api/forge/analysis?username=bad-name")
    );

    expect(response.status).toBe(400);
    expect((await readJson<{ code: string }>(response)).code).toBe(
      "bad_request"
    );
  });

  it("rejects out-of-range and non-integer overrides", async () => {
    const { GET } = await import("./route");

    expect(
      await GET(
        new Request(
          "http://localhost/api/forge/analysis?username=Notch&hotmOverride=-1"
        )
      )
    ).toMatchObject({ status: 400 });

    expect(
      await GET(
        new Request(
          "http://localhost/api/forge/analysis?username=Notch&hotmOverride=11"
        )
      )
    ).toMatchObject({ status: 400 });

    expect(
      await GET(
        new Request(
          "http://localhost/api/forge/analysis?username=Notch&hotmOverride=1.5"
        )
      )
    ).toMatchObject({ status: 400 });

    const quickForgeResponse = await GET(
      new Request(
        "http://localhost/api/forge/analysis?username=Notch&quickForgeOverride=21"
      )
    );
    expect(quickForgeResponse.status).toBe(400);
  });

  it("rejects unknown profile ids", async () => {
    resolveMinecraftUsername.mockResolvedValue({
      username: "Notch",
      uuid: "player-uuid",
    });
    getSkyBlockProfiles.mockResolvedValue({
      profiles: [createAnalysisProfile()],
      success: true,
    });
    preloadCurrentPricing.mockResolvedValue(createSnapshot());

    const { GET } = await import("./route");
    const response = await GET(
      new Request(
        "http://localhost/api/forge/analysis?username=Notch&profileId=wrong"
      )
    );

    expect(response.status).toBe(400);
    expect((await readJson<{ code: string }>(response)).code).toBe(
      "bad_request"
    );
  });

  it("returns not_found when no profiles are available", async () => {
    resolveMinecraftUsername.mockResolvedValue({
      username: "Notch",
      uuid: "player-uuid",
    });
    getSkyBlockProfiles.mockResolvedValue({
      profiles: [],
      success: true,
    });

    const { GET } = await import("./route");
    const response = await GET(
      new Request("http://localhost/api/forge/analysis?username=Notch")
    );

    expect(response.status).toBe(404);
    expect((await readJson<{ code: string }>(response)).code).toBe("not_found");
  });

  it("returns not_found when no usable profile exists", async () => {
    resolveMinecraftUsername.mockResolvedValue({
      username: "Notch",
      uuid: "player-uuid",
    });
    getSkyBlockProfiles.mockResolvedValue({
      profiles: [
        {
          profile_id: "",
          selected: true,
          members: {},
        },
      ],
      success: true,
    });

    const { GET } = await import("./route");
    const response = await GET(
      new Request("http://localhost/api/forge/analysis?username=Notch")
    );

    expect(response.status).toBe(404);
    expect((await readJson<{ code: string }>(response)).code).toBe("not_found");
  });

  it("returns a successful response with rate limit headers", async () => {
    resolveMinecraftUsername.mockResolvedValue({
      username: "Notch",
      uuid: "player-uuid",
    });
    getSkyBlockProfiles.mockResolvedValue({
      profiles: [createAnalysisProfile()],
      success: true,
    });
    preloadCurrentPricing.mockResolvedValue(createSnapshot());

    const { GET } = await import("./route");
    const response = await GET(
      new Request("http://localhost/api/forge/analysis?username=Notch", {
        headers: { "x-forwarded-for": "1.2.3.4" },
      })
    );

    expect(response.status).toBe(200);
    expect(response.headers.get("RateLimit-Limit")).toBe("10");
    const payload = await readJson<{
      pricingMeta: { snapshotAgeSeconds: number | null };
      profile: { profileId: string; hotmTier: number | null };
      rows: unknown[];
    }>(response);
    expect(payload.profile.profileId).toBe("profile-1");
    expect(payload.profile.hotmTier).toBe(5);
    expect(Array.isArray(payload.rows)).toBe(true);
    expect(payload.pricingMeta.snapshotAgeSeconds).toBe(0);
  });

  it("caches identical analysis requests", async () => {
    resolveMinecraftUsername.mockResolvedValue({
      username: "Notch",
      uuid: "player-uuid",
    });
    getSkyBlockProfiles.mockResolvedValue({
      profiles: [createAnalysisProfile()],
      success: true,
    });
    preloadCurrentPricing.mockResolvedValue(createSnapshot());

    const { GET } = await import("./route");
    const request = new Request(
      "http://localhost/api/forge/analysis?username=Notch&allowAh=true",
      {
        headers: { "x-forwarded-for": "1.2.3.4" },
      }
    );

    expect((await GET(request)).status).toBe(200);
    expect((await GET(request)).status).toBe(200);
    expect(preloadCurrentPricing).toHaveBeenCalledTimes(1);
  });

  it("rate limits repeated requests from the same ip", async () => {
    resolveMinecraftUsername.mockResolvedValue({
      username: "Notch",
      uuid: "player-uuid",
    });
    getSkyBlockProfiles.mockResolvedValue({
      profiles: [createAnalysisProfile()],
      success: true,
    });
    preloadCurrentPricing.mockResolvedValue(createSnapshot());

    const { GET } = await import("./route");
    const request = new Request(
      "http://localhost/api/forge/analysis?username=Notch",
      {
        headers: { "x-forwarded-for": "1.2.3.4" },
      }
    );

    for (let index = 0; index < 10; index += 1) {
      expect((await GET(request)).status).toBe(200);
    }

    const response = await GET(request);
    expect(response.status).toBe(429);
    expect((await readJson<{ code: string }>(response)).code).toBe(
      "rate_limited"
    );
  });

  it("returns internal_error on unexpected repository failures", async () => {
    resolveMinecraftUsername.mockResolvedValue({
      username: "Notch",
      uuid: "player-uuid",
    });
    getSkyBlockProfiles.mockResolvedValue({
      profiles: [createAnalysisProfile()],
      success: true,
    });
    preloadCurrentPricing.mockRejectedValue(new Error("database exploded"));

    const { GET } = await import("./route");
    const response = await GET(
      new Request("http://localhost/api/forge/analysis?username=Notch")
    );

    expect(response.status).toBe(500);
    expect(await readJson<{ code: string; error: string }>(response)).toEqual({
      code: "internal_error",
      error: "Something went wrong. Please try again.",
    });
  });
});
