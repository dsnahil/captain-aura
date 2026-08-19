"use client";

import * as React from "react";
import { ArrowUp, RotateCw, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/field";
import { Spinner } from "@/components/ui/misc";
import { useAsk } from "@/lib/hooks/use-ask";
import { cn } from "@/lib/utils";

const EXAMPLES = [
  "First date tomorrow",
  "Job interview Friday",
  "Hiking this weekend",
  "Tokyo for 7 days",
  "Help me look more mature",
];

export function AskBox({ initialPrompt = "" }: { initialPrompt?: string }) {
  const [value, setValue] = React.useState(initialPrompt);
  const areaRef = React.useRef<HTMLTextAreaElement>(null);
  const { ask, loading, error, followUp, answerFollowUp, skipFollowUp, clearError } =
    useAsk();

  // Auto-grow rather than scroll inside the box.
  const resize = React.useCallback(() => {
    const el = areaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 240)}px`;
  }, []);

  React.useEffect(resize, [value, resize]);

  const submit = () => {
    clearError();
    ask(value);
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  };

  if (followUp) {
    return (
      <FollowUpCard
        question={followUp.question}
        options={followUp.options}
        loading={loading}
        onAnswer={answerFollowUp}
        onSkip={skipFollowUp}
      />
    );
  }

  return (
    <div>
      <div
        className={cn(
          "relative overflow-hidden rounded-[28px] border border-line-strong bg-canvas",
          "transition-all duration-300 focus-within:border-ink",
          "shadow-[0_2px_16px_-8px_rgba(28,27,26,0.12)]",
        )}
      >
        <label htmlFor="aura-prompt" className="sr-only">
          What are you doing?
        </label>
        <textarea
          id="aura-prompt"
          ref={areaRef}
          rows={2}
          value={value}
          disabled={loading}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder="Tell Captain Aura what you're doing…"
          className="w-full resize-none bg-transparent px-6 pt-6 pb-2 text-lg leading-relaxed outline-none placeholder:text-ink-faint disabled:opacity-60"
        />

        <div className="flex items-center justify-between gap-3 px-5 pb-5">
          <p className="text-sm text-ink-faint">
            {loading ? "Reading the situation…" : "The more detail, the better"}
          </p>
          <Button
            size="md"
            onClick={submit}
            disabled={!value.trim() || loading}
            aria-label="Ask Captain Aura"
            className="size-12 shrink-0 !px-0"
          >
            {loading ? (
              <Spinner className="text-white" />
            ) : (
              <ArrowUp className="size-5" strokeWidth={2.25} />
            )}
          </Button>
        </div>

        {loading && (
          <div className="relative h-0.5 w-full overflow-hidden bg-surface shimmer" />
        )}
      </div>

      {error && (
        <div
          role="alert"
          className="mt-4 flex items-start gap-3 rounded-2xl bg-ember-tint px-5 py-4"
        >
          <p className="flex-1 text-[0.9375rem] text-ember-deep">{error}</p>
          <button
            onClick={submit}
            className="tap flex shrink-0 items-center gap-1.5 text-sm font-semibold text-ember-deep"
          >
            <RotateCw className="size-3.5" strokeWidth={2} />
            Retry
          </button>
        </div>
      )}

      <div className="bleed no-bar mt-5 flex gap-2.5 overflow-x-auto sm:flex-wrap">
        {EXAMPLES.map((e) => (
          <button
            key={e}
            type="button"
            disabled={loading}
            onClick={() => {
              setValue(e);
              areaRef.current?.focus();
            }}
            className="shrink-0 rounded-full bg-surface px-4 py-2.5 text-[0.9375rem] font-medium text-ink-soft transition-colors hover:bg-surface-2 hover:text-ink disabled:opacity-50"
          >
            {e}
          </button>
        ))}
      </div>
    </div>
  );
}

/* ============================================================================
   FOLLOW-UP — one question, always skippable.
   ========================================================================== */

function FollowUpCard({
  question,
  options,
  loading,
  onAnswer,
  onSkip,
}: {
  question: string;
  options?: string[];
  loading: boolean;
  onAnswer: (v: string) => void;
  onSkip: () => void;
}) {
  const [text, setText] = React.useState("");

  return (
    <div className="rounded-[28px] bg-surface p-7 rise">
      <p className="inline-flex items-center gap-2 text-sm font-semibold text-ember">
        <Sparkles className="size-4" strokeWidth={2} />
        One quick thing
      </p>

      <p className="mt-4 text-2xl font-bold tracking-[-0.03em] text-balance">
        {question}
      </p>

      {options ? (
        <div className="mt-6 flex flex-wrap gap-2.5">
          {options.map((o) => (
            <button
              key={o}
              disabled={loading}
              onClick={() => onAnswer(o)}
              className="min-h-12 rounded-full bg-canvas px-5 font-medium transition-colors hover:bg-ink hover:text-white disabled:opacity-50"
            >
              {o}
            </button>
          ))}
        </div>
      ) : (
        <form
          className="mt-6 flex gap-2.5"
          onSubmit={(e) => {
            e.preventDefault();
            if (text.trim()) onAnswer(text.trim());
          }}
        >
          <Input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Type an answer"
            autoFocus
            disabled={loading}
            aria-label={question}
          />
          <Button type="submit" disabled={!text.trim() || loading} className="shrink-0">
            {loading ? <Spinner className="text-white" /> : "Go"}
          </Button>
        </form>
      )}

      <button
        onClick={onSkip}
        disabled={loading}
        className="tap mt-6 text-[0.9375rem] font-medium text-ink-soft underline underline-offset-4 disabled:opacity-50"
      >
        Skip
      </button>
    </div>
  );
}
