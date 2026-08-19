"use client";

import * as React from "react";
import { isFirebaseConfigured } from "@/lib/firebase/client";
import { debounce, loadRemote, saveRemote } from "@/lib/firebase/sync";
import { useAura } from "@/lib/store/aura";
import { useAuth } from "@/lib/store/auth";

/**
 * Keeps the local store and the signed-in account in step.
 *
 * On sign-in: if the account already has data it wins (you're picking up on a
 * new device). If it's empty, whatever you built locally is pushed up, so
 * nothing is lost when someone signs up after trying the app.
 *
 * After that, local changes are written back on a debounce.
 */
export function SyncProvider({ children }: { children: React.ReactNode }) {
  const uid = useAuth((s) => s.user?.uid ?? null);
  // Which account we've finished pulling. Derived state avoids a setState
  // directly inside the effect body.
  const [syncedUid, setSyncedUid] = React.useState<string | null>(null);
  const pulling = !!uid && syncedUid !== uid;
  // Blocks the push effect until the initial pull has finished, so we never
  // overwrite the account with an empty local store.
  const readyToPush = React.useRef(false);

  /* --------------------------------- pull -------------------------------- */
  React.useEffect(() => {
    if (!isFirebaseConfigured || !uid) {
      readyToPush.current = false;
      return;
    }

    let cancelled = false;
    readyToPush.current = false;

    (async () => {
      try {
        const remote = await loadRemote(uid);
        if (cancelled) return;

        const local = useAura.getState();

        if (remote?.profile?.onboardingComplete) {
          // Merge remote over local, but keep local photos: they never sync.
          const photos = new Map(
            local.wardrobe.filter((w) => w.image).map((w) => [w.id, w.image]),
          );
          useAura.setState({
            profile: remote.profile,
            wardrobe: (remote.wardrobe ?? []).map((w) => ({
              ...w,
              image: photos.get(w.id),
            })),
            memory: remote.memory ?? [],
            requests: remote.requests ?? [],
            mode: "user",
          });
        } else if (local.profile.onboardingComplete && local.mode !== "demo") {
          await saveRemote(uid, {
            profile: local.profile,
            wardrobe: local.wardrobe,
            memory: local.memory,
            requests: local.requests,
          });
        }
      } catch (err) {
        console.error("[captain-aura] sync pull failed:", err);
      } finally {
        if (!cancelled) {
          readyToPush.current = true;
          setSyncedUid(uid);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [uid]);

  /* --------------------------------- push -------------------------------- */
  React.useEffect(() => {
    if (!isFirebaseConfigured || !uid) return;

    const push = debounce(() => {
      if (!readyToPush.current) return;
      const s = useAura.getState();
      // Demo data belongs to nobody — never write it to an account.
      if (s.mode === "demo" || !s.profile.onboardingComplete) return;
      saveRemote(uid, {
        profile: s.profile,
        wardrobe: s.wardrobe,
        memory: s.memory,
        requests: s.requests,
      }).catch((err) => console.error("[captain-aura] sync push failed:", err));
    }, 1200);

    return useAura.subscribe(push);
  }, [uid]);

  if (pulling) {
    return (
      <div className="flex min-h-[60dvh] items-center justify-center">
        <p className="text-ink-soft">Loading your Aura…</p>
      </div>
    );
  }

  return <>{children}</>;
}
