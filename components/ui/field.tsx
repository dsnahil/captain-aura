import * as React from "react";
import { cn } from "@/lib/utils";

const control =
  "w-full rounded-2xl border border-line-strong bg-canvas px-5 py-4 text-base text-ink " +
  "transition-colors duration-200 placeholder:text-ink-faint " +
  "hover:border-ink-faint focus:border-ink focus:outline-none focus-visible:outline-none";

export function Input({
  className,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn(control, "min-h-14", className)} {...props} />;
}

export function Textarea({
  className,
  ...props
}: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={cn(control, "resize-none", className)} {...props} />;
}

export function Select({
  className,
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select className={cn(control, "min-h-14 appearance-none", className)} {...props} />
  );
}

export function Label({
  className,
  ...props
}: React.LabelHTMLAttributes<HTMLLabelElement>) {
  return (
    <label
      className={cn("mb-3 block text-[0.9375rem] font-semibold text-ink", className)}
      {...props}
    />
  );
}

export function Field({
  label,
  hint,
  error,
  children,
  className,
}: {
  label?: string;
  hint?: string;
  error?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("w-full", className)}>
      {label && <Label>{label}</Label>}
      {children}
      {hint && !error && <p className="mt-2 text-sm text-ink-soft">{hint}</p>}
      {error && (
        <p role="alert" className="mt-2 text-sm text-ember">
          {error}
        </p>
      )}
    </div>
  );
}
