import { z } from "zod";
import {
  AGE_RANGES,
  BUDGETS,
  BUILDS,
  CATEGORIES,
  COLOURS,
  COMMUNICATE,
  FACE_SHAPES,
  FACIAL_HAIR,
  FEEDBACK_REASONS,
  FIT_PREFERENCES,
  FORMALITY,
  GOALS,
  GROOMING_GOALS,
  GROOMING_TIME,
  HAIR_LENGTHS,
  HAIR_THICKNESS,
  HAIR_TYPES,
  LIFESTYLES,
  MATERIALS,
  SEASONS,
  SHOPPING_PREFS,
  STYLE_TAGS,
  WEATHER_SUITABILITY,
  values,
} from "./enums";

/* ============================================================================
   PROFILE
   Every field is optional by design: the user can bail out of onboarding at
   any point and the engine degrades gracefully instead of breaking.
   ========================================================================== */

export const AboutSchema = z.object({
  name: z.string().max(60).optional(),
  ageRange: z.enum(values(AGE_RANGES)).optional(),
  heightCm: z.number().int().min(120).max(230).optional(),
  build: z.enum(values(BUILDS)).optional(),
  lifestyle: z.enum(values(LIFESTYLES)).optional(),
});

export const AppearanceSchema = z.object({
  faceShape: z.enum(values(FACE_SHAPES)).optional(),
  hairType: z.enum(values(HAIR_TYPES)).optional(),
  hairThickness: z.enum(values(HAIR_THICKNESS)).optional(),
  hairLength: z.enum(values(HAIR_LENGTHS)).optional(),
  currentHairstyle: z.string().max(140).optional(),
  facialHair: z.enum(values(FACIAL_HAIR)).optional(),
});

export const StyleSchema = z.object({
  styles: z.array(z.enum(values(STYLE_TAGS))).default([]),
  fit: z.enum(values(FIT_PREFERENCES)).optional(),
  colours: z.array(z.enum(values(COLOURS))).default([]),
  communicate: z.array(z.enum(values(COMMUNICATE))).default([]),
});

export const GroomingSchema = z.object({
  time: z.enum(values(GROOMING_TIME)).optional(),
  goals: z.array(z.enum(values(GROOMING_GOALS))).default([]),
});

export const PreferencesSchema = z.object({
  budget: z.enum(values(BUDGETS)).optional(),
  shopping: z.enum(values(SHOPPING_PREFS)).optional(),
  brands: z.string().max(280).optional(),
  dislikes: z.string().max(500).optional(),
});

export const LocationSchema = z.object({
  /** Human label, e.g. "Boston, Massachusetts". */
  label: z.string().max(120).optional(),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  /** How we obtained it — drives the privacy copy in the UI. */
  source: z.enum(["device", "manual", "demo", "none"]).default("none"),
  capturedAt: z.string().optional(),
});

export const GoalSchema = z.object({
  goals: z.array(z.enum(values(GOALS))).default([]),
  note: z.string().max(500).optional(),
});

export const AuraProfileSchema = z.object({
  id: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
  isDemo: z.boolean().default(false),
  onboardingComplete: z.boolean().default(false),
  about: AboutSchema.default({}),
  appearance: AppearanceSchema.default({}),
  style: StyleSchema.default({ styles: [], colours: [], communicate: [] }),
  grooming: GroomingSchema.default({ goals: [] }),
  preferences: PreferencesSchema.default({}),
  location: LocationSchema.default({ source: "none" }),
  goal: GoalSchema.default({ goals: [] }),
});

export type About = z.infer<typeof AboutSchema>;
export type Appearance = z.infer<typeof AppearanceSchema>;
export type StyleProfile = z.infer<typeof StyleSchema>;
export type Grooming = z.infer<typeof GroomingSchema>;
export type Preferences = z.infer<typeof PreferencesSchema>;
export type LocationContext = z.infer<typeof LocationSchema>;
export type GoalContext = z.infer<typeof GoalSchema>;
export type AuraProfile = z.infer<typeof AuraProfileSchema>;

/* ============================================================================
   WARDROBE
   ========================================================================== */

