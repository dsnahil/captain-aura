import { NextResponse } from "next/server";
import { geocodeWithFallback } from "@/lib/providers/geocode";

export const runtime = "nodejs";

/** City search for manual location entry (used when location permission is denied). */
export async function GET(req: Request) {
  const q = new URL(req.url).searchParams.get("q")?.trim();
  if (!q || q.length < 2) return NextResponse.json({ results: [] });

  try {
    const results = await geocodeWithFallback(q);
    return NextResponse.json({ results });
  } catch {
    return NextResponse.json(
      { results: [], error: "Location lookup is unavailable right now." },
      { status: 200 },
    );
  }
}
