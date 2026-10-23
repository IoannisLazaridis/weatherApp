import { describe, expect, it } from 'vitest';
import { describeCode, iconForCode, themeForCode } from '../src/weatherCodes';

describe('weather codes', () => {
  it('describes known and unknown codes', () => {
    expect(describeCode(0)).toBe('Clear sky');
    expect(describeCode(95)).toBe('Thunderstorm');
    expect(describeCode(1234)).toBe('Unknown');
  });

  it('switches to night icons', () => {
    expect(iconForCode(0, true)).toBe('clear-day');
    expect(iconForCode(0, false)).toBe('clear-night');
    expect(iconForCode(2, false)).toBe('partly-cloudy-night');
    expect(iconForCode(63, false)).toBe('rain');
  });

  it('picks a background theme', () => {
    expect(themeForCode(1, true)).toBe('clear-day');
    expect(themeForCode(1, false)).toBe('clear-night');
    expect(themeForCode(3, false)).toBe('cloudy-night');
    expect(themeForCode(45, true)).toBe('fog');
    expect(themeForCode(73, true)).toBe('snow');
    expect(themeForCode(99, true)).toBe('storm');
    expect(themeForCode(81, true)).toBe('rain');
  });
});
