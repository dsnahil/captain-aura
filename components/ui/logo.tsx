import { cn } from "@/lib/utils";

/**
 * Captain Aura mark: concentric aura rings around a captain's chevron.
 * Inherits currentColor.
 */
export function AuraMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      className={cn("size-7", className)}
      aria-hidden
    >
      <circle
        cx="16"
        cy="16"
        r="14"
        stroke="currentColor"
        strokeOpacity="0.25"
        strokeWidth="1.6"
      />
      <circle
        cx="16"
        cy="16"
        r="9.5"
        stroke="currentColor"
        strokeOpacity="0.5"
        strokeWidth="1.6"
      />
      <path
        d="M10.9 18.4 16 10.4l5.1 8"
        stroke="currentColor"
        strokeWidth="2.1"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M13 18.6h6"
        stroke="currentColor"
        strokeWidth="2.1"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function Wordmark({
  className,
  compact = false,
}: {
  className?: string;
  compact?: boolean;
}) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <AuraMark className="size-7 text-ember" />
      <span className="text-[1.0625rem] font-extrabold tracking-[-0.03em] text-ink">
        {compact ? "Aura" : "Captain Aura"}
      </span>
    </span>
  );
}
