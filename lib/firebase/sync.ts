"use client";

import { doc, getDoc, setDoc } from "firebase/firestore";
import type { AuraProfile, AuraRequest, MemoryEntry, WardrobeItem } from "@/lib/domain/types";
import { getDb } from "./client";

/** The slice of app state that syncs to an account. */
export type SyncPayload = {
  profile: AuraProfile;
  wardrobe: WardrobeItem[];
  memory: MemoryEntry[];
  requests: AuraRequest[];
  updatedAt: string;
};

/**
 * Wardrobe photos are data URLs — often hundreds of KB each — and a Firestore
 * document is capped at 1 MB. Photos therefore stay on the device and only the
 * attributes the engine actually reads are synced.
 */
function stripImages(items: WardrobeItem[]): WardrobeItem[] {
  return items.map((item) => {
    const copy = { ...item };
    delete copy.image;
    return copy;
  });
}

/** Firestore rejects `undefined`; drop those keys entirely. */
function clean<T>(value: T): T {
  return JSON.parse(JSON.stringify(value ?? null));
}

export async function loadRemote(uid: string): Promise<SyncPayload | null> {
  const db = getDb();
  if (!db) return null;
  const snap = await getDoc(doc(db, "users", uid));
  return snap.exists() ? (snap.data() as SyncPayload) : null;
}

export async function saveRemote(
  uid: string,
  payload: Omit<SyncPayload, "updatedAt">,
): Promise<void> {
  const db = getDb();
  if (!db) return;

  await setDoc(
    doc(db, "users", uid),
    clean({
      ...payload,
      wardrobe: stripImages(payload.wardrobe),
      // Keep documents comfortably small.
      requests: payload.requests.slice(0, 30),
      updatedAt: new Date().toISOString(),
    }),
    { merge: false },
  );
}

/** Trailing debounce so a burst of edits produces one write. */
export function debounce<A extends unknown[]>(
  fn: (...args: A) => void,
  ms: number,
): (...args: A) => void {
  let t: ReturnType<typeof setTimeout> | undefined;
  return (...args: A) => {
    if (t) clearTimeout(t);
    t = setTimeout(() => fn(...args), ms);
  };
}
