import { describe, expect, it } from 'vitest';
import { buildAirQuality, buildReport, currentHourIndex } from '../src/transform';
import { airQuality, BASE, makeForecast } from './fixtures';

const place = { name: 'Athens', latitude: 37.98, longitude: 23.72 };

describe('transform', () => {
  it('finds the hourly slot containing the current time', () => {
    const times = [100, 200, 300, 400];
    expect(currentHourIndex(times, 50)).toBe(0);
    expect(currentHourIndex(times, 200)).toBe(1);
    expect(currentHourIndex(times, 350)).toBe(2);
    expect(currentHourIndex(times, 999)).toBe(3);
  });

  it('builds a report starting at the current hour', () => {
    const report = buildReport(place, makeForecast(), airQuality, 123);
    expect(report.fetchedAt).toBe(123);
    expect(report.timezone).toBe('Europe/Athens');
    expect(report.hourly).toHaveLength(24);
    expect(report.hourly[0]!.time).toBe(BASE + 10 * 3600);
    expect(report.current.visibility).toBe(20010);
    expect(report.current.uvIndex).toBe(2.5);
    expect(report.current.isDay).toBe(true);
    expect(report.daily).toHaveLength(10);
    expect(report.daily[0]!.max).toBe(26);
    expect(report.airQuality).toEqual({ usAqi: 42, pm25: 8.3, pm10: 15 });
  });

  it('handles missing air quality data', () => {
    expect(buildAirQuality(null)).toBeNull();
    expect(buildAirQuality({ current: { time: 0, us_aqi: null, pm2_5: null, pm10: null } })).toBeNull();
  });

  it('truncates hourly data near the end of the range', () => {
    const forecast = makeForecast({ time: BASE + 40 * 3600 });
    const report = buildReport(place, forecast, null);
    expect(report.hourly).toHaveLength(8);
    expect(report.airQuality).toBeNull();
  });
});
