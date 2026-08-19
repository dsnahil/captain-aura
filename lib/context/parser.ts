import type {
  ActivityKind,
  FollowUp,
  Situation,
  SocialKind,
} from "@/lib/domain/types";
import { resolveTime } from "./time";

/* ============================================================================
   ACTIVITY DETECTION
   Ordered by specificity — the first match wins, so "gym then dinner" resolves
   to the transition case rather than plain "gym".
   ========================================================================== */

type ActivityRule = {
  kind: ActivityKind;
  label: string;
  re: RegExp;
  /** Baseline formality 1–5. */
  formality: number;
  indoors?: boolean;
  outdoorExposure?: boolean;
};

const ACTIVITY_RULES: ActivityRule[] = [
  {
    kind: "wedding",
    label: "Wedding",
    re: /\bwedding|reception|nikah|shaadi|marriage ceremony\b/i,
    formality: 4,
    indoors: true,
  },
  {
    kind: "interview",
    label: "Job interview",
    re: /\binterview(s|ing)?\b/i,
    formality: 4,
    indoors: true,
  },
  {
    kind: "presentation",
    label: "Presentation",
    re: /\bpresent(ation|ing)?\b|\bdefen[cs]e\b|\bpitch\b|\bdemo day\b|\bviva\b/i,
    formality: 3.5,
    indoors: true,
  },
  {
    kind: "date",
    label: "Date",
    re: /\b(first date|second date|date night|a date|on a date|dinner date)\b|\bdate (tonight|tomorrow|with)\b/i,
    formality: 3,
  },
  {
    kind: "hiking",
    label: "Hiking",
    re: /\bhik(e|ing)|trek(king)?|trail\b|\bsummit\b/i,
    formality: 1,
    outdoorExposure: true,
  },
  {
    kind: "beach",
    label: "Beach",
    re: /\bbeach|seaside|pool party|swimming\b/i,
    formality: 1,
    outdoorExposure: true,
  },
  {
    kind: "gym",
    label: "Gym",
    re: /\bgym|workout|lifting|training session|run(ning)? (club|session)\b/i,
    formality: 1,
    indoors: true,
  },
  {
    kind: "travel",
    label: "Travel",
    re: /\btravel(l)?ing|trip to|flying to|going to (japan|tokyo|europe|india|paris|london|new york|nyc|korea|italy|spain|thailand)\b|\bcarry[- ]on\b|\bvacation|holiday\b/i,
    formality: 2,
  },
  {
    kind: "networking",
    label: "Networking event",
    re: /\bnetworking|career fair|meetup|conference|summit\b/i,
    formality: 3.5,
    indoors: true,
  },
  {
    kind: "formal-event",
    label: "Formal event",
    re: /\bgala|black tie|banquet|award(s)? (night|ceremony)|formal event|graduation\b/i,
    formality: 5,
    indoors: true,
  },
  {
    kind: "night-out",
    label: "Night out",
    re: /\bnight out|clubbing|bar hopping|going out (tonight|with)|drinks with\b/i,
    formality: 3,
  },
  {
    kind: "party",
    label: "Party",
    re: /\bparty|birthday|house warming|celebration\b/i,
    formality: 3,
  },
  {
    kind: "dinner",
    label: "Dinner",
    re: /\bdinner|restaurant|lunch with|brunch\b/i,
    formality: 3,
    indoors: true,
  },
  {
    kind: "university",
    label: "University",
    re: /\b(uni|university|campus|class(es)?|lecture|seminar|college)\b/i,
    formality: 2,
  },
  {
    kind: "work",
    label: "Work",
    re: /\b(work|office|standup|client meeting|meeting with|the team)\b/i,
    formality: 3,
    indoors: true,
  },
  {
    kind: "family",
    label: "Family occasion",
    re: /\b(family|parents|in[- ]laws|relatives|thanksgiving|eid|diwali|christmas)\b/i,
    formality: 3,
  },
  {
    kind: "outdoor",
    label: "Outdoors",
    re: /\b(camping|picnic|park|festival|outdoor|walk|cycling|fishing|ski(ing)?|golf)\b/i,
    formality: 1.5,
    outdoorExposure: true,
  },
  {
    kind: "casual-outing",
    label: "Casual outing",
    re: /\b(coffee|cafe|hang(ing)? out|shopping|museum|movie|cinema)\b/i,
    formality: 2,
  },
  {
    kind: "improvement",
    label: "Style improvement",
    re: /\b(look more|improve my|build a|dress better|my style|haircut|hairstyle|grooming routine|stop overthinking|upgrade my)\b/i,
    formality: 2.5,
  },
  {
    kind: "everyday",
    label: "Everyday",
    re: /\b(what should i wear today|today|everyday|day to day|casual day)\b/i,
    formality: 2,
  },
];

