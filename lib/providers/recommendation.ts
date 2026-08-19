import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import { CATEGORIES, COLOURS, FIT_PREFERENCES, labelOf, labelsOf, STYLE_TAGS } from "@/lib/domain/enums";
import type { AuraContext, Recommendation } from "@/lib/domain/types";
import { generateRuleBasedRecommendation } from "@/lib/engine/rules";
import { readMemory } from "@/lib/engine/memory";

/* ============================================================================
   RecommendationProvider
   ========================================================================== */

export interface RecommendationProvider {
  readonly name: string;
  readonly isAI: boolean;
  recommend(ctx: AuraContext): Promise<Recommendation>;
}

/** Deterministic, always available, zero dependencies. */
export class RuleBasedRecommendationProvider implements RecommendationProvider {
  readonly name = "rules";
  readonly isAI = false;

  async recommend(ctx: AuraContext): Promise<Recommendation> {
    return generateRuleBasedRecommendation(ctx);
  }
}

/* ============================================================================
   AI PROVIDER — only used when ANTHROPIC_API_KEY is configured.
   ========================================================================== */

const SYSTEM_PROMPT = `You are Captain Aura, a personalized men's appearance and lifestyle advisor.

You are given a structured context object describing a specific man and a specific real-life situation. Your job is to tell him how to show up.

Priorities, in order:
1. Safety and practicality
2. Appropriateness to the situation
3. His stated preferences and dislikes
4. Clothes he already owns
5. His build and appearance
6. Weather and environment
7. His style direction
8. Budget

Hard rules:
- Never give generic advice when specific context is available. Every recommendation must be traceable to something in the context.
- If he already owns something that fills a slot, use it. Do not tell him to buy something he already has an equivalent of.
- Explain WHY, referencing the actual context (his build, the weather, who he is meeting).
- Never make medical claims, never diagnose skin or hair conditions, never body-shame, never claim one body type is better than another, never guarantee attractiveness. Say "this can create a more balanced silhouette", not "this will make you look perfect".
- Never invent weather, location or wardrobe data. If a field is absent from the context, say you do not know it in "caveats".
- Do not infer race, ethnicity, health, sexuality, religion or political beliefs.
- Write in a calm, direct, premium register. No hype, no "alpha", no motivational language, no emoji.

Respond with a single JSON object and nothing else.`;

const AiRecommendationSchema = z.object({
  title: z.string(),
  vibe: z.string(),
  approach: z.string(),
  outfit: z
    .array(
      z.object({
        slot: z.enum(["base", "mid", "outer", "bottom", "shoes", "accessory"]),
        label: z.string(),
        detail: z.string().optional(),
        ownedItemId: z.string().optional(),
        colourSuggestion: z.string().optional(),
      }),
    )
    .default([]),
  plan: z
    .array(z.object({ title: z.string(), detail: z.string(), horizon: z.string().optional() }))
    .optional(),
  packing: z.array(z.string()).optional(),
  palette: z.array(z.string()).default([]),
  reasons: z.array(z.string()).default([]),
  weatherNote: z.string().optional(),
  grooming: z
    .object({
      hair: z.string().optional(),
      beard: z.string().optional(),
      fragrance: z.string().optional(),
      extra: z.string().optional(),
    })
    .default({}),
  socialNote: z.string().optional(),
  avoid: z.array(z.string()).default([]),
  wardrobeHeadline: z.string(),
  missing: z
    .array(z.object({ slot: z.string(), label: z.string(), why: z.string() }))
    .default([]),
  nextMove: z.string(),
  caveats: z.array(z.string()).default([]),
});

export class AIRecommendationProvider implements RecommendationProvider {
  readonly name = "anthropic";
  readonly isAI = true;

  constructor(private client: Anthropic) {}

