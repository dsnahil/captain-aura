"use client";

import * as React from "react";
import Image from "next/image";
import { Pencil, Plus, Shirt, Trash2 } from "lucide-react";
import { ItemForm } from "@/components/closet/item-form";
import { Button } from "@/components/ui/button";
import { Eyebrow } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/misc";
import { Sheet } from "@/components/ui/sheet";
import { CATEGORIES, COLOURS, FORMALITY, labelOf } from "@/lib/domain/enums";
import type { WardrobeItem, WardrobeItemInput } from "@/lib/domain/types";
import { useAura } from "@/lib/store/aura";

/** Display groups — friendlier than raw categories. */
const GROUPS: { label: string; categories: string[] }[] = [
  { label: "Tops", categories: ["tshirts", "shirts", "sweaters", "hoodies"] },
  { label: "Outerwear", categories: ["jackets"] },
  { label: "Bottoms", categories: ["pants", "shorts"] },
  { label: "Shoes", categories: ["shoes"] },
  { label: "Accessories", categories: ["accessories"] },
];

export default function ClosetPage() {
  const wardrobe = useAura((s) => s.wardrobe);
  const addWardrobeItem = useAura((s) => s.addWardrobeItem);
  const updateWardrobeItem = useAura((s) => s.updateWardrobeItem);
  const deleteWardrobeItem = useAura((s) => s.deleteWardrobeItem);

  const [adding, setAdding] = React.useState(false);
  const [editing, setEditing] = React.useState<WardrobeItem | null>(null);

  const grouped = GROUPS.map((g) => ({
    ...g,
    items: wardrobe.filter((w) => g.categories.includes(w.category)),
  })).filter((g) => g.items.length > 0);

  return (
    <div className="space-y-9">
      <header className="flex items-end justify-between gap-4">
        <div>
          <Eyebrow>Your closet</Eyebrow>
          <h1 className="title mt-3">
            {wardrobe.length} item{wardrobe.length === 1 ? "" : "s"}
          </h1>
        </div>
        <Button size="md" onClick={() => setAdding(true)}>
          <Plus className="size-4" />
          Add
        </Button>
      </header>

      {wardrobe.length === 0 ? (
        <EmptyState
          icon={<Shirt className="size-6" />}
          title="Your closet is empty"
          body="Once I know what you own, I stop describing outfits and start picking them."
          action={
            <Button onClick={() => setAdding(true)}>
              <Plus className="size-4" />
              Add your first item
            </Button>
          }
        />
      ) : (
        <div className="space-y-10">
          {grouped.map((group) => (
            <section key={group.label}>
              <Eyebrow className="mb-4">
                {group.label} · {group.items.length}
              </Eyebrow>
              <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                {group.items.map((item) => (
                  <li key={item.id}>
                    <ItemCard
                      item={item}
                      onEdit={() => setEditing(item)}
                      onDelete={() => deleteWardrobeItem(item.id)}
                    />
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}

      {/* ------------------------------- add ------------------------------- */}
      <Sheet open={adding} onClose={() => setAdding(false)} title="Add an item">
        <ItemForm
          onSubmit={(item: WardrobeItemInput) => {
            addWardrobeItem(item);
            setAdding(false);
          }}
          onCancel={() => setAdding(false)}
        />
      </Sheet>

      {/* ------------------------------- edit ------------------------------ */}
      <Sheet
        open={!!editing}
        onClose={() => setEditing(null)}
        title="Edit item"
      >
        {editing && (
          <ItemForm
            key={editing.id}
            compact={false}
            defaultValues={editing}
            submitLabel="Save changes"
            onSubmit={(item) => {
              updateWardrobeItem(editing.id, item);
              setEditing(null);
            }}
            onCancel={() => setEditing(null)}
          />
        )}
      </Sheet>
    </div>
  );
}

function ItemCard({
  item,
  onEdit,
  onDelete,
}: {
  item: WardrobeItem;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const swatch = COLOURS.find((c) => c.value === item.colour)?.hint;

  return (
    <div className="group overflow-hidden card-lift">
      <div className="relative aspect-[4/5] bg-surface">
        {item.image ? (
          <Image
            src={item.image}
            alt={item.name}
            fill
            sizes="(max-width: 640px) 50vw, 25vw"
            className="object-cover"
            unoptimized
          />
        ) : (
          <div className="flex size-full items-center justify-center">
            <Shirt className="size-8 text-ink-faint" strokeWidth={1.4} />
          </div>
        )}

        {/* Actions stay visible on touch, where there is no hover. */}
        <div className="absolute top-2 right-2 flex gap-1.5 opacity-100 transition-opacity md:opacity-0 md:group-hover:opacity-100 md:group-focus-within:opacity-100">
          <button
            onClick={onEdit}
            aria-label={`Edit ${item.name}`}
            className="rounded-full bg-canvas p-2.5 text-ink-soft shadow-[0_2px_8px_-2px_rgba(28,27,26,0.25)] transition-colors hover:text-ink"
          >
            <Pencil className="size-4" strokeWidth={1.75} />
          </button>
          <button
            onClick={onDelete}
            aria-label={`Delete ${item.name}`}
            className="rounded-full bg-canvas p-2.5 text-ink-soft shadow-[0_2px_8px_-2px_rgba(28,27,26,0.25)] transition-colors hover:text-ember"
          >
            <Trash2 className="size-4" strokeWidth={1.75} />
          </button>
        </div>
      </div>

      <div className="p-3">
        <p className="truncate text-sm text-ink">{item.name}</p>
        <div className="mt-1.5 flex items-center gap-2">
          {swatch && (
            <span
              aria-hidden
              className="size-2.5 shrink-0 rounded-full ring-1 ring-white/15"
              style={{ background: swatch }}
            />
          )}
          <p className="truncate text-xs text-ink-faint">
            {labelOf(CATEGORIES, item.category)}
            {item.formality ? ` · ${labelOf(FORMALITY, item.formality)}` : ""}
          </p>
        </div>
      </div>
    </div>
  );
}
