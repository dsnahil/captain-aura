"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";
import { Wordmark } from "@/components/ui/logo";
import { Spinner } from "@/components/ui/misc";
import { useAuth } from "@/lib/store/auth";

type Mode = "signin" | "signup" | "reset";

export default function SignInPage() {
  const router = useRouter();
  const [mode, setMode] = React.useState<Mode>("signup");
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [name, setName] = React.useState("");
  const [sent, setSent] = React.useState(false);

  const { enabled, busy, error, user, signIn, signUp, signInWithGoogle, resetPassword, clearError } =
    useAuth();

  // Already signed in? Nothing to do here.
  React.useEffect(() => {
    if (user) router.replace("/home");
  }, [user, router]);

  if (!enabled) {
    return (
      <Shell>
        <h1 className="title">Accounts aren&rsquo;t set up yet.</h1>
        <p className="mt-4 text-pretty text-ink-soft">
          Captain Aura works fully without an account — everything is saved on
          this device. Add Firebase config to enable sign-in and sync.
        </p>
        <Button className="mt-8" onClick={() => router.push("/home")}>
          Keep going without an account
        </Button>
      </Shell>
    );
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();

    if (mode === "reset") {
      const ok = await resetPassword(email);
      if (ok) setSent(true);
      return;
    }

    const ok =
      mode === "signup"
        ? await signUp(email, password, name)
        : await signIn(email, password);

    if (ok) router.replace("/home");
  };

  return (
    <Shell>
      <h1 className="title">
        {mode === "signup"
          ? "Create your account"
          : mode === "signin"
            ? "Welcome back"
            : "Reset your password"}
      </h1>
      <p className="mt-4 text-pretty text-ink-soft">
        {mode === "reset"
          ? "We'll email you a reset link."
          : "So your Aura follows you to any device."}
      </p>

      {sent ? (
        <div className="mt-8 flex items-start gap-3 rounded-2xl bg-ember-tint px-5 py-4">
          <Check className="mt-0.5 size-5 shrink-0 text-ember" strokeWidth={2.25} />
          <p className="text-ember-deep">
            Check <strong>{email}</strong> for the reset link.
          </p>
        </div>
      ) : (
        <form onSubmit={submit} className="mt-8 space-y-5" noValidate>
          {mode === "signup" && (
            <Field label="First name">
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Alex"
                autoComplete="given-name"
              />
            </Field>
          )}

          <Field label="Email">
            <Input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              autoComplete="email"
            />
          </Field>

          {mode !== "reset" && (
            <Field label="Password" hint={mode === "signup" ? "At least 6 characters." : undefined}>
              <Input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete={mode === "signup" ? "new-password" : "current-password"}
              />
            </Field>
          )}

          {error && (
            <p role="alert" className="rounded-2xl bg-ember-tint px-5 py-4 text-ember-deep">
              {error}
            </p>
          )}

          <Button type="submit" size="lg" className="w-full" disabled={busy}>
            {busy ? (
              <Spinner className="text-white" />
            ) : mode === "signup" ? (
              "Create account"
            ) : mode === "signin" ? (
              "Sign in"
            ) : (
              "Send reset link"
            )}
          </Button>
        </form>
      )}

      {mode !== "reset" && !sent && (
        <>
          <div className="my-7 flex items-center gap-4">
            <span className="h-px flex-1 bg-line" />
            <span className="text-sm text-ink-faint">or</span>
            <span className="h-px flex-1 bg-line" />
          </div>

          <Button
            variant="secondary"
            size="lg"
            className="w-full"
            disabled={busy}
            onClick={async () => {
              const ok = await signInWithGoogle();
              if (ok) router.replace("/home");
            }}
          >
            <GoogleGlyph />
            Continue with Google
          </Button>
        </>
      )}

      <div className="mt-8 space-y-3 text-[0.9375rem]">
        {mode === "signup" && (
          <p className="text-ink-soft">
            Already have an account?{" "}
            <button onClick={() => { setMode("signin"); clearError(); }} className="tap font-semibold text-ink underline underline-offset-4">
              Sign in
            </button>
          </p>
        )}
        {mode === "signin" && (
          <>
            <p className="text-ink-soft">
              New here?{" "}
              <button onClick={() => { setMode("signup"); clearError(); }} className="tap font-semibold text-ink underline underline-offset-4">
                Create an account
              </button>
            </p>
            <p className="text-ink-soft">
              <button onClick={() => { setMode("reset"); clearError(); }} className="tap font-semibold text-ink underline underline-offset-4">
                Forgot your password?
              </button>
            </p>
          </>
        )}
        {mode === "reset" && (
          <p className="text-ink-soft">
            <button onClick={() => { setMode("signin"); setSent(false); clearError(); }} className="tap font-semibold text-ink underline underline-offset-4">
              Back to sign in
            </button>
          </p>
        )}
        <p className="text-ink-faint">
          Or{" "}
          <Link href="/home" className="tap font-semibold text-ink underline underline-offset-4">
            keep using it on this device
          </Link>{" "}
          without an account.
        </p>
      </div>
    </Shell>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh">
      <header className="mx-auto flex max-w-md items-center justify-between px-6 py-6">
        <Link href="/">
          <Wordmark />
        </Link>
        <Link
          href="/home"
          aria-label="Back"
          className="tap text-ink-soft hover:text-ink"
        >
          <ArrowLeft className="size-5" strokeWidth={1.75} />
        </Link>
      </header>
      <main className="mx-auto w-full max-w-md px-6 pt-8 pb-20">{children}</main>
    </div>
  );
}

function GoogleGlyph() {
  return (
    <svg viewBox="0 0 18 18" className="size-5" aria-hidden>
      <path
        fill="#4285F4"
        d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.92c1.7-1.57 2.68-3.88 2.68-6.62Z"
      />
      <path
        fill="#34A853"
        d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.92-2.26c-.8.54-1.84.86-3.04.86-2.34 0-4.32-1.58-5.03-3.7H.96v2.33A9 9 0 0 0 9 18Z"
      />
      <path
        fill="#FBBC05"
        d="M3.97 10.72a5.4 5.4 0 0 1 0-3.44V4.95H.96a9 9 0 0 0 0 8.1l3.01-2.33Z"
      />
      <path
        fill="#EA4335"
        d="M9 3.58c1.32 0 2.5.45 3.44 1.35l2.58-2.58C13.46.9 11.43 0 9 0A9 9 0 0 0 .96 4.95l3.01 2.33C4.68 5.16 6.66 3.58 9 3.58Z"
      />
    </svg>
  );
}
