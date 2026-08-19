"use client";

import * as React from "react";
import Link from "next/link";
import { Bookmark, BookmarkCheck, Check, ThumbsDown, ThumbsUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Chip, ChipGroup } from "@/components/ui/chip";
import { Textarea } from "@/components/ui/field";
import { track } from "@/lib/analytics";
import { FEEDBACK_REASONS } from "@/lib/domain/enums";
import type { AuraRequest } from "@/lib/domain/types";
import { useAura } from "@/lib/store/aura";
import { cn } from "@/lib/utils";

/** Pill-shaped toggle used for every feedback action. */
function Toggle({
  active,
  onClick,
  children,
}: {
  active?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      aria-pressed={!!active}
      className={cn(
        "inline-flex min-h-12 items-center gap-2 rounded-full border px-5 font-semibold transition-all active:scale-[0.97]",
        active
          ? "border-ink bg-ink text-white"
          : "border-line-strong bg-canvas hover:border-ink",
      )}
    >
      {children}
    </button>
  );
}

/**
 * The feedback loop. Anything captured here is written straight into Aura
 * Memory and changes the next recommendation.
 */
export function FeedbackPanel({ request }: { request: AuraRequest }) {
  const setFeedback = useAura((s) => s.setFeedback);
  const fb = request.feedback;

  const [rejecting, setRejecting] = React.useState(false);
  const [reasons, setReasons] = React.useState<string[]>(fb?.reasons ?? []);
  const [note, setNote] = React.useState(fb?.note ?? "");
  const [flash, setFlash] = React.useState<string | null>(null);

  const say = (msg: string) => {
    setFlash(msg);
    setTimeout(() => setFlash(null), 2600);
  };

  const helpful = (value: boolean) => {
    setFeedback(request.id, { helpful: value, reasons: [] });
    if (value) {
      say("Noted — more like this.");
      track("recommendation_saved", { kind: "helpful" });
    } else {
      setRejecting(true);
    }
  };

  const submitReasons = () => {
    setFeedback(request.id, {
      helpful: false,
      rejected: true,
      reasons,
      note: note.trim() || undefined,
    });
    setRejecting(false);
    say("Got it. That changes what I suggest next.");
    track("recommendation_rejected", { reasons: reasons.join(",") });
  };

  return (
    <section className="tinted p-7 rise">
      <h2 className="text-xl font-bold tracking-[-0.02em]">Did this help?</h2>

      <div className="mt-5 flex flex-wrap gap-3">
        <Toggle active={fb?.helpful === true} onClick={() => helpful(true)}>
          <ThumbsUp className="size-4" strokeWidth={2} />
          Yes
        </Toggle>
        <Toggle active={fb?.helpful === false} onClick={() => helpful(false)}>
          <ThumbsDown className="size-4" strokeWidth={2} />
          Not really
        </Toggle>
      </div>

      <div className="mt-4 flex flex-wrap gap-3">
        <Toggle
          active={!!fb?.saved}
          onClick={() => {
            const next = !fb?.saved;
            setFeedback(request.id, { saved: next });
            if (next) {
              say("Saved.");
              track("recommendation_saved", { kind: "outfit" });
            }
          }}
        >
          {fb?.saved ? (
            <BookmarkCheck className="size-4" strokeWidth={2} />
          ) : (
            <Bookmark className="size-4" strokeWidth={2} />
          )}
          {fb?.saved ? "Saved" : "Save"}
        </Toggle>

        <Toggle
          active={!!fb?.tried}
          onClick={() => {
            setFeedback(request.id, { tried: true });
            say("Logged — I'll favour these pieces.");
            track("recommendation_tried");
          }}
        >
          {fb?.tried && <Check className="size-4" strokeWidth={2.5} />}
          {fb?.tried ? "You wore this" : "I wore this"}
        </Toggle>

        <Toggle onClick={() => setRejecting(true)}>Not my style</Toggle>
      </div>

      {rejecting && (
        <div className="mt-6 border-t border-line-strong pt-6 rise">
          <p className="mb-4 font-semibold">What didn&rsquo;t work?</p>
          <ChipGroup>
            {FEEDBACK_REASONS.map((r) => (
              <Chip
                key={r.value}
                selected={reasons.includes(r.value)}
                onClick={() =>
                  setReasons((s) =>
                    s.includes(r.value)
                      ? s.filter((x) => x !== r.value)
                      : [...s, r.value],
                  )
                }
              >
                {r.label}
              </Chip>
            ))}
          </ChipGroup>

          {reasons.includes("other") && (
            <Textarea
              className="mt-5"
              rows={2}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Tell me what was off."
              aria-label="What didn't work"
            />
          )}

          <div className="mt-5 flex gap-3">
            <Button onClick={submitReasons} disabled={!reasons.length}>
              Send
            </Button>
            <Button variant="ghost" onClick={() => setRejecting(false)}>
              Cancel
            </Button>
          </div>
        </div>
      )}

      {flash && (
        <p className="mt-5 font-medium text-ember fade" role="status">
          {flash}{" "}
          <Link href="/aura" className="underline underline-offset-4">
            See what I know
          </Link>
        </p>
      )}
    </section>
  );
}
