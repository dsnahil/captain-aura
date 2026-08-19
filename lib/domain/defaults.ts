import { id } from "@/lib/utils";
import type { AuraProfile, MemoryEntry, WardrobeItem } from "./types";

export function emptyProfile(): AuraProfile {
  const now = new Date().toISOString();
  return {
    id: id("aura"),
    createdAt: now,
    updatedAt: now,
    isDemo: false,
    onboardingComplete: false,
    about: {},
    appearance: {},
    style: { styles: [], colours: [], communicate: [] },
    grooming: { goals: [] },
    preferences: {},
    location: { source: "none" },
    goal: { goals: [] },
  };
}

/* ============================================================================
   DEMO MODE — a fully-formed fictional user so the product can be evaluated
   in one tap, with no account and no API keys.
   ========================================================================== */

export function demoProfile(): AuraProfile {
  const now = new Date().toISOString();
  return {
    id: "aura_demo",
    createdAt: now,
    updatedAt: now,
    isDemo: true,
    onboardingComplete: true,
    about: {
      name: "Alex",
      ageRange: "18-24",
      heightCm: 180,
      build: "slim",
      lifestyle: "student",
    },
    appearance: {
      faceShape: "oval",
      hairType: "wavy",
      hairThickness: "thick",
      hairLength: "medium",
      currentHairstyle: "Grown-out mid-length, pushed back",
      facialHair: "stubble",
    },
    style: {
      styles: ["minimal", "modern"],
      fit: "relaxed",
      colours: ["cream", "olive", "charcoal", "navy", "black"],
      communicate: ["effortless", "mature", "confident"],
    },
    grooming: { time: "10", goals: ["low-maintenance", "hair"] },
    preferences: {
      budget: "moderate",
      shopping: "mostly-own",
      brands: "Uniqlo, Arc'teryx, Adidas",
      dislikes: "I hate skinny jeans and loud colours.",
    },
    location: {
      label: "Boston, Massachusetts",
      latitude: 42.3601,
      longitude: -71.0589,
      source: "demo",
      capturedAt: now,
    },
    goal: {
      goals: ["mature", "personal-style"],
      note: "I want to look put-together without looking like I tried hard.",
    },
  };
}

