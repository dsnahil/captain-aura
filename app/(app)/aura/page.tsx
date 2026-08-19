"use client";

import * as React from "react";
import Link from "next/link";
import { Check, Pencil, Sparkles, Trash2, X } from "lucide-react";
import { Card, Eyebrow } from "@/components/ui/card";
import { Input } from "@/components/ui/field";
import { EmptyState } from "@/components/ui/misc";
import {
  BUILDS,
  COLOURS,
  COMMUNICATE,
  FACIAL_HAIR,
  FIT_PREFERENCES,
  HAIR_THICKNESS,
  HAIR_TYPES,
  labelOf,
  labelsOf,
  STYLE_TAGS,
} from "@/lib/domain/enums";
import type { MemoryEntry } from "@/lib/domain/types";
import { useAura } from "@/lib/store/aura";

/** Groups memory into the sections a person would expect to see. */
const SECTIONS: { key: string; label: string; match: (m: MemoryEntry) => boolean }[] = [
  { key: "dislikes", label: "I don't like", match: (m) => m.kind === "dislike" },
  { key: "likes", label: "I like", match: (m) => m.kind === "like" },
  { key: "goals", label: "My goals", match: (m) => m.kind === "goal" },
];

export default function AuraMemoryPage() {
  const profile = useAura((s) => s.profile);
  const memory = useAura((s) => s.memory);
  const deleteMemory = useAura((s) => s.deleteMemory);
  const editMemory = useAura((s) => s.editMemory);

  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [draft, setDraft] = React.useState("");

  const startEdit = (m: MemoryEntry) => {
    setEditingId(m.id);
    setDraft(m.label);
  };

  const commit = () => {
    if (editingId && draft.trim()) editMemory(editingId, draft.trim());
    setEditingId(null);
  };

  return (
    <div className="space-y-10">
      <header>
        <div className="flex items-center gap-2.5">
          <Sparkles className="size-4 text-ember" />
          <Eyebrow>Aura memory</Eyebrow>
        </div>
        <h1 className="title mt-4 text-balance">
          What Captain Aura knows about you.
        </h1>
        <p className="mt-4 max-w-lg text-[0.9375rem] leading-relaxed text-pretty text-ink-faint">
          From your answers and your feedback. Delete anything that&rsquo;s wrong.
        </p>
      </header>

      {/* ------------------------------- profile ---------------------------- */}
      <section>
        <Eyebrow className="mb-4">The basics</Eyebrow>
        <Card className="divide-y divide-line">
          <Row label="Build" value={labelOf(BUILDS, profile.about.build)} />
          <Row
            label="Style"
            value={labelsOf(STYLE_TAGS, profile.style.styles).join(" / ")}
          />
          <Row label="Fit" value={labelOf(FIT_PREFERENCES, profile.style.fit)} />
          <Row
            label="Colours"
            value={labelsOf(COLOURS, profile.style.colours).join(", ")}
          />
          <Row
            label="Hair"
            value={[
              labelOf(HAIR_THICKNESS, profile.appearance.hairThickness),
              labelOf(HAIR_TYPES, profile.appearance.hairType),
            ]
              .filter(Boolean)
              .join(" / ")}
          />
          <Row label="Beard" value={labelOf(FACIAL_HAIR, profile.appearance.facialHair)} />
          <Row
            label="Grooming"
            value={
              profile.grooming.time === "enjoy"
                ? "Enjoys grooming"
                : profile.grooming.time
                  ? `${profile.grooming.time} minutes`
                  : ""
            }
          />
          <Row
            label="Wants to read as"
            value={labelsOf(COMMUNICATE, profile.style.communicate).join(", ")}
          />
        </Card>
        <Link
          href="/profile"
          className="tap mt-3 inline-block text-sm text-ember underline underline-offset-4 hover:text-ember-deep"
        >
          Edit your profile
        </Link>
      </section>

      {/* ------------------------------- learned ---------------------------- */}
      {memory.length === 0 ? (
        <EmptyState
          title="I haven't learned anything yet"
          body="Ask a question and rate the answer. What you tell me shows up here, and you stay in control of it."
        />
      ) : (
        SECTIONS.map((section) => {
          const entries = memory
            .filter(section.match)
            .sort((a, b) => b.confidence - a.confidence);
          if (!entries.length) return null;

          return (
            <section key={section.key}>
              <Eyebrow className="mb-4">{section.label}</Eyebrow>
              <ul className="space-y-2">
                {entries.map((m) => (
                  <li
                    key={m.id}
                    className="flex items-center gap-3 rounded-2xl border border-line px-5 py-4"
                  >
                    {editingId === m.id ? (
                      <>
                        <Input
                          value={draft}
                          onChange={(e) => setDraft(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") commit();
                            if (e.key === "Escape") setEditingId(null);
                          }}
                          autoFocus
                          className="min-h-10 py-1.5"
                          aria-label="Edit memory"
                        />
                        <button
                          onClick={commit}
                          aria-label="Save"
                          className="rounded-full p-2 text-ember hover:bg-surface"
                        >
                          <Check className="size-4" />
                        </button>
                        <button
                          onClick={() => setEditingId(null)}
                          aria-label="Cancel"
                          className="rounded-full p-2 text-ink-faint hover:bg-surface"
                        >
                          <X className="size-4" />
                        </button>
                      </>
                    ) : (
                      <>
                        <div className="min-w-0 flex-1">
                          <p className="text-[0.9375rem] text-ink">{m.label}</p>
                          <p className="mt-0.5 text-xs text-ink-faint">
                            From {sourceLabel(m.source)}
                            {m.confidence >= 0.85 ? " · strong signal" : ""}
                          </p>
                        </div>
                        <button
                          onClick={() => startEdit(m)}
                          aria-label={`Edit: ${m.label}`}
                          className="rounded-full p-2 text-ink-faint transition-colors hover:text-ink"
                        >
                          <Pencil className="size-3.5" />
                        </button>
                        <button
                          onClick={() => deleteMemory(m.id)}
                          aria-label={`Forget: ${m.label}`}
                          className="rounded-full p-2 text-ink-faint transition-colors hover:text-ember"
                        >
                          <Trash2 className="size-3.5" />
                        </button>
                      </>
                    )}
                  </li>
                ))}
              </ul>
            </section>
          );
        })
      )}

      <p className="rounded-xl border border-dashed border-line px-4 py-4 text-xs leading-relaxed text-ink-faint">
        Only preferences are kept — never your raw messages.
      </p>
    </div>
  );
}

function Row({ label, value }: { label: string; value?: string }) {
  return (
    <div className="flex items-baseline gap-4 px-5 py-3.5">
      <span className="w-32 shrink-0 text-[0.9375rem] font-medium text-ink-soft">
        {label}
      </span>
      <span className="flex-1 text-sm text-ink">
        {value && value.length > 0 ? (
          capitalise(value)
        ) : (
          <span className="text-ink-faint">Not set</span>
        )}
      </span>
    </div>
  );
}

function capitalise(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function sourceLabel(source: MemoryEntry["source"]) {
  return {
    onboarding: "your Aura profile",
    prompt: "something you asked",
    feedback: "your feedback",
    manual: "you",
    demo: "the demo profile",
  }[source];
}
