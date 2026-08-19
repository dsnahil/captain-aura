"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { track } from "@/lib/analytics";
import {
  demoMemory,
  demoProfile,
  demoWardrobe,
  emptyProfile,
} from "@/lib/domain/defaults";
import type {
  AuraProfile,
  AuraRequest,
  Feedback,
  MemoryEntry,
  WardrobeItem,
  WardrobeItemInput,
} from "@/lib/domain/types";
import {
  memoryFromFeedback,
  memoryFromProfile,
  mergeMemory,
} from "@/lib/engine/memory";
import { id } from "@/lib/utils";

/* ============================================================================
   PERSISTENCE SEAM

   Everything the product knows about a user lives here. The MVP keeps it on
   the device so the app works with no account and no backend. To move to
   Supabase (or any server), replace `storage` below with an adapter that
   reads/writes the same shape — no component needs to change.
   ========================================================================== */

export type AuraState = {
  profile: AuraProfile;
  wardrobe: WardrobeItem[];
  memory: MemoryEntry[];
  requests: AuraRequest[];
  mode: "none" | "demo" | "user";
  /** Set once the persisted state has been read on the client. */
  hydrated: boolean;

  // profile
  updateProfile: (patch: Partial<AuraProfile>) => void;
  completeOnboarding: () => void;
  resetAll: () => void;
  startDemo: () => void;
  exitDemo: () => void;

  // wardrobe
  addWardrobeItem: (item: WardrobeItemInput) => WardrobeItem;
  updateWardrobeItem: (itemId: string, patch: Partial<WardrobeItem>) => void;
  deleteWardrobeItem: (itemId: string) => void;

  // memory
  addMemory: (entries: MemoryEntry[]) => void;
  deleteMemory: (entryId: string) => void;
  editMemory: (entryId: string, label: string) => void;

  // requests
  addRequest: (request: AuraRequest) => void;
  /** Accepts a patch — feedback accumulates across separate taps. */
  setFeedback: (requestId: string, feedback: Partial<Feedback>) => void;
  deleteRequest: (requestId: string) => void;
};

const initial = {
  profile: emptyProfile(),
  wardrobe: [] as WardrobeItem[],
  memory: [] as MemoryEntry[],
  requests: [] as AuraRequest[],
  mode: "none" as const,
};

export const useAura = create<AuraState>()(
  persist(
    (set, get) => ({
      ...initial,
      hydrated: false,

      /* ------------------------------ profile ----------------------------- */

      updateProfile: (patch) =>
        set((s) => ({
          profile: { ...s.profile, ...patch, updatedAt: new Date().toISOString() },
        })),

      completeOnboarding: () => {
        const profile = {
          ...get().profile,
          onboardingComplete: true,
          updatedAt: new Date().toISOString(),
        };
        // Onboarding answers become the first entries in Aura Memory.
        const derived = memoryFromProfile(profile);
        set((s) => ({
          profile,
          mode: s.mode === "demo" ? "demo" : "user",
          memory: mergeMemory(s.memory, derived),
        }));
        track("aura_completed");
      },

      resetAll: () =>
        set({ ...initial, profile: emptyProfile(), hydrated: true }),

      startDemo: () => {
        set({
          profile: demoProfile(),
          wardrobe: demoWardrobe(),
          memory: demoMemory(),
          requests: [],
          mode: "demo",
        });
        track("demo_started");
      },

      exitDemo: () =>
        set({ ...initial, profile: emptyProfile(), hydrated: true }),

      /* ----------------------------- wardrobe ----------------------------- */

      addWardrobeItem: (item) => {
        const created: WardrobeItem = {
          ...item,
          id: id("item"),
          createdAt: new Date().toISOString(),
        };
        set((s) => ({ wardrobe: [created, ...s.wardrobe] }));
        track("wardrobe_item_added", { category: item.category });
        return created;
      },

      updateWardrobeItem: (itemId, patch) =>
        set((s) => ({
          wardrobe: s.wardrobe.map((w) => (w.id === itemId ? { ...w, ...patch } : w)),
        })),

      deleteWardrobeItem: (itemId) => {
        set((s) => ({ wardrobe: s.wardrobe.filter((w) => w.id !== itemId) }));
        track("wardrobe_item_deleted");
      },

      /* ------------------------------ memory ------------------------------ */

      addMemory: (entries) =>
        set((s) => ({ memory: mergeMemory(s.memory, entries) })),

      deleteMemory: (entryId) => {
        set((s) => ({ memory: s.memory.filter((m) => m.id !== entryId) }));
        track("memory_deleted");
      },

      editMemory: (entryId, label) =>
        set((s) => ({
          memory: s.memory.map((m) => (m.id === entryId ? { ...m, label } : m)),
        })),

      /* ----------------------------- requests ----------------------------- */

      addRequest: (request) =>
        set((s) => ({ requests: [request, ...s.requests].slice(0, 50) })),

      setFeedback: (requestId, feedback) => {
        const request = get().requests.find((r) => r.id === requestId);
        if (!request) return;

        const merged: Feedback = {
          ...request.feedback,
          ...feedback,
          reasons: feedback.reasons?.length
            ? feedback.reasons
            : (request.feedback?.reasons ?? []),
          at: new Date().toISOString(),
        };

        set((s) => ({
          requests: s.requests.map((r) =>
            r.id === requestId ? { ...r, feedback: merged } : r,
          ),
          memory: mergeMemory(
            s.memory,
            memoryFromFeedback(merged, { ...request, feedback: merged }),
          ),
        }));

        track("feedback_submitted", {
          helpful: merged.helpful,
          reasons: merged.reasons.join(","),
        });
      },

      deleteRequest: (requestId) =>
        set((s) => ({ requests: s.requests.filter((r) => r.id !== requestId) })),
    }),
    {
      name: "captain-aura:v1",
      storage: createJSONStorage(() => localStorage),
      version: 1,
      partialize: (s) => ({
        profile: s.profile,
        wardrobe: s.wardrobe,
        memory: s.memory,
        requests: s.requests,
        mode: s.mode,
      }),
    },
  ),
);

/**
 * Components must not render persisted state during SSR/first paint or React
 * will complain about a hydration mismatch. Everything gates on `hydrated`.
 */
if (typeof window !== "undefined") {
  const finish = () => useAura.setState({ hydrated: true });
  if (useAura.persist.hasHydrated()) finish();
  else useAura.persist.onFinishHydration(finish);
}

/* ------------------------------- selectors -------------------------------- */

export const useProfile = () => useAura((s) => s.profile);
export const useWardrobe = () => useAura((s) => s.wardrobe);
export const useMemory = () => useAura((s) => s.memory);
export const useRequests = () => useAura((s) => s.requests);
export const useHydrated = () => useAura((s) => s.hydrated);

export const useIsOnboarded = () =>
  useAura((s) => s.profile.onboardingComplete);
