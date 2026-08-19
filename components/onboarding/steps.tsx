"use client";

import * as React from "react";
import { Plus, Shirt, Trash2 } from "lucide-react";
import { ItemForm } from "@/components/closet/item-form";
import { LocationPicker } from "@/components/location-picker";
import { Button } from "@/components/ui/button";
import { Field, Input, Textarea } from "@/components/ui/field";
import { EmptyState } from "@/components/ui/misc";
import { Sheet } from "@/components/ui/sheet";
import {
  AGE_RANGES,
  BUDGETS,
  BUILDS,
  CATEGORIES,
  COLOURS,
  COMMUNICATE,
  FACE_SHAPES,
  FACIAL_HAIR,
  FIT_PREFERENCES,
  GOALS,
  GROOMING_GOALS,
  GROOMING_TIME,
  HAIR_LENGTHS,
  HAIR_THICKNESS,
  HAIR_TYPES,
  labelOf,
  LIFESTYLES,
  SHOPPING_PREFS,
  STYLE_TAGS,
} from "@/lib/domain/enums";
import type {
  About,
  Appearance,
  GoalContext,
  Grooming,
  LocationContext,
  Preferences,
  StyleProfile,
  WardrobeItemInput,
} from "@/lib/domain/types";
import { ColourSelect, MultiSelect, Question, SingleSelect, StepShell } from "./pieces";

export type Draft = {
  about: About;
  appearance: Appearance;
  style: StyleProfile;
  grooming: Grooming;
  preferences: Preferences;
  location: LocationContext;
  goal: GoalContext;
  wardrobe: WardrobeItemInput[];
};

export const emptyDraft: Draft = {
  about: {},
  appearance: {},
  style: { styles: [], colours: [], communicate: [] },
  grooming: { goals: [] },
  preferences: {},
  location: { source: "none" },
  goal: { goals: [] },
  wardrobe: [],
};

type StepProps = {
  draft: Draft;
  set: <K extends keyof Draft>(key: K, value: Draft[K]) => void;
};

/* ------------------------------- 01 · ABOUT -------------------------------- */

export function StepAbout({ draft, set }: StepProps) {
  const { about } = draft;
  return (
    <StepShell
      title="Let's start with you."
      subtitle="A few taps. You can change any of it later."
    >
      <Question label="Age range">
        <SingleSelect
          options={AGE_RANGES}
          value={about.ageRange}
          onChange={(v) => set("about", { ...about, ageRange: v })}
        />
      </Question>

      <Question label="Height" optional>
        <div className="flex max-w-[11rem] items-center gap-3">
          <Input
            type="number"
            inputMode="numeric"
            min={120}
            max={230}
            placeholder="180"
            value={about.heightCm ?? ""}
            onChange={(e) =>
              set("about", {
                ...about,
                heightCm: e.target.value ? Number(e.target.value) : undefined,
              })
            }
            aria-label="Height in centimetres"
          />
          <span className="text-sm text-ink-faint">cm</span>
        </div>
      </Question>

      <Question label="General build">
        <SingleSelect
          options={BUILDS}
          value={about.build}
          onChange={(v) => set("about", { ...about, build: v })}
        />
      </Question>

      <Question label="Which sounds most like your life?">
        <SingleSelect
          options={LIFESTYLES}
          value={about.lifestyle}
          onChange={(v) => set("about", { ...about, lifestyle: v })}
        />
      </Question>

      <Question label="What should I call you?" optional>
        <Input
          className="max-w-xs"
          placeholder="Your first name"
          value={about.name ?? ""}
          onChange={(e) => set("about", { ...about, name: e.target.value })}
          autoComplete="given-name"
        />
      </Question>
    </StepShell>
  );
}

/* ----------------------------- 02 · APPEARANCE ----------------------------- */

