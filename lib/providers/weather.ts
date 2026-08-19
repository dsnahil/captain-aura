import "server-only";
import type { Weather } from "@/lib/domain/types";
import { startOfDay } from "@/lib/utils";

/* ============================================================================
   WeatherProvider — swap the implementation without touching the engine.
   ========================================================================== */

export type WeatherQuery = {
  latitude: number;
  longitude: number;
  /** ISO date of the situation. Past 16 days falls back to seasonal norms. */
  date?: string;
  locationLabel?: string;
};

export interface WeatherProvider {
  readonly name: string;
  getCurrentWeather(q: WeatherQuery): Promise<Weather>;
  getForecast(q: WeatherQuery): Promise<Weather>;
}

/* ----------------------------- WMO code mapping ---------------------------- */

const WMO: Record<number, string> = {
  0: "Clear",
  1: "Mostly clear",
  2: "Partly cloudy",
  3: "Overcast",
  45: "Fog",
  48: "Freezing fog",
  51: "Light drizzle",
  53: "Drizzle",
  55: "Heavy drizzle",
  56: "Freezing drizzle",
  57: "Freezing drizzle",
  61: "Light rain",
  63: "Rain",
  65: "Heavy rain",
  66: "Freezing rain",
  67: "Freezing rain",
  71: "Light snow",
  73: "Snow",
  75: "Heavy snow",
  77: "Snow grains",
  80: "Rain showers",
  81: "Rain showers",
  82: "Heavy rain showers",
  85: "Snow showers",
  86: "Heavy snow showers",
  95: "Thunderstorm",
  96: "Thunderstorm with hail",
  99: "Thunderstorm with hail",
};

function conditionFor(code: number | undefined): string {
  if (code === undefined) return "Unknown";
  return WMO[code] ?? "Mixed";
}

/* ============================================================================
   LIVE — Open-Meteo. Free, keyless, no attribution requirement, no account.
   ========================================================================== */

export class OpenMeteoWeatherProvider implements WeatherProvider {
  readonly name = "open-meteo";

  async getCurrentWeather(q: WeatherQuery): Promise<Weather> {
    return this.fetchWeather(q, new Date().toISOString());
  }

  async getForecast(q: WeatherQuery): Promise<Weather> {
    return this.fetchWeather(q, q.date ?? new Date().toISOString());
  }

  private async fetchWeather(q: WeatherQuery, isoDate: string): Promise<Weather> {
    const params = new URLSearchParams({
      latitude: String(q.latitude),
      longitude: String(q.longitude),
      current:
        "temperature_2m,apparent_temperature,relative_humidity_2m,precipitation,wind_speed_10m,weather_code",
      daily:
        "weather_code,temperature_2m_max,temperature_2m_min,apparent_temperature_max,precipitation_probability_max,precipitation_sum,wind_speed_10m_max,uv_index_max,sunrise,sunset",
      timezone: "auto",
      forecast_days: "16",
    });

    const res = await fetch(`https://api.open-meteo.com/v1/forecast?${params}`, {
      // Weather changes slowly enough that 15 minutes of caching is safe and
      // keeps us far below any fair-use threshold.
      next: { revalidate: 900 },
      signal: AbortSignal.timeout(8000),
    });

    if (!res.ok) throw new Error(`open-meteo ${res.status}`);
    const data = await res.json();

    const target = startOfDay(new Date(isoDate)).getTime();
    const days: string[] = data.daily?.time ?? [];
    // Open-Meteo returns local calendar dates; parse as local to compare.
    const idx = days.findIndex(
      (d) => startOfDay(new Date(`${d}T00:00:00`)).getTime() === target,
    );

    const isToday =
      target === startOfDay(new Date()).getTime() || idx === -1;

    const cur = data.current ?? {};
    const daily = data.daily ?? {};
    const at = <T,>(arr: T[] | undefined): T | undefined =>
      idx >= 0 && arr ? arr[idx] : undefined;

    const dayCode = at<number>(daily.weather_code);
    const highC = at<number>(daily.temperature_2m_max);
    const lowC = at<number>(daily.temperature_2m_min);

    // Today -> live current conditions. Future day -> that day's forecast.
    const temperatureC = isToday
      ? Number(cur.temperature_2m)
      : Math.round((((highC ?? 0) + (lowC ?? 0)) / 2) * 10) / 10;

    const feelsLikeC = isToday
      ? Number(cur.apparent_temperature ?? cur.temperature_2m)
      : (at<number>(daily.apparent_temperature_max) ?? temperatureC);

    return {
      temperatureC: round1(temperatureC),
      feelsLikeC: round1(feelsLikeC),
      highC: highC !== undefined ? round1(highC) : undefined,
      lowC: lowC !== undefined ? round1(lowC) : undefined,
      precipitationProbability: at<number>(daily.precipitation_probability_max),
      precipitationMm: at<number>(daily.precipitation_sum),
      windKph: round1(
        isToday
          ? Number(cur.wind_speed_10m ?? 0)
          : (at<number>(daily.wind_speed_10m_max) ?? 0),
      ),
      humidity: isToday ? Number(cur.relative_humidity_2m) : undefined,
      uvIndex: at<number>(daily.uv_index_max),
      sunrise: at<string>(daily.sunrise),
      sunset: at<string>(daily.sunset),
      condition: conditionFor(isToday ? cur.weather_code : dayCode),
      source: "live",
      locationLabel: q.locationLabel,
      date: isoDate,
    };
  }
}

