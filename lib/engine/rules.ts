import { COLOURS, labelOf, type OutfitSlot } from "@/lib/domain/enums";
import type {
  AuraContext,
  MissingPiece,
  OutfitPiece,
  PlanStep,
  Recommendation,
} from "@/lib/domain/types";
import { listJoin } from "@/lib/utils";
import { readMemory, type MemoryView } from "./memory";
import {
  bestMatch,
  conditionsFrom,
  type Conditions,
  type SlotNeed,
} from "./wardrobe";

/* ============================================================================
   RuleBasedRecommendationProvider

   Fully deterministic. No API keys, no network. Every sentence it emits is
   derived from something the user actually told us or something we measured.
   ========================================================================== */

type PieceSpec = {
  slot: OutfitSlot;
  label: string;
  detail?: string;
  essential: boolean;
  categories?: string[];
  requiresWaterproof?: boolean;
  /** Reason this piece exists at all — feeds the "why" section. */
  rationale?: string;
};

/* ------------------------------- vocabulary -------------------------------- */

const TITLE_NOUN: Record<string, string> = {
  hiking: "Hike",
  date: "Date",
  interview: "Interview",
  presentation: "Presentation",
  wedding: "Wedding",
  "formal-event": "Event",
  travel: "Travel",
  gym: "Gym",
  beach: "Beach",
  university: "Campus",
  work: "Work",
  dinner: "Dinner",
  "night-out": "Night",
  party: "Party",
  networking: "Networking",
  family: "Family",
  outdoor: "Outdoor",
  "casual-outing": "Day",
  everyday: "Everyday",
  improvement: "Direction",
  unknown: "Today",
};

const VIBE: Record<string, string> = {
  hiking: "Prepared. Relaxed. Natural.",
  date: "Considered. Warm. Unforced.",
  interview: "Composed. Credible. Current.",
  presentation: "Sharp. Calm. Deliberate.",
  wedding: "Polished. Respectful. Personal.",
  "formal-event": "Refined. Confident. Quiet.",
  travel: "Light. Adaptable. Repeatable.",
  gym: "Functional. Uncomplicated.",
  beach: "Easy. Light. Unfussy.",
  university: "Effortless. Put-together.",
  work: "Capable. Understated.",
  dinner: "Relaxed. Considered.",
  "night-out": "Sharp. Dark. Easy.",
  party: "Relaxed. A little sharper than usual.",
  networking: "Approachable. Credible.",
  family: "Comfortable. Presentable.",
  outdoor: "Practical. Unfussy.",
  "casual-outing": "Simple. Clean.",
  everyday: "Simple. Reliable.",
  improvement: "Gradual. Deliberate.",
  unknown: "Adaptable. Clean.",
};

/* ------------------------------ fit language ------------------------------- */

function fitLanguage(build?: string, preferredFit?: string) {
  const b = build ?? "unspecified";
  if (b === "slim") {
    return {
      word: preferredFit === "slim" ? "regular" : "straight or relaxed",
      note: "structured layers add visual weight across your frame",
      avoid: "very tight athletic cuts, which emphasise a narrow silhouette",
    };
  }
  if (b === "broad" || b === "muscular") {
    return {
      word: "straight-cut",
      note: "clean vertical lines keep the shape balanced rather than bulky",
      avoid: "clingy stretch fabrics and boxy oversized cuts",
    };
  }
  if (b === "athletic") {
    return {
      word: preferredFit === "relaxed" ? "relaxed" : "regular",
      note: "a regular cut reads more considered than a compression fit",
      avoid: "gym-tight tops outside the gym",
    };
  }
  return {
    word: preferredFit && preferredFit !== "depends" ? preferredFit : "regular",
    note: "a clean regular cut is the most reliable starting point",
    avoid: "anything that pulls at the shoulder or waist",
  };
}

/* -------------------------------- palette ---------------------------------- */

const DEFAULT_PALETTES: Record<string, string[]> = {
  outdoor: ["olive", "cream", "charcoal"],
  formal: ["charcoal", "navy", "white"],
  evening: ["black", "charcoal", "navy"],
  neutral: ["cream", "charcoal", "navy"],
};

function buildPalette(ctx: AuraContext, view: MemoryView, formality: number): string[] {
  const { activity } = ctx.situation;
  const preferred = ctx.profile.style.colours.filter(
    (c) => !view.dislikedColours.includes(c),
  );

  let base: string[];
  if (preferred.length >= 3) {
    base = preferred.slice(0, 4);
  } else {
    const fallback =
      activity === "hiking" || activity === "outdoor"
        ? DEFAULT_PALETTES.outdoor
        : formality >= 4
          ? DEFAULT_PALETTES.formal
          : ctx.situation.timeOfDay === "evening" || ctx.situation.timeOfDay === "night"
            ? DEFAULT_PALETTES.evening
            : DEFAULT_PALETTES.neutral;
    base = Array.from(new Set([...preferred, ...fallback])).slice(0, 4);
  }

  const filtered = base.filter((c) => !view.dislikedColours.includes(c));
  return filtered.length ? filtered : ["charcoal", "cream", "navy"];
}

