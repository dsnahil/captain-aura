"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { DEMO_PROMPT } from "@/lib/domain/defaults";
import { useAura } from "@/lib/store/aura";

/**
 * Loads the fictional demo user and drops straight into the home screen with
 * the example question pre-filled. No account, no keys.
 */
export function DemoButton({
  children = "See a demo",
  variant = "secondary",
  size = "lg",
  className,
}: {
  children?: React.ReactNode;
  variant?: "primary" | "secondary" | "ghost";
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const router = useRouter();
  const startDemo = useAura((s) => s.startDemo);

  return (
    <Button
      variant={variant}
      size={size}
      className={className}
      onClick={() => {
        startDemo();
        router.push(`/home?q=${encodeURIComponent(DEMO_PROMPT)}`);
      }}
    >
      {children}
    </Button>
  );
}