  async recommend(ctx: AuraContext): Promise<Recommendation> {
    const res = await this.client.messages.create({
      model: process.env.ANTHROPIC_MODEL ?? "claude-sonnet-5",
      max_tokens: 2000,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: `${buildContextBrief(ctx)}

Respond with JSON in exactly this shape:
{
  "title": "Your hike aura",
  "vibe": "Three short words.",
  "approach": "2-3 sentences on the overall strategy.",
  "outfit": [{"slot":"base|mid|outer|bottom|shoes|accessory","label":"...","detail":"...","ownedItemId":"id from HIS WARDROBE if this piece is something he owns, else omit","colourSuggestion":"colour word"}],
  "palette": ["colour","colour","colour"],
  "reasons": ["Why this works for HIM specifically — reference his build, the weather, who he is meeting."],
  "weatherNote": "Only if weather data was provided.",
  "grooming": {"hair":"...","beard":"...","fragrance":"...","extra":"..."},
  "socialNote": "Advice about the social context.",
  "avoid": ["Specific things not to do here."],
  "wardrobeHeadline": "One line on whether he already has this outfit.",
  "missing": [{"slot":"outer","label":"Waterproof shell","why":"..."}],
  "nextMove": "One concrete action.",
  "caveats": ["Anything you genuinely did not know."]
}${ctx.situation.activity === "improvement" ? '\n\nThis is a self-improvement request, not an event: return "plan" (3-5 prioritised steps) and leave "outfit" empty.' : ""}${ctx.situation.activity === "travel" ? '\n\nThis is a travel request: also return "packing" as a capsule packing list.' : ""}`,
        },
      ],
    });

    const text = res.content.find((c) => c.type === "text")?.text ?? "";
    const json = JSON.parse(stripFences(text));
    const parsed = AiRecommendationSchema.parse(json);

    // Resolve owned item ids the model referenced back to real names.
    const byId = new Map(ctx.wardrobe.map((w) => [w.id, w]));
    const outfit = parsed.outfit.map((p) => {
      const owned = p.ownedItemId ? byId.get(p.ownedItemId) : undefined;
      return {
        slot: p.slot,
        label: p.label,
        detail: p.detail,
        ownedItemId: owned?.id,
        ownedItemName: owned?.name,
        colourSuggestion: p.colourSuggestion,
      };
    });

    const usedItemIds = outfit.map((p) => p.ownedItemId).filter((x): x is string => !!x);

    return {
      title: parsed.title,
      vibe: parsed.vibe,
      approach: parsed.approach,
      outfit,
      plan: parsed.plan,
      packing: parsed.packing,
      palette: parsed.palette,
      reasons: parsed.reasons,
      weatherNote: parsed.weatherNote,
      grooming: parsed.grooming,
      socialNote: parsed.socialNote,
      avoid: parsed.avoid,
      wardrobeVerdict: {
        status:
          ctx.wardrobe.length === 0
            ? "none"
            : parsed.missing.length === 0
              ? "complete"
              : "partial",
        headline: parsed.wardrobeHeadline,
        usedItemIds,
        missing: parsed.missing.map((m) => ({
          slot: m.slot as Recommendation["outfit"][number]["slot"],
          label: m.label,
          why: m.why,
          productOptions: [],
        })),
      },
      nextMove: parsed.nextMove,
      caveats: parsed.caveats,
      engine: "ai",
    };
  }
}

function stripFences(text: string): string {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  const body = fenced ? fenced[1] : text;
  const start = body.indexOf("{");
  const end = body.lastIndexOf("}");
  return start >= 0 && end > start ? body.slice(start, end + 1) : body;
}

/* ============================================================================
   CONTEXT BRIEF — structured context, not the raw message.
   ========================================================================== */

