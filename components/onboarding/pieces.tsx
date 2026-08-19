"use client";

import * as React from "react";
import { Check } from "lucide-react";
import { Chip, ChipGroup } from "@/components/ui/chip";
import type { Option } from "@/lib/domain/enums";
import { cn } from "@/lib/utils";

/* ------------------------------- step shell -------------------------------- */

export function StepShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rise">
      <h1 className="title text-balance">{title}</h1>
      {subtitle && (
        <p className="mt-4 max-w-md text-pretty text-ink-soft">{subtitle}</p>
      )}
      <div className="mt-10 space-y-11">{children}</div>
    </div>
  );
}

export function Question({
  label,
  hint,
  optional,
  children,
}: {
  label: string;
  hint?: string;
  optional?: boolean;
  children: React.ReactNode;
}) {
  return (
    <fieldset>
      <legend className="mb-5 flex items-baseline gap-2.5">
        <span className="text-lg font-bold tracking-[-0.02em]">{label}</span>
        {optional && (
          <span className="text-sm font-medium text-ink-faint">Optional</span>
        )}
      </legend>
      {hint && <p className="-mt-3 mb-5 text-ink-soft">{hint}</p>}
      {children}
    </fieldset>
  );
}

/* ------------------------------- selectors --------------------------------- */

export function SingleSelect<T extends string>({
  options,
  value,
  onChange,
}: {
  options: readonly Option[];
  value?: T;
  onChange: (v: T) => void;
}) {
  return (
    <ChipGroup>
      {options.map((o) => (
        <Chip
          key={o.value}
          selected={value === o.value}
          onClick={() => onChange(o.value as T)}
        >
          {o.label}
        </Chip>
      ))}
    </ChipGroup>
  );
}

export function MultiSelect<T extends string>({
  options,
  values,
  onChange,
}: {
  options: readonly Option[];
  values: T[];
  onChange: (v: T[]) => void;
}) {
  const toggle = (v: string) =>
    onChange(
      values.includes(v as T)
        ? values.filter((x) => x !== v)
        : ([...values, v] as T[]),
    );

  return (
    <ChipGroup>
      {options.map((o) => (
        <Chip
          key={o.value}
          selected={values.includes(o.value as T)}
          onClick={() => toggle(o.value)}
        >
          {o.label}
        </Chip>
      ))}
    </ChipGroup>
  );
}

/** Colour picker with real swatches. */
export function ColourSelect({
  options,
  values,
  onChange,
}: {
  options: readonly Option[];
  values: string[];
  onChange: (v: string[]) => void;
}) {
  const toggle = (v: string) =>
    onChange(values.includes(v) ? values.filter((x) => x !== v) : [...values, v]);

  return (
    <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
      {options.map((o) => {
        const selected = values.includes(o.value);
        return (
          <button
            key={o.value}
            type="button"
            aria-pressed={selected}
            onClick={() => toggle(o.value)}
            className={cn(
              "flex min-h-14 items-center gap-3 rounded-2xl border px-4 py-3 text-left font-medium transition-all",
              "active:scale-[0.97]",
              selected
                ? "border-ink bg-surface"
                : "border-line-strong hover:border-ink",
            )}
          >
            <span
              aria-hidden
              className="relative flex size-7 shrink-0 items-center justify-center rounded-full ring-1 ring-black/10"
              style={{ background: o.hint }}
            >
              {selected && (
                <Check
                  className="size-4 text-white mix-blend-difference"
                  strokeWidth={2.5}
                />
              )}
            </span>
            <span className="truncate text-[0.9375rem]">{o.label}</span>
          </button>
        );
      })}
    </div>
  );
}
