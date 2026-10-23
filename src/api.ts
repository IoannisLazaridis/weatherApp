import { buildReport } from './transform';
import type { AirQualityResponse, ForecastResponse, GeocodingResult, Place, WeatherReport } from './types';

const FORECAST_URL = 'https://api.open-meteo.com/v1/forecast';
const AIR_QUALITY_URL = 'https://air-quality-api.open-meteo.com/v1/air-quality';
const GEOCODING_URL = 'https://geocoding-api.open-meteo.com/v1/search';
const REVERSE_GEOCODING_URL = 'https://api.bigdatacloud.net/data/reverse-geocode-client';

const REQUEST_TIMEOUT_MS = 12_000;
export const CACHE_TTL_MS = 10 * 60 * 1000;

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status?: number,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

/** Fetches JSON with a timeout that also honours an external abort signal. */
export async function fetchJson<T>(url: string, signal?: AbortSignal): Promise<T> {
  const timeout = AbortSignal.timeout(REQUEST_TIMEOUT_MS);
  const combined = signal ? AbortSignal.any([signal, timeout]) : timeout;

  let response: Response;
  try {
    response = await fetch(url, { signal: combined, headers: { Accept: 'application/json' } });
  } catch (error) {
    if (signal?.aborted) throw error;
    if (timeout.aborted) throw new ApiError('The weather service took too long to respond.');
    throw new ApiError(
      navigator.onLine === false ? 'You appear to be offline.' : 'Could not reach the weather service.',
    );
  }

  if (!response.ok) {
    let reason = '';
    try {
      const body = (await response.json()) as { reason?: string };
      reason = body.reason ?? '';
    } catch {
      // Non-JSON error body; ignore.
    }
    throw new ApiError(reason || `Request failed (${response.status}).`, response.status);
  }
  return (await response.json()) as T;
}

const coord = (n: number): string => n.toFixed(4);

export function forecastUrl(lat: number, lon: number): string {
  const params = new URLSearchParams({
    latitude: coord(lat),
    longitude: coord(lon),
    current: [
      'temperature_2m',
      'relative_humidity_2m',
      'apparent_temperature',
      'is_day',
      'precipitation',
      'weather_code',
      'cloud_cover',
      'pressure_msl',
      'wind_speed_10m',
      'wind_direction_10m',
      'wind_gusts_10m',
    ].join(','),
    hourly: ['temperature_2m', 'precipitation_probability', 'weather_code', 'is_day', 'visibility', 'uv_index'].join(
      ',',
    ),
    daily: [
      'weather_code',
      'temperature_2m_max',
      'temperature_2m_min',
      'sunrise',
      'sunset',
      'uv_index_max',
      'precipitation_sum',
      'precipitation_probability_max',
      'wind_speed_10m_max',
    ].join(','),
    timezone: 'auto',
    timeformat: 'unixtime',
    forecast_days: '10',
  });
  return `${FORECAST_URL}?${params}`;
}

export function airQualityUrl(lat: number, lon: number): string {
  const params = new URLSearchParams({
    latitude: coord(lat),
    longitude: coord(lon),
    current: 'us_aqi,pm2_5,pm10',
    timezone: 'auto',
    timeformat: 'unixtime',
  });
  return `${AIR_QUALITY_URL}?${params}`;
}

const reportCache = new Map<string, WeatherReport>();
const cacheKey = (place: Place): string => `${place.latitude.toFixed(2)},${place.longitude.toFixed(2)}`;

export function clearCache(): void {
  reportCache.clear();
}

export async function getWeather(
  place: Place,
  { signal, force = false }: { signal?: AbortSignal; force?: boolean } = {},
): Promise<WeatherReport> {
  const key = cacheKey(place);
  const cached = reportCache.get(key);
  if (!force && cached && Date.now() - cached.fetchedAt < CACHE_TTL_MS) {
    return { ...cached, place };
  }

  const [forecast, airQuality] = await Promise.all([
    fetchJson<ForecastResponse>(forecastUrl(place.latitude, place.longitude), signal),
    // Air quality is a nice-to-have: never let it break the main forecast.
    fetchJson<AirQualityResponse>(airQualityUrl(place.latitude, place.longitude), signal).catch((error: unknown) => {
      if (signal?.aborted) throw error;
      return null;
    }),
  ]);

  const report = buildReport(place, forecast, airQuality);
  reportCache.set(key, report);
  return report;
}

export function toPlace(result: GeocodingResult): Place {
  const region = [result.admin1, result.country].filter((part, i, all) => part && all.indexOf(part) === i).join(', ');
  return {
    name: result.name,
    latitude: result.latitude,
    longitude: result.longitude,
    region: region || undefined,
    countryCode: result.country_code,
  };
}

export async function searchPlaces(query: string, signal?: AbortSignal): Promise<Place[]> {
  const trimmed = query.trim();
  if (trimmed.length < 2) return [];
  const params = new URLSearchParams({
    name: trimmed,
    count: '8',
    language: navigator.language?.split('-')[0] || 'en',
    format: 'json',
  });
  const data = await fetchJson<{ results?: GeocodingResult[] }>(`${GEOCODING_URL}?${params}`, signal);
  return (data.results ?? []).map(toPlace);
}

interface ReverseGeocodeResponse {
  city?: string;
  locality?: string;
  principalSubdivision?: string;
  countryName?: string;
  countryCode?: string;
}

/** Best-effort name lookup for coordinates; falls back to a generic label. */
export async function reverseGeocode(lat: number, lon: number, signal?: AbortSignal): Promise<Place> {
  const fallback: Place = { name: 'Current location', latitude: lat, longitude: lon };
  try {
    const params = new URLSearchParams({
      latitude: coord(lat),
      longitude: coord(lon),
      localityLanguage: navigator.language?.split('-')[0] || 'en',
    });
    const data = await fetchJson<ReverseGeocodeResponse>(`${REVERSE_GEOCODING_URL}?${params}`, signal);
    const name = data.city || data.locality || data.principalSubdivision;
    if (!name) return fallback;
    const region = [data.principalSubdivision, data.countryName].filter((part) => part && part !== name).join(', ');
    return { ...fallback, name, region: region || undefined, countryCode: data.countryCode };
  } catch (error) {
    if (signal?.aborted) throw error;
    return fallback;
  }
}

export function getCurrentPosition(): Promise<GeolocationPosition> {
  return new Promise((resolve, reject) => {
    if (!('geolocation' in navigator)) {
      reject(new Error('Geolocation is not supported by this browser.'));
      return;
    }
    navigator.geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: false,
      timeout: 10_000,
      maximumAge: 5 * 60 * 1000,
    });
  });
}

export function geolocationErrorMessage(error: unknown): string {
  if (typeof GeolocationPositionError !== 'undefined' && error instanceof GeolocationPositionError) {
    if (error.code === error.PERMISSION_DENIED) return 'Location access was denied. Search for a city instead.';
    if (error.code === error.TIMEOUT) return 'Finding your location timed out. Try again or search for a city.';
    return 'Your location is unavailable right now. Search for a city instead.';
  }
  return error instanceof Error ? error.message : 'Could not determine your location.';
}
