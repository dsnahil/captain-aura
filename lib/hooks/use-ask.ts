"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { track } from "@/lib/analytics";
import { withoutImages } from "@/lib/domain/defaults";
import type { AuraRequest, FollowUp } from "@/lib/domain/types";
import { useAura } from "@/lib/store/aura";
import { id } from "@/lib/utils";

type AskResponse = {
  situation: AuraRequest["situation"];
  location?: AuraRequest["location"];
  weather?: AuraRequest["weather"];
  weatherDegraded?: boolean;
  recommendation: AuraRequest["recommendation"];
  followUp: FollowUp | null;
};

type Pending = { prompt: string; response: AskResponse };

/**
 * Owns the whole ask lifecycle: send context to the server, surface at most one
 * follow-up question, persist the result, then navigate to it.
 */
export function useAsk() {
  const router = useRouter();
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [pending, setPending] = React.useState<Pending | null>(null);

  const profile = useAura((s) => s.profile);
  const wardrobe = useAura((s) => s.wardrobe);
  const memory = useAura((s) => s.memory);
  const requests = useAura((s) => s.requests);
  const addRequest = useAura((s) => s.addRequest);

  const call = React.useCallback(
    async (
      prompt: string,
      followUpAnswer?: { key: string; value: string },
    ): Promise<AskResponse> => {
      const res = await fetch("/api/aura", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt,
          profile,
          // Photos are large and irrelevant to the engine — never send them.
          wardrobe: withoutImages(wardrobe),
          memory,
          location: profile.location,
          followUpAnswer,
          history: requests.slice(0, 5).map((r) => ({
            id: r.id,
            createdAt: r.createdAt,
            originalPrompt: r.originalPrompt,
            situation: r.situation,
            recommendation: r.recommendation,
            feedback: r.feedback,
          })),
        }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? "Captain Aura couldn't answer that just now.");
      }
      return res.json();
    },
    [profile, wardrobe, memory, requests],
  );

  const save = React.useCallback(
    (
      prompt: string,
      response: AskResponse,
      followUpAnswer?: { key: string; value: string },
    ) => {
      const request: AuraRequest = {
        id: id("req"),
        createdAt: new Date().toISOString(),
        originalPrompt: prompt,
        situation: response.situation,
        location: response.location,
        weather: response.weather,
        recommendation: response.recommendation,
        followUpAnswer,
      };
      addRequest(request);
      track("recommendation_generated", {
        activity: response.situation.activity,
        engine: response.recommendation.engine,
        wardrobe: response.recommendation.wardrobeVerdict.status,
      });
      router.push(`/aura/${request.id}`);
    },
    [addRequest, router],
  );

  /** Submit a new question. */
  const ask = React.useCallback(
    async (prompt: string) => {
      const trimmed = prompt.trim();
      if (!trimmed || loading) return;

      setLoading(true);
      setError(null);
      track("request_created", { length: trimmed.length });

      try {
        const response = await call(trimmed);
        // Hold the answer back only when one question would materially change it.
        if (response.followUp) {
          setPending({ prompt: trimmed, response });
        } else {
          save(trimmed, response);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Something went wrong.");
      } finally {
        setLoading(false);
      }
    },
    [call, loading, save],
  );

  /** Answer the follow-up and regenerate with the extra context. */
  const answerFollowUp = React.useCallback(
    async (value: string) => {
      if (!pending) return;
      const key = pending.response.followUp!.key;

      setLoading(true);
      setError(null);
      track("followup_answered", { key });

      try {
        const response = await call(pending.prompt, { key, value });
        save(pending.prompt, response, { key, value });
        setPending(null);
      } catch {
        // The provisional answer is still good — don't strand the user.
        save(pending.prompt, pending.response);
        setPending(null);
      } finally {
        setLoading(false);
      }
    },
    [call, pending, save],
  );

  /** Skip the question and take the answer we already have. */
  const skipFollowUp = React.useCallback(() => {
    if (!pending) return;
    save(pending.prompt, pending.response);
    setPending(null);
  }, [pending, save]);

  return {
    ask,
    loading,
    error,
    followUp: pending?.response.followUp ?? null,
    answerFollowUp,
    skipFollowUp,
    clearError: () => setError(null),
  };
}
