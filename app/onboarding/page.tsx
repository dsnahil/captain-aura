"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { emptyDraft, STEPS, type Draft } from "@/components/onboarding/steps";
import { Button } from "@/components/ui/button";
import { AuraMark, Wordmark } from "@/components/ui/logo";
import { ProgressBar, StepCounter } from "@/components/ui/misc";
import { track } from "@/lib/analytics";
import { useAura } from "@/lib/store/aura";

const BUILD_LINES = [
  "Reading your build and proportions",
  "Mapping your style direction",
  "Noting what you'd rather not wear",
  "Indexing your closet",
  "Setting your palette",
];

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = React.useState(0);
  const [draft, setDraft] = React.useState<Draft>(emptyDraft);
  const [building, setBuilding] = React.useState(false);
  const headingRef = React.useRef<HTMLDivElement>(null);

  const updateProfile = useAura((s) => s.updateProfile);
  const completeOnboarding = useAura((s) => s.completeOnboarding);
  const addWardrobeItem = useAura((s) => s.addWardrobeItem);

  React.useEffect(() => {
    track("aura_started");
  }, []);

  const set = React.useCallback(
    <K extends keyof Draft>(key: K, value: Draft[K]) =>
      setDraft((d) => ({ ...d, [key]: value })),
    [],
  );

  const total = STEPS.length;
  const Current = STEPS[step].Component;
  const isLast = step === total - 1;

  const goNext = () => {
    if (!isLast) {
      track("aura_step_completed", { step: STEPS[step].key });
      setStep((s) => s + 1);
      // Move focus to the new heading so keyboard and SR users follow along.
      requestAnimationFrame(() => headingRef.current?.focus());
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    finish();
  };

  const finish = () => {
    updateProfile({
      about: draft.about,
      appearance: draft.appearance,
      style: draft.style,
      grooming: draft.grooming,
      preferences: draft.preferences,
      location: draft.location,
      goal: draft.goal,
    });
    for (const item of draft.wardrobe) addWardrobeItem(item);
    completeOnboarding();
    setBuilding(true);
  };

  /* ---------------------------- building screen --------------------------- */

  if (building) return <BuildingAura onDone={() => router.replace("/home")} />;

  return (
    <div className="flex min-h-dvh flex-col">
      {/* progress header */}
      <header className="sticky top-0 z-30 bg-canvas/95 backdrop-blur-xl">
        <div className="mx-auto flex max-w-xl items-center justify-between gap-4 px-5 py-5 sm:px-6">
          <Link href="/" aria-label="Captain Aura home">
            <Wordmark compact className="sm:hidden" />
            <Wordmark className="hidden sm:inline-flex" />
          </Link>
          <StepCounter step={step + 1} total={total} />
        </div>
        <ProgressBar value={(step + 1) / total} />
      </header>

      <main className="mx-auto w-full max-w-xl flex-1 px-5 py-10 sm:px-6 sm:py-14">
        <div ref={headingRef} tabIndex={-1} className="outline-none">
          <p className="text-sm font-semibold text-ember mb-8">{STEPS[step].label}</p>
          {/* key remounts the step so entrance animations replay */}
          <Current key={STEPS[step].key} draft={draft} set={set} />
        </div>
      </main>

      {/* sticky action bar — always reachable with one thumb */}
      <footer className="sticky bottom-0 border-t border-line bg-canvas/95 backdrop-blur-xl">
        <div className="mx-auto flex max-w-xl items-center gap-3 px-5 py-4 pb-[calc(1rem+env(safe-area-inset-bottom))] sm:px-6">
          {step > 0 && (
            <Button
              variant="ghost"
              size="md"
              onClick={() => {
                setStep((s) => s - 1);
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
              aria-label="Previous step"
            >
              <ArrowLeft className="size-4" />
              Back
            </Button>
          )}
          <Button size="md" onClick={goNext} className="ml-auto min-w-36">
            {isLast ? "Build my Aura" : "Continue"}
            {!isLast && <ArrowRight className="size-4" />}
          </Button>
        </div>
      </footer>
    </div>
  );
}

/* ============================================================================
   BUILDING YOUR AURA
   ========================================================================== */

/** True when the user has asked the OS to minimise animation. */
function prefersReducedMotion(): boolean {
  return (
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

function BuildingAura({ onDone }: { onDone: () => void }) {
  const [line, setLine] = React.useState(0);
  // Reduced motion skips straight to the finished state — derived up front
  // rather than set from inside an effect.
  const [ready, setReady] = React.useState(prefersReducedMotion);

  React.useEffect(() => {
    if (prefersReducedMotion()) {
      const t = setTimeout(onDone, 700);
      return () => clearTimeout(t);
    }

    const interval = setInterval(
      () => setLine((l) => Math.min(l + 1, BUILD_LINES.length - 1)),
      420,
    );
    const done = setTimeout(() => {
      clearInterval(interval);
      setReady(true);
    }, 2100);
    const leave = setTimeout(onDone, 3300);

    return () => {
      clearInterval(interval);
      clearTimeout(done);
      clearTimeout(leave);
    };
  }, [onDone]);

  return (
    <div
      className="flex min-h-dvh flex-col items-center justify-center px-6 text-center"
      role="status"
      aria-live="polite"
    >
      <div className="relative">
        <div
          aria-hidden
          className="absolute -inset-16 rounded-full bg-ember/15 blur-[70px] breathe"
        />
        <AuraMark className="relative size-12 text-ember" />
      </div>

      {!ready ? (
        <>
          <p className="text-sm font-semibold text-ember mt-10">Building your Aura</p>
          <p className="mt-5 h-6 text-[0.9375rem] text-ink-soft fade" key={line}>
            {BUILD_LINES[line]}
          </p>
          <div className="relative mt-8 h-px w-44 overflow-hidden bg-line shimmer" />
        </>
      ) : (
        <>
          <h1 className="title mt-10 rise">
            Your Aura is ready.
          </h1>
          <p
            className="mt-4 max-w-xs text-sm text-pretty text-ink-faint rise"
            style={{ "--i": 1 } as React.CSSProperties}
          >
            Tell me what you&rsquo;re doing and I&rsquo;ll tell you how to show
            up.
          </p>
        </>
      )}
    </div>
  );
}
