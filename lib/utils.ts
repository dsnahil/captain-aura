import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Stable id generator that works on server and client. */
export function id(prefix = "id"): string {
  const rnd =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID().slice(0, 8)
      : Math.random().toString(36).slice(2, 10);
  return `${prefix}_${Date.now().toString(36)}_${rnd}`;
}

export function titleCase(s: string): string {
  return s.replace(/(^|[\s/-])([a-z])/g, (_, p, c) => p + c.toUpperCase());
}

/** "Aug 18" style short date. */
export function shortDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

export function relativeDay(iso: string, now = new Date()): string {
  const d = new Date(iso);
  const days = Math.round(
    (startOfDay(d).getTime() - startOfDay(now).getTime()) / 86_400_000,
  );
  if (days === 0) return "Today";
  if (days === 1) return "Tomorrow";
  if (days === -1) return "Yesterday";
  if (days > 1 && days < 7)
    return d.toLocaleDateString(undefined, { weekday: "long" });
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export function startOfDay(d: Date): Date {
  const c = new Date(d);
  c.setHours(0, 0, 0, 0);
  return c;
}

/** Join a list as "a, b and c". */
export function listJoin(items: string[]): string {
  const c = items.filter(Boolean);
  if (c.length === 0) return "";
  if (c.length === 1) return c[0];
  return `${c.slice(0, -1).join(", ")} and ${c[c.length - 1]}`;
}