/* ----------------------------- piece selection ----------------------------- */

function pickBottom(
  activity: string,
  formality: number,
  cond: Conditions,
  fitWord: string,
): PieceSpec {
  const s = (label: string, detail: string, categories?: string[]): PieceSpec => ({
    slot: "bottom",
    label,
    detail,
    essential: true,
    categories,
  });

  if (activity === "gym")
    return s("Training shorts or joggers", "Whatever you actually move well in");
  if (activity === "beach")
    return s("Swim shorts", "Mid-length, plain colour", ["shorts"]);
  if (activity === "hiking" || activity === "outdoor") {
    return cond.band === "hot"
      ? s("Hiking shorts", "Quick-drying, not running-short length", ["shorts"])
      : s(
          `${fitWord === "straight or relaxed" ? "Straight-cut" : "Regular"} hiking pants`,
          "Technical or ripstop — avoid denim on a trail",
          ["pants"],
        );
  }
  if (formality >= 4.5)
    return s("Tailored wool trousers", "Clean break at the shoe", ["pants"]);
  if (formality >= 3.5)
    return s("Tailored trousers", `${fitWord} through the leg, no break or a slight one`, ["pants"]);
  if (formality >= 2.5)
    return s("Dark straight trousers or clean dark denim", `${fitWord} cut, no distressing`, ["pants"]);
  if (cond.band === "hot")
    return s("Relaxed chino shorts", "Just above the knee", ["shorts"]);
  return s("Straight-leg jeans or chinos", `${fitWord} cut`, ["pants"]);
}

function pickBase(activity: string, formality: number, cond: Conditions): PieceSpec {
  const s = (label: string, detail: string, categories?: string[]): PieceSpec => ({
    slot: "base",
    label,
    detail,
    essential: true,
    categories,
  });

  if (activity === "gym") return s("Breathable training tee", "Synthetic or merino, not cotton");
  if (activity === "hiking" || activity === "outdoor") {
    return cond.band === "cold" || cond.band === "cool"
      ? s("Long-sleeve merino or technical base", "Wicking, close to the skin")
      : s("Technical or merino tee", "Cotton holds sweat and cools you down when you stop");
  }
  if (activity === "beach") return s("Light cotton or linen tee", "Something you don't mind creasing");
  if (formality >= 4.5) return s("Crisp white shirt", "Pressed, plain, no visible logo", ["shirts"]);
  if (formality >= 3.5) return s("Plain shirt in a muted tone", "Ironed, collar sitting flat", ["shirts"]);
  if (formality >= 2.8) return s("Plain tee or fine knit", "No graphics — let the fit do the work");
  return s("Plain heavyweight tee", "Good shoulder seam, opaque fabric");
}

function pickMid(
  activity: string,
  formality: number,
  cond: Conditions,
  timeOfDay: string,
): PieceSpec | null {
  if (cond.band === "hot") return null;
  if (activity === "gym" || activity === "beach") return null;

  const s = (label: string, detail: string, rationale: string, categories?: string[]): PieceSpec => ({
    slot: "mid",
    label,
    detail,
    essential: cond.band === "cold" || cond.band === "cool",
    categories,
    rationale,
  });

  if (activity === "hiking" || activity === "outdoor") {
    return s(
      "Light fleece or structured overshirt",
      "Easy to take off ten minutes into the walk",
      "you warm up fast on a climb and cool down fast at the top",
      ["hoodies", "sweaters", "shirts"],
    );
  }
  if (formality >= 4) {
    return s("Fine merino knit or waistcoat", "Slim enough to sit under a jacket",
      "it keeps the tailoring reading as one clean line", ["sweaters"]);
  }
  if (formality >= 3) {
    return s("Fine merino crewneck or overshirt", "Plain, in a colour from your palette",
      "a mid layer is the easiest way to look deliberate rather than thrown together",
      ["sweaters", "shirts"]);
  }
  if (cond.band === "cool" || cond.band === "cold") {
    return s("Knit or overshirt", "Something you can wear open or layered",
      `it's ${cond.tempC !== undefined ? `around ${Math.round(cond.tempC)}°C` : "cool"} — one layer isn't enough`,
      ["sweaters", "hoodies", "shirts"]);
  }
  // Mild evenings drop several degrees once the sun goes down.
  if (timeOfDay === "evening" || timeOfDay === "night") {
    return s("Light overshirt or knit", "Worn open over the base layer",
      "it cools off in the evening, and a second layer reads as more considered",
      ["sweaters", "shirts", "hoodies"]);
  }
  return null;
}