/* ============================================================================
   SOCIAL CONTEXT
   ========================================================================== */

const SOCIAL_RULES: { kind: SocialKind; label: string; re: RegExp }[] = [
  {
    kind: "romantic",
    label: "Romantic",
    re: /\bdate|girlfriend|boyfriend|partner|someone i like|tinder|hinge|bumble\b/i,
  },
  {
    kind: "classmates",
    label: "University peers",
    re: /\b(classmates|university (colleagues|friends|people)|uni (mates|friends)|coursemates|cohort|classmate)\b/i,
  },
  {
    kind: "colleagues",
    label: "Colleagues",
    re: /\b(colleagues|coworkers|co[- ]workers|my team|workmates)\b/i,
  },
  {
    kind: "professional",
    label: "Professional audience",
    re: /\b(recruiter|hiring manager|interviewer|client|investors|professor|panel|faculty)\b/i,
  },
  {
    kind: "strangers",
    label: "People I don't know well",
    re: /\b(don'?t know (them|some of them|anyone)|first time meeting|never met|new people|strangers|meeting some of them)\b/i,
  },
  {
    kind: "friends",
    label: "Friends",
    re: /\b(friends|mates|the boys|my group)\b/i,
  },
  {
    kind: "family",
    label: "Family",
    re: /\b(family|parents|in[- ]laws|relatives|cousins)\b/i,
  },
];

/* ============================================================================
   GOALS + CONCERNS
   ========================================================================== */

const GOAL_RULES: { re: RegExp; goal: string }[] = [
  { re: /\bnot (look like i'?m )?trying too hard|effortless|natural\b/i, goal: "effortless" },
  { re: /\blook good|stylish|sharp|put[- ]together|fashionable\b/i, goal: "stylish" },
  { re: /\bmature|older|grown[- ]up|serious\b/i, goal: "mature" },
  { re: /\battractive|impress|good impression|handsome|hot\b/i, goal: "attractive" },
  { re: /\bconfident|confidence\b/i, goal: "confident" },
  { re: /\bprofessional|competent|credible|taken seriously\b/i, goal: "professional" },
  { re: /\bapproachable|friendly|warm\b/i, goal: "approachable" },
  { re: /\bcomfortable|comfy|practical|functional|prepared|ready\b/i, goal: "practical" },
  { re: /\bnot overdress|don'?t want to overdress|not too formal\b/i, goal: "not-overdressed" },
  { re: /\bblend in|fit in|not stand out\b/i, goal: "understated" },
  { re: /\bstand out|memorable|noticed\b/i, goal: "distinctive" },
  { re: /\bwarm|not (be )?cold|stay dry\b/i, goal: "practical" },
];

const CONCERN_RULES: { re: RegExp; concern: string }[] = [
  { re: /\b(i'?m |i am |being )?(skinny|slim|thin|lanky|scrawny)\b/i, concern: "slim-build" },
  { re: /\b(i'?m |i am )?(short|not tall)\b/i, concern: "shorter-height" },
  { re: /\b(i'?m |i am )?(tall)\b/i, concern: "taller-height" },
  { re: /\b(broad|wide) shoulders|\bbig build|\bheavy set|\bbulky\b/i, concern: "broad-build" },
  { re: /\b(muscular|buff|jacked)\b/i, concern: "muscular-build" },
  { re: /\bdon'?t know (what|anyone)|no idea what\b/i, concern: "uncertain" },
  { re: /\bfirst time|never (been|met)\b/i, concern: "first-impression" },
  { re: /\bbudget|cheap|can'?t afford|no money|broke\b/i, concern: "budget" },
  { re: /\bcarry[- ]on|one bag|light packing|limited luggage\b/i, concern: "packing-light" },
  { re: /\bthen dinner|after (the )?gym|straight after|transition\b/i, concern: "outfit-transition" },
];

/* ============================================================================
   WEATHER + LOCATION MENTIONED BY THE USER
   ========================================================================== */

const WEATHER_WORDS =
  /\b(rain(y|ing)?|wet|drizzle|storm|snow(y|ing)?|cold|freezing|chilly|cool|hot|warm|humid|windy|wind|sunny|clear|overcast|cloudy|muggy)\b/gi;

const TEMP_RE = /(-?\d{1,2})\s*(?:°|deg(?:rees)?\s*)?\s*(c|celsius|f|fahrenheit)\b/i;

/** Words that look like place names but aren't. */
const NOT_PLACES = new Set([
  "i", "im", "monday", "tuesday", "wednesday", "thursday", "friday",
  "saturday", "sunday", "january", "february", "march", "april", "may",
  "june", "july", "august", "september", "october", "november", "december",
  "captain", "aura", "tomorrow", "today", "tonight",
]);

function extractLocationHint(text: string): string | undefined {
  const re =
    /\b(?:in|to|at|around|near|visiting)\s+([A-Z][a-zA-Z]+(?:[\s-][A-Z][a-zA-Z]+){0,2})/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text))) {
    const candidate = m[1].trim();
    if (!NOT_PLACES.has(candidate.toLowerCase().split(/\s+/)[0])) {
      return candidate;
    }
  }
  return undefined;
}

function extractDescribedWeather(text: string): string | undefined {
  const words = text.match(WEATHER_WORDS);
  const temp = text.match(TEMP_RE);
  const parts: string[] = [];
  if (temp) {
    const unit = temp[2].toLowerCase().startsWith("f") ? "F" : "C";
    parts.push(`${temp[1]}°${unit}`);
  }
  if (words) {
    parts.push(...Array.from(new Set(words.map((w) => w.toLowerCase()))));
  }
  return parts.length ? parts.join(", ") : undefined;
}

/** Convert an explicitly stated temperature into Celsius. */
export function extractStatedTemperature(text: string): number | undefined {
  const m = text.match(TEMP_RE);
  if (!m) return undefined;
  const value = parseInt(m[1], 10);
  return m[2].toLowerCase().startsWith("f")
    ? Math.round(((value - 32) * 5) / 9)
    : value;
}

/* ============================================================================
   FORMALITY MODIFIERS
   ========================================================================== */

function formalityAdjustment(text: string): number {
  let d = 0;
  if (/\bblack tie|formal|suit required|dress code is formal\b/i.test(text)) d += 1.5;
  if (/\bsmart casual|business casual\b/i.test(text)) d += 0.5;
  if (/\bcasual|chill|relaxed|laid[- ]back|informal\b/i.test(text)) d -= 0.8;
  if (/\bnot too formal|don'?t want to overdress|not overdressed\b/i.test(text)) d -= 0.7;
  if (/\bfancy|upscale|nice restaurant|michelin|rooftop\b/i.test(text)) d += 0.8;
  if (/\bstartup|tech company|software|engineering\b/i.test(text)) d -= 0.5;
  if (/\bbank|consulting|law firm|finance\b/i.test(text)) d += 0.7;
  return d;
}

/* ============================================================================
   MAIN PARSER
   ========================================================================== */

export function parseSituation(input: string, now = new Date()): Situation {
  const text = input.trim();
  const time = resolveTime(text, now);

  // --- activity ---
  const matches = ACTIVITY_RULES.filter((r) => r.re.test(text));
  const isTransition =
    /\b(then|after|and then|before)\b/i.test(text) && matches.length > 1;

  // "gym and then dinner" needs one outfit that survives both, so anchor on
  // the more demanding event rather than whichever matched first.
  const rule = isTransition
    ? matches.reduce((a, b) => (b.formality > a.formality ? b : a))
    : matches[0];

  const activity: ActivityKind = rule?.kind ?? "unknown";
  const activityLabel = rule?.label ?? "General advice";

  // --- social ---
  const socialMatches = SOCIAL_RULES.filter((r) => r.re.test(text));
  // "romantic" only counts when the activity supports it.
  const social = socialMatches.find(
    (s) => s.kind !== "romantic" || activity === "date",
  );
  const socialKind: SocialKind = social?.kind ?? "unknown";

  // --- formality ---
  let formality = rule?.formality ?? 2.5;
  formality += formalityAdjustment(text);
  if (time.timeOfDay === "evening" || time.timeOfDay === "night") formality += 0.3;
  formality = Math.max(1, Math.min(5, Math.round(formality * 2) / 2));

  // --- goals + concerns ---
  const goals = Array.from(
    new Set(GOAL_RULES.filter((g) => g.re.test(text)).map((g) => g.goal)),
  );
  const concerns = Array.from(
    new Set(CONCERN_RULES.filter((c) => c.re.test(text)).map((c) => c.concern)),
  );
  if (isTransition && !concerns.includes("outfit-transition")) {
    concerns.push("outfit-transition");
  }

  const describedWeather = extractDescribedWeather(text);
  const locationHint = extractLocationHint(text);
  const durationDays = time.durationDays;

  // --- what we don't know ---
  const unknowns: string[] = [];
  const needsOutdoorContext =
    rule?.outdoorExposure || activity === "travel" || activity === "outdoor";
  if (!locationHint && needsOutdoorContext) unknowns.push("location");
  if (
    (activity === "wedding" || activity === "formal-event") &&
    !/\bdress code|black tie|formal|cocktail|casual\b/i.test(text)
  ) {
    unknowns.push("dressCode");
  }
  if (activity === "travel" && !durationDays) unknowns.push("duration");
  if (!time.explicit && activity !== "improvement" && activity !== "everyday") {
    unknowns.push("timeOfDay");
  }
  if (activity === "unknown") unknowns.push("setting");

  // --- confidence ---
  let confidence = 0.3;
  if (rule) confidence += 0.35;
  if (social) confidence += 0.12;
  if (time.explicit) confidence += 0.1;
  if (describedWeather) confidence += 0.06;
  if (goals.length) confidence += 0.07;
  confidence = Math.min(1, Number(confidence.toFixed(2)));

  return {
    activity,
    activityLabel,
    social: socialKind,
    socialLabel: social?.label,
    date: time.date,
    dateLabel: time.dateLabel,
    timeOfDay: time.timeOfDay,
    formality,
    goals,
    concerns,
    describedWeather,
    locationHint,
    durationDays,
    indoors: rule?.indoors,
    unknowns,
    confidence,
  };
}

/* ============================================================================
   FOLLOW-UP — exactly one question, only when it genuinely changes the answer.
   ========================================================================== */

export function pickFollowUp(
  situation: Situation,
  hasLocation: boolean,
): FollowUp | null {
  const { unknowns, activity } = situation;

  if (unknowns.includes("dressCode")) {
    return {
      key: "dressCode",
      question: "Do you know the dress code?",
      options: ["Black tie", "Formal", "Cocktail", "Smart casual", "Not sure"],
    };
  }

  if (unknowns.includes("location") && !hasLocation) {
    return {
      key: "location",
      question:
        activity === "hiking" ? "Where's the hike?" : "Where is this happening?",
    };
  }

  if (activity === "travel" && unknowns.includes("duration")) {
    return {
      key: "duration",
      question: "How long are you going for?",
      options: ["A weekend", "About a week", "Two weeks", "Longer"],
    };
  }

  if (activity === "unknown") {
    return {
      key: "setting",
      question: "What's the occasion?",
      options: ["Work", "Social", "Date", "Outdoors", "Everyday"],
    };
  }

  // Everything material is known — don't ask for the sake of asking.
  return null;
}

/** Merge a follow-up answer back into the situation. */
export function applyFollowUp(
  situation: Situation,
  key: string,
  value: string,
  now = new Date(),
): Situation {
  const next = { ...situation, unknowns: situation.unknowns.filter((u) => u !== key) };

  switch (key) {
    case "location":
      next.locationHint = value;
      break;
    case "dressCode": {
      const map: Record<string, number> = {
        "black tie": 5,
        formal: 4.5,
        cocktail: 4,
        "smart casual": 3,
      };
      const f = map[value.toLowerCase()];
      if (f) next.formality = f;
      break;
    }
    case "duration": {
      const t = resolveTime(value, now);
      const map: Record<string, number> = {
        "a weekend": 2,
        "about a week": 7,
        "two weeks": 14,
      };
      next.durationDays = map[value.toLowerCase()] ?? t.durationDays ?? next.durationDays;
      break;
    }
    case "setting": {
      const reparsed = parseSituation(value, now);
      next.activity = reparsed.activity;
      next.activityLabel = reparsed.activityLabel;
      next.formality = reparsed.formality;
      break;
    }
  }

  next.confidence = Math.min(1, next.confidence + 0.15);
  return next;
}
