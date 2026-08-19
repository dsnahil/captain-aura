"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * Selectable chip. Selection reads as a filled dark pill — high contrast and
 * obvious at a glance, no icon needed.
 */
export function Chip({
  selected,
  children,
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { selected?: boolean }) {
  return (
    <button
      type="button"
      aria-pressed={!!selected}
      className={cn(
        "inline-flex min-h-12 items-center rounded-full border px-5 text-[0.9375rem] font-medium",
        "transition-all duration-200 active:scale-[0.97]",
        selected
          ? "border-ink bg-ink text-white"
          : "border-line-strong bg-canvas text-ink hover:border-ink",
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}

export function ChipGroup({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("flex flex-wrap gap-3", className)} {...props} />;
}