function pickOuter(
  activity: string,
  formality: number,
  cond: Conditions,
): PieceSpec | null {
  const s = (
    label: string,
    detail: string,
    rationale: string,
    essential = true,
    requiresWaterproof = false,
  ): PieceSpec => ({
    slot: "outer",
    label,
    detail,
    essential,
    requiresWaterproof,
    rationale,
    categories: ["jackets"],
  });

  if (cond.rain) {
    return formality >= 4
      ? s("Dark waterproof overcoat", "Long enough to cover the jacket underneath",
          "rain is likely and a soaked suit jacket can't recover", true, true)
      : s("Waterproof shell", "Taped seams if you have them, hood up",
          "rain is likely enough that a hoodie won't hold up as your outer layer", true, true);
  }
  if (cond.band === "cold") {
    return formality >= 3.5
      ? s("Wool overcoat", "Mid-thigh, in a dark neutral", "it's cold and an overcoat is warmer and sharper than a puffer")
      : s("Insulated jacket", "Something that actually blocks wind", "it's cold enough that a knit alone won't hold heat");
  }
  if (cond.band === "cool") {
    return s("Overshirt, bomber or unstructured jacket", "Worn open over the mid layer",
      "cool but not cold — you want a layer you can carry, not a parka", false);
  }
  if (formality >= 4.5) {
    return s("Tailored jacket", "Shoulder seam sitting exactly on your shoulder",
      "the occasion calls for structure on top", true);
  }
  if (cond.wind && activity !== "gym") {
    // A windbreaker would undercut a dressed-up outfit — reach for structure.
    return formality >= 3.5
      ? s("Unstructured blazer or overshirt", "Something that cuts the wind without looking technical",
          "it's windy, but a shell would undercut how you're dressed", false)
      : s("Light windbreaker", "Packs down small", "wind is the part people underestimate", false);
  }
  return null;
}

function pickShoes(activity: string, formality: number, cond: Conditions): PieceSpec {
  const s = (label: string, detail: string): PieceSpec => ({
    slot: "shoes",
    label,
    detail,
    essential: true,
    categories: ["shoes"],
  });

  if (activity === "hiking" || activity === "outdoor")
    return s("Trail shoes with real grip", "Broken in — a hike is the wrong place for new shoes");
  if (activity === "gym") return s("Training shoes", "Flat sole if you're lifting");
  if (activity === "beach") return s("Slides or simple sandals", "Nothing that minds sand");
  if (formality >= 4.5) return s("Polished leather derbies or oxfords", "Clean, with a matching belt");
  if (formality >= 3.5) return s("Leather boots or polished derbies", "Dark, clean, no chunky sole");
  if (formality >= 2.8)
    return cond.rain
      ? s("Water-resistant boots or dark sneakers", "Nothing suede in the wet")
      : s("Clean minimal leather sneakers", "White or dark — the cleanliness matters more than the brand");
  return s("Clean everyday sneakers", "Give them a wipe before you leave");
}

function pickAccessory(activity: string, formality: number, cond: Conditions): PieceSpec | null {
  const s = (label: string, detail: string): PieceSpec => ({
    slot: "accessory",
    label,
    detail,
    essential: false,
    categories: ["accessories"],
  });

  if (activity === "hiking" || activity === "outdoor")
    return s("Practical daypack", "Water, a layer, and something to eat");
  if (activity === "gym") return null;
  if (activity === "travel") return s("One bag you can carry all day", "Comfortable straps beat looking sharp at hour six");
  if (formality >= 4) return s("Slim watch", "One piece is enough — let the tailoring lead");
  if (cond.rain) return s("Compact umbrella", "Or skip it if your shell has a hood");
  return s("Simple watch", "The one accessory that always works");
}

/* ------------------------------ special modes ------------------------------ */

function improvementPlan(ctx: AuraContext, view: MemoryView): PlanStep[] {
  const goals = view.goals.length ? view.goals : ctx.situation.goals;
  const steps: PlanStep[] = [];
  const build = ctx.profile.about.build;
  const fit = fitLanguage(build, ctx.profile.style.fit);

  if (goals.includes("mature") || ctx.situation.goals.includes("mature")) {
    steps.push({
      title: "Raise the floor on fit",
      detail: `Looking older is mostly about fit and finish, not new clothes. Move your everyday pieces to a ${fit.word} cut and get the two you wear most adjusted — ${fit.note}.`,
      horizon: "This week",
    });
    steps.push({
      title: "Narrow the palette",
      detail:
        "Mature reads as restrained. Pick three colours and buy nothing outside them for a season. Fewer decisions, more coherence.",
      horizon: "This month",
    });
  }

  steps.push({
    title: "Fix the shoes first",
    detail:
      "Shoes set the register of everything above them. One clean, well-kept pair does more than three new tops.",
    horizon: "This month",
  });

  if (ctx.profile.grooming.time === "5" || ctx.profile.grooming.goals.includes("low-maintenance")) {
    steps.push({
      title: "Build a five-minute grooming floor",
      detail:
        "A haircut on a schedule you actually keep, a clean neckline, moisturiser. That's the whole routine — consistency beats products.",
      horizon: "Ongoing",
    });
  } else {
    steps.push({
      title: "Get the haircut cadence right",
      detail:
        "Book the next cut before you leave the chair. Most of the difference between 'styled' and 'overdue' is scheduling.",
      horizon: "Ongoing",
    });
  }

  if (ctx.wardrobe.length < 8) {
    steps.push({
      title: "Log what you own",
      detail:
        "Add your real wardrobe to the closet. Once I can see it, the advice stops being general and starts being about your actual clothes.",
      horizon: "This week",
    });
  } else {
    steps.push({
      title: "Cut the dead weight",
      detail:
        "Anything you haven't worn in a year is taking up decision space. Remove it and the good pieces become obvious.",
      horizon: "This month",
    });
  }

  return steps.slice(0, 5);
}

