import { GOALS, labelOf } from "@/lib/domain/enums";
import type { AuraProfile, AuraRequest, MemoryEntry, WardrobeItem } from "@/lib/domain/types";

export type NextMove = { headline: string; body: string; href: string; cta: string };

/**
 * One personalised improvement suggestion for the home screen. Ordered by how
 * much the answer would actually improve future recommendations.
 */
export function nextMoveFor(
  profile: AuraProfile,
  wardrobe: WardrobeItem[],
  requests: AuraRequest[],
  memory: MemoryEntry[],
): NextMove {
  if (wardrobe.length === 0) {
    return {
      headline: "Add what you own",
      body: "Right now I can only describe the shape of an outfit. With even five items I can tell you which of your clothes to actually put on.",
      href: "/closet",
      cta: "Open your closet",
    };
  }

  if (wardrobe.length < 8) {
    return {
      headline: "Fill in the gaps",
      body: `You've logged ${wardrobe.length} item${wardrobe.length === 1 ? "" : "s"}. A few more — especially outerwear and shoes — and I can build a complete outfit for almost any situation.`,
      href: "/closet",
      cta: "Add more items",
    };
  }

  const missingFormality = wardrobe.filter((w) => !w.formality).length;
  if (missingFormality > wardrobe.length / 2) {
    return {
      headline: "Tell me how formal things are",
      body: "Most of your items don't have a formality set. It's the single field that decides whether something shows up for an interview or a hike.",
      href: "/closet",
      cta: "Review your closet",
    };
  }

  if (profile.location.source === "none") {
    return {
      headline: "Set your location",
      body: "Without it I can't use the real forecast, and weather is usually what decides the outer layer.",
      href: "/profile",
      cta: "Add a location",
    };
  }

  const withoutFeedback = requests.filter((r) => !r.feedback).length;
  if (requests.length > 0 && withoutFeedback === requests.length) {
    return {
      headline: "Tell me what worked",
      body: "You haven't rated a recommendation yet. One tap on any of them and I start adjusting to what you actually wear.",
      href: "/history",
      cta: "Open your history",
    };
  }

  const goal = profile.goal.goals[0];
  if (goal) {
    return {
      headline: labelOf(GOALS, goal),
      body: "Ask me how to work towards this and I'll give you a prioritised plan rather than a single outfit.",
      href: "/home",
      cta: "Ask about it",
    };
  }

  if (memory.length < 4) {
    return {
      headline: "Teach me your taste",
      body: "The more you tell me you dislike, the sharper the recommendations get. Everything I learn is visible and editable.",
      href: "/aura",
      cta: "See what I know",
    };
  }

  return {
    headline: "Ask me something real",
    body: "The advice gets better the closer it is to an actual situation. Give me the date, the people, and the place.",
    href: "/home",
    cta: "Ask Captain Aura",
  };
}