export function StepAppearance({ draft, set }: StepProps) {
  const { appearance: a } = draft;
  return (
    <StepShell
      title="How you look."
      subtitle="Makes hair and grooming advice specific."
    >
      <Question label="Face shape" optional>
        <SingleSelect
          options={FACE_SHAPES}
          value={a.faceShape}
          onChange={(v) => set("appearance", { ...a, faceShape: v })}
        />
      </Question>

      <Question label="Hair type">
        <SingleSelect
          options={HAIR_TYPES}
          value={a.hairType}
          onChange={(v) => set("appearance", { ...a, hairType: v })}
        />
      </Question>

      <Question label="Thickness">
        <SingleSelect
          options={HAIR_THICKNESS}
          value={a.hairThickness}
          onChange={(v) => set("appearance", { ...a, hairThickness: v })}
        />
      </Question>

      <Question label="Length">
        <SingleSelect
          options={HAIR_LENGTHS}
          value={a.hairLength}
          onChange={(v) => set("appearance", { ...a, hairLength: v })}
        />
      </Question>

      <Question label="Current hairstyle" optional>
        <Input
          placeholder="e.g. Grown out on top, faded sides"
          value={a.currentHairstyle ?? ""}
          onChange={(e) => set("appearance", { ...a, currentHairstyle: e.target.value })}
        />
      </Question>

      <Question label="Facial hair">
        <SingleSelect
          options={FACIAL_HAIR}
          value={a.facialHair}
          onChange={(v) => set("appearance", { ...a, facialHair: v })}
        />
      </Question>
    </StepShell>
  );
}

/* -------------------------------- 03 · STYLE ------------------------------- */

export function StepStyle({ draft, set }: StepProps) {
  const { style: s } = draft;
  return (
    <StepShell
      title="What do you like?"
      subtitle="Pick as many as feel true."
    >
      <Question label="Your direction">
        <MultiSelect
          options={STYLE_TAGS}
          values={s.styles}
          onChange={(v) => set("style", { ...s, styles: v })}
        />
      </Question>

      <Question label="How clothes should fit">
        <SingleSelect
          options={FIT_PREFERENCES}
          value={s.fit}
          onChange={(v) => set("style", { ...s, fit: v })}
        />
      </Question>

      <Question label="Colours you wear">
        <ColourSelect
          options={COLOURS}
          values={s.colours}
          onChange={(v) => set("style", { ...s, colours: v })}
        />
      </Question>

      <Question label="You want to come across as">
        <MultiSelect
          options={COMMUNICATE}
          values={s.communicate}
          onChange={(v) => set("style", { ...s, communicate: v })}
        />
      </Question>
    </StepShell>
  );
}

/* ------------------------------ 04 · GROOMING ------------------------------ */

export function StepGrooming({ draft, set }: StepProps) {
  const { grooming: g } = draft;
  return (
    <StepShell
      title="How much do you fuss?"
      subtitle="Every answer here is a fine answer."
    >
      <Question label="Time on a normal day">
        <SingleSelect
          options={GROOMING_TIME}
          value={g.time}
          onChange={(v) => set("grooming", { ...g, time: v })}
        />
      </Question>

      <Question label="What to improve">
        <MultiSelect
          options={GROOMING_GOALS}
          values={g.goals}
          onChange={(v) => set("grooming", { ...g, goals: v })}
        />
      </Question>

      <p className="tinted px-5 py-4 text-sm text-ink-soft">
        Grooming suggestions only — not medical advice.
      </p>
    </StepShell>
  );
}

/* ------------------------------ 05 · WARDROBE ------------------------------ */

export function StepWardrobe({ draft, set }: StepProps) {
  const [open, setOpen] = React.useState(false);

  return (
    <StepShell
      title="What's in your closet?"
      subtitle="Optional — but it's how you get “wear your charcoal overshirt” instead of “wear a dark overshirt”."
    >
      {draft.wardrobe.length === 0 ? (
        <EmptyState
          icon={<Shirt className="size-6" />}
          title="Nothing added yet"
          body="Three or four things you wear most is enough to start."
          action={
            <Button onClick={() => setOpen(true)} size="md">
              <Plus className="size-4" />
              Add an item
            </Button>
          }
        />
      ) : (
        <div className="space-y-3">
          <ul className="space-y-2.5">
            {draft.wardrobe.map((item, i) => (
              <li
                key={`${item.name}-${i}`}
                className="flex items-center gap-3 rounded-2xl border border-line px-5 py-4"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm text-ink">{item.name}</p>
                  <p className="text-xs text-ink-faint">
                    {labelOf(CATEGORIES, item.category)}
                    {item.colour ? ` · ${labelOf(COLOURS, item.colour)}` : ""}
                  </p>
                </div>
                <button
                  type="button"
                  aria-label={`Remove ${item.name}`}
                  onClick={() =>
                    set(
                      "wardrobe",
                      draft.wardrobe.filter((_, j) => j !== i),
                    )
                  }
                  className="rounded-full p-2 text-ink-faint transition-colors hover:bg-surface hover:text-ember"
                >
                  <Trash2 className="size-4" />
                </button>
              </li>
            ))}
          </ul>
          <Button variant="secondary" size="md" onClick={() => setOpen(true)}>
            <Plus className="size-4" />
            Add another
          </Button>
        </div>
      )}

      <Sheet open={open} onClose={() => setOpen(false)} title="Add an item">
        <ItemForm
          onSubmit={(item) => {
            set("wardrobe", [...draft.wardrobe, item]);
            setOpen(false);
          }}
          onCancel={() => setOpen(false)}
        />
      </Sheet>
    </StepShell>
  );
}

