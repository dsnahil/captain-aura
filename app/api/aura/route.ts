import { NextResponse } from "next/server";
import { z } from "zod";
import { applyFollowUp, extractStatedTemperature, parseSituation, pickFollowUp } from "@/lib/context/parser";
import { AuraProfileSchema, LocationSchema, MemoryEntrySchema, WardrobeItemSchema } from "@/lib/domain/types";
import type { AuraContext, Weather } from "@/lib/domain/types";
import { geocodeWithFallback } from "@/lib/providers/geocode";
import { recommendWithFallback } from "@/lib/providers/recommendation";
import { getWeatherWithFallback } from "@/lib/providers/weather";

export const runtime = "nodejs";
/** Recommendations are per-user; nothing here is cacheable. */
export const dynamic = "force-dynamic";

const BodySchema = z.object({
  prompt: z.string().min(1).max(2000),
  profile: AuraProfileSchema,
  wardrobe: z.array(WardrobeItemSchema).max(300).default([]),
  memory: z.array(MemoryEntrySchema).max(300).default([]),
  location: LocationSchema.optional(),
  followUpAnswer: z.object({ key: z.string(), value: z.string() }).optional(),
  /** Trimmed history — only what the engine reads. */
  history: z
    .array(
      z.object({
        id: z.string(),
        createdAt: z.string(),
        originalPrompt: z.string(),
        situation: z.any(),
        recommendation: z.any(),
        feedback: z.any().optional(),
      }),
    )
    .max(10)
    .default([]),
});

/** Build a Weather object from what the user said, when we have no provider. */
function weatherFromDescription(
  prompt: string,
  describedWeather: string | undefined,
  date: string,
): Weather | undefined {
  if (!describedWeather) return undefined;

  const stated = extractStatedTemperature(prompt);
  const d = describedWeather.toLowerCase();

  const guess = /freezing|snow/.test(d)
    ? -2
    : /cold/.test(d)
      ? 5
      : /chilly|cool/.test(d)
        ? 11
        : /hot/.test(d)
          ? 30
          : /warm/.test(d)
            ? 23
            : 16;

  const temperatureC = stated ?? guess;
  const rain = /rain|drizzle|storm|wet|shower/.test(d);
  const windy = /wind/.test(d);

  return {
    temperatureC,
    feelsLikeC: temperatureC - (windy ? 3 : 1),
    precipitationProbability: rain ? 80 : undefined,
    windKph: windy ? 30 : undefined,
    condition: rain ? "Rain" : /snow/.test(d) ? "Snow" : /sun|clear/.test(d) ? "Clear" : "As described",
    source: "user-described",
    date,
  };
}

export async function POST(req: Request) {
  let body: z.infer<typeof BodySchema>;
  try {
    body = BodySchema.parse(await req.json());
  } catch (err) {
    return NextResponse.json(
      { error: "Invalid request", detail: err instanceof z.ZodError ? err.issues : undefined },
      { status: 400 },
    );
  }

  const now = new Date();

  /* ------------------------------- situation ------------------------------ */
  let situation = parseSituation(body.prompt, now);
  if (body.followUpAnswer) {
    situation = applyFollowUp(situation, body.followUpAnswer.key, body.followUpAnswer.value, now);
  }

  /* -------------------------------- location ------------------------------ */
  // Priority: a place named in this request > the location passed in > profile.
  let location = body.location ?? body.profile.location;
  const hint =
    body.followUpAnswer?.key === "location" ? body.followUpAnswer.value : situation.locationHint;

  if (hint) {
    try {
      const [first] = await geocodeWithFallback(hint);
      if (first) {
        location = {
          label: first.label,
          latitude: first.latitude,
          longitude: first.longitude,
          source: "manual",
          capturedAt: now.toISOString(),
        };
      }
    } catch {
      // Keep whatever location we already had.
    }
  }

  /* -------------------------------- weather ------------------------------- */
  let weather: Weather | undefined;
  let weatherDegraded = false;

  if (location?.latitude !== undefined && location?.longitude !== undefined) {
    try {
      const result = await getWeatherWithFallback({
        latitude: location.latitude,
        longitude: location.longitude,
        date: situation.date,
        locationLabel: location.label,
      });
      weather = result.weather;
      weatherDegraded = result.degraded;
    } catch {
      weather = undefined;
    }
  }

  // No provider result — fall back to what the user told us directly.
  if (!weather) {
    weather = weatherFromDescription(body.prompt, situation.describedWeather, situation.date);
  }

  /* ----------------------------- recommendation --------------------------- */
  const ctx: AuraContext = {
    profile: body.profile,
    wardrobe: body.wardrobe,
    memory: body.memory,
    situation,
    originalPrompt: body.prompt,
    location,
    weather,
    history: body.history as AuraContext["history"],
    now: now.toISOString(),
  };

  const recommendation = await recommendWithFallback(ctx);

  const followUp = body.followUpAnswer
    ? null
    : pickFollowUp(situation, location?.latitude !== undefined);

  return NextResponse.json({
    situation,
    location,
    weather,
    weatherDegraded,
    recommendation,
    followUp,
  });
}
