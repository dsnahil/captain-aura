"use client";

import {
  GoogleAuthProvider,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut as fbSignOut,
  updateProfile,
  type User,
} from "firebase/auth";
import { create } from "zustand";
import { getFirebaseAuth, isFirebaseConfigured } from "@/lib/firebase/client";

export type AuthUser = {
  uid: string;
  email: string | null;
  displayName: string | null;
};

type AuthState = {
  user: AuthUser | null;
  /** False until Firebase has reported the initial auth state. */
  ready: boolean;
  /** True when the project has Firebase configured at all. */
  enabled: boolean;
  error: string | null;
  busy: boolean;

  signUp: (email: string, password: string, name?: string) => Promise<boolean>;
  signIn: (email: string, password: string) => Promise<boolean>;
  signInWithGoogle: () => Promise<boolean>;
  resetPassword: (email: string) => Promise<boolean>;
  signOut: () => Promise<void>;
  clearError: () => void;
};

/** Firebase error codes are not user-facing text. */
function readableError(err: unknown): string {
  const code = (err as { code?: string })?.code ?? "";
  const map: Record<string, string> = {
    "auth/invalid-email": "That email doesn't look right.",
    "auth/missing-password": "Enter a password.",
    "auth/weak-password": "Use at least 6 characters.",
    "auth/email-already-in-use": "That email already has an account. Try signing in.",
    "auth/invalid-credential": "Email or password is incorrect.",
    "auth/wrong-password": "Email or password is incorrect.",
    "auth/user-not-found": "No account with that email.",
    "auth/too-many-requests": "Too many attempts. Try again in a minute.",
    "auth/popup-closed-by-user": "Sign-in was cancelled.",
    "auth/popup-blocked": "Your browser blocked the popup. Allow it and try again.",
    "auth/network-request-failed": "Network problem. Check your connection.",
    "auth/operation-not-allowed": "That sign-in method isn't enabled for this project yet.",
  };
  return map[code] ?? "Something went wrong. Try again.";
}

const toUser = (u: User): AuthUser => ({
  uid: u.uid,
  email: u.email,
  displayName: u.displayName,
});

export const useAuth = create<AuthState>((set) => ({
  user: null,
  // With no Firebase config there is nothing to wait for.
  ready: !isFirebaseConfigured,
  enabled: isFirebaseConfigured,
  error: null,
  busy: false,

  signUp: async (email, password, name) => {
    const auth = getFirebaseAuth();
    if (!auth) return false;
    set({ busy: true, error: null });
    try {
      const cred = await createUserWithEmailAndPassword(auth, email.trim(), password);
      if (name?.trim()) await updateProfile(cred.user, { displayName: name.trim() });
      set({ user: toUser(cred.user), busy: false });
      return true;
    } catch (err) {
      set({ error: readableError(err), busy: false });
      return false;
    }
  },

  signIn: async (email, password) => {
    const auth = getFirebaseAuth();
    if (!auth) return false;
    set({ busy: true, error: null });
    try {
      const cred = await signInWithEmailAndPassword(auth, email.trim(), password);
      set({ user: toUser(cred.user), busy: false });
      return true;
    } catch (err) {
      set({ error: readableError(err), busy: false });
      return false;
    }
  },

  signInWithGoogle: async () => {
    const auth = getFirebaseAuth();
    if (!auth) return false;
    set({ busy: true, error: null });
    try {
      const cred = await signInWithPopup(auth, new GoogleAuthProvider());
      set({ user: toUser(cred.user), busy: false });
      return true;
    } catch (err) {
      set({ error: readableError(err), busy: false });
      return false;
    }
  },

  resetPassword: async (email) => {
    const auth = getFirebaseAuth();
    if (!auth) return false;
    set({ busy: true, error: null });
    try {
      await sendPasswordResetEmail(auth, email.trim());
      set({ busy: false });
      return true;
    } catch (err) {
      set({ error: readableError(err), busy: false });
      return false;
    }
  },

  signOut: async () => {
    const auth = getFirebaseAuth();
    if (!auth) return;
    await fbSignOut(auth);
    set({ user: null });
  },

  clearError: () => set({ error: null }),
}));

// Subscribe once, at module load, so auth state is available app-wide.
if (typeof window !== "undefined" && isFirebaseConfigured) {
  const auth = getFirebaseAuth();
  if (auth) {
    onAuthStateChanged(auth, (u) => {
      useAuth.setState({ user: u ? toUser(u) : null, ready: true });
    });
  }
}
