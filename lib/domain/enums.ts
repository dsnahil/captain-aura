/**
 * Option catalogs — single source of truth shared by the Zod schemas,
 * the onboarding UI and the recommendation engine.
 */

export type Option<T extends string = string> = {
  value: T;
  label: string;
  hint?: string;
};

function opts<const T extends readonly Option[]>(o: T) {
  return o;
}

/** Extract the tuple of values for z.enum(). */
export function values<T extends readonly Option[]>(o: T) {
  return o.map((x) => x.value) as unknown as [string, ...string[]];
}

export function labelOf(list: readonly Option[], value?: string | null) {
  return list.find((o) => o.value === value)?.label ?? "";
}

export function labelsOf(list: readonly Option[], vals: readonly string[] = []) {
  return vals.map((v) => labelOf(list, v)).filter(Boolean);
}

/* ---------------------------------- 01 · You --------------------------------- */

export const AGE_RANGES = opts([
  { value: "18-24", label: "18–24" },
  { value: "25-34", label: "25–34" },
  { value: "35-44", label: "35–44" },
  { value: "45-54", label: "45–54" },
  { value: "55+", label: "55+" },
]);

export const BUILDS = opts([
  { value: "slim", label: "Slim" },
  { value: "average", label: "Average" },
  { value: "athletic", label: "Athletic" },
  { value: "broad", label: "Broad" },
  { value: "muscular", label: "Muscular" },
  { value: "unspecified", label: "Prefer not to say" },
]);

export const LIFESTYLES = opts([
  { value: "student", label: "Student" },
  { value: "professional", label: "Professional" },
  { value: "entrepreneur", label: "Entrepreneur" },
  { value: "creative", label: "Creative" },
  { value: "active", label: "Active" },
  { value: "other", label: "Other" },
]);

/* ------------------------------ 02 · Appearance ------------------------------ */

export const FACE_SHAPES = opts([
  { value: "oval", label: "Oval" },
  { value: "round", label: "Round" },
  { value: "square", label: "Square" },
  { value: "oblong", label: "Oblong" },
  { value: "heart", label: "Heart" },
  { value: "diamond", label: "Diamond" },
  { value: "unsure", label: "Not sure" },
]);

export const HAIR_TYPES = opts([
  { value: "straight", label: "Straight" },
  { value: "wavy", label: "Wavy" },
  { value: "curly", label: "Curly" },
  { value: "coily", label: "Coily" },
]);

export const HAIR_THICKNESS = opts([
  { value: "fine", label: "Fine" },
  { value: "medium", label: "Medium" },
  { value: "thick", label: "Thick" },
]);

export const HAIR_LENGTHS = opts([
  { value: "very-short", label: "Very short" },
  { value: "short", label: "Short" },
  { value: "medium", label: "Medium" },
  { value: "long", label: "Long" },
]);

export const FACIAL_HAIR = opts([
  { value: "clean-shaven", label: "Clean shaven" },
  { value: "stubble", label: "Stubble" },
  { value: "short-beard", label: "Short beard" },
  { value: "medium-beard", label: "Medium beard" },
  { value: "long-beard", label: "Long beard" },
  { value: "mustache", label: "Mustache" },
]);

/* -------------------------------- 03 · Style -------------------------------- */

export const STYLE_TAGS = opts([
  { value: "minimal", label: "Minimal" },
  { value: "classic", label: "Classic" },
  { value: "modern", label: "Modern" },
  { value: "smart-casual", label: "Smart casual" },
  { value: "streetwear", label: "Streetwear" },
  { value: "athletic", label: "Athletic" },
  { value: "workwear", label: "Workwear" },
  { value: "relaxed", label: "Relaxed" },
  { value: "vintage", label: "Vintage" },
  { value: "experimental", label: "Experimental" },
]);

export const FIT_PREFERENCES = opts([
  { value: "slim", label: "Slim" },
  { value: "regular", label: "Regular" },
  { value: "relaxed", label: "Relaxed" },
  { value: "oversized", label: "Oversized" },
  { value: "depends", label: "Depends on the outfit" },
]);

/** Colour tokens carry a swatch so the UI can render them honestly. */
export const COLOURS = opts([
  { value: "black", label: "Black", hint: "#111114" },
  { value: "charcoal", label: "Charcoal", hint: "#3a3f46" },
  { value: "grey", label: "Grey", hint: "#8f949b" },
  { value: "white", label: "White", hint: "#f2f0eb" },
  { value: "cream", label: "Cream", hint: "#e6ddc9" },
  { value: "beige", label: "Beige", hint: "#cbb894" },
  { value: "brown", label: "Brown", hint: "#6f5240" },
  { value: "tan", label: "Tan", hint: "#a8825c" },
  { value: "olive", label: "Olive", hint: "#6b7355" },
  { value: "green", label: "Green", hint: "#3f6b52" },
  { value: "navy", label: "Navy", hint: "#28374f" },
  { value: "blue", label: "Blue", hint: "#4a6d94" },
  { value: "burgundy", label: "Burgundy", hint: "#6d3440" },
  { value: "red", label: "Red", hint: "#a8443c" },
  { value: "orange", label: "Orange", hint: "#c2723c" },
  { value: "yellow", label: "Yellow", hint: "#d0a94a" },
  { value: "pink", label: "Pink", hint: "#c98d92" },
  { value: "purple", label: "Purple", hint: "#5f4a72" },
]);

export const COMMUNICATE = opts([
  { value: "confident", label: "Confident" },
  { value: "mature", label: "Mature" },
  { value: "attractive", label: "Attractive" },
  { value: "approachable", label: "Approachable" },
  { value: "professional", label: "Professional" },
  { value: "stylish", label: "Stylish" },
  { value: "masculine", label: "Masculine" },
  { value: "effortless", label: "Effortless" },
  { value: "creative", label: "Creative" },
]);

