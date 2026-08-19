"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { AuraMark } from "@/components/ui/logo";
import { useAura, useHydrated } from "@/lib/store/aura";

/**
 * Persisted state lives on the device, so the app section can't render until
 * hydration finishes. Anyone without a profile is sent to onboarding.
 */
export function RequireProfile({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const hydrated = useHydrated();
  const onboarded = useAura((s) => s.profile.onboardingComplete);

  useEffect(() => {
    if (hydrated && !onboarded) router.replace("/onboarding");
  }, [hydrated, onboarded, router]);

  if (!hydrated || !onboarded) {
    return (
      <div className="flex min-h-[60dvh] items-center justify-center">
        <AuraMark className="size-9 text-ember breathe" />
        <span className="sr-only">Loading Captain Aura</span>
      </div>
    );
  }

  return <>{children}</>;
}
