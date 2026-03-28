import { afterEach, describe, expect, it, vi } from "vitest";
import { upstreamUnavailable } from "@/lib/server-errors";
import { readJson, resetTestState } from "@/test/test-helpers";

const getSkyBlockProfiles = vi.fn();
const resolveMinecraftUsername = vi.fn();

vi.mock("@/lib/api/hypixel", () => ({
  getSkyBlockProfiles,
}));

vi.mock("@/lib/api/mojang", () => ({
  resolveMinecraftUsername,
}));

function createValidProfile() {
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
      },
    },
  };
}

describe("GET /api/skyblock/context", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    resetTestState();
    getSkyBlockProfiles.mockReset();
    resolveMinecraftUsername.mockReset();
  });

  it("rejects missing usernames", async () => {
    const { GET } = await import("./route");
    const response = await GET(
      new Request("http://localhost/api/skyblock/context")
    );

    expect(response.status).toBe(400);
    expect((await readJson<{ code: string }>(response)).code).toBe(
      "bad_request"
    );
  });

  it("rejects malformed usernames", async () => {
    const { GET } = await import("./route");
    const response = await GET(
      new Request("http://localhost/api/skyblock/context?username=bad-name")
    );

    expect(response.status).toBe(400);
    expect((await readJson<{ code: string }>(response)).code).toBe(
      "bad_request"
    );
  });

  it("returns player profile context with quick forge reduction", async () => {
    resolveMinecraftUsername.mockResolvedValue({
      username: "Notch",
      uuid: "player-uuid",
    });
    getSkyBlockProfiles.mockResolvedValue({
      profiles: [createValidProfile()],
      success: true,
    });

    const { GET } = await import("./route");
    const response = await GET(
      new Request("http://localhost/api/skyblock/context?username=Notch", {
        headers: { "x-forwarded-for": "1.2.3.4" },
      })
    );

    expect(response.status).toBe(200);
    expect(response.headers.get("RateLimit-Limit")).toBe("20");
    const payload = await readJson<{
      player: { username: string; uuid: string };
      profile: { quickForgeReduction: number };
      profiles: unknown[];
      selectedProfileId: string;
    }>(response);
    expect(payload.player).toEqual({
      username: "Notch",
      uuid: "player-uuid",
    });
    expect(payload.profiles).toHaveLength(1);
    expect(payload.selectedProfileId).toBe("profile-1");
    expect(payload.profile.quickForgeReduction).toBe(0.13);
  });

  it("returns not_found when no profiles are accessible", async () => {
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
      new Request("http://localhost/api/skyblock/context?username=Notch")
    );

    expect(response.status).toBe(404);
    expect((await readJson<{ code: string }>(response)).code).toBe("not_found");
  });

  it("returns not_found when no usable default profile exists", async () => {
    resolveMinecraftUsername.mockResolvedValue({
      username: "Notch",
      uuid: "player-uuid",
    });
    getSkyBlockProfiles.mockResolvedValue({
      profiles: [
        {
          profile_id: "",
          cute_name: "Broken",
          selected: true,
          members: {},
        },
      ],
      success: true,
    });

    const { GET } = await import("./route");
    const response = await GET(
      new Request("http://localhost/api/skyblock/context?username=Notch")
    );

    expect(response.status).toBe(404);
    expect((await readJson<{ code: string }>(response)).code).toBe("not_found");
  });

  it("reuses the cached profile lookup", async () => {
    resolveMinecraftUsername.mockResolvedValue({
      username: "Notch",
      uuid: "player-uuid",
    });
    getSkyBlockProfiles.mockResolvedValue({
      profiles: [createValidProfile()],
      success: true,
    });

    const { GET } = await import("./route");
    const request = new Request(
      "http://localhost/api/skyblock/context?username=Notch",
      {
        headers: { "x-forwarded-for": "1.2.3.4" },
      }
    );

    expect((await GET(request)).status).toBe(200);
    expect((await GET(request)).status).toBe(200);
    expect(resolveMinecraftUsername).toHaveBeenCalledTimes(1);
    expect(getSkyBlockProfiles).toHaveBeenCalledTimes(1);
  });

  it("rate limits repeated requests from the same ip", async () => {
    resolveMinecraftUsername.mockResolvedValue({
      username: "Notch",
      uuid: "player-uuid",
    });
    getSkyBlockProfiles.mockResolvedValue({
      profiles: [createValidProfile()],
      success: true,
    });

    const { GET } = await import("./route");
    const request = new Request(
      "http://localhost/api/skyblock/context?username=Notch",
      {
        headers: { "x-forwarded-for": "1.2.3.4" },
      }
    );

    for (let index = 0; index < 20; index += 1) {
      expect((await GET(request)).status).toBe(200);
    }

    const response = await GET(request);
    expect(response.status).toBe(429);
    expect((await readJson<{ code: string }>(response)).code).toBe(
      "rate_limited"
    );
  });

  it("propagates sanitized upstream failures", async () => {
    resolveMinecraftUsername.mockRejectedValue(
      upstreamUnavailable("SkyBlock upstream is unavailable.")
    );

    const { GET } = await import("./route");
    const response = await GET(
      new Request("http://localhost/api/skyblock/context?username=Notch")
    );

    expect(response.status).toBe(503);
    expect(await readJson<{ code: string; error: string }>(response)).toEqual({
      code: "upstream_unavailable",
      error: "SkyBlock upstream is unavailable.",
    });
  });
});
