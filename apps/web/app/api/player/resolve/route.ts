import { NextResponse } from "next/server";

import { resolveMinecraftUsername } from "@/lib/api/mojang";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const username = searchParams.get("username")?.trim() ?? "";

    if (!username) {
      return NextResponse.json(
        { error: "Username is required." },
        { status: 400 }
      );
    }

    const player = await resolveMinecraftUsername(username);
    return NextResponse.json(player);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to resolve player.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
