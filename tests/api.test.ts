import { afterEach, describe, expect, it, vi } from 'vitest';
import { ApiError, clearCache, forecastUrl, getWeather, reverseGeocode, searchPlaces, toPlace } from '../src/api';
import { airQuality, makeForecast } from './fixtures';

const place = { name: 'Athens', latitude: 37.98, longitude: 23.72 };

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
}

function mockFetch(handler: (url: string) => Response | Promise<Response>) {
  const fn = vi.fn((input: RequestInfo | URL) => Promise.resolve(handler(String(input))));
  vi.stubGlobal('fetch', fn);
  return fn;
}

afterEach(() => {
  clearCache();
  vi.unstubAllGlobals();
});

describe('api', () => {
  it('builds a forecast URL with all required fields', () => {
    const url = new URL(forecastUrl(37.98381, 23.72754));
    expect(url.searchParams.get('latitude')).toBe('37.9838');
    expect(url.searchParams.get('timeformat')).toBe('unixtime');
    expect(url.searchParams.get('current')).toContain('weather_code');
    expect(url.searchParams.get('daily')).toContain('sunrise');
  });

  it('fetches, combines and caches weather', async () => {
    const fetchMock = mockFetch((url) => jsonResponse(url.includes('air-quality') ? airQuality : makeForecast()));
    const report = await getWeather(place);
    expect(report.current.temperature).toBe(24.6);
    expect(report.airQuality?.usAqi).toBe(42);
    expect(fetchMock).toHaveBeenCalledTimes(2);

    await getWeather(place);
    expect(fetchMock).toHaveBeenCalledTimes(2);

    await getWeather(place, { force: true });
    expect(fetchMock).toHaveBeenCalledTimes(4);
  });

  it('still returns a forecast when air quality fails', async () => {
    mockFetch((url) => (url.includes('air-quality') ? jsonResponse({}, 500) : jsonResponse(makeForecast())));
    const report = await getWeather(place);
    expect(report.airQuality).toBeNull();
  });

  it('surfaces API error reasons', async () => {
    mockFetch(() => jsonResponse({ error: true, reason: 'Latitude must be in range' }, 400));
    await expect(getWeather(place)).rejects.toEqual(new ApiError('Latitude must be in range', 400));
  });

  it('reports network failures with a friendly message', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() => Promise.reject(new TypeError('Failed to fetch'))),
    );
    await expect(getWeather(place)).rejects.toThrow(/Could not reach|offline/);
  });

  it('searches places and formats regions', async () => {
    mockFetch(() =>
      jsonResponse({
        results: [
          {
            id: 1,
            name: 'Paris',
            latitude: 48.85,
            longitude: 2.35,
            country: 'France',
            admin1: 'Île-de-France',
            country_code: 'FR',
          },
        ],
      }),
    );
    expect(await searchPlaces('p')).toEqual([]);
    const results = await searchPlaces('Paris');
    expect(results[0]).toMatchObject({ name: 'Paris', region: 'Île-de-France, France', countryCode: 'FR' });
  });

  it('returns no results when the geocoder has none', async () => {
    mockFetch(() => jsonResponse({ generationtime_ms: 0.1 }));
    expect(await searchPlaces('zzzzzz')).toEqual([]);
  });

  it('dedupes identical region parts', () => {
    expect(
      toPlace({ id: 1, name: 'Singapore', latitude: 1.3, longitude: 103.8, country: 'Singapore', admin1: 'Singapore' })
        .region,
    ).toBe('Singapore');
  });

  it('falls back gracefully when reverse geocoding fails', async () => {
    mockFetch(() => jsonResponse({}, 503));
    const result = await reverseGeocode(1, 2);
    expect(result).toEqual({ name: 'Current location', latitude: 1, longitude: 2 });
  });

  it('names a location from reverse geocoding', async () => {
    mockFetch(() =>
      jsonResponse({
        city: 'Thessaloniki',
        principalSubdivision: 'Central Macedonia',
        countryName: 'Greece',
        countryCode: 'GR',
      }),
    );
    const result = await reverseGeocode(40.64, 22.94);
    expect(result).toMatchObject({ name: 'Thessaloniki', region: 'Central Macedonia, Greece' });
  });
});
