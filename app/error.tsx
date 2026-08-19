"use client";

import { useEffect } from "react";
import { Button, ButtonLink } from "@/components/ui/button";
import { AuraMark } from "@/components/ui/logo";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[captain-aura]", error);
  }, [error]);

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center px-6 text-center">
      <AuraMark className="size-8 text-ember" />
      <h1 className="title mt-8">
        Something went wrong.
      </h1>
      <p className="mt-4 max-w-sm text-sm text-pretty text-ink-faint">
        Your profile, closet and history are stored on this device and
        haven&rsquo;t been touched. Try again.
      </p>
      <div className="mt-8 flex gap-3">
        <Button onClick={reset}>Try again</Button>
        <ButtonLink href="/home" variant="ghost">
          Go home
        </ButtonLink>
      </div>
    </div>
  );
}
