import { NextResponse } from "next/server";
import { z } from "zod";
import { getWeatherWithFallback } from "@/lib/providers/weather";

export const runtime = "nodejs";

const QuerySchema = z.object({
  lat: z.coerce.number().min(-90).max(90),
  lon: z.coerce.number().min(-180).max(180),
  date: z.string().optional(),
  label: z.string().optional(),
});

/** Used by the home screen's conditions strip and the future Daily Aura. */
export async function GET(req: Request) {
  const params = Object.fromEntries(new URL(req.url).searchParams);
  const parsed = QuerySchema.safeParse(params);

  if (!parsed.success) {
    return NextResponse.json({ error: "lat and lon are required" }, { status: 400 });
  }

  try {
    const { weather, degraded } = await getWeatherWithFallback({
      latitude: parsed.data.lat,
      longitude: parsed.data.lon,
      date: parsed.data.date,
      locationLabel: parsed.data.label,
    });
    return NextResponse.json({ weather, degraded });
  } catch {
    return NextResponse.json(
      { error: "I couldn't retrieve weather right now." },
      { status: 503 },
    );
  }
}