export const WardrobeItemSchema = z.object({
  id: z.string(),
  createdAt: z.string(),
  name: z.string().min(1, "Give the item a name").max(80),
  category: z.enum(values(CATEGORIES)),
  colour: z.enum(values(COLOURS)).optional(),
  fit: z.enum(values(FIT_PREFERENCES)).optional(),
  material: z.enum(values(MATERIALS)).optional(),
  styles: z.array(z.enum(values(STYLE_TAGS))).default([]),
  season: z.enum(values(SEASONS)).optional(),
  formality: z.enum(values(FORMALITY)).optional(),
  weather: z.array(z.enum(values(WEATHER_SUITABILITY))).default([]),
  /** Data URL for locally-stored photos. No upload server in the MVP. */
  image: z.string().optional(),
  notes: z.string().max(280).optional(),
});

export type WardrobeItem = z.infer<typeof WardrobeItemSchema>;

/** Form-facing schema (id/createdAt are assigned by the store). */
export const WardrobeItemInputSchema = WardrobeItemSchema.omit({
  id: true,
  createdAt: true,
});
export type WardrobeItemInput = z.infer<typeof WardrobeItemInputSchema>;
/** Pre-validation shape: fields with defaults are still optional in the form. */
export type WardrobeItemFormValues = z.input<typeof WardrobeItemInputSchema>;

/* ============================================================================
   MEMORY — what Captain Aura has learned, always user-visible and editable.
   ========================================================================== */

export const MemoryEntrySchema = z.object({
  id: z.string(),
  createdAt: z.string(),
  kind: z.enum(["like", "dislike", "goal", "fact"]),
  /** What the memory is about, e.g. "fit", "colour", "category". */
  subject: z.string(),
  /** Canonical token where possible (e.g. "skinny"), else free text. */
  value: z.string(),
  /** Human sentence rendered in the Memory screen. */
  label: z.string(),
  source: z.enum(["onboarding", "prompt", "feedback", "manual", "demo"]),
  /** 0–1. Repeated signals push this up; the engine weights by it. */
  confidence: z.number().min(0).max(1).default(0.6),
});

export type MemoryEntry = z.infer<typeof MemoryEntrySchema>;

/* ============================================================================
   ENVIRONMENT
   ========================================================================== */

export const WeatherSchema = z.object({
  temperatureC: z.number(),
  feelsLikeC: z.number(),
  highC: z.number().optional(),
  lowC: z.number().optional(),
  precipitationProbability: z.number().min(0).max(100).optional(),
  precipitationMm: z.number().optional(),
  windKph: z.number().optional(),
  humidity: z.number().optional(),
  uvIndex: z.number().optional(),
  sunrise: z.string().optional(),
  sunset: z.string().optional(),
  /** Normalised summary word, e.g. "Rain", "Clear". */
  condition: z.string(),
  /** Which provider produced this — surfaced honestly in the UI. */
  source: z.enum(["live", "mock", "user-described", "unavailable"]),
  locationLabel: z.string().optional(),
  date: z.string(),
});

export type Weather = z.infer<typeof WeatherSchema>;

/* ============================================================================
   PARSED SITUATION — output of the context engine
   ========================================================================== */

export type ActivityKind =
  | "date"
  | "interview"
  | "work"
  | "presentation"
  | "university"
  | "wedding"
  | "formal-event"
  | "party"
  | "night-out"
  | "dinner"
  | "casual-outing"
  | "hiking"
  | "outdoor"
  | "beach"
  | "gym"
  | "travel"
  | "networking"
  | "family"
  | "everyday"
  | "improvement"
  | "unknown";

export type SocialKind =
  | "romantic"
  | "strangers"
  | "colleagues"
  | "classmates"
  | "friends"
  | "family"
  | "professional"
  | "solo"
  | "unknown";

