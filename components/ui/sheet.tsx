"use client";

import * as React from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Bottom sheet on mobile, centered dialog on desktop.
 * Handles Escape, scroll lock, focus capture and click-outside.
 */
export function Sheet({
  open,
  onClose,
  title,
  children,
  className,
}: {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  className?: string;
}) {
  const panelRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    panelRef.current?.focus();
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <button
        aria-label="Close"
        tabIndex={-1}
        onClick={onClose}
        className="absolute inset-0 cursor-default bg-ink/35 backdrop-blur-[2px] fade"
      />
      <div
        ref={panelRef}
        tabIndex={-1}
        className={cn(
          "relative z-10 max-h-[92dvh] w-full overflow-y-auto rounded-t-[28px] bg-canvas",
          "p-6 pb-[calc(1.5rem+env(safe-area-inset-bottom))] rise",
          "sm:max-w-lg sm:rounded-[28px] sm:p-8 sm:pb-8",
          "shadow-[0_-8px_40px_-12px_rgba(28,27,26,0.25)] sm:shadow-[0_24px_60px_-20px_rgba(28,27,26,0.35)]",
          className,
        )}
      >
        <div className="mx-auto mb-5 h-1 w-9 rounded-full bg-line-strong sm:hidden" />
        {title && (
          <div className="mb-6 flex items-start justify-between gap-4">
            <h2 className="text-2xl font-bold tracking-[-0.03em]">{title}</h2>
            <button
              onClick={onClose}
              aria-label="Close"
              className="-mt-1 -mr-1 rounded-full p-2.5 text-ink-soft transition-colors hover:bg-surface hover:text-ink"
            >
              <X className="size-5" strokeWidth={1.75} />
            </button>
          </div>
        )}
        {children}
      </div>
    </div>
  );
}