export function demoWardrobe(): WardrobeItem[] {
  const now = new Date().toISOString();
  const mk = (
    n: number,
    item: Omit<WardrobeItem, "id" | "createdAt">,
  ): WardrobeItem => ({
    ...item,
    id: `demo_item_${n}`,
    createdAt: now,
  });

  return [
    mk(1, {
      name: "Cream technical tee",
      category: "tshirts",
      colour: "cream",
      fit: "regular",
      material: "technical",
      styles: ["minimal", "athletic"],
      season: "all",
      formality: "casual",
      weather: ["warm", "mild", "cool"],
    }),
    mk(2, {
      name: "Black heavyweight tee",
      category: "tshirts",
      colour: "black",
      fit: "relaxed",
      material: "cotton",
      styles: ["minimal", "modern"],
      season: "all",
      formality: "casual",
      weather: ["warm", "mild"],
    }),
    mk(3, {
      name: "Navy oxford shirt",
      category: "shirts",
      colour: "navy",
      fit: "regular",
      material: "cotton",
      styles: ["classic", "smart-casual"],
      season: "all",
      formality: "smart-casual",
      weather: ["mild", "cool"],
    }),
    mk(4, {
      name: "Charcoal merino crewneck",
      category: "sweaters",
      colour: "charcoal",
      fit: "regular",
      material: "wool",
      styles: ["minimal", "classic"],
      season: "autumn",
      formality: "smart-casual",
      weather: ["cool", "cold"],
    }),
    mk(5, {
      name: "Grey grid fleece",
      category: "hoodies",
      colour: "grey",
      fit: "regular",
      material: "fleece",
      styles: ["athletic", "modern"],
      season: "all",
      formality: "casual",
      weather: ["cool", "cold", "wind"],
    }),
    mk(6, {
      name: "Black waterproof shell",
      category: "jackets",
      colour: "black",
      fit: "regular",
      material: "technical",
      styles: ["minimal", "athletic"],
      season: "all",
      formality: "casual",
      weather: ["rain", "wind", "cool", "cold"],
    }),
    mk(7, {
      name: "Olive relaxed hiking pants",
      category: "pants",
      colour: "olive",
      fit: "relaxed",
      material: "technical",
      styles: ["workwear", "relaxed"],
      season: "all",
      formality: "very-casual",
      weather: ["mild", "cool", "wind"],
    }),
    mk(8, {
      name: "Charcoal straight trousers",
      category: "pants",
      colour: "charcoal",
      fit: "regular",
      material: "wool",
      styles: ["minimal", "smart-casual", "classic"],
      season: "all",
      formality: "business",
      weather: ["mild", "cool"],
    }),
    mk(9, {
      name: "Dark indigo straight jeans",
      category: "pants",
      colour: "navy",
      fit: "regular",
      material: "denim",
      styles: ["classic", "modern"],
      season: "all",
      formality: "casual",
      weather: ["mild", "cool"],
    }),
    mk(10, {
      name: "Olive trail shoes",
      category: "shoes",
      colour: "olive",
      fit: "regular",
      material: "technical",
      styles: ["athletic", "workwear"],
      season: "all",
      formality: "very-casual",
      weather: ["rain", "cool", "mild"],
    }),
    mk(11, {
      name: "White leather sneakers",
      category: "shoes",
      colour: "white",
      fit: "regular",
      material: "leather",
      styles: ["minimal", "modern"],
      season: "all",
      formality: "smart-casual",
      weather: ["mild", "warm"],
    }),
    mk(12, {
      name: "Brown suede chelsea boots",
      category: "shoes",
      colour: "brown",
      fit: "regular",
      material: "leather",
      styles: ["classic", "smart-casual"],
      season: "autumn",
      formality: "smart-casual",
      weather: ["cool", "mild"],
    }),
    mk(13, {
      name: "Slim steel watch",
      category: "accessories",
      colour: "grey",
      material: "other",
      styles: ["minimal", "classic"],
      season: "all",
      formality: "smart-casual",
      weather: [],
    }),
    mk(14, {
      name: "Black 20L daypack",
      category: "accessories",
      colour: "black",
      material: "technical",
      styles: ["minimal", "athletic"],
      season: "all",
      formality: "very-casual",
      weather: ["rain"],
    }),
  ];
}

export function demoMemory(): MemoryEntry[] {
  const now = new Date().toISOString();
  const mk = (
    n: number,
    e: Omit<MemoryEntry, "id" | "createdAt">,
  ): MemoryEntry => ({ ...e, id: `demo_mem_${n}`, createdAt: now });

  return [
    mk(1, {
      kind: "dislike",
      subject: "fit",
      value: "skinny",
      label: "Doesn't wear skinny fits",
      source: "demo",
      confidence: 0.9,
    }),
    mk(2, {
      kind: "dislike",
      subject: "colour",
      value: "loud",
      label: "Avoids loud, high-saturation colours",
      source: "demo",
      confidence: 0.85,
    }),
    mk(3, {
      kind: "like",
      subject: "layering",
      value: "simple-layers",
      label: "Likes simple, uncluttered layering",
      source: "demo",
      confidence: 0.7,
    }),
    mk(4, {
      kind: "like",
      subject: "shoes",
      value: "clean-sneakers",
      label: "Likes clean, minimal sneakers",
      source: "demo",
      confidence: 0.7,
    }),
    mk(5, {
      kind: "goal",
      subject: "goal",
      value: "mature",
      label: "Wants to look more mature",
      source: "demo",
      confidence: 0.8,
    }),
  ];
}

export const DEMO_PROMPT =
  "I'm going on a hike with my university colleagues tomorrow. I want to look prepared but still stylish. I'm skinny.";

/**
 * Wardrobe photos are data URLs and can be megabytes each. The engine never
 * looks at them, so they are stripped before the closet is sent to the server.
 */
export function withoutImages(items: WardrobeItem[]): WardrobeItem[] {
  return items.map((item) => {
    const copy = { ...item };
    delete copy.image;
    return copy;
  });
}