export const SituationSchema = z.object({
  activity: z.custom<ActivityKind>(),
  activityLabel: z.string(),
  social: z.custom<SocialKind>(),
  socialLabel: z.string().optional(),
  /** ISO date the situation happens on. */
  date: z.string(),
  dateLabel: z.string(),
  /** Rough part of day, used for formality + fragrance advice. */
  timeOfDay: z.enum(["morning", "afternoon", "evening", "night", "unknown"]),
  /** 1–5, same scale as FORMALITY_SCORE. */
  formality: z.number().min(1).max(5),
  goals: z.array(z.string()).default([]),
  concerns: z.array(z.string()).default([]),
  /** Weather the user described in their own words, if any. */
  describedWeather: z.string().optional(),
  locationHint: z.string().optional(),
  durationDays: z.number().optional(),
  indoors: z.boolean().optional(),
  /** Fields the parser could not determine. Drives the follow-up question. */
  unknowns: z.array(z.string()).default([]),
  confidence: z.number().min(0).max(1),
});

export type Situation = z.infer<typeof SituationSchema>;

export type FollowUp = {
  /** Machine key so the answer can be merged back into the situation. */
  key: "location" | "dressCode" | "timeOfDay" | "duration" | "setting";
  question: string;
  options?: string[];
};

/* ============================================================================
   RECOMMENDATION
   ========================================================================== */

export type OutfitPiece = {
  slot: import("./enums").OutfitSlot;
  /** Generic description, e.g. "Relaxed hiking pants". */
  label: string;
  detail?: string;
  /** Set when this piece is satisfied by something the user owns. */
  ownedItemId?: string;
  ownedItemName?: string;
  colourSuggestion?: string;
};

export type GroomingAdvice = {
  hair?: string;
  beard?: string;
  fragrance?: string;
  extra?: string;
};

export type MissingPiece = {
  slot: import("./enums").OutfitSlot;
  label: string;
  why: string;
  /** Extension point for future affiliate/product links. Empty in MVP. */
  productOptions?: { tier: "budget" | "mid" | "premium"; note: string }[];
};

export type PlanStep = {
  title: string;
  detail: string;
  /** "This week", "This month" — keeps improvement advice actionable. */
  horizon?: string;
};

export type Recommendation = {
  title: string;
  vibe: string;
  approach: string;
  outfit: OutfitPiece[];
  /** Used by improvement requests instead of a single outfit. */
  plan?: PlanStep[];
  /** Used by travel requests: what to actually put in the bag. */
  packing?: string[];
  palette: string[];
  reasons: string[];
  weatherNote?: string;
  grooming: GroomingAdvice;
  socialNote?: string;
  avoid: string[];
  wardrobeVerdict: {
    status: "complete" | "partial" | "none" | "unknown";
    headline: string;
    usedItemIds: string[];
    missing: MissingPiece[];
  };
  nextMove: string;
  /** Honest statements about what Captain Aura did not know. */
  caveats: string[];
  /** Which engine produced this. Never claim AI when rules ran. */
  engine: "rules" | "ai";
  /** Present when the AI provider failed and rules took over. */
  engineNote?: string;
};

/* ============================================================================
   REQUESTS + FEEDBACK
   ========================================================================== */

export const FeedbackSchema = z.object({
  helpful: z.boolean().optional(),
  tried: z.boolean().optional(),
  saved: z.boolean().optional(),
  rejected: z.boolean().optional(),
  reasons: z.array(z.enum(values(FEEDBACK_REASONS))).default([]),
  note: z.string().max(400).optional(),
  at: z.string().optional(),
});

export type Feedback = z.infer<typeof FeedbackSchema>;

export type AuraRequest = {
  id: string;
  createdAt: string;
  originalPrompt: string;
  situation: Situation;
  location?: LocationContext;
  weather?: Weather;
  recommendation: Recommendation;
  feedback?: Feedback;
  /** Answer the user gave to the single follow-up question, if asked. */
  followUpAnswer?: { key: string; value: string };
};

/* ============================================================================
   ENGINE INPUT — the full structured context handed to any provider.
   ========================================================================== */

export type AuraContext = {
  profile: AuraProfile;
  wardrobe: WardrobeItem[];
  memory: MemoryEntry[];
  situation: Situation;
  /** The user's raw message, kept verbatim for the AI provider. */
  originalPrompt: string;
  location?: LocationContext;
  weather?: Weather;
  /** Prior requests, most recent first. Enables "last time you said…". */
  history: AuraRequest[];
  now: string;
};
