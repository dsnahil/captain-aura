"use client";

import { useRouter } from "next/navigation";
import { useAura, useHydrated } from "@/lib/store/aura";

export function DemoBanner() {
  const router = useRouter();
  const hydrated = useHydrated();
  const mode = useAura((s) => s.mode);
  const exitDemo = useAura((s) => s.exitDemo);

  if (!hydrated || mode !== "demo") return null;

  return (
    <div className="bg-ember-tint">
      <div className="mx-auto flex max-w-2xl items-center justify-between gap-4 px-5 py-3 sm:px-6">
        <p className="text-sm font-medium text-ember-deep">
          Demo &middot; you&rsquo;re browsing as Alex
        </p>
        <button
          onClick={() => {
            exitDemo();
            router.push("/");
          }}
          className="tap shrink-0 text-sm font-semibold text-ember-deep underline underline-offset-4"
        >
          Exit
        </button>
      </div>
    </div>
  );
}
