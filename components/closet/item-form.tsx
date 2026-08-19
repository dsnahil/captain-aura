"use client";

import * as React from "react";
import Image from "next/image";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Camera, ImagePlus, Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Chip, ChipGroup } from "@/components/ui/chip";
import { Field, Input } from "@/components/ui/field";
import {
  CATEGORIES,
  COLOURS,
  FIT_PREFERENCES,
  FORMALITY,
  MATERIALS,
  SEASONS,
  STYLE_TAGS,
  WEATHER_SUITABILITY,
} from "@/lib/domain/enums";
import {
  WardrobeItemInputSchema,
  type WardrobeItemFormValues,
  type WardrobeItemInput,
} from "@/lib/domain/types";
import { downscaleImage, estimateDominantColour } from "@/lib/image";
import { ColourSelect, MultiSelect, Question, SingleSelect } from "@/components/onboarding/pieces";

type Props = {
  defaultValues?: Partial<WardrobeItemFormValues>;
  onSubmit: (item: WardrobeItemInput) => void;
  onCancel?: () => void;
  submitLabel?: string;
  /** Hides the advanced attributes behind a toggle for fast entry. */
  compact?: boolean;
};

const EMPTY: WardrobeItemFormValues = {
  name: "",
  category: "tshirts",
  styles: [],
  weather: [],
};