function packingList(ctx: AuraContext, cond: Conditions, days: number): string[] {
  const light = ctx.situation.concerns.includes("packing-light");
  const tops = light ? Math.min(4, Math.ceil(days / 2)) : Math.min(6, days);
  const list = [
    `${tops} plain tops in your palette — they all have to work with every bottom`,
    `${days <= 4 ? 2 : 3} bottoms, one smarter than the rest`,
    "1 mid layer you can wear on the plane",
    cond.rain || cond.band === "cool" || cond.band === "cold"
      ? "1 packable waterproof shell"
      : "1 light overshirt for evenings",
    "2 pairs of shoes: one you can walk all day in, one that reads smarter",
    "Underwear and socks for the trip, plus one spare",
  ];
  if (light) list.push("Wash mid-trip rather than packing more — one small bottle of detergent");
  list.push("Grooming: travel-size wash, moisturiser, deodorant, and one fragrance only");
  return list;
}

/* -------------------------------- grooming --------------------------------- */

function groomingAdvice(ctx: AuraContext, formality: number) {
  const { appearance, grooming } = ctx.profile;
  const { activity, timeOfDay } = ctx.situation;
  const quick = grooming.time === "5" || grooming.goals.includes("low-maintenance");

  let hair: string;
  const length = appearance.hairLength;
  const type = appearance.hairType;

  if (activity === "gym" || activity === "hiking" || activity === "outdoor") {
    hair =
      length === "medium" || length === "long"
        ? "Keep it back and off your face. Natural texture is right here — heavily styled hair looks out of place outdoors."
        : "Leave it natural. Minimal product, since you'll be under a hood or sweating.";
  } else if (formality >= 4) {
    hair = quick
      ? "Clean and tidy, with a light hold product. Make sure it's dry before you leave."
      : "Style it properly — a matte product with light hold, shaped rather than slicked.";
  } else if (type === "curly" || type === "coily") {
    hair = "Work a leave-in through damp hair and let it dry naturally. Definition over control.";
  } else if (length === "medium" || length === "long") {
    hair = "A little texture product through damp hair, then leave it alone. Deliberate, not fixed in place.";
  } else {
    hair = "Clean and natural, light product at most.";
  }

  const beardMap: Record<string, string> = {
    "clean-shaven": formality >= 3.5
      ? "Shave the morning of, not the night before — you'll look sharper for longer."
      : "A clean shave the morning of is enough.",
    stubble: "Even it out with a guard and clean the neckline. The neckline is what reads as tidy.",
    "short-beard": "Light trim, tight neckline and cheek line. Brush it before you go.",
    "medium-beard": "Trim the stragglers, define the neckline, and use a little beard oil so it sits flat.",
    "long-beard": "Comb it through with oil. Keep the neckline clean — length is fine, mess isn't.",
    mustache: "Trim above the lip line and keep the edges defined.",
  };
  const beard = appearance.facialHair
    ? beardMap[appearance.facialHair]
    : "Whatever you're growing, a clean neckline does most of the work.";

  let fragrance: string | undefined;
  if (activity === "gym") {
    fragrance = "Skip fragrance — deodorant only.";
  } else if (activity === "hiking" || activity === "outdoor") {
    fragrance = "Skip it or go very light. Outdoors, strong scent reads as trying too hard.";
  } else if (activity === "interview" || formality >= 4.5) {
    fragrance = "One spray of something clean and unobtrusive, or none. Never noticeable across a table.";
  } else if (timeOfDay === "evening" || timeOfDay === "night") {
    fragrance = "Something warm — woody or amber. Two sprays, on the chest, not the neck.";
  } else {
    fragrance = "Something fresh and light. Two sprays maximum.";
  }

  const extra =
    formality >= 3.5
      ? "Nails short and clean — it's the detail people notice up close."
      : quick
        ? "Moisturiser before you leave. That's the whole routine."
        : undefined;

  return { hair, beard, fragrance, extra };
}

