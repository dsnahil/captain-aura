import "server-only";

export type GeocodeResult = {
  label: string;
  latitude: number;
  longitude: number;
  country?: string;
};

export interface GeocodeProvider {
  readonly name: string;
  search(query: string): Promise<GeocodeResult[]>;
}

/** Open-Meteo geocoding: free, keyless, no account. */
export class OpenMeteoGeocodeProvider implements GeocodeProvider {
  readonly name = "open-meteo-geocoding";

  async search(query: string): Promise<GeocodeResult[]> {
    const params = new URLSearchParams({
      name: query,
      count: "5",
      language: "en",
      format: "json",
    });
    const res = await fetch(
      `https://geocoding-api.open-meteo.com/v1/search?${params}`,
      { next: { revalidate: 86_400 }, signal: AbortSignal.timeout(8000) },
    );
    if (!res.ok) throw new Error(`geocoding ${res.status}`);
    const data = await res.json();

    return (data.results ?? []).map(
      (r: {
        name: string;
        admin1?: string;
        country?: string;
        latitude: number;
        longitude: number;
      }) => ({
        // Country-level queries return name === country ("Japan, Japan").
        label: Array.from(
          new Set([r.name, r.admin1, r.country].filter(Boolean) as string[]),
        ).join(", "),
        latitude: r.latitude,
        longitude: r.longitude,
        country: r.country,
      }),
    );
  }
}

/** A handful of well-known cities so manual entry still works offline. */
const OFFLINE_CITIES: GeocodeResult[] = [
  { label: "Boston, Massachusetts, United States", latitude: 42.3601, longitude: -71.0589 },
  { label: "New York, New York, United States", latitude: 40.7128, longitude: -74.006 },
  { label: "San Francisco, California, United States", latitude: 37.7749, longitude: -122.4194 },
  { label: "London, England, United Kingdom", latitude: 51.5072, longitude: -0.1276 },
  { label: "Tokyo, Japan", latitude: 35.6762, longitude: 139.6503 },
  { label: "Paris, Île-de-France, France", latitude: 48.8566, longitude: 2.3522 },
  { label: "Berlin, Germany", latitude: 52.52, longitude: 13.405 },
  { label: "Toronto, Ontario, Canada", latitude: 43.6532, longitude: -79.3832 },
  { label: "Sydney, New South Wales, Australia", latitude: -33.8688, longitude: 151.2093 },
  { label: "Mumbai, Maharashtra, India", latitude: 19.076, longitude: 72.8777 },
  { label: "Delhi, India", latitude: 28.6139, longitude: 77.209 },
  { label: "Bengaluru, Karnataka, India", latitude: 12.9716, longitude: 77.5946 },
  { label: "Dubai, United Arab Emirates", latitude: 25.2048, longitude: 55.2708 },
  { label: "Singapore", latitude: 1.3521, longitude: 103.8198 },
];

export class OfflineGeocodeProvider implements GeocodeProvider {
  readonly name = "offline-cities";
  async search(query: string): Promise<GeocodeResult[]> {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return OFFLINE_CITIES.filter((c) => c.label.toLowerCase().includes(q)).slice(0, 5);
  }
}

export function getGeocodeProvider(): GeocodeProvider {
  return process.env.GEOCODE_PROVIDER === "offline"
    ? new OfflineGeocodeProvider()
    : new OpenMeteoGeocodeProvider();
}

/** Live lookup, then a small offline city list, then nothing. */
export async function geocodeWithFallback(query: string): Promise<GeocodeResult[]> {
  try {
    const results = await getGeocodeProvider().search(query);
    if (results.length) return results;
  } catch {
    /* fall through to the offline list */
  }
  return new OfflineGeocodeProvider().search(query);
}
