"use client";

import * as React from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  ArrowRight,
  ChevronRight,
  Heart,
  PartyPopper,
  Plane,
  Scissors,
  Sparkles,
  Sun,
} from "lucide-react";
import { AskBox } from "@/components/home/ask-box";
import { SectionHeader } from "@/components/ui/card";
import { nextMoveFor } from "@/lib/engine/next-move";
import { useAura } from "@/lib/store/aura";
import { relativeDay, shortDate } from "@/lib/utils";

const QUICK_START = [
  { label: "A date", prompt: "I'm going on a date tonight.", icon: Heart },
  { label: "Today's fit", prompt: "What should I wear today?", icon: Sun },
  { label: "An event", prompt: "I have an event this weekend.", icon: PartyPopper },
  { label: "Travelling", prompt: "I'm travelling next week.", icon: Plane },
  { label: "A haircut", prompt: "I need a new haircut. What suits me?", icon: Scissors },
  { label: "My style", prompt: "I want to build a better personal style.", icon: Sparkles },
];

function greeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Morning";
  if (h < 17) return "Afternoon";
  return "Evening";
}

export default function HomePage() {
  return (
    <React.Suspense fallback={<div className="min-h-[50dvh]" />}>
      <HomeContent />
    </React.Suspense>
  );
}

function HomeContent() {
  const params = useSearchParams();
  const initial = params.get("q") ?? "";

  const profile = useAura((s) => s.profile);
  const wardrobe = useAura((s) => s.wardrobe);
  const requests = useAura((s) => s.requests);
  const memory = useAura((s) => s.memory);

  const [prefill, setPrefill] = React.useState(initial);
  const nextMove = React.useMemo(
    () => nextMoveFor(profile, wardrobe, requests, memory),
    [profile, wardrobe, requests, memory],
  );

  const name = profile.about.name;
  const recent = requests.slice(0, 3);

  return (
    <div className="space-y-14">
      {/* --------------------------------------------------------------- ask */}
      <section>
        <p className="text-[0.9375rem] font-semibold text-ink-soft">
          {greeting()}
          {name ? `, ${name}` : ""}
        </p>
        <h1 className="title mt-3 text-balance">What are you doing?</h1>

        <div className="mt-8">
          {/* key forces a remount when a quick-start prefills the box */}
          <AskBox key={prefill} initialPrompt={prefill} />
        </div>
      </section>

      {/* ------------------------------------------------------- quick start */}
      <section>
        <SectionHeader label="Quick start" />
        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
          {QUICK_START.map(({ label, prompt, icon: Icon }) => (
            <button
              key={label}
              onClick={() => {
                setPrefill(prompt);
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
              className="card-lift flex min-h-[6.5rem] flex-col items-start justify-between p-5 text-left"
            >
              <Icon className="size-6 text-ember" strokeWidth={1.6} />
              <span className="font-semibold">{label}</span>
            </button>
          ))}
        </div>
      </section>

      {/* ------------------------------------------------------- recent aura */}
      {recent.length > 0 && (
        <section>
          <SectionHeader
            label="Recent"
            action={
              <Link
                href="/history"
                className="tap text-[0.9375rem] font-semibold text-ink-soft hover:text-ink"
              >
                See all
              </Link>
            }
          />
          <ul className="mt-5 space-y-3">
            {recent.map((r) => (
              <li key={r.id}>
                <Link
                  href={`/aura/${r.id}`}
                  className="card-lift flex items-center gap-4 px-5 py-4"
                >
                  <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-surface text-sm font-bold">
                    {shortDate(r.createdAt).split(" ")[1]}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-semibold">
                      {r.recommendation.title}
                    </span>
                    <span className="mt-0.5 block truncate text-sm text-ink-soft">
                      {r.situation.activityLabel} ·{" "}
                      {relativeDay(r.situation.date, new Date(r.createdAt))}
                    </span>
                  </span>
                  <ChevronRight
                    className="size-5 shrink-0 text-ink-faint"
                    strokeWidth={1.75}
                  />
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* ---------------------------------------------------------- next move */}
      <section>
        <SectionHeader label="Next move" />
        <div className="tinted mt-5 p-6">
          <h3 className="text-lg font-bold">{nextMove.headline}</h3>
          <p className="mt-2 text-pretty text-ink-soft">{nextMove.body}</p>
          <Link
            href={nextMove.href}
            className="tap mt-5 inline-flex items-center gap-1.5 font-semibold text-ember"
          >
            {nextMove.cta}
            <ArrowRight className="size-4" strokeWidth={2} />
          </Link>
        </div>
      </section>
    </div>
  );
}