/* ----------------------------- 06 · PREFERENCES ---------------------------- */

export function StepPreferences({ draft, set }: StepProps) {
  const { preferences: p } = draft;
  return (
    <StepShell
      title="How should I suggest things?"
      subtitle="This decides whether I reach for your closet or the shops."
    >
      <Question label="Budget">
        <SingleSelect
          options={BUDGETS}
          value={p.budget}
          onChange={(v) => set("preferences", { ...p, budget: v })}
        />
      </Question>

      <Question label="Buying new things">
        <SingleSelect
          options={SHOPPING_PREFS}
          value={p.shopping}
          onChange={(v) => set("preferences", { ...p, shopping: v })}
        />
      </Question>

      <Field label="Brands you like" hint="Optional.">
        <Input
          placeholder="e.g. Uniqlo, Arc'teryx"
          value={p.brands ?? ""}
          onChange={(e) => set("preferences", { ...p, brands: e.target.value })}
        />
      </Field>

      <Field label="Anything you hate wearing?" hint="Be blunt — I'll never suggest it.">
        <Textarea
          rows={3}
          placeholder="e.g. I hate skinny jeans and loud colours."
          value={p.dislikes ?? ""}
          onChange={(e) => set("preferences", { ...p, dislikes: e.target.value })}
        />
      </Field>
    </StepShell>
  );
}

/* ------------------------------ 07 · LOCATION ------------------------------ */

export function StepLocation({ draft, set }: StepProps) {
  return (
    <StepShell
      title="Where are you?"
      subtitle="So I can use the real forecast. It's usually what decides the outer layer."
    >
      <LocationPicker
        value={draft.location}
        onChange={(loc) => set("location", loc)}
      />

      <div className="tinted px-5 py-4">
        <p className="font-semibold">Asked once, never tracked</p>
        <p className="mt-1 text-sm text-pretty text-ink-soft">
          Coordinates are rounded and only used for the weather lookup. Skipping
          is fine.
        </p>
      </div>
    </StepShell>
  );
}

/* -------------------------------- 08 · GOAL -------------------------------- */

export function StepGoal({ draft, set }: StepProps) {
  const { goal: g } = draft;
  return (
    <StepShell
      title="What are you working on?"
      subtitle="I'll aim at this in every recommendation."
    >
      <Question label="What matters right now">
        <MultiSelect
          options={GOALS}
          values={g.goals}
          onChange={(v) => set("goal", { ...g, goals: v })}
        />
      </Question>

      <Field label="Anything else?" hint="Optional.">
        <Textarea
          rows={3}
          placeholder="e.g. I want to look put-together without looking like I tried hard."
          value={g.note ?? ""}
          onChange={(e) => set("goal", { ...g, note: e.target.value })}
        />
      </Field>
    </StepShell>
  );
}

/* --------------------------------- registry -------------------------------- */

export const STEPS = [
  { key: "about", label: "About you", Component: StepAbout },
  { key: "appearance", label: "Appearance", Component: StepAppearance },
  { key: "style", label: "Style", Component: StepStyle },
  { key: "grooming", label: "Grooming", Component: StepGrooming },
  { key: "wardrobe", label: "Wardrobe", Component: StepWardrobe },
  { key: "preferences", label: "Preferences", Component: StepPreferences },
  { key: "location", label: "Location", Component: StepLocation },
  { key: "goal", label: "Your goal", Component: StepGoal },
] as const;
