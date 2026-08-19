import { COLOURS, FIT_PREFERENCES, GOALS, labelOf } from "@/lib/domain/enums";
import type {
  AuraProfile,
  AuraRequest,
  Feedback,
  MemoryEntry,
} from "@/lib/domain/types";
import { id } from "@/lib/utils";

/* ============================================================================
   UserPreferenceMemory

   Only durable preference signal is retained — never raw prompts, never
   everything the user typed. Every entry is visible and deletable in /memory.
   ========================================================================== */

function entry(
  e: Omit<MemoryEntry, "id" | "createdAt">,
  createdAt = new Date().toISOString(),
): MemoryEntry {
  return { ...e, id: id("mem"), createdAt };
}

/* --------------------------- free-text dislikes ---------------------------- */

const DISLIKE_PATTERNS: {
  re: RegExp;
  subject: string;
  value: string;
  label: string;
}[] = [
  { re: /\bskinny\b/i, subject: "fit", value: "skinny", label: "Doesn't wear skinny fits" },
  { re: /\bslim fit|tight\b/i, subject: "fit", value: "slim", label: "Avoids tight, slim-cut clothing" },
  { re: /\bbaggy|oversized\b/i, subject: "fit", value: "oversized", label: "Avoids oversized fits" },
  { re: /\bloud|bright|neon|flashy|garish\b/i, subject: "colour", value: "loud", label: "Avoids loud, high-saturation colours" },
  { re: /\bpastel\b/i, subject: "colour", value: "pastel", label: "Avoids pastels" },
  { re: /\blogo|branded|big brands\b/i, subject: "detail", value: "logos", label: "Avoids visible logos and branding" },
  { re: /\bfloral|pattern(s|ed)?|print(s|ed)?\b/i, subject: "detail", value: "patterns", label: "Prefers plain over patterned" },
  { re: /\bsuits?\b/i, subject: "formality", value: "suits", label: "Doesn't like wearing suits" },
  { re: /\bshorts\b/i, subject: "category", value: "shorts", label: "Doesn't wear shorts" },
  { re: /\bsandals|flip[- ]?flops\b/i, subject: "category", value: "sandals", label: "Doesn't wear sandals" },
  { re: /\bheels?|boots\b/i, subject: "category", value: "boots", label: "Avoids boots" },
  { re: /\bpink|purple|yellow|orange|red\b/i, subject: "colour", value: "warm-brights", label: "Avoids warm bright colours" },
];

/** Pull structured signal out of a free-text dislikes field. */
export function parseDislikes(text?: string): MemoryEntry[] {
  if (!text?.trim()) return [];
  const found = DISLIKE_PATTERNS.filter((p) => p.re.test(text));
  const entries = found.map((p) =>
    entry({
      kind: "dislike",
      subject: p.subject,
      value: p.value,
      label: p.label,
      source: "onboarding",
      confidence: 0.85,
    }),
  );
  // Keep the user's own words too, so nothing is silently dropped.
  if (!entries.length) {
    entries.push(
      entry({
        kind: "dislike",
        subject: "note",
        value: text.trim().slice(0, 120),
        label: text.trim().slice(0, 120),
        source: "onboarding",
        confidence: 0.6,
      }),
    );
  }
  return entries;
}

/* --------------------------- profile → memory ------------------------------ */

export function memoryFromProfile(profile: AuraProfile): MemoryEntry[] {
  const out: MemoryEntry[] = [];

  if (profile.style.fit && profile.style.fit !== "depends") {
    out.push(
      entry({
        kind: "like",
        subject: "fit",
        value: profile.style.fit,
        label: `Prefers a ${labelOf(FIT_PREFERENCES, profile.style.fit).toLowerCase()} fit`,
        source: "onboarding",
        confidence: 0.8,
      }),
    );
  }

  for (const c of profile.style.colours.slice(0, 6)) {
    out.push(
      entry({
        kind: "like",
        subject: "colour",
        value: c,
        label: `Wears ${labelOf(COLOURS, c).toLowerCase()}`,
        source: "onboarding",
        confidence: 0.7,
      }),
    );
  }

  for (const g of profile.goal.goals) {
    out.push(
      entry({
        kind: "goal",
        subject: "goal",
        value: g,
        label: labelOf(GOALS, g),
        source: "onboarding",
        confidence: 0.8,
      }),
    );
  }

  out.push(...parseDislikes(profile.preferences.dislikes));

  return out;
}

/* --------------------------- feedback → memory ----------------------------- */

const FEEDBACK_TO_MEMORY: Record<
  string,
  { subject: string; value: string; label: string }
