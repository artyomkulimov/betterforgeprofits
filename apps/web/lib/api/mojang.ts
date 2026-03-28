import { notFound, upstreamUnavailable } from "@/lib/server-errors";

const MOJANG_BASE_URL = "https://api.mojang.com";

export async function resolveMinecraftUsername(username: string) {
  const value = username.trim();
  if (!value) {
    throw new Error("Username is required.");
  }

  const response = await fetch(
    `${MOJANG_BASE_URL}/users/profiles/minecraft/${encodeURIComponent(value)}`,
    {
      next: { revalidate: 300 },
    }
  );

  if (response.status === 404) {
    throw notFound("Minecraft username not found.");
  }

  if (!response.ok) {
    throw upstreamUnavailable(
      "Minecraft account lookup is temporarily unavailable.",
      {
        service: "mojang",
        status: response.status,
      }
    );
  }

  const payload = (await response.json()) as { id: string; name: string };
  return {
    uuid: payload.id,
    username: payload.name,
  };
}
