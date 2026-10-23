import './styles.css';
import { geolocationErrorMessage, getCurrentPosition, getWeather, reverseGeocode } from './api';
import { glyph } from './icons';
import {
  loadFavorites,
  loadLastPlace,
  loadUnits,
  placeFromUrl,
  placeToSearch,
  samePlace,
  saveFavorites,
  saveLastPlace,
  saveUnits,
  toggleFavorite,
} from './storage';
import { formatClock, formatRelative } from './time';
import type { Place, UnitSystem, WeatherReport } from './types';
import { formatTemp } from './units';
import { $ } from './ui/dom';
import { renderDaily, renderFavorites, renderHero, renderHighlights, renderHourly } from './ui/render';
import { setupSearch } from './ui/search';
import { themeForCode } from './weatherCodes';

const DEFAULT_PLACE: Place = {
  name: 'Athens',
  region: 'Attica, Greece',
  latitude: 37.9838,
  longitude: 23.7275,
  countryCode: 'GR',
};
const AUTO_REFRESH_MS = 15 * 60 * 1000;

const THEME_COLORS: Record<string, string> = {
  'clear-day': '#3b82f6',
  'clear-night': '#0f172a',
  'cloudy-day': '#64748b',
  'cloudy-night': '#1e293b',
  rain: '#334155',
  snow: '#94a3b8',
  storm: '#1e1b4b',
  fog: '#6b7280',
};

const state = {
  units: loadUnits(),
  favorites: loadFavorites(),
  place: null as Place | null,
  report: null as WeatherReport | null,
  controller: null as AbortController | null,
};

const el = {
  main: $('#main'),
  hero: $('#hero'),
  hourly: $('#hourly-body'),
  daily: $('#daily-body'),
  highlights: $('#highlights-body'),
  favorites: $('#favorites'),
  favoritesList: $('#favorites-list'),
  notice: $('#notice'),
  locate: $('#locate-btn') as HTMLButtonElement,
  unitButtons: document.querySelectorAll<HTMLButtonElement>('[data-units]'),
  themeColor: document.querySelector<HTMLMetaElement>('meta[name="theme-color"]'),
};

function showNotice(
  message: string,
  { retry = false, tone = 'error' }: { retry?: boolean; tone?: 'error' | 'info' } = {},
): void {
  el.notice.className = `notice notice-${tone}`;
  el.notice.innerHTML = `${glyph('alert')}<span></span>
    ${retry ? '<button type="button" class="link-btn" data-action="retry">Try again</button>' : ''}
    <button type="button" class="icon-btn notice-close" data-action="dismiss" aria-label="Dismiss">${glyph('close')}</button>`;
  el.notice.querySelector('span')!.textContent = message;
  el.notice.hidden = false;
}

function hideNotice(): void {
  el.notice.hidden = true;
}

function render(): void {
  const { report, units } = state;
  if (!report) return;
  const isFavorite = state.favorites.some((f) => samePlace(f, report.place));

  el.hero.innerHTML = renderHero(report, units, isFavorite);
  el.hourly.innerHTML = renderHourly(report.hourly, units, report.timezone);
  // Keep expanded days open across re-renders (e.g. when switching units).
  const samePlaceAsBefore = el.daily.dataset.place === `${report.place.latitude},${report.place.longitude}`;
  const openDays = samePlaceAsBefore
    ? [...el.daily.querySelectorAll('details')].flatMap((d, i) => (d.open ? [i] : []))
    : [];
  el.daily.dataset.place = `${report.place.latitude},${report.place.longitude}`;
  el.daily.innerHTML = renderDaily(report.daily, units, report.timezone, report.current.time);
  const days = el.daily.querySelectorAll('details');
  openDays.forEach((i) => days[i]?.setAttribute('open', ''));
  el.highlights.innerHTML = renderHighlights(report, units);

  const theme = themeForCode(report.current.code, report.current.isDay);
  document.documentElement.dataset.theme = theme;
  el.themeColor?.setAttribute('content', THEME_COLORS[theme] ?? '#0f172a');
  document.title = `${formatTemp(report.current.temperature, units)} ${report.place.name} · Weather`;

  renderFavoritesBar();
}

function renderFavoritesBar(): void {
  el.favorites.hidden = state.favorites.length === 0;
  el.favoritesList.innerHTML = renderFavorites(state.favorites, state.place, samePlace);
}

function setUnits(units: UnitSystem): void {
  state.units = units;
  saveUnits(units);
  el.unitButtons.forEach((btn) => btn.setAttribute('aria-pressed', String(btn.dataset.units === units)));
  render();
}