/* --------------------------------- avoid ----------------------------------- */

function buildAvoid(ctx: AuraContext, cond: Conditions, formality: number, view: MemoryView): string[] {
  const out: string[] = [];
  const { activity } = ctx.situation;
  const fit = fitLanguage(ctx.profile.about.build, ctx.profile.style.fit);

  if (activity === "hiking" || activity === "outdoor") {
    out.push("Heavy cotton — it soaks through and stays cold");
    out.push("Brand-new shoes you haven't walked in");
    if (cond.rain) out.push("Relying on a hoodie as your outer layer");
  }
  if (cond.rain && activity !== "hiking") out.push("Suede shoes and anything that water-marks");
  if (formality >= 4) out.push("Visible logos and novelty details");
  if (formality <= 2.5) out.push("Overdressing — a suit here would read as trying too hard");
  if (activity === "date") out.push("A brand-new outfit you haven't worn before — you'll fidget");
  if (activity === "interview") out.push("Anything you have to keep adjusting while you talk");
  if (activity === "gym") out.push("Cotton, which stays wet the whole session");

  out.push(fit.avoid.charAt(0).toUpperCase() + fit.avoid.slice(1));

  const disliked = describeDislikedColours(view.dislikedColours);
  if (disliked) {
    out.push(`${capitalise(disliked)} — you've told me those aren't for you`);
  }

  return Array.from(new Set(out)).slice(0, 5);
}

/* ==========================================================================
   MAIN
   ========================================================================== */