/* ------------------------------- 04 · Grooming ------------------------------- */

export const GROOMING_TIME = opts([
  { value: "5", label: "5 minutes" },
  { value: "10", label: "10 minutes" },
  { value: "20", label: "20 minutes" },
  { value: "enjoy", label: "I enjoy grooming" },
]);

export const GROOMING_GOALS = opts([
  { value: "hair", label: "Better hair" },
  { value: "beard", label: "Better beard" },
  { value: "skin", label: "Better skin routine" },
  { value: "fragrance", label: "Better fragrance" },
  { value: "overall", label: "Overall improvement" },
  { value: "low-maintenance", label: "Low-maintenance routine" },
]);

/* ------------------------------- 05 · Wardrobe ------------------------------- */

export type OutfitSlot =
  | "base"
  | "mid"
  | "outer"
  | "bottom"
  | "shoes"
  | "accessory";

export const CATEGORIES = opts([
  { value: "tshirts", label: "T-shirts" },
  { value: "shirts", label: "Shirts" },
  { value: "sweaters", label: "Sweaters" },
  { value: "hoodies", label: "Hoodies" },
  { value: "jackets", label: "Jackets" },
  { value: "pants", label: "Pants" },
  { value: "shorts", label: "Shorts" },
  { value: "shoes", label: "Shoes" },
  { value: "accessories", label: "Accessories" },
]);

/** Which outfit slot each category can fill. Drives wardrobe matching. */
export const CATEGORY_SLOT: Record<string, OutfitSlot> = {
  tshirts: "base",
  shirts: "mid",
  sweaters: "mid",
  hoodies: "mid",
  jackets: "outer",
  pants: "bottom",
  shorts: "bottom",
  shoes: "shoes",
  accessories: "accessory",
};

export const SLOT_LABEL: Record<OutfitSlot, string> = {
  base: "Base",
  mid: "Layer",
  outer: "Outer",
  bottom: "Bottom",
  shoes: "Shoes",
  accessory: "Accessory",
};

export const SLOT_ORDER: OutfitSlot[] = [
  "base",
  "mid",
  "outer",
  "bottom",
  "shoes",
  "accessory",
];

export const MATERIALS = opts([
  { value: "cotton", label: "Cotton" },
  { value: "wool", label: "Wool" },
  { value: "denim", label: "Denim" },
  { value: "linen", label: "Linen" },
  { value: "leather", label: "Leather" },
  { value: "technical", label: "Technical / synthetic" },
  { value: "fleece", label: "Fleece" },
  { value: "down", label: "Down / insulated" },
  { value: "other", label: "Other" },
]);

export const SEASONS = opts([
  { value: "spring", label: "Spring" },
  { value: "summer", label: "Summer" },
  { value: "autumn", label: "Autumn" },
  { value: "winter", label: "Winter" },
  { value: "all", label: "All year" },
]);

export const FORMALITY = opts([
  { value: "very-casual", label: "Very casual" },
  { value: "casual", label: "Casual" },
  { value: "smart-casual", label: "Smart casual" },
  { value: "business", label: "Business" },
  { value: "formal", label: "Formal" },
]);

/** Ordinal scale so the engine can compare an item against an occasion. */
export const FORMALITY_SCORE: Record<string, number> = {
  "very-casual": 1,
  casual: 2,
  "smart-casual": 3,
  business: 4,
  formal: 5,
};

export const WEATHER_SUITABILITY = opts([
  { value: "hot", label: "Hot" },
  { value: "warm", label: "Warm" },
  { value: "mild", label: "Mild" },
  { value: "cool", label: "Cool" },
  { value: "cold", label: "Cold" },
  { value: "rain", label: "Rain" },
  { value: "wind", label: "Wind" },
]);

/* ------------------------------ 06 · Preferences ----------------------------- */

export const BUDGETS = opts([
  { value: "budget", label: "Budget" },
  { value: "moderate", label: "Moderate" },
  { value: "premium", label: "Premium" },
  { value: "flexible", label: "Flexible" },
]);

export const SHOPPING_PREFS = opts([
  { value: "own-only", label: "Use what I own" },
  { value: "mostly-own", label: "Mostly use what I own" },
  { value: "open", label: "Open to buying things" },
  { value: "anything", label: "Recommend anything" },
]);

/* --------------------------------- 08 · Goal -------------------------------- */

export const GOALS = opts([
  { value: "attractive", label: "Look more attractive" },
  { value: "mature", label: "Look more mature" },
  { value: "dress-better", label: "Dress better" },
  { value: "personal-style", label: "Build a personal style" },
  { value: "grooming", label: "Improve grooming" },
  { value: "confidence", label: "Become more confident" },
  { value: "stop-overthinking", label: "Stop overthinking what to wear" },
  { value: "social", label: "Look better in social situations" },
  { value: "everything", label: "Everything" },
]);

/* -------------------------------- Feedback ---------------------------------- */

export const FEEDBACK_REASONS = opts([
  { value: "too-formal", label: "Too formal" },
  { value: "too-casual", label: "Too casual" },
  { value: "too-tight", label: "Too tight" },
  { value: "too-loose", label: "Too loose" },
  { value: "too-boring", label: "Too boring" },
  { value: "too-flashy", label: "Too flashy" },
  { value: "not-practical", label: "Not practical" },
  { value: "wrong-colours", label: "Wrong colours" },
  { value: "other", label: "Other" },
]);