function setBusy(busy: boolean): void {
  el.main.setAttribute('aria-busy', String(busy));
  el.main.classList.toggle('is-loading', busy);
}

async function loadPlace(place: Place, { force = false, silent = false, keepNotice = false } = {}): Promise<void> {
  state.controller?.abort();
  const controller = new AbortController();
  state.controller = controller;
  state.place = place;
  if (!silent) setBusy(true);
  renderFavoritesBar();

  try {
    const report = await getWeather(place, { signal: controller.signal, force });
    if (controller.signal.aborted) return;
    state.report = report;
    if (!keepNotice) hideNotice();
    saveLastPlace(place);
    history.replaceState(null, '', placeToSearch(place));
    render();
    el.main.classList.remove('is-empty');
  } catch (error) {
    if (controller.signal.aborted) return;
    console.error(error);
    showNotice(error instanceof Error ? error.message : 'Something went wrong loading the forecast.', { retry: true });
  } finally {
    if (state.controller === controller) {
      setBusy(false);
      state.controller = null;
    }
  }
}

async function locate({ fallback }: { fallback?: Place } = {}): Promise<void> {
  el.locate.classList.add('is-locating');
  el.locate.disabled = true;
  try {
    const position = await getCurrentPosition();
    const { latitude, longitude } = position.coords;
    const place = await reverseGeocode(latitude, longitude);
    await loadPlace(place);
  } catch (error) {
    showNotice(geolocationErrorMessage(error), { tone: 'info' });
    if (fallback) await loadPlace(fallback, { keepNotice: true });
  } finally {
    el.locate.classList.remove('is-locating');
    el.locate.disabled = false;
  }
}

function tick(): void {
  const report = state.report;
  if (!report) return;
  document.querySelectorAll<HTMLElement>('[data-clock]').forEach((node) => {
    node.textContent = formatClock(Date.now() / 1000, report.timezone);
  });
  document.querySelectorAll<HTMLElement>('[data-updated]').forEach((node) => {
    node.textContent = formatRelative(Number(node.dataset.updated));
  });
  if (document.visibilityState === 'visible' && Date.now() - report.fetchedAt > AUTO_REFRESH_MS && !state.controller) {
    void loadPlace(report.place, { force: true, silent: true });
  }
}

function bindEvents(): void {
  el.unitButtons.forEach((btn) =>
    btn.addEventListener('click', () => setUnits(btn.dataset.units === 'imperial' ? 'imperial' : 'metric')),
  );

  el.locate.addEventListener('click', () => void locate());

  document.addEventListener('click', (event) => {
    const target = (event.target as HTMLElement).closest<HTMLElement>('[data-action], [data-favorite]');
    if (!target) return;

    if (target.dataset.favorite !== undefined) {
      const place = state.favorites[Number(target.dataset.favorite)];
      if (place) void loadPlace(place);
      return;
    }

    switch (target.dataset.action) {
      case 'favorite':
        if (!state.report) return;
        state.favorites = toggleFavorite(state.favorites, state.report.place);
        saveFavorites(state.favorites);
        render();
        break;
      case 'refresh':
        if (state.place) void loadPlace(state.place, { force: true });
        break;
      case 'retry':
        hideNotice();
        void loadPlace(state.place ?? DEFAULT_PLACE, { force: true });
        break;
      case 'dismiss':
        hideNotice();
        break;
    }
  });

  document.addEventListener('visibilitychange', tick);
  window.addEventListener('online', () => {
    if (state.place) void loadPlace(state.place, { force: true, silent: Boolean(state.report) });
  });
  window.addEventListener('offline', () =>
    showNotice('You are offline. Showing the last available forecast.', { tone: 'info' }),
  );
  setInterval(tick, 30_000);

  setupSearch({
    input: $('#search-input') as HTMLInputElement,
    list: $('#search-results'),
    form: $('#search-form') as HTMLFormElement,
    onSelect: (place) => void loadPlace(place),
    onError: (message) => showNotice(message, { tone: 'error' }),
  });
}

function registerServiceWorker(): void {
  if (import.meta.env.PROD && 'serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker
        .register(`${import.meta.env.BASE_URL}sw.js`)
        .catch((error: unknown) => console.warn('Service worker failed', error));
    });
  }
}

function init(): void {
  el.unitButtons.forEach((btn) => btn.setAttribute('aria-pressed', String(btn.dataset.units === state.units)));
  bindEvents();
  registerServiceWorker();

  const initial = placeFromUrl() ?? loadLastPlace();
  if (initial) void loadPlace(initial);
  else void locate({ fallback: DEFAULT_PLACE });
}

init();
