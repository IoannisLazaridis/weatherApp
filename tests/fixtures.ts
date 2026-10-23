import type { AirQualityResponse, ForecastResponse } from '../src/types';

const HOUR = 3600;
/** 2026-06-15T00:00:00Z */
export const BASE = 1781481600;

export function makeForecast(overrides: Partial<ForecastResponse['current']> = {}): ForecastResponse {
  const hours = 48;
  const days = 10;
  return {
    latitude: 37.98,
    longitude: 23.72,
    timezone: 'Europe/Athens',
    utc_offset_seconds: 10800,
    current: {
      time: BASE + 10 * HOUR + 15 * 60,
      temperature_2m: 24.6,
      relative_humidity_2m: 48,
      apparent_temperature: 25.1,
      is_day: 1,
      precipitation: 0,
      weather_code: 1,
      cloud_cover: 12,
      pressure_msl: 1014.2,
      wind_speed_10m: 14.4,
      wind_direction_10m: 315,
      wind_gusts_10m: 28.8,
      ...overrides,
    },
    hourly: {
      time: Array.from({ length: hours }, (_, i) => BASE + i * HOUR),
      temperature_2m: Array.from({ length: hours }, (_, i) => 18 + 8 * Math.sin((i - 6) / 4)),
      precipitation_probability: Array.from({ length: hours }, (_, i) => (i % 7) * 10),
      weather_code: Array.from({ length: hours }, (_, i) => [0, 1, 2, 3, 61][i % 5]!),
      is_day: Array.from({ length: hours }, (_, i) => (i % 24 >= 6 && i % 24 < 20 ? 1 : 0)),
      visibility: Array.from({ length: hours }, (_, i) => 20000 + i),
      uv_index: Array.from({ length: hours }, (_, i) => i / 4),
    },
    daily: {
      time: Array.from({ length: days }, (_, i) => BASE + i * 24 * HOUR),
      weather_code: Array.from({ length: days }, (_, i) => [0, 2, 61, 95, 71][i % 5]!),
      temperature_2m_max: Array.from({ length: days }, (_, i) => 26 + i),
      temperature_2m_min: Array.from({ length: days }, (_, i) => 16 + i / 2),
      sunrise: Array.from({ length: days }, (_, i) => BASE + i * 24 * HOUR + 3 * HOUR),
      sunset: Array.from({ length: days }, (_, i) => BASE + i * 24 * HOUR + 17 * HOUR + 30 * 60),
      uv_index_max: Array.from({ length: days }, () => 8.2),
      precipitation_sum: Array.from({ length: days }, (_, i) => i * 1.5),
      precipitation_probability_max: Array.from({ length: days }, (_, i) => i * 10),
      wind_speed_10m_max: Array.from({ length: days }, () => 22),
    },
  };
}

export const airQuality: AirQualityResponse = {
  current: { time: BASE, us_aqi: 42, pm2_5: 8.3, pm10: 15 },
};
