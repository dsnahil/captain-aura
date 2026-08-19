/**
 * Analytics abstraction. No paid platform required — the default sink is a
 * dev-only console logger. Swap `sink` for PostHog/Segment/Plausible later
 * without touching a single call site.
 */

export type AnalyticsEvent =
  | "landing_view"
  | "demo_started"
  | "aura_started"
  | "aura_step_completed"
  | "aura_completed"
  | "request_created"
  | "recommendation_generated"
  | "recommendation_saved"
  | "recommendation_tried"
  | "recommendation_rejected"
  | "feedback_submitted"
  | "followup_answered"
  | "wardrobe_item_added"
  | "wardrobe_item_deleted"
  | "profile_updated"
  | "memory_deleted"
  | "location_granted"
  | "location_denied";

type Props = Record<string, string | number | boolean | undefined>;

export interface AnalyticsSink {
  track(event: AnalyticsEvent, props?: Props): void;
}

class ConsoleSink implements AnalyticsSink {
  track(event: AnalyticsEvent, props?: Props) {
    if (process.env.NODE_ENV === "development") {
      console.debug(`[analytics] ${event}`, props ?? {});
    }
  }
}

class NoopSink implements AnalyticsSink {
  track() {}
}

let sink: AnalyticsSink =
  process.env.NODE_ENV === "development" ? new ConsoleSink() : new NoopSink();

export function setAnalyticsSink(next: AnalyticsSink) {
  sink = next;
}

export function track(event: AnalyticsEvent, props?: Props) {
  try {
    sink.track(event, props);
  } catch {
    // Analytics must never break the product.
  }
}
