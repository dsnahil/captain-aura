"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Compass, Search, Shirt, Sparkles, UserRound } from "lucide-react";
import { AuraMark } from "@/components/ui/logo";
import { cn } from "@/lib/utils";

const ITEMS = [
  { href: "/home", label: "Ask", icon: Search },
  { href: "/aura", label: "Aura", icon: Sparkles },
  { href: "/closet", label: "Closet", icon: Shirt },
  { href: "/explore", label: "Explore", icon: Compass },
  { href: "/profile", label: "Profile", icon: UserRound },
];

function useActive() {
  const pathname = usePathname();
  return (href: string) =>
    href === "/home"
      ? pathname === "/home"
      : pathname === href || pathname.startsWith(`${href}/`);
}

/** Mobile: bottom tab bar. */
export function BottomNav() {
  const isActive = useActive();

  return (
    <nav
      aria-label="Primary"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-canvas/95 backdrop-blur-xl md:hidden"
    >
      <ul className="mx-auto flex max-w-lg items-stretch justify-around px-2 pt-2 pb-[calc(0.625rem+env(safe-area-inset-bottom))]">
        {ITEMS.map(({ href, label, icon: Icon }) => {
          const active = isActive(href);
          return (
            <li key={href} className="flex-1">
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex min-h-12 flex-col items-center justify-center gap-1.5 rounded-2xl py-1 transition-colors",
                  active ? "text-ember" : "text-ink-faint hover:text-ink",
                )}
              >
                <Icon className="size-[1.375rem]" strokeWidth={active ? 2.25 : 1.6} />
                <span className="text-[0.6875rem] font-semibold tracking-tight">
                  {label}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

/** Desktop: clean top bar. */
export function TopNav() {
  const isActive = useActive();

  return (
    <header className="sticky top-0 z-40 hidden border-b border-line bg-canvas/90 backdrop-blur-xl md:block">
      <div className="mx-auto flex h-20 max-w-4xl items-center gap-10 px-8">
        <Link href="/home" className="flex items-center gap-2.5">
          <AuraMark className="size-7 text-ember" />
          <span className="text-[1.0625rem] font-extrabold tracking-[-0.03em]">
            Captain Aura
          </span>
        </Link>

        <nav aria-label="Primary" className="flex items-center gap-1">
          {ITEMS.map(({ href, label, icon: Icon }) => {
            const active = isActive(href);
            return (
              <Link
                key={href}
                href={href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-[0.9375rem] font-semibold transition-colors",
                  active ? "bg-surface text-ink" : "text-ink-soft hover:bg-surface hover:text-ink",
                )}
              >
                <Icon className="size-[1.125rem]" strokeWidth={1.75} />
                {label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
