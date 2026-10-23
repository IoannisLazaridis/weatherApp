import type { IconKey, ThemeKey } from './types';

interface CodeInfo {
  label: string;
  icon: IconKey;
}

/** WMO weather interpretation codes, as used by Open-Meteo. */
const CODES: Record<number, CodeInfo> = {
  0: { label: 'Clear sky', icon: 'clear-day' },
  1: { label: 'Mainly clear', icon: 'clear-day' },
  2: { label: 'Partly cloudy', icon: 'partly-cloudy-day' },
  3: { label: 'Overcast', icon: 'cloudy' },
  45: { label: 'Fog', icon: 'fog' },
  48: { label: 'Freezing fog', icon: 'fog' },
  51: { label: 'Light drizzle', icon: 'drizzle' },
  53: { label: 'Drizzle', icon: 'drizzle' },
  55: { label: 'Heavy drizzle', icon: 'drizzle' },
  56: { label: 'Light freezing drizzle', icon: 'freezing-rain' },
  57: { label: 'Freezing drizzle', icon: 'freezing-rain' },
  61: { label: 'Light rain', icon: 'rain' },
  63: { label: 'Rain', icon: 'rain' },
  65: { label: 'Heavy rain', icon: 'rain' },
  66: { label: 'Light freezing rain', icon: 'freezing-rain' },
  67: { label: 'Freezing rain', icon: 'freezing-rain' },
  71: { label: 'Light snow', icon: 'snow' },
  73: { label: 'Snow', icon: 'snow' },
  75: { label: 'Heavy snow', icon: 'snow' },
  77: { label: 'Snow grains', icon: 'snow' },
  80: { label: 'Light showers', icon: 'rain' },
  81: { label: 'Showers', icon: 'rain' },
  82: { label: 'Violent showers', icon: 'rain' },
  85: { label: 'Snow showers', icon: 'snow' },
  86: { label: 'Heavy snow showers', icon: 'snow' },
  95: { label: 'Thunderstorm', icon: 'thunderstorm' },
  96: { label: 'Thunderstorm with hail', icon: 'thunderstorm' },
  99: { label: 'Severe thunderstorm with hail', icon: 'thunderstorm' },
};

const UNKNOWN: CodeInfo = { label: 'Unknown', icon: 'cloudy' };

export function describeCode(code: number): string {
  return (CODES[code] ?? UNKNOWN).label;
}

export function iconForCode(code: number, isDay = true): IconKey {
  const { icon } = CODES[code] ?? UNKNOWN;
  if (isDay) return icon;
  if (icon === 'clear-day') return 'clear-night';
  if (icon === 'partly-cloudy-day') return 'partly-cloudy-night';
  return icon;
}

export function themeForCode(code: number, isDay: boolean): ThemeKey {
  const icon = (CODES[code] ?? UNKNOWN).icon;
  switch (icon) {
    case 'clear-day':
    case 'partly-cloudy-day':
      return isDay ? 'clear-day' : 'clear-night';
    case 'cloudy':
      return isDay ? 'cloudy-day' : 'cloudy-night';
    case 'fog':
      return 'fog';
    case 'snow':
      return 'snow';
    case 'thunderstorm':
      return 'storm';
    default:
      return 'rain';
  }
}
