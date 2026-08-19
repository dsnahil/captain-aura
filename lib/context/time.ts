import * as chrono from "chrono-node";
import { relativeDay, startOfDay } from "@/lib/utils";

export type TimeOfDay = "morning" | "afternoon" | "evening" | "night" | "unknown";

export type ResolvedTime = {
  /** ISO timestamp of the situation. */
  date: string;
  /** "Tomorrow", "Friday", "Aug 24" … */
  dateLabel: string;
  timeOfDay: TimeOfDay;
  /** True when the user actually stated a date; false when we defaulted to now. */
  explicit: boolean;
  /** Multi-day trips: "7 days", "a week". */
  durationDays?: number;
};

const TIME_WORDS: [RegExp, TimeOfDay][] = [
  [/\b(tonight|this evening|dinner|drinks|night out)\b/i, "evening"],
  [/\b(late night|after midnight)\b/i, "night"],
  [/\b(morning|breakfast|brunch|sunrise|early)\b/i, "morning"],
  [/\b(afternoon|lunch|midday)\b/i, "afternoon"],
  [/\b(evening)\b/i, "evening"],
];

function timeOfDayFromHour(h: number): TimeOfDay {
  if (h < 5) return "night";
  if (h < 12) return "morning";
  if (h < 17) return "afternoon";
  if (h < 22) return "evening";
  return "night";
}

/** "for 10 days", "a week", "2 weeks", "5-day trip" */
function parseDuration(text: string): number | undefined {
  const t = text.toLowerCase();
  const days = t.match(/(\d+)[-\s]?(?:day|days|nights?)\b/);
  if (days) return Math.min(parseInt(days[1], 10), 60);
  const weeks = t.match(/(\d+)[-\s]?(?:week|weeks)\b/);
  if (weeks) return Math.min(parseInt(weeks[1], 10) * 7, 60);
  if (/\ba week\b/.test(t)) return 7;
  if (/\ba weekend\b|\bthe weekend\b/.test(t)) return 2;
  if (/\ba fortnight\b|\btwo weeks\b/.test(t)) return 14;
  if (/\ba month\b/.test(t)) return 30;
  return undefined;
}

/**
 * Resolve when a situation happens, relative to the real current time.
 * Never hardcodes a date — `now` is always supplied by the caller.
 */
export function resolveTime(text: string, now = new Date()): ResolvedTime {
  // forwardDate makes bare weekdays ("Friday") resolve to the *upcoming* one.
  // "for 10 days" is a trip length, not a date 10 days from now.
  // ("in 10 days" is a real date and is deliberately left alone.)
  const results = chrono
    .parse(text, now, { forwardDate: true })
    .filter((r) => !/^for\s+/i.test(r.text.trim()));
  const first = results[0];

  let date = new Date(now);
  let explicit = false;
  let hourKnown = false;

  if (first) {
    date = first.start.date();
    explicit = true;
    hourKnown = first.start.isCertain("hour");
  }

  // Word-level cues beat chrono's implied midday for part-of-day.
  let timeOfDay: TimeOfDay = "unknown";
  for (const [re, tod] of TIME_WORDS) {
    if (re.test(text)) {
      timeOfDay = tod;
      break;
    }
  }

  if (timeOfDay === "unknown") {
    if (hourKnown) {
      timeOfDay = timeOfDayFromHour(date.getHours());
    } else if (!explicit) {
      // "What should I wear?" with no date -> right now.
      timeOfDay = timeOfDayFromHour(now.getHours());
    }
  } else if (!hourKnown) {
    // Align the timestamp with the stated part of day.
    const map: Record<Exclude<TimeOfDay, "unknown">, number> = {
      morning: 9,
      afternoon: 14,
      evening: 19,
      night: 22,
    };
    const h = map[timeOfDay as Exclude<TimeOfDay, "unknown">];
    if (h !== undefined) date.setHours(h, 0, 0, 0);
  }

  // "tonight" said after that hour still means today, not yesterday.
  if (date.getTime() < now.getTime() - 60_000 && !explicit) date = new Date(now);

  const label = explicit
    ? relativeDay(date.toISOString(), now)
    : startOfDay(date).getTime() === startOfDay(now).getTime()
      ? "Today"
      : relativeDay(date.toISOString(), now);

  return {
    date: date.toISOString(),
    dateLabel: label,
    timeOfDay,
    explicit,
    durationDays: parseDuration(text),
  };
}

export function seasonOf(date: Date, latitude?: number): string {
  const m = date.getMonth();
  const north = latitude === undefined || latitude >= 0;
  const seasons = ["winter", "spring", "summer", "autumn"];
  const idx = Math.floor(((m + 1) % 12) / 3);
  return north ? seasons[idx] : seasons[(idx + 2) % 4];
}
