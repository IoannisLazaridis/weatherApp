import { beforeEach, describe, expect, it } from 'vitest';
import {
  defaultUnits,
  isValidPlace,
  loadFavorites,
  loadLastPlace,
  loadUnits,
  placeFromUrl,
  placeToSearch,
  saveFavorites,
  saveLastPlace,
  saveUnits,
  toggleFavorite,
} from '../src/storage';

const athens = { name: 'Athens', latitude: 37.98, longitude: 23.72 };
const oslo = { name: 'Oslo', latitude: 59.91, longitude: 10.75, region: 'Norway' };

describe('storage', () => {
  beforeEach(() => localStorage.clear());

  it('persists units with a locale-based default', () => {
    expect(defaultUnits('en-US')).toBe('imperial');
    expect(defaultUnits('el-GR')).toBe('metric');
    saveUnits('imperial');
    expect(loadUnits()).toBe('imperial');
  });

  it('toggles favorites without duplicates', () => {
    let favs = toggleFavorite([], athens);
    favs = toggleFavorite(favs, oslo);
    expect(favs.map((f) => f.name)).toEqual(['Oslo', 'Athens']);
    favs = toggleFavorite(favs, { ...athens, latitude: 37.981 });
    expect(favs.map((f) => f.name)).toEqual(['Oslo']);
  });

  it('round-trips favorites and ignores corrupt data', () => {
    saveFavorites([athens, oslo]);
    expect(loadFavorites()).toEqual([athens, oslo]);
    localStorage.setItem('weather:favorites', '{not json');
    expect(loadFavorites()).toEqual([]);
    localStorage.setItem('weather:favorites', JSON.stringify([athens, { name: 1 }, { ...oslo, latitude: 200 }]));
    expect(loadFavorites()).toEqual([athens]);
  });

  it('remembers the last place', () => {
    expect(loadLastPlace()).toBeNull();
    saveLastPlace(oslo);
    expect(loadLastPlace()).toEqual(oslo);
  });

  it('validates places', () => {
    expect(isValidPlace(athens)).toBe(true);
    expect(isValidPlace(null)).toBe(false);
    expect(isValidPlace({ name: 'x', latitude: '1', longitude: 2 })).toBe(false);
  });

  it('round-trips places through the URL', () => {
    const search = placeToSearch(oslo);
    expect(placeFromUrl(search)).toEqual({ name: 'Oslo', latitude: 59.91, longitude: 10.75, region: 'Norway' });
    expect(placeFromUrl('?lat=abc&lon=1')).toBeNull();
    expect(placeFromUrl('?lat=95&lon=1')).toBeNull();
    expect(placeFromUrl('')).toBeNull();
  });
});
