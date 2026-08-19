"use client";

import * as React from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, RotateCcw, Trash2 } from "lucide-react";
import { RecommendationResult } from "@/components/recommendation/result";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/misc";
import { useAsk } from "@/lib/hooks/use-ask";
import { useAura } from "@/lib/store/aura";

export default function AuraResultPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const requests = useAura((s) => s.requests);
  const deleteRequest = useAura((s) => s.deleteRequest);
  const { ask, loading } = useAsk();

  const request = requests.find((r) => r.id === id);

  if (!request) {
    return (
      <EmptyState
        title="That recommendation isn't here"
        body="It may have been deleted, or it belongs to a different device — everything is stored locally."
        action={
          <Button onClick={() => router.push("/home")}>Ask something new</Button>
        }
      />
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between gap-4">
        <Link
          href="/home"
          className="inline-flex items-center gap-2 text-sm text-ink-faint transition-colors hover:text-ink"
        >
          <ArrowLeft className="size-4" />
          Home
        </Link>

        <button
          onClick={() => {
            deleteRequest(request.id);
            router.push("/history");
          }}
          className="tap inline-flex items-center gap-1.5 text-xs text-ink-faint transition-colors hover:text-ember"
        >
          <Trash2 className="size-3.5" />
          Delete
        </button>
      </div>

      {/* what the user originally asked */}
      <blockquote className="border-l-2 border-ember-line pl-4 text-sm leading-relaxed text-pretty text-ink-faint">
        &ldquo;{request.originalPrompt}&rdquo;
        {request.followUpAnswer && (
          <span className="mt-1.5 block text-xs text-ink-faint/70">
            {request.followUpAnswer.key}: {request.followUpAnswer.value}
          </span>
        )}
      </blockquote>

      <RecommendationResult request={request} />

      <div className="flex flex-wrap gap-3 border-t border-line pt-8">
        <Button
          variant="secondary"
          size="md"
          disabled={loading}
          onClick={() => ask(request.originalPrompt)}
        >
          <RotateCcw className="size-4" />
          {loading ? "Updating…" : "Update for today"}
        </Button>
        <Button variant="ghost" size="md" onClick={() => router.push("/home")}>
          Ask something else
        </Button>
      </div>
    </div>
  );
}
