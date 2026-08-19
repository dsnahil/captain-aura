import {
  CATEGORY_SLOT,
  FORMALITY_SCORE,
  type OutfitSlot,
} from "@/lib/domain/enums";
import type { WardrobeItem, Weather } from "@/lib/domain/types";

export type ThermalBand = "hot" | "warm" | "mild" | "cool" | "cold";

export function thermalBand(tempC: number): ThermalBand {
  if (tempC >= 26) return "hot";
  if (tempC >= 20) return "warm";
  if (tempC >= 14) return "mild";
  if (tempC >= 7) return "cool";
  return "cold";
}

export type Conditions = {
  band: ThermalBand;
  tempC?: number;
  rain: boolean;
  wind: boolean;
  /** True when we have no weather at all and are reasoning blind. */
  unknown: boolean;
};

export function conditionsFrom(weather?: Weather): Conditions {
  if (!weather) {
    return { band: "mild", rain: false, wind: false, unknown: true };
  }
  const rain =
    (weather.precipitationProbability ?? 0) >= 40 ||
    /rain|drizzle|shower|storm|snow/i.test(weather.condition);
  return {
    band: thermalBand(weather.feelsLikeC ?? weather.temperatureC),
    tempC: weather.temperatureC,
    rain,
    wind: (weather.windKph ?? 0) >= 25,
    unknown: false,
  };
}

/* ============================================================================
   MATCHING — score owned items against what a slot needs.
   ========================================================================== */

export type SlotNeed = {
  slot: OutfitSlot;
  /** Target formality on the 1–5 scale. */
  formality: number;
  conditions: Conditions;
  /** Colour tokens we'd prefer, in priority order. */
  preferredColours: string[];
  /** Style tokens from the user's profile. */
  preferredStyles: string[];
  /** Memory-derived exclusions. */
  dislikedFits: string[];
  dislikedColours: string[];
  /** Categories that make sense for this need, e.g. only jackets for outer. */
  categories?: string[];
  /** Must handle rain (outer layer on a wet day). */
  requiresWaterproof?: boolean;
  /** Materials that are wrong for this occasion, e.g. technical on a date. */
  penalisedMaterials?: string[];
};

export type Match = {
  item: WardrobeItem;
  score: number;
  /** Why this item won — surfaced in the UI for transparency. */
  because: string[];
};

const BAND_TAGS: Record<ThermalBand, string[]> = {
  hot: ["hot", "warm"],
  warm: ["warm", "mild"],
  mild: ["mild", "warm", "cool"],
  cool: ["cool", "mild", "cold"],
  cold: ["cold", "cool"],
};

export function scoreItem(item: WardrobeItem, need: SlotNeed): Match | null {
  // An explicit category list is authoritative: a shirt is a mid layer by
  // default, but it is a perfectly good base layer under a knit.
  if (need.categories) {
    if (!need.categories.includes(item.category)) return null;
  } else if (CATEGORY_SLOT[item.category] !== need.slot) {
    return null;
  }

  // Hard exclusions — never recommend something the user has rejected.
  if (item.fit && need.dislikedFits.includes(item.fit)) return null;
  if (item.colour && need.dislikedColours.includes(item.colour)) return null;

  let score = 1;
  const because: string[] = [];

  // Formality proximity is the strongest signal.
  const itemFormality = item.formality ? FORMALITY_SCORE[item.formality] : 2.5;
  const gap = Math.abs(itemFormality - need.formality);
  if (gap <= 0.5) {
    score += 3;
    because.push("right level of formality");
  } else if (gap <= 1) {
    score += 1.5;
  } else if (gap <= 1.5) {
    score += 0.2;
  } else {
    score -= 2.5;
  }

  // Weather suitability.
  if (need.requiresWaterproof) {
    const waterproof =
      item.weather.includes("rain") || item.material === "technical";
    if (waterproof) {
      score += 4;
      because.push("handles rain");
    } else {
      score -= 4;
    }
  }

  if (!need.conditions.unknown && item.weather.length) {
    const wanted = BAND_TAGS[need.conditions.band];
    if (item.weather.some((w) => wanted.includes(w))) {
      score += 1.6;
      because.push(`works at ${need.conditions.band} temperatures`);
    } else {
      score -= 1.2;
    }
    if (need.conditions.wind && item.weather.includes("wind")) score += 0.5;
  }

  // Rain days: heavy cotton is a genuinely bad idea, not just a style call.
  if (need.conditions.rain && item.material === "cotton" && need.slot === "outer") {
    score -= 2;
  }

  // Technical fabric is right on a trail and wrong at dinner.
  if (item.material && need.penalisedMaterials?.includes(item.material)) {
    score -= 1.2;
  }

  // Colour preference.
  if (item.colour) {
    const idx = need.preferredColours.indexOf(item.colour);
    if (idx === 0) {
      score += 1.4;
      because.push("in your palette");
    } else if (idx > 0) {
      score += 1.4 - Math.min(idx, 5) * 0.18;
      because.push("in your palette");
    }
  }

  // Style alignment.
  const overlap = item.styles.filter((s) => need.preferredStyles.includes(s));
  if (overlap.length) {
    score += Math.min(overlap.length * 0.6, 1.4);
    because.push(`matches your ${overlap[0].replace("-", " ")} direction`);
  }

  // Dressed-up occasions favour classic pieces over sporty or street ones,
  // even when the raw formality rating is the same.
  if (need.formality >= 3.5) {
    if (item.styles.some((s) => s === "classic" || s === "smart-casual")) {
      score += 1.3;
      because.push("dressier read than the alternatives");
    }
    if (item.styles.some((s) => s === "athletic" || s === "streetwear")) {
      score -= 1.5;
    }
  }

  return { item, score, because };
}

export function bestMatch(items: WardrobeItem[], need: SlotNeed): Match | null {
  const scored = items
    .map((i) => scoreItem(i, need))
    .filter((m): m is Match => m !== null && m.score > 0)
    .sort((a, b) => b.score - a.score);
  return scored[0] ?? null;
}

export function groupBySlot(items: WardrobeItem[]): Record<OutfitSlot, WardrobeItem[]> {
  const out = {
    base: [], mid: [], outer: [], bottom: [], shoes: [], accessory: [],
  } as Record<OutfitSlot, WardrobeItem[]>;
  for (const i of items) {
    const slot = CATEGORY_SLOT[i.category];
    if (slot) out[slot].push(i);
  }
  return out;
}