export function ItemForm({
  defaultValues,
  onSubmit,
  onCancel,
  submitLabel = "Add item",
  compact = true,
}: Props) {
  const [analysing, setAnalysing] = React.useState(false);
  const [visionNote, setVisionNote] = React.useState<string | null>(null);
  const [showAdvanced, setShowAdvanced] = React.useState(!compact);

  const {
    register,
    handleSubmit,
    setValue,
    control,
    formState: { errors, isSubmitting },
    // Zod defaults mean the form's input type is looser than its output type.
  } = useForm<WardrobeItemFormValues, unknown, WardrobeItemInput>({
    resolver: zodResolver(WardrobeItemInputSchema),
    defaultValues: { ...EMPTY, ...defaultValues },
  });

  // useWatch (rather than watch()) keeps this component compiler-optimisable.
  const values = useWatch({ control });

  /* ------------------------------ photo flow ------------------------------ */

  const onFile = async (file?: File) => {
    if (!file) return;
    setAnalysing(true);
    setVisionNote(null);
    try {
      const dataUrl = await downscaleImage(file);
      setValue("image", dataUrl, { shouldDirty: true });

      // Real, on-device colour estimate — always presented for confirmation.
      const colour = await estimateDominantColour(dataUrl);
      if (colour) setValue("colour", colour, { shouldDirty: true });

      // Optional server-side recognition; a mock unless a vision key is set.
      const res = await fetch("/api/vision", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: dataUrl }),
      });
      const { analysis } = await res.json();
      if (analysis?.category) setValue("category", analysis.category, { shouldDirty: true });
      if (analysis?.suggestedName && !values.name) {
        setValue("name", analysis.suggestedName, { shouldDirty: true });
      }
      if (analysis?.formality) setValue("formality", analysis.formality, { shouldDirty: true });
      setVisionNote(
        analysis?.note ??
          "Detected from the photo — change anything that looks wrong.",
      );
      setShowAdvanced(true);
    } catch {
      setVisionNote("I couldn't read that image. Fill the details in yourself.");
    } finally {
      setAnalysing(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="space-y-7"
      noValidate
    >
      {/* ------------------------------- photo ------------------------------ */}
      <div className="flex items-start gap-4">
        <div className="relative size-24 shrink-0 overflow-hidden rounded-xl border border-line bg-surface">
          {values.image ? (
            <>
              <Image
                src={values.image}
                alt=""
                fill
                sizes="96px"
                className="object-cover"
                unoptimized
              />
              <button
                type="button"
                aria-label="Remove photo"
                onClick={() => setValue("image", undefined, { shouldDirty: true })}
                className="absolute top-1 right-1 rounded-full bg-ink/60 p-1.5 text-ink-soft transition-colors hover:text-ink"
              >
                <X className="size-3" />
              </button>
            </>
          ) : (
            <div className="flex size-full items-center justify-center text-ink-faint">
              {analysing ? (
                <Loader2 className="size-5 animate-spin" />
              ) : (
                <ImagePlus className="size-5" />
              )}
            </div>
          )}
        </div>

        <div className="min-w-0 flex-1 space-y-2.5">
          <div className="flex flex-wrap gap-2">
            <label className="inline-flex min-h-9 cursor-pointer items-center gap-2 rounded-full border border-line-strong px-4 text-[0.8125rem] text-ink transition-colors hover:border-ember hover:text-ember">
              <ImagePlus className="size-3.5" />
              Upload
              <input
                type="file"
                accept="image/*"
                className="sr-only"
                onChange={(e) => onFile(e.target.files?.[0])}
              />
            </label>
            <label className="inline-flex min-h-9 cursor-pointer items-center gap-2 rounded-full border border-line-strong px-4 text-[0.8125rem] text-ink transition-colors hover:border-ember hover:text-ember sm:hidden">
              <Camera className="size-3.5" />
              Take photo
              <input
                type="file"
                accept="image/*"
                capture="environment"
                className="sr-only"
                onChange={(e) => onFile(e.target.files?.[0])}
              />
            </label>
          </div>
          <p className="text-xs leading-relaxed text-ink-faint">
            {visionNote ?? "A photo is optional — the details below are what the recommendations actually use."}
          </p>
        </div>
      </div>

      {/* ------------------------------ essentials -------------------------- */}
      <Field label="Name" error={errors.name?.message}>
        <Input
          {...register("name")}
          placeholder="e.g. Olive relaxed hiking pants"
          autoComplete="off"
        />
      </Field>

      <Question label="Category">
        <SingleSelect
          options={CATEGORIES}
          value={values.category}
          onChange={(v) => setValue("category", v, { shouldDirty: true })}
        />
      </Question>

      <Question label="Colour" optional>
        <ColourSelect
          options={COLOURS}
          values={values.colour ? [values.colour] : []}
          onChange={(v) =>
            setValue("colour", (v[v.length - 1] ?? undefined) as WardrobeItemFormValues["colour"], {
              shouldDirty: true,
            })
          }
        />
      </Question>

      {/* ------------------------------ advanced ---------------------------- */}
      {!showAdvanced ? (
        <button
          type="button"
          onClick={() => setShowAdvanced(true)}
          className="text-sm text-ember underline underline-offset-4 transition-colors hover:text-ember-deep"
        >
          Add fit, material, weather and formality
        </button>
      ) : (
        <div className="space-y-7 border-t border-line pt-7">
          <Question label="Fit" optional>
            <SingleSelect
              options={FIT_PREFERENCES.filter((f) => f.value !== "depends")}
              value={values.fit}
              onChange={(v) => setValue("fit", v, { shouldDirty: true })}
            />
          </Question>

          <Question label="Material" optional>
            <SingleSelect
              options={MATERIALS}
              value={values.material}
              onChange={(v) => setValue("material", v, { shouldDirty: true })}
            />
          </Question>

          <Question
            label="How formal is it?"
            hint="This is the single most useful field — it's what decides whether an item shows up for an interview or a hike."
            optional
          >
            <SingleSelect
              options={FORMALITY}
              value={values.formality}
              onChange={(v) => setValue("formality", v, { shouldDirty: true })}
            />
          </Question>

          <Question label="Good in which conditions?" optional>
            <MultiSelect
              options={WEATHER_SUITABILITY}
              values={values.weather ?? []}
              onChange={(v) => setValue("weather", v, { shouldDirty: true })}
            />
          </Question>

          <Question label="Style" optional>
            <MultiSelect
              options={STYLE_TAGS}
              values={values.styles ?? []}
              onChange={(v) => setValue("styles", v, { shouldDirty: true })}
            />
          </Question>

          <Question label="Season" optional>
            <ChipGroup>
              {SEASONS.map((s) => (
                <Chip
                  key={s.value}
                  selected={values.season === s.value}
                  onClick={() =>
                    setValue(
                      "season",
                      (values.season === s.value ? undefined : s.value) as WardrobeItemFormValues["season"],
                      { shouldDirty: true },
                    )
                  }
                >
                  {s.label}
                </Chip>
              ))}
            </ChipGroup>
          </Question>
        </div>
      )}

      <div className="flex gap-3 pt-1">
        <Button type="submit" disabled={isSubmitting} className="flex-1">
          {submitLabel}
        </Button>
        {onCancel && (
          <Button type="button" variant="ghost" onClick={onCancel}>
            Cancel
          </Button>
        )}
      </div>
    </form>
  );
}
