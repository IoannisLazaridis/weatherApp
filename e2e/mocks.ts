import type { Page } from '@playwright/test';

const H = 3600;

/** Builds a forecast aligned to the current time so "Now"/"Today" render as in production. */
export function forecastFixture(code = 2, isDay = 1) {
  const now = Math.floor(Date.now() / 1000);
  const dayStart = now - (now % 86400) - 3 * H;
  const hours = 240;
  return {
    latitude: 37.98,
    longitude: 23.72,
    timezone: 'Europe/Athens',
    utc_offset_seconds: 10800,
    current: {
      time: now,
      temperature_2m: 21.4,
      relative_humidity_2m: 55,
      apparent_temperature: 20.8,
      is_day: isDay,
      precipitation: 0,
      weather_code: code,
      cloud_cover: 40,
      pressure_msl: 1015,
      wind_speed_10m: 12,
      wind_direction_10m: 200,
      wind_gusts_10m: 25,
    },
    hourly: {
      time: Array.from({ length: hours }, (_, i) => dayStart + i * H),
      temperature_2m: Array.from({ length: hours }, (_, i) => 16 + 6 * Math.sin(((i % 24) - 9) / 3.8)),
      precipitation_probability: Array.from({ length: hours }, (_, i) => (i % 5) * 15),
      weather_code: Array.from({ length: hours }, (_, i) => [0, 1, 2, 3, 61][i % 5]),
      is_day: Array.from({ length: hours }, (_, i) => (i % 24 >= 7 && i % 24 < 19 ? 1 : 0)),
      visibility: Array.from({ length: hours }, () => 20000),
      uv_index: Array.from({ length: hours }, () => 3.2),
    },
    daily: {
      time: Array.from({ length: 10 }, (_, i) => dayStart + i * 86400),
      weather_code: [code, 2, 61, 95, 3, 0, 71, 45, 80, 1],
      temperature_2m_max: [24, 23, 19, 18, 21, 26, 12, 17, 20, 25],
      temperature_2m_min: [15, 14, 12, 11, 13, 16, 3, 9, 12, 15],
      sunrise: Array.from({ length: 10 }, (_, i) => dayStart + i * 86400 + 7 * H),
      sunset: Array.from({ length: 10 }, (_, i) => dayStart + i * 86400 + 18 * H),
      uv_index_max: Array(10).fill(5),
      precipitation_sum: [0, 0.4, 6.2, 12, 0, 0, 3, 0, 2, 0],
      precipitation_probability_max: [5, 20, 80, 90, 10, 0, 60, 15, 45, 0],
      wind_speed_10m_max: Array(10).fill(24),
    },
  };
}

export const geocodingFixture = {
  results: [
    {
      id: 1,
      name: 'Thessaloniki',
      latitude: 40.64,
      longitude: 22.94,
      country: 'Greece',
      admin1: 'Central Macedonia',
      country_code: 'GR',
    },
    { id: 2, name: 'Thessalon', latitude: 46.25, longitude: -83.55, country: 'Canada', admin1: 'Ontario' },
  ],
};

interface MockOptions {
  forecastStatus?: number;
}

/** Intercepts every third-party request so tests are deterministic and offline-safe. */
export async function mockApis(page: Page, { forecastStatus = 200 }: MockOptions = {}) {
  const calls = { forecast: 0 };
  await page.route('https://api.open-meteo.com/**', (route) => {
    calls.forecast++;
    return forecastStatus === 200
      ? route.fulfill({ json: forecastFixture() })
      : route.fulfill({ status: forecastStatus, json: { error: true, reason: 'Service unavailable' } });
  });
  await page.route('https://air-quality-api.open-meteo.com/**', (route) =>
    route.fulfill({ json: { current: { time: 0, us_aqi: 35, pm2_5: 6.1, pm10: 12 } } }),
  );
  await page.route('https://geocoding-api.open-meteo.com/**', (route) => route.fulfill({ json: geocodingFixture }));
  await page.route('https://api.bigdatacloud.net/**', (route) =>
    route.fulfill({ json: { city: 'Athens', principalSubdivision: 'Attica', countryName: 'Greece' } }),
  );
  await page.route(/fonts\.(googleapis|gstatic)\.com/, (route) => route.abort());
  return calls;
}
