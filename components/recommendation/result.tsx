"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Check,
  CloudRain,
  Droplets,
  Info,
  MapPin,
  Scissors,
  ShoppingBag,
  Sparkles,
  Thermometer,
  Wind,
  X,
} from "lucide-react";
import { FeedbackPanel } from "@/components/recommendation/feedback";
import { Eyebrow } from "@/components/ui/card";
import { Pill } from "@/components/ui/misc";
import { COLOURS, SLOT_LABEL, labelOf, type OutfitSlot } from "@/lib/domain/enums";
import type { AuraRequest } from "@/lib/domain/types";
import { useAura } from "@/lib/store/aura";
import { relativeDay } from "@/lib/utils";

export function RecommendationResult({ request }: { request: AuraRequest }) {
  const r = request.recommendation;
  const wardrobe = useAura((s) => s.wardrobe);
  const byId = React.useMemo(
    () => new Map(wardrobe.map((w) => [w.id, w])),
    [wardrobe],
  );

  const w = request.weather;
  const thumbs = r.outfit
    .map((p) => (p.ownedItemId ? byId.get(p.ownedItemId) : undefined))
    .filter((i) => i?.image);

  return (
    <article className="space-y-12">
      {/* ------------------------------------------------------------ header */}
      <header className="rise">
        <p className="text-[0.9375rem] font-semibold text-ember">{r.title}</p>

        <h1 className="title mt-3 text-balance">{r.vibe}</h1>

        <div className="mt-6 flex flex-wrap gap-2">
          <Pill>{request.situation.activityLabel}</Pill>
          <Pill>
            {relativeDay(request.situation.date, new Date(request.createdAt))}
          </Pill>
          {request.location?.label && (
            <Pill>
              <MapPin className="size-4 text-ember" strokeWidth={1.75} />
              {request.location.label.split(",")[0]}
            </Pill>
          )}
          {w && (
            <>
              <Pill>
                <Thermometer className="size-4 text-ember" strokeWidth={1.75} />
                {Math.round(w.temperatureC)}°C
              </Pill>
              {w.precipitationProbability !== undefined &&
                w.precipitationProbability > 0 && (
                  <Pill>
                    <Droplets className="size-4 text-ember" strokeWidth={1.75} />
                    {w.precipitationProbability}%
                  </Pill>
                )}
              {w.windKph !== undefined && w.windKph >= 20 && (
                <Pill>
                  <Wind className="size-4 text-ember" strokeWidth={1.75} />
                  {Math.round(w.windKph)} km/h
                </Pill>
              )}
            </>
          )}
        </div>

        <p className="mt-7 text-lg leading-relaxed text-pretty text-ink-soft">
          {r.approach}
        </p>
      </header>

      {/* ----------------------------------------------------- outfit strip */}
      {thumbs.length > 1 && (
        <section className="rise" style={{ "--i": 1 } as React.CSSProperties}>
          <div className="bleed no-bar flex gap-3 overflow-x-auto">
            {thumbs.map((item) => (
              <div
                key={item!.id}
                className="relative aspect-[3/4] w-32 shrink-0 overflow-hidden rounded-2xl bg-surface"
              >
                <Image
                  src={item!.image!}
                  alt={item!.name}
                  fill
                  sizes="128px"
                  className="object-cover"
                  unoptimized
                />
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ------------------------------------------------------------- wear */}
      {r.outfit.length > 0 && (
        <Section label="Wear" i={2}>
          <ul className="divide-y divide-line overflow-hidden rounded-[20px] border border-line">
            {r.outfit.map((piece, i) => (
              <li key={`${piece.slot}-${i}`} className="flex gap-4 px-5 py-5">
                <span className="w-16 shrink-0 pt-0.5 text-sm font-semibold text-ink-faint">
                  {SLOT_LABEL[piece.slot as OutfitSlot] ?? piece.slot}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex flex-wrap items-center gap-2">
                    <span className="font-semibold">{piece.label}</span>
                    {piece.ownedItemId && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-ember-tint px-2.5 py-1 text-xs font-bold text-ember-deep">
                        <Check className="size-3" strokeWidth={2.5} />
                        Yours
                      </span>
                    )}
                  </span>
                  {piece.detail && (
                    <span className="mt-1 block text-[0.9375rem] text-pretty text-ink-soft">
                      {piece.detail}
                    </span>
                  )}
                </span>
                {piece.colourSuggestion && (
                  <span
                    aria-label={labelOf(COLOURS, piece.colourSuggestion)}
                    title={labelOf(COLOURS, piece.colourSuggestion)}
                    className="mt-1 size-5 shrink-0 rounded-full ring-1 ring-black/10"
                    style={{
                      background:
                        COLOURS.find((c) => c.value === piece.colourSuggestion)
                          ?.hint ?? "transparent",
                    }}
                  />
                )}
              </li>
            ))}
          </ul>
        </Section>
      )}

      {/* -------------------------------------------------------------- plan */}
      {r.plan && r.plan.length > 0 && (
        <Section label="The plan" i={2}>
          <ol className="space-y-6">
            {r.plan.map((step, i) => (
              <li key={i} className="flex gap-4">
                <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-surface text-sm font-bold">
                  {i + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-baseline gap-2.5">
                    <h3 className="font-bold">{step.title}</h3>
                    {step.horizon && (
                      <span className="text-sm font-medium text-ink-faint">
                        {step.horizon}
                      </span>
                    )}
                  </div>
                  <p className="mt-1.5 text-pretty text-ink-soft">{step.detail}</p>
                </div>
              </li>
            ))}
          </ol>
        </Section>
      )}

      {/* ----------------------------------------------------------- packing */}
      {r.packing && r.packing.length > 0 && (
        <Section label="What to pack" i={3}>
          <ul className="space-y-3">
            {r.packing.map((item, i) => (
              <li key={i} className="flex gap-3 text-ink-soft">
                <Check
                  className="mt-1 size-4 shrink-0 text-ember"
                  strokeWidth={2.25}
                />
                <span className="text-pretty">{item}</span>
              </li>
            ))}
          </ul>
        </Section>
      )}

      {/* ----------------------------------------------------------- palette */}
      {r.palette.length > 0 && (
        <Section label="Palette" i={3}>
          <div className="flex flex-wrap gap-4">
            {r.palette.map((c) => (
              <div key={c} className="flex items-center gap-2.5">
                <span
                  aria-hidden
                  className="size-9 rounded-full ring-1 ring-black/10"
                  style={{
                    background: COLOURS.find((x) => x.value === c)?.hint ?? "#ccc",
                  }}
                />
                <span className="font-medium">{labelOf(COLOURS, c) || c}</span>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* --------------------------------------------------------------- why */}
      {r.reasons.length > 0 && (
        <Section label="Why this works for you" i={4}>
          <ul className="space-y-4">
            {r.reasons.map((reason, i) => (
              <li key={i} className="flex gap-3.5">
                <span className="mt-2.5 size-1.5 shrink-0 rounded-full bg-ember" />
                <p className="text-pretty text-ink-soft">{reason}</p>
              </li>
            ))}
          </ul>
        </Section>
      )}

      {/* ---------------------------------------------------- weather/social */}
      {r.weatherNote && (
        <Note icon={<CloudRain className="size-5" strokeWidth={1.75} />}>
          {r.weatherNote}
        </Note>
      )}
      {r.socialNote && (
        <Note icon={<Sparkles className="size-5" strokeWidth={1.75} />}>
          {r.socialNote}
        </Note>
      )}

      {/* ---------------------------------------------------------- grooming */}
      {(r.grooming.hair || r.grooming.beard || r.grooming.fragrance) && (
        <Section label="Grooming" i={5}>
          <dl className="space-y-5">
            {(
              [
                ["Hair", r.grooming.hair],
                ["Beard", r.grooming.beard],
                ["Fragrance", r.grooming.fragrance],
                ["Detail", r.grooming.extra],
              ] as const
            )
              .filter(([, v]) => !!v)
              .map(([k, v]) => (
                <div key={k} className="flex gap-4">
                  <Scissors
                    className="mt-1 size-4 shrink-0 text-ember"
                    strokeWidth={1.75}
                  />
                  <div className="min-w-0 flex-1">
                    <dt className="font-semibold">{k}</dt>
                    <dd className="mt-1 text-pretty text-ink-soft">{v}</dd>
                  </div>
                </div>
              ))}
          </dl>
        </Section>
      )}

      {/* ------------------------------------------------------------- avoid */}
      {r.avoid.length > 0 && (
        <Section label="Skip" i={6}>
          <ul className="space-y-3.5">
            {r.avoid.map((a, i) => (
              <li key={i} className="flex gap-3.5">
                <X
                  className="mt-1 size-4 shrink-0 text-ink-faint"
                  strokeWidth={2.25}
                />
                <p className="text-pretty text-ink-soft">{a}</p>
              </li>
            ))}
          </ul>
        </Section>
      )}

      {/* ---------------------------------------------------------- wardrobe */}
      <Section label="Your closet" i={7}>
        <div
          className={
            r.wardrobeVerdict.status === "complete"
              ? "rounded-[20px] bg-ember-tint p-6"
              : "tinted p-6"
          }
        >
          <p
            className={
              r.wardrobeVerdict.status === "complete"
                ? "text-lg font-bold text-ember-deep"
                : "text-lg font-semibold"
            }
          >
            {r.wardrobeVerdict.headline}
          </p>

          {r.wardrobeVerdict.missing.length > 0 && (
            <div className="mt-5 space-y-4 border-t border-line-strong pt-5">
              {r.wardrobeVerdict.missing.map((m, i) => (
                <div key={i} className="flex gap-3.5">
                  <ShoppingBag
                    className="mt-0.5 size-5 shrink-0 text-ink-faint"
                    strokeWidth={1.6}
                  />
                  <div>
                    <p className="font-semibold">{m.label}</p>
                    <p className="mt-0.5 text-pretty text-ink-soft">{m.why}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {r.wardrobeVerdict.status === "none" && (
            <Link
              href="/closet"
              className="tap mt-4 inline-block font-semibold text-ember"
            >
              Add your clothes
            </Link>
          )}
        </div>
      </Section>

      {/* --------------------------------------------------------- next move */}
      <Section label="Next move" i={8}>
        <p className="text-lg leading-relaxed text-pretty">{r.nextMove}</p>
      </Section>

      {/* ----------------------------------------------------------- caveats */}
      {(r.caveats.length > 0 || r.engineNote) && (
        <section className="tinted px-6 py-5">
          <p className="flex items-center gap-2 font-semibold text-ink-soft">
            <Info className="size-4" strokeWidth={1.75} />
            What I didn&rsquo;t know
          </p>
          <ul className="mt-3 space-y-2">
            {r.engineNote && (
              <li className="text-[0.9375rem] text-ink-soft">{r.engineNote}</li>
            )}
            {r.caveats.map((c, i) => (
              <li key={i} className="text-[0.9375rem] text-pretty text-ink-soft">
                {c}
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* ---------------------------------------------------------- feedback */}
      <FeedbackPanel request={request} />

      <p className="pb-2 text-center text-sm text-ink-faint">
        From Captain Aura&rsquo;s{" "}
        {r.engine === "ai" ? "AI advisor" : "recommendation rules"}. Style advice
        is subjective.
      </p>
    </article>
  );
}

/* -------------------------------- helpers ---------------------------------- */

function Section({
  label,
  i = 0,
  children,
}: {
  label: string;
  i?: number;
  children: React.ReactNode;
}) {
  return (
    <section className="rise" style={{ "--i": i } as React.CSSProperties}>
      <Eyebrow className="mb-5">{label}</Eyebrow>
      {children}
    </section>
  );
}

function Note({
  icon,
  children,
}: {
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="flex gap-4 rounded-[20px] border border-line px-6 py-5">
      <span className="mt-0.5 shrink-0 text-ember">{icon}</span>
      <p className="text-pretty text-ink-soft">{children}</p>
    </section>
  );
}
