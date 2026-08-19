"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Cloud, CloudOff, LogOut, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/store/auth";

/** Account status + sign-in prompt, shown on the profile screen. */
export function AccountCard() {
  const router = useRouter();
  const { enabled, ready, user, signOut } = useAuth();

  if (!enabled) {
    return (
      <div className="tinted flex items-start gap-4 p-6">
        <CloudOff className="mt-0.5 size-6 shrink-0 text-ink-faint" strokeWidth={1.6} />
        <div className="min-w-0 flex-1">
          <p className="font-semibold">Saved on this device</p>
          <p className="mt-1 text-pretty text-ink-soft">
            Accounts aren&rsquo;t configured for this build.
          </p>
        </div>
      </div>
    );
  }

  if (!ready) return <div className="tinted h-28 animate-pulse" />;

  if (!user) {
    return (
      <div className="tinted p-6">
        <div className="flex items-start gap-4">
          <Cloud className="mt-0.5 size-6 shrink-0 text-ember" strokeWidth={1.6} />
          <div className="min-w-0 flex-1">
            <p className="font-semibold">Save your Aura to an account</p>
            <p className="mt-1 text-pretty text-ink-soft">
              Right now everything lives on this device. Sign up free and it
              follows you anywhere.
            </p>
          </div>
        </div>
        <Button className="mt-5 w-full" onClick={() => router.push("/signin")}>
          Create a free account
        </Button>
      </div>
    );
  }

  return (
    <div className="tinted p-6">
      <div className="flex items-center gap-4">
        <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-canvas">
          <UserRound className="size-6 text-ember" strokeWidth={1.6} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold">
            {user.displayName || user.email}
          </p>
          <p className="text-sm text-ink-soft">Synced to your account</p>
        </div>
      </div>
      <button
        onClick={async () => {
          await signOut();
          router.push("/");
        }}
        className="tap mt-5 inline-flex items-center gap-2 font-semibold text-ink-soft hover:text-ink"
      >
        <LogOut className="size-4" strokeWidth={1.75} />
        Sign out
      </button>
      <p className="mt-4 text-sm text-ink-faint">
        Closet photos stay on this device.{" "}
        <Link href="/closet" className="underline underline-offset-4">
          Your closet
        </Link>
      </p>
    </div>
  );
}
