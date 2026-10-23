import type { UnitSystem } from './types';

export const cToF = (c: number): number => (c * 9) / 5 + 32;
export const kmhToMph = (kmh: number): number => kmh / 1.609344;
export const mmToIn = (mm: number): number => mm / 25.4;
export const hPaToInHg = (hPa: number): number => hPa * 0.0295299830714;

export function formatTemp(celsius: number, units: UnitSystem, withUnit = false): string {
  const value = Math.round(units === 'imperial' ? cToF(celsius) : celsius);
  // Avoid rendering "-0°".
  const safe = Object.is(value, -0) ? 0 : value;
  return `${safe}°${withUnit ? (units === 'imperial' ? 'F' : 'C') : ''}`;
}

export function formatSpeed(kmh: number, units: UnitSystem): string {
  return units === 'imperial' ? `${Math.round(kmhToMph(kmh))} mph` : `${Math.round(kmh)} km/h`;
}

export function formatPrecip(mm: number, units: UnitSystem): string {
  if (units === 'imperial') {
    const inches = mmToIn(mm);
    return `${inches < 0.1 && inches > 0 ? inches.toFixed(2) : inches.toFixed(1)} in`;
  }
  return `${mm < 10 ? mm.toFixed(1) : Math.round(mm)} mm`;
}

export function formatPressure(hPa: number, units: UnitSystem): string {
  return units === 'imperial' ? `${hPaToInHg(hPa).toFixed(2)} inHg` : `${Math.round(hPa)} hPa`;
}

export function formatDistance(meters: number, units: UnitSystem): string {
  if (units === 'imperial') {
    const miles = meters / 1609.344;
    return `${miles < 10 ? miles.toFixed(1) : Math.round(miles)} mi`;
  }
  const km = meters / 1000;
  return `${km < 10 ? km.toFixed(1) : Math.round(km)} km`;
}

const COMPASS = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];

export function compassDirection(degrees: number): string {
  const normalized = ((degrees % 360) + 360) % 360;
  return COMPASS[Math.round(normalized / 22.5) % 16] ?? 'N';
}

export function uvCategory(uv: number): string {
  if (uv < 3) return 'Low';
  if (uv < 6) return 'Moderate';
  if (uv < 8) return 'High';
  if (uv < 11) return 'Very high';
  return 'Extreme';
}

export function aqiCategory(aqi: number): { label: string; level: number } {
  if (aqi <= 50) return { label: 'Good', level: 1 };
  if (aqi <= 100) return { label: 'Moderate', level: 2 };
  if (aqi <= 150) return { label: 'Unhealthy for sensitive groups', level: 3 };
  if (aqi <= 200) return { label: 'Unhealthy', level: 4 };
  if (aqi <= 300) return { label: 'Very unhealthy', level: 5 };
  return { label: 'Hazardous', level: 6 };
}

export function humidityComment(humidity: number): string {
  if (humidity < 30) return 'Dry';
  if (humidity < 60) return 'Comfortable';
  if (humidity < 80) return 'Humid';
  return 'Very humid';
}