export function generateRuleBasedRecommendation(ctx: AuraContext): Recommendation {
  const view = readMemory(ctx.memory);
  const cond = conditionsFrom(ctx.weather);
  const { situation, profile, wardrobe } = ctx;

  // Memory can nudge how formally we pitch, within one step.
  const formality = Math.max(
    1,
    Math.min(5, situation.formality + clamp(view.formalityBias, -1, 1)),
  );

  const fit = fitLanguage(profile.about.build, view.preferredFit ?? profile.style.fit);
  const palette = buildPalette(ctx, view, formality);
  const noun = TITLE_NOUN[situation.activity] ?? "Today";

  /* ----------------------------- improvement ----------------------------- */
  if (situation.activity === "improvement") {
    const plan = improvementPlan(ctx, view);
    return {
      title: `Your ${noun.toLowerCase()}`,
      vibe: VIBE.improvement,
      approach:
        "This isn't an outfit — it's an order of operations. Do these in sequence and the individual decisions get easier.",
      outfit: [],
      plan,
      palette,
      reasons: buildReasons(ctx, cond, formality, fit, view, []),
      grooming: groomingAdvice(ctx, formality),
      avoid: [
        "Buying a whole new wardrobe at once — it won't cohere",
        "Copying a look wholesale from someone with a different build",
        "Changing everything before you know what you actually wear",
      ],
      wardrobeVerdict: {
        status: wardrobe.length ? "unknown" : "none",
        headline: wardrobe.length
          ? `Working from the ${wardrobe.length} items in your closet.`
          : "I don't know what your wardrobe looks like yet.",
        usedItemIds: [],
        missing: [],
      },
      nextMove: plan[0]?.title ?? "Start with fit.",
      caveats: buildCaveats(ctx, cond),
      engine: "rules",
    };
  }

  /* -------------------------- outfit construction ------------------------- */
  const specs: PieceSpec[] = [];
  specs.push(pickBase(situation.activity, formality, cond));
  const mid = pickMid(situation.activity, formality, cond, situation.timeOfDay);
  if (mid) specs.push(mid);
  const outer = pickOuter(situation.activity, formality, cond);
  if (outer) specs.push(outer);
  specs.push(pickBottom(situation.activity, formality, cond, fit.word));
  specs.push(pickShoes(situation.activity, formality, cond));
  const acc = pickAccessory(situation.activity, formality, cond);
  if (acc) specs.push(acc);

  // Keep display order anatomical rather than construction order.
  const ORDER: OutfitSlot[] = ["base", "mid", "outer", "bottom", "shoes", "accessory"];
  specs.sort((a, b) => ORDER.indexOf(a.slot) - ORDER.indexOf(b.slot));

  /* ---------------------------- wardrobe match ---------------------------- */
  const usedIds = new Set<string>();
  const outfit: OutfitPiece[] = [];
  const missing: MissingPiece[] = [];
  const matchNotes: string[] = [];

  // Outside of genuinely outdoor activities, technical fabric reads as gym kit.
  const outdoorish =
    situation.activity === "hiking" ||
    situation.activity === "outdoor" ||
    situation.activity === "gym";

  specs.forEach((spec, i) => {
    const need: SlotNeed = {
      slot: spec.slot,
      formality,
      conditions: cond,
      preferredColours: palette,
      preferredStyles: profile.style.styles,
      dislikedFits: view.dislikedFits,
      dislikedColours: view.dislikedColours,
      categories: spec.categories,
      requiresWaterproof: spec.requiresWaterproof,
      penalisedMaterials:
        !outdoorish && !spec.requiresWaterproof ? ["technical", "fleece"] : undefined,
    };

    const available = wardrobe.filter((w) => !usedIds.has(w.id));
    const match = bestMatch(available, need);

    const colourSuggestion = palette[i % palette.length];

    if (match) {
      usedIds.add(match.item.id);
      // Show the item he owns, and explain why it was chosen. Keeping the
      // generic label here would contradict the actual garment.
      outfit.push({
        slot: spec.slot,
        label: match.item.name,
        detail: match.because.length
          ? capitalise(match.because.join(" · "))
          : `Fills the ${spec.label.toLowerCase()} role here`,
        ownedItemId: match.item.id,
        ownedItemName: match.item.name,
        colourSuggestion: match.item.colour ?? colourSuggestion,
      });
      if (match.because.length) {
        matchNotes.push(`${match.item.name} — ${match.because[0]}`);
      }
    } else {
      outfit.push({
        slot: spec.slot,
        label: spec.label,
        // Details are built from fragments, so normalise the sentence start.
        detail: spec.detail ? capitalise(spec.detail) : undefined,
        colourSuggestion,
      });
      if (spec.essential && wardrobe.length > 0) {
        missing.push({
          slot: spec.slot,
          label: spec.label,
          why:
            spec.rationale ??
            `Nothing in your closet fills the ${spec.slot} slot for this.`,
          productOptions: [],
        });
      }
    }
  });

  /* --------------------------- wardrobe verdict --------------------------- */
  const essentialCount = specs.filter((s) => s.essential).length;
  const essentialMatched = specs.filter(
    (s, i) => s.essential && outfit[i]?.ownedItemId,
  ).length;

  const ownOnly =
    profile.preferences.shopping === "own-only" ||
    profile.preferences.shopping === "mostly-own";

  let verdict: Recommendation["wardrobeVerdict"];
  if (wardrobe.length === 0) {
    verdict = {
      status: "none",
      headline: "I don't know what your wardrobe looks like yet — this is the shape to aim for.",
      usedItemIds: [],
      missing: [],
    };
  } else if (missing.length === 0) {
    verdict = {
      status: "complete",
      headline: "You already have this outfit.",
      usedItemIds: [...usedIds],
      missing: [],
    };
  } else if (essentialMatched >= Math.max(1, essentialCount - 1)) {
    verdict = {
      status: "partial",
      headline: `You're one piece away — everything else is already in your closet.`,
      usedItemIds: [...usedIds],
      missing: ownOnly ? missing.slice(0, 1) : missing,
    };
  } else {
    verdict = {
      status: "partial",
      headline: `${essentialMatched} of ${essentialCount} core pieces are already yours.`,
      usedItemIds: [...usedIds],
      missing: ownOnly ? missing.slice(0, 2) : missing,
    };
  }

  /* ------------------------------- assembly ------------------------------- */
  const approach = buildApproach(ctx, cond, formality, fit);
  const reasons = buildReasons(ctx, cond, formality, fit, view, matchNotes);

  const rec: Recommendation = {
    title: `Your ${noun.toLowerCase()} aura`,
    vibe: VIBE[situation.activity] ?? VIBE.unknown,
    approach,
    outfit,
    palette,
    reasons,
    weatherNote: buildWeatherNote(ctx, cond),
    grooming: groomingAdvice(ctx, formality),
    socialNote: buildSocialNote(ctx, formality),
    avoid: buildAvoid(ctx, cond, formality, view),
    wardrobeVerdict: verdict,
    nextMove: buildNextMove(ctx, verdict),
    caveats: buildCaveats(ctx, cond),
    engine: "rules",
  };

  if (situation.activity === "travel") {
    rec.packing = packingList(ctx, cond, situation.durationDays ?? 5);
  }

  return rec;
}

/* ------------------------------- narrative --------------------------------- */

function buildApproach(
  ctx: AuraContext,
  cond: Conditions,
  formality: number,
  fit: ReturnType<typeof fitLanguage>,
): string {
  const bits: string[] = [];
  const { activity } = ctx.situation;

  if (formality >= 4.5) bits.push("Formal, but personal rather than costume.");
  else if (formality >= 3.5) bits.push("Smart, with the edges softened so it doesn't read as a uniform.");
  else if (formality >= 2.5) bits.push("Clean and considered without looking like you planned it.");
  else bits.push("Practical first. Style comes from fit and restraint, not from adding pieces.");

  if (ctx.profile.about.build === "slim") {
    bits.push(`You're slim, so we're using ${fit.word} cuts and light layering — ${fit.note}.`);
  } else if (ctx.profile.about.build === "broad" || ctx.profile.about.build === "muscular") {
    bits.push(`With a ${ctx.profile.about.build} build, ${fit.note}.`);
  }

  if (cond.rain && activity !== "gym") {
    bits.push("Rain is the constraint that decides the outer layer here.");
  } else if (cond.band === "cold") {
    bits.push("Cold is doing the deciding — layers you can actually take off indoors.");
  }

  return bits.join(" ");
}

