"use client";

import * as React from "react";
import { Check, Crosshair, MapPin, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/field";
import { Spinner } from "@/components/ui/misc";
import { track } from "@/lib/analytics";
import type { LocationContext } from "@/lib/domain/types";

type GeocodeResult = { label: string; latitude: number; longitude: number };

/**
 * Location is always opt-in. If permission is denied the user can type a city
 * instead, and the app works either way.
 */
export function LocationPicker({
  value,
  onChange,
}: {
  value?: LocationContext;
  onChange: (loc: LocationContext) => void;
}) {
  const [asking, setAsking] = React.useState(false);
  const [denied, setDenied] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const [results, setResults] = React.useState<GeocodeResult[]>([]);
  const [searching, setSearching] = React.useState(false);
  const [searchError, setSearchError] = React.useState<string | null>(null);

  const requestDevice = () => {
    if (!("geolocation" in navigator)) {
      setDenied(true);
      return;
    }
    setAsking(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setAsking(false);
        setDenied(false);
        onChange({
          // We deliberately keep only a coarse label — no reverse lookup,
          // no address, nothing beyond what weather needs.
          label: "Your current location",
          latitude: Number(pos.coords.latitude.toFixed(3)),
          longitude: Number(pos.coords.longitude.toFixed(3)),
          source: "device",
          capturedAt: new Date().toISOString(),
        });
        track("location_granted");
      },
      () => {
        setAsking(false);
        setDenied(true);
        track("location_denied");
      },
      { enableHighAccuracy: false, timeout: 10_000, maximumAge: 600_000 },
    );
  };

  const q = query.trim();
  const searchable = q.length >= 2;
  // Derived rather than stored, so clearing the box doesn't need a setState.
  const visibleResults = searchable ? results : [];

  // Debounced city search.
  React.useEffect(() => {
    if (!searchable) return;

    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setSearching(true);
      setSearchError(null);
      try {
        const res = await fetch(`/api/geocode?q=${encodeURIComponent(q)}`, {
          signal: controller.signal,
        });
        const data = await res.json();
        setResults(data.results ?? []);
        if (!data.results?.length) setSearchError("No matching place found.");
      } catch (err) {
        if ((err as Error).name !== "AbortError") {
          setSearchError("Location search is unavailable right now.");
        }
      } finally {
        setSearching(false);
      }
    }, 350);

    return () => {
      controller.abort();
      clearTimeout(timer);
    };
  }, [q, searchable]);

  const select = (r: GeocodeResult) => {
    onChange({
      label: r.label,
      latitude: r.latitude,
      longitude: r.longitude,
      source: "manual",
      capturedAt: new Date().toISOString(),
    });
    setQuery("");
    setResults([]);
  };

  const hasLocation = value?.latitude !== undefined;

  return (
    <div className="space-y-5">
      {hasLocation && (
        <div className="flex items-center gap-3 rounded-xl border border-ember-line bg-ember-tint px-4 py-3.5">
          <Check className="size-4 shrink-0 text-ember" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm text-ember">{value?.label}</p>
            <p className="text-xs text-ink-faint">
              {value?.source === "device"
                ? "From your device, used only for weather"
                : "Set manually"}
            </p>
          </div>
        </div>
      )}

      <Button
        type="button"
        variant={hasLocation ? "ghost" : "secondary"}
        size="md"
        onClick={requestDevice}
        disabled={asking}
        className="w-full"
      >
        {asking ? <Spinner /> : <Crosshair className="size-4" />}
        {hasLocation ? "Use my current location instead" : "Use my current location"}
      </Button>

      {denied && (
        <p className="text-sm text-ink-faint">
          No problem — Captain Aura works without it. Enter a city and
          you&rsquo;ll still get weather-aware recommendations.
        </p>
      )}

      <div>
        <div className="relative">
          <Search className="pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2 text-ink-faint" />
          <Input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Or enter a city"
            className="pl-11"
            aria-label="Search for a city"
          />
          {searching && (
            <Spinner className="absolute top-1/2 right-4 -translate-y-1/2 text-ink-faint" />
          )}
        </div>

        {searchError && searchable && !searching && (
          <p className="mt-2 text-xs text-ink-faint">{searchError}</p>
        )}

        {visibleResults.length > 0 && (
          <ul className="mt-2 overflow-hidden rounded-xl border border-line">
            {visibleResults.map((r) => (
              <li key={`${r.latitude},${r.longitude}`}>
                <button
                  type="button"
                  onClick={() => select(r)}
                  className="flex w-full items-center gap-3 border-b border-line px-4 py-3 text-left text-sm text-ink-soft transition-colors last:border-0 hover:bg-surface hover:text-ink"
                >
                  <MapPin className="size-3.5 shrink-0 text-ink-faint" />
                  <span className="truncate">{r.label}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
