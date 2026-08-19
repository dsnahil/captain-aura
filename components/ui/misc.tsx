import * as React from "react";
import { cn } from "@/lib/utils";

export function Spinner({ className }: { className?: string }) {
  return (
    <span
      role="status"
      aria-label="Loading"
      className={cn(
        "inline-block size-4 animate-spin rounded-full border-2 border-current border-t-transparent",
        className,
      )}
    />
  );
}

export function EmptyState({
  icon,
  title,
  body,
  action,
}: {
  icon?: React.ReactNode;
  title: string;
  body?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="tinted flex flex-col items-center px-6 py-16 text-center">
      {icon && (
        <div className="mb-5 flex size-14 items-center justify-center rounded-full bg-canvas text-ink-soft">
          {icon}
        </div>
      )}
      <p className="text-lg font-semibold">{title}</p>
      {body && (
        <p className="mt-2 max-w-xs text-pretty text-ink-soft">{body}</p>
      )}
      {action && <div className="mt-7">{action}</div>}
    </div>
  );
}

/** Step indicator: 1 of 8 */
export function StepCounter({ step, total }: { step: number; total: number }) {
  return (
    <p className="text-sm font-medium text-ink-soft">
      <span className="text-ink">{step}</span> of {total}
    </p>
  );
}

export function ProgressBar({ value }: { value: number }) {
  return (
    <div
      className="h-1 w-full rounded-full bg-surface-2"
      role="progressbar"
      aria-valuenow={Math.round(value * 100)}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div
        className="h-1 rounded-full bg-ink transition-[width] duration-500 ease-out"
        style={{ width: `${Math.max(0, Math.min(1, value)) * 100}%` }}
      />
    </div>
  );
}

export function Pill({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full bg-surface px-3.5 py-2 text-sm font-medium text-ink-soft",
        className,
      )}
    >
      {children}
    </span>
  );
}