export function buildContextBrief(ctx: AuraContext): string {
  const { profile, situation, weather, wardrobe, history } = ctx;
  const view = readMemory(ctx.memory);
  const L: string[] = [];

  L.push("## HIM");
  const about = [
    profile.about.ageRange && `age ${profile.about.ageRange}`,
    profile.about.build && profile.about.build !== "unspecified" && `${profile.about.build} build`,
    profile.about.heightCm && `${profile.about.heightCm}cm`,
    profile.about.lifestyle,
  ].filter(Boolean);
  L.push(about.length ? `- ${about.join(", ")}` : "- (not provided)");

  const app = profile.appearance;
  const appearance = [
    app.hairType && app.hairLength && `${app.hairLength} ${app.hairType} hair`,
    app.hairThickness && `${app.hairThickness} thickness`,
    app.currentHairstyle && `currently: ${app.currentHairstyle}`,
    app.facialHair && `facial hair: ${app.facialHair}`,
    app.faceShape && app.faceShape !== "unsure" && `${app.faceShape} face`,
  ].filter(Boolean);
  if (appearance.length) L.push(`- appearance: ${appearance.join(", ")}`);

  L.push("");
  L.push("## HIS STYLE");
  if (profile.style.styles.length)
    L.push(`- direction: ${labelsOf(STYLE_TAGS, profile.style.styles).join(", ")}`);
  if (profile.style.fit) L.push(`- preferred fit: ${labelOf(FIT_PREFERENCES, profile.style.fit)}`);
  if (profile.style.colours.length)
    L.push(`- colours he wears: ${labelsOf(COLOURS, profile.style.colours).join(", ")}`);
  if (profile.style.communicate.length)
    L.push(`- wants to come across as: ${profile.style.communicate.join(", ")}`);
  if (profile.grooming.time) L.push(`- grooming time budget: ${profile.grooming.time} minutes`);
  if (profile.grooming.goals.length) L.push(`- grooming goals: ${profile.grooming.goals.join(", ")}`);
  if (profile.preferences.budget) L.push(`- budget: ${profile.preferences.budget}`);
  if (profile.preferences.shopping) L.push(`- shopping stance: ${profile.preferences.shopping}`);
  if (profile.preferences.brands) L.push(`- brands he likes: ${profile.preferences.brands}`);
  if (profile.preferences.dislikes) L.push(`- in his words, dislikes: "${profile.preferences.dislikes}"`);
  if (profile.goal.goals.length) L.push(`- current goals: ${profile.goal.goals.join(", ")}`);
  if (profile.goal.note) L.push(`- in his words: "${profile.goal.note}"`);

  L.push("");
  L.push("## WHAT I'VE LEARNED");
  if (view.dislikedFits.length) L.push(`- NEVER recommend these fits: ${view.dislikedFits.join(", ")}`);
  if (view.dislikedColours.length) L.push(`- NEVER recommend these colours: ${view.dislikedColours.join(", ")}`);
  if (view.dislikedDetails.length) L.push(`- avoid: ${view.dislikedDetails.join(", ")}`);
  if (view.formalityBias !== 0)
    L.push(`- he wants recommendations pitched ${view.formalityBias < 0 ? "more casual" : "more formal"} than before`);
  if (view.characterBias !== 0)
    L.push(`- he wants outfits ${view.characterBias > 0 ? "with more character" : "more understated"}`);
  if (!view.dislikedFits.length && !view.dislikedColours.length) L.push("- nothing yet");

  L.push("");
  L.push("## THE SITUATION");
  L.push(`- activity: ${situation.activityLabel} (${situation.activity})`);
  L.push(`- when: ${situation.dateLabel}, ${situation.timeOfDay}`);
  if (situation.socialLabel) L.push(`- who with: ${situation.socialLabel}`);
  L.push(`- target formality: ${situation.formality}/5`);
  if (situation.goals.length) L.push(`- what he wants from it: ${situation.goals.join(", ")}`);
  if (situation.concerns.length) L.push(`- his concerns: ${situation.concerns.join(", ")}`);
  if (situation.durationDays) L.push(`- duration: ${situation.durationDays} days`);
  if (situation.locationHint) L.push(`- location mentioned: ${situation.locationHint}`);
  if (situation.unknowns.length) L.push(`- UNKNOWN (do not invent): ${situation.unknowns.join(", ")}`);
  L.push(`- his exact words: "${ctx.originalPrompt}"`);

  L.push("");
  L.push("## ENVIRONMENT");
  if (weather) {
    L.push(
      `- ${weather.locationLabel ?? "location"}: ${Math.round(weather.temperatureC)}°C (feels ${Math.round(weather.feelsLikeC)}°C), ${weather.condition}` +
        (weather.precipitationProbability !== undefined ? `, ${weather.precipitationProbability}% rain` : "") +
        (weather.windKph !== undefined ? `, wind ${Math.round(weather.windKph)} km/h` : ""),
    );
    L.push(`- weather source: ${weather.source}${weather.source === "mock" ? " (SIMULATED — say so if you mention it)" : ""}`);
  } else if (situation.describedWeather) {
    L.push(`- no live weather. He described: ${situation.describedWeather}`);
  } else {
    L.push("- no weather data available. Do not state any temperature.");
  }

  L.push("");
  L.push("## HIS WARDROBE");
  if (wardrobe.length === 0) {
    L.push("- EMPTY. You do not know what he owns. Describe pieces generically and say so in caveats.");
  } else {
    for (const w of wardrobe) {
      L.push(
        `- id=${w.id} | ${w.name} | ${labelOf(CATEGORIES, w.category)}` +
          (w.colour ? ` | ${w.colour}` : "") +
          (w.fit ? ` | ${w.fit} fit` : "") +
          (w.material ? ` | ${w.material}` : "") +
          (w.formality ? ` | ${w.formality}` : "") +
          (w.weather.length ? ` | good for: ${w.weather.join("/")}` : ""),
      );
    }
  }

  if (history.length) {
    L.push("");
    L.push("## RECENT HISTORY");
    for (const h of history.slice(0, 3)) {
      const fb = h.feedback;
      L.push(
        `- ${h.situation.activityLabel}: ${h.recommendation.title}` +
          (fb?.reasons?.length ? ` — he said: ${fb.reasons.join(", ")}` : "") +
          (fb?.helpful ? " — he found it helpful" : ""),
      );
    }
  }

  return L.join("\n");
}

/* ============================================================================
   FACTORY
   ========================================================================== */

export function getRecommendationProvider(): RecommendationProvider {
  const key = process.env.ANTHROPIC_API_KEY;
  if (key && process.env.RECOMMENDATION_PROVIDER !== "rules") {
    return new AIRecommendationProvider(new Anthropic({ apiKey: key }));
  }
  return new RuleBasedRecommendationProvider();
}

/**
 * AI when available, rules when not — and rules again if the AI call fails.
 * The app is never allowed to return nothing.
 */
export async function recommendWithFallback(
  ctx: AuraContext,
): Promise<Recommendation> {
  const provider = getRecommendationProvider();
  if (!provider.isAI) return provider.recommend(ctx);

  try {
    return await provider.recommend(ctx);
  } catch (err) {
    const rec = generateRuleBasedRecommendation(ctx);
    rec.engineNote =
      "The AI advisor was unavailable, so this came from Captain Aura's built-in rules.";
    console.error("[captain-aura] AI provider failed, fell back to rules:", err);
    return rec;
  }
}
