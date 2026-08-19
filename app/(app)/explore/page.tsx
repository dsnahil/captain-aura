"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { Card, Eyebrow } from "@/components/ui/card";
import { Chip, ChipGroup } from "@/components/ui/chip";
import { labelOf, HAIR_LENGTHS, STYLE_TAGS } from "@/lib/domain/enums";
import { useAura } from "@/lib/store/aura";

const TOPICS = ["Hair", "Style", "Grooming", "Fragrance", "Outfits", "Situations"] as const;
type Topic = (typeof TOPICS)[number];

/**
 * Curated starting points. Each one is a prompt, so "reading" turns straight
 * into a personalised answer rather than a generic article.
 */
const LIBRARY: Record<Topic, { title: string; body: string; prompt: string }[]> = {
  Hair: [
    {
      title: "A cut that suits your face and hair type",
      body: "What to ask a barber for, in words they'll understand.",
      prompt: "I need a new haircut. What should I ask my barber for?",
    },
    {
      title: "Growing it out without the awkward stage",
      body: "How to keep it looking intentional while the length catches up.",
      prompt: "I'm growing my hair out. How do I keep it looking deliberate?",
    },
  ],
  Style: [
    {
      title: "Look more mature without dressing formally",
      body: "Fit, finish and restraint do most of the work.",
      prompt: "I want to look more mature without dressing formally.",
    },
    {
      title: "Three ways to style what you already own",
      body: "Built from your closet, not a shop window.",
      prompt: "Give me three outfits from the clothes I already own.",
    },
    {
      title: "Build a personal style that holds together",
      body: "Pick a direction and stop buying against it.",
      prompt: "Help me build a personal style that actually holds together.",
    },
  ],
  Grooming: [
    {
      title: "A five-minute routine you'll actually keep",
      body: "The floor matters more than the ceiling.",
      prompt: "Give me a five-minute grooming routine I'll actually stick to.",
    },
    {
      title: "Getting the beard neckline right",
      body: "The single detail that separates tidy from overdue.",
      prompt: "How should I shape and maintain my facial hair?",
    },
  ],
  Fragrance: [
    {
      title: "One fragrance for everything",
      body: "How to pick something that works day and night.",
      prompt: "Help me pick a fragrance that works for most situations.",
    },
    {
      title: "How much is too much",
      body: "Where to spray, how many, and when to skip it.",
      prompt: "How should I actually wear fragrance day to day?",
    },
  ],
  Outfits: [
    {
      title: "The outfit that works for gym and dinner",
      body: "One set of clothes, two very different rooms.",
      prompt: "I'm going to the gym and then dinner. What works for both?",
    },
    {
      title: "Dressing for cold rain without looking bulky",
      body: "Layering that stays dry and keeps a clean line.",
      prompt: "It's cold and raining. What should I wear that still looks good?",
    },
  ],
  Situations: [
    {
      title: "First date",
      body: "Considered, not costumed.",
      prompt: "I have a first date this week. What should I wear?",
    },
    {
      title: "Job interview",
      body: "Read the industry, then aim one step above the room.",
      prompt: "I have a job interview this week. What should I wear?",
    },
    {
      title: "Wedding as a guest",
      body: "Respect the dress code, keep one thing personal.",
      prompt: "I'm going to a wedding as a guest. What should I wear?",
    },
    {
      title: "Carry-on only travel",
      body: "A capsule that repeats without looking like it does.",
      prompt: "I'm travelling for a week with carry-on only. What should I pack?",
    },
  ],
};

export default function ExplorePage() {
  const router = useRouter();
  const [topic, setTopic] = React.useState<Topic>("Style");
  const profile = useAura((s) => s.profile);
  const wardrobe = useAura((s) => s.wardrobe);

  const ask = (prompt: string) =>
    router.push(`/home?q=${encodeURIComponent(prompt)}`);

  // "For you" is derived from the actual profile, not a fixed list.
  const forYou = React.useMemo(() => {
    const out: { title: string; prompt: string }[] = [];
    const style = profile.style.styles[0];
    const length = profile.appearance.hairLength;

    if (wardrobe.length >= 5) {
      out.push({
        title: `Three ways to style your ${wardrobe.length} logged items`,
        prompt: "Give me three different outfits using only the clothes I own.",
      });
    }
    if (length) {
      out.push({
        title: `Haircuts that work with ${labelOf(HAIR_LENGTHS, length).toLowerCase()} hair`,
        prompt: `I have ${labelOf(HAIR_LENGTHS, length).toLowerCase()} hair. What cut would suit me?`,
      });
    }
    if (style) {
      out.push({
        title: `Push your ${labelOf(STYLE_TAGS, style).toLowerCase()} direction further`,
        prompt: `How do I develop my ${labelOf(STYLE_TAGS, style).toLowerCase()} style further?`,
      });
    }
    if (profile.goal.goals.includes("mature")) {
      out.push({
        title: "How to look more mature without dressing formally",
        prompt: "How do I look more mature without dressing formally?",
      });
    }
    return out.slice(0, 3);
  }, [profile, wardrobe.length]);

  return (
    <div className="space-y-10">
      <header>
        <Eyebrow>Explore</Eyebrow>
        <h1 className="title mt-3">Worth knowing.</h1>
        <p className="mt-4 max-w-lg text-[0.9375rem] leading-relaxed text-pretty text-ink-faint">
          Tap any of these and you get an answer built around your profile.
        </p>
      </header>

      {forYou.length > 0 && (
        <section>
          <Eyebrow className="mb-4">For you</Eyebrow>
          <div className="grid gap-3 sm:grid-cols-2">
            {forYou.map((item) => (
              <button
                key={item.title}
                onClick={() => ask(item.prompt)}
                className="group flex items-center gap-4 rounded-2xl border border-ember-line bg-ember-tint px-5 py-5 text-left transition-colors hover:border-ember/50"
              >
                <span className="flex-1 text-[0.9375rem] text-balance text-ember">
                  {item.title}
                </span>
                <ArrowRight className="size-4 shrink-0 text-ember transition-transform group-hover:translate-x-0.5" />
              </button>
            ))}
          </div>
        </section>
      )}

      <section>
        <ChipGroup className="-mx-5 overflow-x-auto px-5 pb-1 sm:mx-0 sm:flex-wrap sm:px-0">
          {TOPICS.map((t) => (
            <Chip key={t} selected={topic === t} onClick={() => setTopic(t)}>
              {t}
            </Chip>
          ))}
        </ChipGroup>

        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          {LIBRARY[topic].map((item) => (
            <Card key={item.title} className="group p-0">
              <button
                onClick={() => ask(item.prompt)}
                className="flex h-full w-full flex-col items-start gap-2 p-5 text-left"
              >
                <h2 className="text-[0.9375rem] font-medium text-balance text-ink">
                  {item.title}
                </h2>
                <p className="text-sm leading-relaxed text-pretty text-ink-faint">
                  {item.body}
                </p>
                <span className="mt-3 inline-flex items-center gap-1.5 text-xs text-ember">
                  Ask Captain Aura
                  <ArrowRight className="size-3 transition-transform group-hover:translate-x-0.5" />
                </span>
              </button>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}