/* ============================================================================
   MOCK — deterministic, seasonally plausible. Always reports source:"mock"
   so the UI can say so rather than implying a live reading.
   ========================================================================== */

export class MockWeatherProvider implements WeatherProvider {
  readonly name = "mock";

  async getCurrentWeather(q: WeatherQuery): Promise<Weather> {
    return this.make(q, new Date().toISOString());
  }

  async getForecast(q: WeatherQuery): Promise<Weather> {
    return this.make(q, q.date ?? new Date().toISOString());
  }

  private make(q: WeatherQuery, isoDate: string): Weather {
    const d = new Date(isoDate);
    const seed = hash(`${q.latitude.toFixed(1)}:${q.longitude.toFixed(1)}:${d.toDateString()}`);
    const rnd = (n: number) => ((seed >> n) & 0xff) / 255;

    // Crude but plausible seasonal curve by latitude.
    const dayOfYear = Math.floor(
      (d.getTime() - new Date(d.getFullYear(), 0, 0).getTime()) / 86_400_000,
    );
    const hemisphere = q.latitude >= 0 ? 1 : -1;
    const seasonal = Math.cos(((dayOfYear - 200) / 365) * 2 * Math.PI) * hemisphere;
    const latPenalty = (Math.abs(q.latitude) / 90) * 26;
    const base = 22 - latPenalty + seasonal * 9;

    const temperatureC = round1(base + (rnd(0) - 0.5) * 6);
    const windKph = round1(4 + rnd(8) * 22);
    const precipitationProbability = Math.round(rnd(16) * 100);
    const raining = precipitationProbability > 55;

    return {
      temperatureC,
      feelsLikeC: round1(temperatureC - (windKph > 18 ? 2.5 : 0.8)),
      highC: round1(temperatureC + 3),
      lowC: round1(temperatureC - 4),
      precipitationProbability,
      precipitationMm: raining ? round1(rnd(4) * 8) : 0,
      windKph,
      humidity: Math.round(45 + rnd(20) * 45),
      uvIndex: round1(rnd(12) * 8),
      condition: raining ? "Rain" : precipitationProbability > 30 ? "Partly cloudy" : "Clear",
      source: "mock",
      locationLabel: q.locationLabel,
      date: isoDate,
    };
  }
}

/* ============================================================================ */

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}

function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/**
 * WEATHER_PROVIDER=mock forces the mock (useful offline / in demos).
 * Otherwise we use live Open-Meteo, which needs no API key.
 */
export function getWeatherProvider(): WeatherProvider {
  return process.env.WEATHER_PROVIDER === "mock"
    ? new MockWeatherProvider()
    : new OpenMeteoWeatherProvider();
}

/** Live first, mock second — the app must never break on a weather outage. */
export async function getWeatherWithFallback(
  q: WeatherQuery,
): Promise<{ weather: Weather; degraded: boolean }> {
  const provider = getWeatherProvider();
  try {
    return { weather: await provider.getForecast(q), degraded: false };
  } catch {
    if (provider.name === "mock") {
      return { weather: await provider.getForecast(q), degraded: false };
    }
    const weather = await new MockWeatherProvider().getForecast(q);
    return { weather, degraded: true };
  }
}