function buildReasons(
  ctx: AuraContext,
  cond: Conditions,
  formality: number,
  fit: ReturnType<typeof fitLanguage>,
  view: MemoryView,
  matchNotes: string[],
): string[] {
  const out: string[] = [];
  const { situation, profile } = ctx;

  if (profile.about.build && profile.about.build !== "unspecified") {
    out.push(
      `Your build is ${profile.about.build}, so ${fit.note}. That's why the cuts here are ${fit.word} rather than fitted.`,
    );
  }

  if (profile.style.styles.length) {
    out.push(
      `You told me your direction is ${listJoin(profile.style.styles.map((s) => s.replace("-", " ")))}, so this stays plain and structural rather than decorative.`,
    );
  }

  if (!cond.unknown && ctx.weather) {
    const w = ctx.weather;
    const p = w.precipitationProbability;
    out.push(
      `${Math.round(w.temperatureC)}°C${
        p !== undefined ? ` with ${article(p)} ${p}% chance of rain` : ""
      } — the layering here is a response to that, not a style choice.`,
    );
  }

  const SOCIAL_PHRASE: Record<string, string> = {
    romantic: "It's a date, so one considered detail reads better than a fully styled outfit.",
    classmates: "You're with people from your course, and first impressions with a group land better understated than loud.",
    colleagues: "You're with colleagues, so matching the room's register matters more than standing out in it.",
    strangers: "Some of these people are meeting you for the first time — understated is the safer read.",
    friends: "You're with friends, so this leans comfortable and only a step sharper than usual.",
    family: "It's family, so presentable and comfortable beats impressive.",
    professional: "You're in front of a professional audience, so credibility comes before personality here.",
  };
  if (SOCIAL_PHRASE[situation.social]) out.push(SOCIAL_PHRASE[situation.social]);

  if (view.dislikedFits.length || view.dislikedColours.length) {
    const parts: string[] = [];
    if (view.dislikedFits.length) parts.push(`${listJoin(view.dislikedFits)} fits`);
    const colours = describeDislikedColours(view.dislikedColours);
    if (colours) parts.push(colours);
    out.push(`You've told me to stay away from ${listJoin(parts)} — nothing here uses them.`);
  }

  // Continuity — makes Captain Aura feel like an ongoing advisor.
  const lastWithFeedback = ctx.history.find((h) => h.feedback?.reasons?.length);
  if (lastWithFeedback?.feedback?.reasons?.length) {
    const r = lastWithFeedback.feedback.reasons[0];
    const map: Record<string, string> = {
      "too-formal": "gone noticeably more casual this time",
      "too-casual": "pushed this a step smarter",
      "too-tight": "kept everything straight or relaxed",
      "too-loose": "tightened the silhouette up",
      "too-boring": "given this more texture and character",
      "too-flashy": "stripped this back",
      "not-practical": "put practicality first",
      "wrong-colours": "rebuilt the palette around what you actually wear",
    };
    if (map[r]) {
      out.push(`Last time you said the outfit was ${r.replace("-", " ")}, so I've ${map[r]}.`);
    }
  } else if (ctx.history.length > 0) {
    out.push(
      `This carries over the ${view.preferredFit ?? profile.style.fit ?? "regular"} fit you've preferred in previous recommendations.`,
    );
  }

  if (matchNotes.length) {
    out.push(`From your closet: ${listJoin(matchNotes.slice(0, 3))}.`);
  }

  if (formality <= 2 && situation.goals.includes("not-overdressed")) {
    out.push("You said you don't want to overdress, so this sits one notch below the room rather than above it.");
  }

  return out.slice(0, 6);
}

function buildWeatherNote(ctx: AuraContext, cond: Conditions): string | undefined {
  const w = ctx.weather;
  if (!w) {
    return ctx.situation.describedWeather
      ? `I couldn't retrieve live weather, so I've gone with the conditions you described: ${ctx.situation.describedWeather}.`
      : "I don't have weather for this yet — add a location and I'll factor it in properly.";
  }

  const prefix =
    w.source === "mock"
      ? "Using simulated weather (no live provider configured): "
      : w.source === "user-described"
        ? "Based on the conditions you described: "
        : "";

  const parts = [
    `${Math.round(w.temperatureC)}°C`,
    w.feelsLikeC !== undefined && Math.abs(w.feelsLikeC - w.temperatureC) >= 2
      ? `feels like ${Math.round(w.feelsLikeC)}°C`
      : null,
    w.condition,
    w.precipitationProbability !== undefined ? `${w.precipitationProbability}% rain` : null,
    w.windKph !== undefined && w.windKph >= 20 ? `${Math.round(w.windKph)} km/h wind` : null,
  ].filter(Boolean);

  const advice = cond.rain
    ? " Take the shell — this isn't a day to gamble on staying dry."
    : cond.band === "cold"
      ? " Layer so you can shed one indoors without ending up in just a tee."
      : cond.band === "hot"
        ? " Keep fabrics breathable and light in colour."
        : "";

  return `${prefix}${parts.join(" · ")}.${advice}`;
}

