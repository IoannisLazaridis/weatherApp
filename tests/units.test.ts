import { describe, expect, it } from 'vitest';
import {
  aqiCategory,
  cToF,
  compassDirection,
  formatDistance,
  formatPrecip,
  formatPressure,
  formatSpeed,
  formatTemp,
  uvCategory,
} from '../src/units';

describe('units', () => {
  it('converts celsius to fahrenheit', () => {
    expect(cToF(0)).toBe(32);
    expect(cToF(100)).toBe(212);
    expect(cToF(-40)).toBe(-40);
  });

  it('formats temperatures in both systems', () => {
    expect(formatTemp(21.6, 'metric')).toBe('22°');
    expect(formatTemp(21.6, 'imperial', true)).toBe('71°F');
    expect(formatTemp(-0.3, 'metric')).toBe('0°');
  });

  it('formats wind, precipitation, pressure and distance', () => {
    expect(formatSpeed(16.09344, 'imperial')).toBe('10 mph');
    expect(formatSpeed(12.4, 'metric')).toBe('12 km/h');
    expect(formatPrecip(1.27, 'imperial')).toBe('0.05 in');
    expect(formatPrecip(25.4, 'imperial')).toBe('1.0 in');
    expect(formatPrecip(0.4, 'metric')).toBe('0.4 mm');
    expect(formatPrecip(14.6, 'metric')).toBe('15 mm');
    expect(formatPressure(1013.25, 'metric')).toBe('1013 hPa');
    expect(formatPressure(1013.25, 'imperial')).toBe('29.92 inHg');
    expect(formatDistance(24140, 'metric')).toBe('24 km');
    expect(formatDistance(1609.344 * 5, 'imperial')).toBe('5.0 mi');
  });

  it('maps degrees to compass points', () => {
    expect(compassDirection(0)).toBe('N');
    expect(compassDirection(359)).toBe('N');
    expect(compassDirection(90)).toBe('E');
    expect(compassDirection(225)).toBe('SW');
    expect(compassDirection(-90)).toBe('W');
  });

  it('categorises UV and AQI', () => {
    expect(uvCategory(1)).toBe('Low');
    expect(uvCategory(7)).toBe('High');
    expect(uvCategory(12)).toBe('Extreme');
    expect(aqiCategory(30).label).toBe('Good');
    expect(aqiCategory(120).level).toBe(3);
    expect(aqiCategory(400).label).toBe('Hazardous');
  });
});
