"use client";

import Link from "next/link";
import { ArrowRight, BookmarkCheck, Check, Clock, ThumbsDown, ThumbsUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Eyebrow } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/misc";
import { useAura } from "@/lib/store/aura";
import { relativeDay, shortDate } from "@/lib/utils";

export default function HistoryPage() {
  const requests = useAura((s) => s.requests);

  const saved = requests.filter((r) => r.feedback?.saved);
  const rest = requests.filter((r) => !r.feedback?.saved);

  return (
    <div className="space-y-10">
      <header>
        <Eyebrow>Your Aura history</Eyebrow>
        <h1 className="title mt-3">
          {requests.length} request{requests.length === 1 ? "" : "s"}
        </h1>
      </header>

      {requests.length === 0 ? (
        <EmptyState
          icon={<Clock className="size-6" />}
          title="Nothing here yet"
          body="Every question you ask is kept so you can reuse it later."
          action={
            <Link href="/home">
              <Button>Ask Captain Aura</Button>
            </Link>
          }
        />
      ) : (
        <>
          {saved.length > 0 && (
            <section>
              <Eyebrow className="mb-4">Saved</Eyebrow>
              <RequestList ids={saved} />
            </section>
          )}
          {rest.length > 0 && (
            <section>
              {saved.length > 0 && <Eyebrow className="mb-4">Everything else</Eyebrow>}
              <RequestList ids={rest} />
            </section>
          )}
        </>
      )}
    </div>
  );
}

function RequestList({ ids }: { ids: ReturnType<typeof useAura.getState>["requests"] }) {
  return (
    <ul className="space-y-2.5">
      {ids.map((r) => (
        <li key={r.id}>
          <Link
            href={`/aura/${r.id}`}
            className="flex items-center gap-4 rounded-2xl border border-line px-5 py-5 transition-colors hover:border-line-strong hover:bg-surface"
          >
            <span className="w-14 shrink-0 text-sm font-semibold text-ink-faint">
              {shortDate(r.createdAt)}
            </span>

            <span className="min-w-0 flex-1">
              <span className="block truncate text-[0.9375rem] text-ink">
                {r.recommendation.title}
              </span>
              <span className="mt-0.5 block truncate text-xs text-ink-faint">
                {r.situation.activityLabel} ·{" "}
                {relativeDay(r.situation.date, new Date(r.createdAt))}
                {r.weather ? ` · ${Math.round(r.weather.temperatureC)}°C` : ""}
              </span>
            </span>

            <span className="flex shrink-0 items-center gap-2 text-ink-faint">
              {r.feedback?.saved && <BookmarkCheck className="size-3.5 text-ember" />}
              {r.feedback?.tried && <Check className="size-3.5 text-ember" />}
              {r.feedback?.helpful === true && <ThumbsUp className="size-3.5 text-ember" />}
              {r.feedback?.helpful === false && <ThumbsDown className="size-3.5 text-ember" />}
              <ArrowRight className="size-4" />
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