> = {
  "too-formal": { subject: "formality", value: "lower", label: "Wants recommendations pitched more casual" },
  "too-casual": { subject: "formality", value: "higher", label: "Wants recommendations pitched more formal" },
  "too-tight": { subject: "fit", value: "slim", label: "Found slim fits too tight" },
  "too-loose": { subject: "fit", value: "oversized", label: "Found loose fits too baggy" },
  "too-boring": { subject: "character", value: "more-interest", label: "Wants outfits with more character" },
  "too-flashy": { subject: "character", value: "more-understated", label: "Wants outfits more understated" },
  "not-practical": { subject: "priority", value: "practicality", label: "Prioritises practicality" },
  "wrong-colours": { subject: "colour", value: "recheck", label: "Colour choices missed the mark" },
};

export function memoryFromFeedback(
  feedback: Feedback,
  request: AuraRequest,
): MemoryEntry[] {
  const out: MemoryEntry[] = [];

  for (const r of feedback.reasons) {
    const m = FEEDBACK_TO_MEMORY[r];
    if (m) {
      out.push(
        entry({
          kind: "dislike",
          subject: m.subject,
          value: m.value,
          label: m.label,
          source: "feedback",
          confidence: 0.75,
        }),
      );
    }
  }

  if (feedback.note?.trim()) {
    out.push(
      entry({
        kind: "dislike",
        subject: "note",
        value: feedback.note.trim().slice(0, 160),
        label: feedback.note.trim().slice(0, 160),
        source: "feedback",
        confidence: 0.6,
      }),
    );
  }

  // A liked outfit teaches us about the pieces that were in it.
  if (feedback.helpful || feedback.tried) {
    const owned = request.recommendation.outfit.filter((p) => p.ownedItemName);
    for (const p of owned.slice(0, 3)) {
      out.push(
        entry({
          kind: "like",
          subject: "item",
          value: p.ownedItemId ?? p.ownedItemName!,
          label: `Wore and liked: ${p.ownedItemName}`,
          source: "feedback",
          confidence: 0.7,
        }),
      );
    }
    out.push(
      entry({
        kind: "like",
        subject: "occasion",
        value: request.situation.activity,
        label: `${request.recommendation.title} worked well`,
        source: "feedback",
        confidence: 0.65,
      }),
    );
  }

  return out;
}

/* ----------------------------- merge + query ------------------------------- */

/**
 * Merge new entries into existing memory. A repeated signal reinforces the
 * existing entry instead of creating a duplicate.
 */
export function mergeMemory(
  existing: MemoryEntry[],
  incoming: MemoryEntry[],
): MemoryEntry[] {
  const out = [...existing];
  for (const n of incoming) {
    const i = out.findIndex(
      (e) => e.kind === n.kind && e.subject === n.subject && e.value === n.value,
    );
    if (i >= 0) {
      out[i] = {
        ...out[i],
        confidence: Math.min(1, out[i].confidence + 0.1),
        createdAt: n.createdAt,
      };
    } else {
      out.push(n);
    }
  }
  return out;
}

export type MemoryView = {
  dislikedFits: string[];
  dislikedColours: string[];
  dislikedDetails: string[];
  likedColours: string[];
  preferredFit?: string;
  goals: string[];
  /** −1 = go more casual, +1 = go more formal. */
  formalityBias: number;
  /** −1 = more understated, +1 = more character. */
  characterBias: number;
  practicalityBias: number;
  likedItemIds: string[];
};

/** Collapse memory into the levers the engine actually pulls. */
export function readMemory(memory: MemoryEntry[]): MemoryView {
  const view: MemoryView = {
    dislikedFits: [],
    dislikedColours: [],
    dislikedDetails: [],
    likedColours: [],
    goals: [],
    formalityBias: 0,
    characterBias: 0,
    practicalityBias: 0,
    likedItemIds: [],
  };

  for (const m of memory) {
    const w = m.confidence;
    if (m.kind === "dislike") {
      if (m.subject === "fit") view.dislikedFits.push(m.value);
      if (m.subject === "colour" && m.value !== "recheck") view.dislikedColours.push(m.value);
      if (m.subject === "detail" || m.subject === "category") view.dislikedDetails.push(m.value);
      if (m.subject === "formality") view.formalityBias += m.value === "lower" ? -w : w;
      if (m.subject === "character") view.characterBias += m.value === "more-interest" ? w : -w;
      if (m.subject === "priority" && m.value === "practicality") view.practicalityBias += w;
    }
    if (m.kind === "like") {
      if (m.subject === "colour") view.likedColours.push(m.value);
      if (m.subject === "fit") view.preferredFit = m.value;
      if (m.subject === "item") view.likedItemIds.push(m.value);
    }
    if (m.kind === "goal") view.goals.push(m.value);
  }

  // "loud" isn't a colour token — expand it to the ones it rules out.
  if (view.dislikedColours.includes("loud") || view.dislikedColours.includes("warm-brights")) {
    view.dislikedColours.push("red", "orange", "yellow", "pink", "purple");
  }

  view.dislikedFits = unique(view.dislikedFits);
  view.dislikedColours = unique(view.dislikedColours);
  view.likedColours = unique(view.likedColours);
  view.goals = unique(view.goals);
  return view;
}

function unique(a: string[]): string[] {
  return Array.from(new Set(a));
}