function buildSocialNote(ctx: AuraContext, formality: number): string | undefined {
  const { social, activity, concerns } = ctx.situation;

  if (concerns.includes("outfit-transition")) {
    return "One outfit has to cover both halves of this. Pick the bottom and shoes for the later, smarter half, and change only the top layer.";
  }
  if (social === "strangers" || concerns.includes("first-impression")) {
    return "Some of these people are meeting you for the first time. Keep accessories minimal — you want to be remembered as put-together, not for a specific item.";
  }
  if (activity === "date") {
    return "Wear something you've worn before. Comfort in your clothes shows up as comfort in your face.";
  }
  if (activity === "interview" || formality >= 4) {
    return "Aim one small step above what you expect the room to be wearing. Above that starts to read as a misjudgement.";
  }
  if (social === "classmates" || social === "colleagues") {
    return "Match the group's register. Being the most dressed person in a casual group is more conspicuous than being the least.";
  }
  return undefined;
}

function buildNextMove(
  ctx: AuraContext,
  verdict: Recommendation["wardrobeVerdict"],
): string {
  if (verdict.status === "none") {
    return "Add a handful of things you actually wear to your closet — then I can tell you exactly which of your clothes to put on, not just the shape of the outfit.";
  }
  if (verdict.status === "complete") {
    return ctx.situation.dateLabel === "Today"
      ? "Nothing to buy. Lay it out now and you're done thinking about it."
      : `Nothing to buy. Set it aside the night before and ${ctx.situation.dateLabel.toLowerCase()} takes care of itself.`;
  }
  const first = verdict.missing[0];
  if (first) {
    const gap = first.label.toLowerCase();
    const shopping = ctx.profile.preferences.shopping;
    if (shopping === "own-only") {
      return `Nothing in your closet covers the ${gap}. Work around it — the rest of the outfit holds up without it.`;
    }
    return `Check whether you own anything that works as ${gap}. If not, that's the one gap worth filling.`;
  }
  return "You're set.";
}

function buildCaveats(ctx: AuraContext, cond: Conditions): string[] {
  const out: string[] = [];
  // Improvement advice isn't weather-dependent, so don't apologise for it.
  const weatherMatters = ctx.situation.activity !== "improvement";

  if (weatherMatters && !ctx.weather && !ctx.situation.describedWeather) {
    out.push("I don't have weather for this — the layering is a best guess.");
  } else if (ctx.weather?.source === "mock") {
    out.push("Weather here is simulated, not a live forecast.");
  }

  if (ctx.situation.unknowns.includes("dressCode")) {
    out.push("I don't know the exact dress code, so I've kept this adaptable — one layer up or down covers most rooms.");
  }
  if (ctx.wardrobe.length === 0) {
    out.push("I don't know what you own yet, so I've described pieces rather than picked them.");
  }
  if (ctx.situation.confidence < 0.55) {
    out.push("I'm working from limited detail here — tell me more and I'll get more specific.");
  }
  if (cond.unknown && ctx.situation.locationHint) {
    out.push(`I couldn't get conditions for ${ctx.situation.locationHint}.`);
  }

  return out;
}

function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n));
}

function capitalise(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/** "an 11% chance", "a 60% chance" — chosen by how the number is spoken. */
function article(n: number): string {
  const s = String(n);
  return s.startsWith("8") || s === "11" || s === "18" ? "an" : "a";
}

/** Colours that "loud" already implies — listing them again is redundant. */
const LOUD_IMPLIES = new Set(["red", "orange", "yellow", "pink", "purple"]);

/** Render disliked colours as readable prose, not raw tokens. */
export function describeDislikedColours(tokens: string[]): string {
  const pseudo = new Set(["loud", "warm-brights", "pastel"]);
  const loud = tokens.includes("loud") || tokens.includes("warm-brights");

  const named = tokens
    .filter((t) => !pseudo.has(t) && !(loud && LOUD_IMPLIES.has(t)))
    .map((t) => labelOf(COLOURS, t))
    .filter(Boolean);

  const phrases: string[] = [];
  if (loud) phrases.push("loud colours");
  if (tokens.includes("pastel")) phrases.push("pastels");
  if (named.length) phrases.push(listJoin(named.slice(0, 3)).toLowerCase());

  return listJoin(phrases);
}
