"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, Clock, MapPin, RotateCcw, Shirt, Sparkles } from "lucide-react";
import { AccountCard } from "@/components/auth/account-card";
import { LocationPicker } from "@/components/location-picker";
import { Button } from "@/components/ui/button";
import { Card, Eyebrow, SectionHeader } from "@/components/ui/card";
import { Sheet } from "@/components/ui/sheet";
import { track } from "@/lib/analytics";
import {
  AGE_RANGES,
  BUDGETS,
  BUILDS,
  COLOURS,
  COMMUNICATE,
  FACIAL_HAIR,
  FIT_PREFERENCES,
  GOALS,
  GROOMING_GOALS,
  HAIR_LENGTHS,
  HAIR_TYPES,
  labelOf,
  labelsOf,
  LIFESTYLES,
  SHOPPING_PREFS,
  STYLE_TAGS,
} from "@/lib/domain/enums";
import { useAura } from "@/lib/store/aura";
import { shortDate } from "@/lib/utils";

export default function ProfilePage() {
  const router = useRouter();
  const profile = useAura((s) => s.profile);
  const wardrobe = useAura((s) => s.wardrobe);
  const requests = useAura((s) => s.requests);
  const memory = useAura((s) => s.memory);
  const updateProfile = useAura((s) => s.updateProfile);
  const resetAll = useAura((s) => s.resetAll);

  const [editingLocation, setEditingLocation] = React.useState(false);
  const [confirmReset, setConfirmReset] = React.useState(false);

  const name = profile.about.name;

  return (
    <div className="space-y-10">
      <header>
        <Eyebrow>Your Aura profile</Eyebrow>
        <h1 className="title mt-3">
          {name ? name : "Who you are"}
        </h1>
      </header>

      {/* ------------------------------- stats ------------------------------ */}
      <div className="grid grid-cols-3 gap-3">
        <Stat icon={<Shirt className="size-3.5" />} value={wardrobe.length} label="Items" href="/closet" />
        <Stat icon={<Clock className="size-3.5" />} value={requests.length} label="Requests" href="/history" />
        <Stat icon={<Sparkles className="size-3.5" />} value={memory.length} label="Learned" href="/aura" />
      </div>

      {/* ----------------------------- account ----------------------------- */}
      <AccountCard />

      {/* ------------------------------- who ------------------------------- */}
      <section>
        <SectionHeader label="Who you are" />
        <Card className="mt-4 divide-y divide-line">
          <Row label="Age" value={labelOf(AGE_RANGES, profile.about.ageRange)} />
          <Row label="Build" value={labelOf(BUILDS, profile.about.build)} />
          <Row
            label="Height"
            value={profile.about.heightCm ? `${profile.about.heightCm} cm` : ""}
          />
          <Row label="Lifestyle" value={labelOf(LIFESTYLES, profile.about.lifestyle)} />
          <Row
            label="Hair"
            value={[
              labelOf(HAIR_LENGTHS, profile.appearance.hairLength),
              labelOf(HAIR_TYPES, profile.appearance.hairType),
            ]
              .filter(Boolean)
              .join(" / ")}
          />
          <Row label="Beard" value={labelOf(FACIAL_HAIR, profile.appearance.facialHair)} />
        </Card>
      </section>

      {/* ------------------------------ likes ------------------------------ */}
      <section>
        <SectionHeader label="What you like" />
        <Card className="mt-4 divide-y divide-line">
          <Row label="Style" value={labelsOf(STYLE_TAGS, profile.style.styles).join(" / ")} />
          <Row label="Fit" value={labelOf(FIT_PREFERENCES, profile.style.fit)} />
          <Row label="Colours" value={labelsOf(COLOURS, profile.style.colours).join(", ")} />
          <Row
            label="Reads as"
            value={labelsOf(COMMUNICATE, profile.style.communicate).join(", ")}
          />
          <Row label="Brands" value={profile.preferences.brands} />
          <Row label="Budget" value={labelOf(BUDGETS, profile.preferences.budget)} />
          <Row label="Shopping" value={labelOf(SHOPPING_PREFS, profile.preferences.shopping)} />
        </Card>
      </section>

      {/* ----------------------------- dislikes ---------------------------- */}
      <section>
        <SectionHeader label="What you don't like" />
        <Card className="mt-4 divide-y divide-line">
          <Row label="In your words" value={profile.preferences.dislikes} />
        </Card>
        <Link
          href="/aura"
          className="tap mt-3 inline-flex items-center gap-1.5 text-sm text-ember hover:text-ember-deep"
        >
          See everything I&rsquo;ve learned
          <ArrowRight className="size-3.5" />
        </Link>
      </section>

      {/* ------------------------------ goals ------------------------------ */}
      <section>
        <SectionHeader label="Your goals" />
        <Card className="mt-4 divide-y divide-line">
          <Row label="Working on" value={labelsOf(GOALS, profile.goal.goals).join(", ")} />
          <Row label="Grooming" value={labelsOf(GROOMING_GOALS, profile.grooming.goals).join(", ")} />
          <Row label="In your words" value={profile.goal.note} />
        </Card>
      </section>

      {/* ----------------------------- location ---------------------------- */}
      <section>
        <SectionHeader
          label="Location"
          action={
            <button
              onClick={() => setEditingLocation(true)}
              className="tap text-xs text-ink-faint underline underline-offset-4 hover:text-ink"
            >
              Change
            </button>
          }
        />
        <Card className="mt-4 p-5">
          <div className="flex items-center gap-3">
            <MapPin className="size-4 shrink-0 text-ember" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm text-ink">
                {profile.location.label ?? "Not set"}
              </p>
              <p className="text-xs text-ink-faint">
                {profile.location.source === "none"
                  ? "Without this I can't use the real forecast."
                  : "Used only to look up weather when you ask a question."}
              </p>
            </div>
          </div>
        </Card>
      </section>

      {/* ----------------------------- history ----------------------------- */}
      {requests.length > 0 && (
        <section>
          <SectionHeader
            label="Aura history"
            action={
              <Link
                href="/history"
                className="tap text-xs text-ink-faint underline underline-offset-4 hover:text-ink"
              >
                See all
              </Link>
            }
          />
          <ul className="mt-4 space-y-2">
            {requests.slice(0, 4).map((r) => (
              <li key={r.id}>
                <Link
                  href={`/aura/${r.id}`}
                  className="flex items-center gap-4 rounded-xl border border-line px-4 py-3 transition-colors hover:border-line-strong"
                >
                  <span className="w-14 shrink-0 text-sm font-semibold text-ink-faint">
                    {shortDate(r.createdAt)}
                  </span>
                  <span className="min-w-0 flex-1 truncate text-sm text-ink-soft">
                    {r.recommendation.title}
                  </span>
                  <ArrowRight className="size-3.5 shrink-0 text-ink-faint" />
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* ------------------------------ danger ----------------------------- */}
      <section className="border-t border-line pt-8">
        <Button variant="danger" size="md" onClick={() => setConfirmReset(true)}>
          <RotateCcw className="size-4" />
          Reset everything
        </Button>
        <p className="mt-3 text-xs text-ink-faint">
          Deletes your profile, closet, memory and history from this device. It
          can&rsquo;t be undone.
        </p>
      </section>

      {/* ------------------------------ sheets ----------------------------- */}
      <Sheet
        open={editingLocation}
        onClose={() => setEditingLocation(false)}
        title="Your location"
      >
        <LocationPicker
          value={profile.location}
          onChange={(loc) => {
            updateProfile({ location: loc });
            track("profile_updated", { field: "location" });
          }}
        />
        <Button className="mt-6 w-full" onClick={() => setEditingLocation(false)}>
          Done
        </Button>
      </Sheet>

      <Sheet
        open={confirmReset}
        onClose={() => setConfirmReset(false)}
        title="Reset everything?"
      >
        <p className="text-[0.9375rem] leading-relaxed text-ink-soft">
          This removes your Aura profile, your {wardrobe.length} closet item
          {wardrobe.length === 1 ? "" : "s"}, everything I&rsquo;ve learned, and
          all {requests.length} past recommendation
          {requests.length === 1 ? "" : "s"}. There&rsquo;s no undo.
        </p>
        <div className="mt-6 flex gap-3">
          <Button
            variant="danger"
            className="flex-1"
            onClick={() => {
              resetAll();
              router.push("/");
            }}
          >
            Yes, reset
          </Button>
          <Button variant="ghost" onClick={() => setConfirmReset(false)}>
            Cancel
          </Button>
        </div>
      </Sheet>
    </div>
  );
}

function Stat({
  icon,
  value,
  label,
  href,
}: {
  icon: React.ReactNode;
  value: number;
  label: string;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="rounded-2xl border border-line px-5 py-5 transition-colors hover:border-line-strong hover:bg-surface"
    >
      <span className="text-ink-faint">{icon}</span>
      <p className="mt-2 text-3xl font-bold tracking-[-0.03em]">{value}</p>
      <p className="mt-0.5 text-sm font-medium text-ink-faint">
        {label}
      </p>
    </Link>
  );
}

function Row({ label, value }: { label: string; value?: string }) {
  return (
    <div className="flex items-baseline gap-4 px-5 py-3.5">
      <span className="w-28 shrink-0 text-[0.9375rem] font-medium text-ink-soft">
        {label}
      </span>
      <span className="flex-1 text-sm text-pretty text-ink">
        {value && value.length ? value : <span className="text-ink-faint">Not set</span>}
      </span>
    </div>
  );
}
