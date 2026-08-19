import type { Metadata } from "next";
import {
  ArrowRight,
  CloudRain,
  MapPin,
  ShieldCheck,
  Shirt,
  Sparkles,
  Thermometer,
} from "lucide-react";
import { DemoButton } from "@/components/demo-button";
import { ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Wordmark } from "@/components/ui/logo";
import { Pill } from "@/components/ui/misc";

export const metadata: Metadata = {
  title: "Captain Aura — Know How to Show Up",
  description:
    "Personalized style recommendations built around you, your situation and the weather.",
  alternates: { canonical: "/" },
};

const STEPS = [
  { icon: Sparkles, title: "Build your Aura", body: "Your build, style and goals." },
  { icon: Shirt, title: "Add your closet", body: "So it picks what you own." },
  { icon: CloudRain, title: "Ask anything", body: "It checks the real forecast." },
];

const SITUATIONS = [
  "First date",
  "Interview",
  "Hiking",
  "Wedding",
  "Tokyo, 10 days",
  "Gym then dinner",
];

export default function LandingPage() {
  return (
    <div className="min-h-dvh">
      {/* ---------------------------------------------------------------- nav */}
      <header className="mx-auto flex max-w-5xl items-center justify-between px-6 py-6">
        <Wordmark />
        <ButtonLink href="/onboarding" size="sm">
          Get started
        </ButtonLink>
      </header>

      {/* --------------------------------------------------------------- hero */}
      <section className="mx-auto max-w-5xl px-6 pt-12 pb-20 sm:pt-20 sm:pb-28">
        <h1
          className="max-w-3xl text-[3rem] leading-[1.02] font-extrabold tracking-[-0.04em] text-balance sm:text-7xl rise"
          style={{ "--i": 0 } as React.CSSProperties}
        >
          Know how to
          <br />
          <span className="text-ember">show up.</span>
        </h1>

        <p
          className="mt-7 max-w-md text-lg text-pretty text-ink-soft rise"
          style={{ "--i": 1 } as React.CSSProperties}
        >
          Tell Captain Aura what you&rsquo;re doing. Get an outfit built around
          you, your closet and the weather.
        </p>

        <div
          className="mt-10 flex flex-col gap-3 sm:flex-row rise"
          style={{ "--i": 2 } as React.CSSProperties}
        >
          <ButtonLink href="/onboarding" size="lg">
            Build your Aura
            <ArrowRight className="size-4.5" strokeWidth={2} />
          </ButtonLink>
          <DemoButton />
        </div>

        <p
          className="mt-6 inline-flex items-center gap-2 text-sm text-ink-faint fade"
          style={{ "--i": 4 } as React.CSSProperties}
        >
          <ShieldCheck className="size-4" strokeWidth={1.75} />
          Free. No credit card.
        </p>
      </section>

      {/* ------------------------------------------------------------ example */}
      <section className="mx-auto max-w-5xl px-6 pb-24">
        <div className="grid gap-5 lg:grid-cols-2 lg:gap-8">
          {/* the ask */}
          <div className="flex flex-col justify-center">
            <div className="tinted p-7">
              <p className="text-lg leading-relaxed text-pretty">
                &ldquo;Hiking tomorrow with people from my course. Cold and
                rainy. I&rsquo;m skinny.&rdquo;
              </p>
            </div>

            <div className="mt-5 flex flex-wrap gap-2">
              <Pill>
                <MapPin className="size-4 text-ember" strokeWidth={1.75} />
                Boston
              </Pill>
              <Pill>
                <Thermometer className="size-4 text-ember" strokeWidth={1.75} />
                11°C
              </Pill>
              <Pill>
                <CloudRain className="size-4 text-ember" strokeWidth={1.75} />
                60% rain
              </Pill>
              <Pill>
                <Shirt className="size-4 text-ember" strokeWidth={1.75} />
                14 items
              </Pill>
            </div>
          </div>

          {/* the answer */}
          <Card className="overflow-hidden">
            <div className="border-b border-line px-7 py-6">
              <p className="text-sm font-semibold text-ember">Your hike Aura</p>
              <p className="mt-1.5 text-2xl font-bold tracking-[-0.03em]">
                Prepared. Relaxed. Natural.
              </p>
            </div>

            <ul className="divide-y divide-line">
              {[
                ["Base", "Cream technical tee"],
                ["Layer", "Light fleece"],
                ["Outer", "Black waterproof shell"],
                ["Bottom", "Olive hiking pants"],
                ["Shoes", "Trail shoes"],
              ].map(([slot, item]) => (
                <li key={slot} className="flex items-center gap-5 px-7 py-4">
                  <span className="w-14 shrink-0 text-sm font-medium text-ink-faint">
                    {slot}
                  </span>
                  <span className="font-medium">{item}</span>
                </li>
              ))}
            </ul>

            <div className="bg-ember-tint px-7 py-5">
              <p className="font-semibold text-ember-deep">
                You already own all of this.
              </p>
            </div>
          </Card>
        </div>
      </section>

      {/* ----------------------------------------------------------- how */}
      <section className="mx-auto max-w-5xl px-6 pb-24">
        <div className="grid gap-10 sm:grid-cols-3">
          {STEPS.map(({ icon: Icon, title, body }) => (
            <div key={title}>
              <div className="flex size-12 items-center justify-center rounded-2xl bg-surface text-ember">
                <Icon className="size-6" strokeWidth={1.6} />
              </div>
              <h3 className="mt-5 text-lg font-bold">{title}</h3>
              <p className="mt-1.5 text-ink-soft">{body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ------------------------------------------------------ situations */}
      <section className="mx-auto max-w-5xl px-6 pb-24">
        <h2 className="text-2xl font-bold tracking-[-0.03em]">
          Ask it anything real.
        </h2>
        <div className="mt-6 flex flex-wrap gap-3">
          {SITUATIONS.map((s) => (
            <span
              key={s}
              className="rounded-full border border-line-strong px-5 py-3 font-medium"
            >
              {s}
            </span>
          ))}
        </div>
      </section>

      {/* --------------------------------------------------------- close */}
      <section className="mx-auto max-w-5xl px-6 pb-24">
        <div className="tinted px-8 py-16 text-center sm:py-20">
          <h2 className="text-[2.25rem] leading-tight font-extrabold tracking-[-0.035em] text-balance">
            Stop guessing what to wear.
          </h2>
          <div className="mt-9 flex flex-col justify-center gap-3 sm:flex-row">
            <ButtonLink href="/onboarding" size="lg">
              Build your Aura
              <ArrowRight className="size-4.5" strokeWidth={2} />
            </ButtonLink>
            <DemoButton />
          </div>
        </div>
      </section>

      {/* -------------------------------------------------------- footer */}
      <footer className="border-t border-line">
        <div className="mx-auto flex max-w-5xl flex-col gap-4 px-6 py-10 sm:flex-row sm:items-center sm:justify-between">
          <Wordmark />
          <p className="text-sm text-ink-faint">
            Style advice is subjective. Not medical or health advice.
          </p>
        </div>
      </footer>
    </div>
  );
}
