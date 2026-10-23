import type { Place, UnitSystem } from './types';

const KEYS = {
  units: 'weather:units',
  favorites: 'weather:favorites',
  lastPlace: 'weather:last-place',
} as const;

const MAX_FAVORITES = 8;

function read<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

function write(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Storage can be full or blocked (private mode); persistence is best-effort.
  }
}

export function isValidPlace(value: unknown): value is Place {
  if (!value || typeof value !== 'object') return false;
  const p = value as Record<string, unknown>;
  return (
    typeof p.name === 'string' &&
    typeof p.latitude === 'number' &&
    typeof p.longitude === 'number' &&
    Math.abs(p.latitude) <= 90 &&
    Math.abs(p.longitude) <= 180
  );
}

export function samePlace(a: Place, b: Place): boolean {
  return Math.abs(a.latitude - b.latitude) < 0.01 && Math.abs(a.longitude - b.longitude) < 0.01;
}

export function defaultUnits(locale = typeof navigator !== 'undefined' ? navigator.language : 'en-GB'): UnitSystem {
  // Countries that primarily use Fahrenheit.
  return /-(US|LR|MM|BS|BZ|KY|PW)$/i.test(locale) ? 'imperial' : 'metric';
}

export function loadUnits(): UnitSystem {
  const stored = read<string>(KEYS.units);
  return stored === 'metric' || stored === 'imperial' ? stored : defaultUnits();
}

export function saveUnits(units: UnitSystem): void {
  write(KEYS.units, units);
}

export function loadFavorites(): Place[] {
  const stored = read<unknown>(KEYS.favorites);
  return Array.isArray(stored) ? stored.filter(isValidPlace).slice(0, MAX_FAVORITES) : [];
}

export function saveFavorites(favorites: Place[]): void {
  write(KEYS.favorites, favorites.slice(0, MAX_FAVORITES));
}

export function toggleFavorite(favorites: Place[], place: Place): Place[] {
  const exists = favorites.some((f) => samePlace(f, place));
  const next = exists ? favorites.filter((f) => !samePlace(f, place)) : [place, ...favorites];
  return next.slice(0, MAX_FAVORITES);
}

export function loadLastPlace(): Place | null {
  const stored = read<unknown>(KEYS.lastPlace);
  return isValidPlace(stored) ? stored : null;
}

export function saveLastPlace(place: Place): void {
  write(KEYS.lastPlace, place);
}

/** Reads a shareable place from the page URL (?lat=..&lon=..&name=..). */
export function placeFromUrl(search = location.search): Place | null {
  const params = new URLSearchParams(search);
  const lat = Number.parseFloat(params.get('lat') ?? '');
  const lon = Number.parseFloat(params.get('lon') ?? '');
  const candidate = {
    name: params.get('name')?.slice(0, 80) || 'Selected location',
    latitude: lat,
    longitude: lon,
    region: params.get('region')?.slice(0, 120) || undefined,
  };
  return Number.isFinite(lat) && Number.isFinite(lon) && isValidPlace(candidate) ? candidate : null;
}

export function placeToSearch(place: Place): string {
  const params = new URLSearchParams({
    lat: place.latitude.toFixed(4),
    lon: place.longitude.toFixed(4),
    name: place.name,
  });
  if (place.region) params.set('region', place.region);
  return `?${params}`;
}
