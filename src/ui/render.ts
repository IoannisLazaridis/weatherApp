import { glyph, iconSvg } from '../icons';
import { dayKey, formatClock, formatFullDate, formatHour, formatRelative, formatWeekday } from '../time';
import type { DailyPoint, HourlyPoint, Place, UnitSystem, WeatherReport } from '../types';
import {
  aqiCategory,
  cToF,
  compassDirection,
  formatDistance,
  formatPrecip,
  formatPressure,
  formatSpeed,
  formatTemp,
  humidityComment,
  uvCategory,
} from '../units';
import { describeCode, iconForCode } from '../weatherCodes';
import { esc } from './dom';

const clamp = (n: number, min: number, max: number): number => Math.min(max, Math.max(min, n));

export function renderHero(report: WeatherReport, units: UnitSystem, isFavorite: boolean): string {
  const { current, place, timezone, daily } = report;
  const today = daily[0];
  const label = describeCode(current.code);
  return `
    <div class="hero-top">
      <div class="hero-place">
        <h1 class="hero-name">${esc(place.name)}</h1>
        ${place.region ? `<p class="hero-region">${esc(place.region)}</p>` : ''}
        <p class="hero-date">${esc(formatFullDate(current.time, timezone))} · <span data-clock>${esc(formatClock(Date.now() / 1000, timezone))}</span></p>
      </div>
      <button class="icon-btn fav-btn" type="button" data-action="favorite" aria-pressed="${isFavorite}"
        aria-label="${isFavorite ? 'Remove from saved places' : 'Save this place'}" title="${isFavorite ? 'Remove from saved places' : 'Save this place'}">
        ${glyph('star')}
      </button>
    </div>
    <div class="hero-main">
      ${iconSvg(iconForCode(current.code, current.isDay), label, 'hero-icon')}
      <div class="hero-temp">
        <span class="hero-degrees">${formatTemp(current.temperature, units)}</span>
        <span class="hero-unit">${units === 'imperial' ? 'F' : 'C'}</span>
      </div>
    </div>
    <p class="hero-condition">${esc(label)}</p>
    <p class="hero-meta">
      Feels like <strong>${formatTemp(current.feelsLike, units)}</strong>
      ${today ? `<span class="dot" aria-hidden="true"></span> H <strong>${formatTemp(today.max, units)}</strong> · L <strong>${formatTemp(today.min, units)}</strong>` : ''}
    </p>
    <p class="hero-updated">
      Updated <span data-updated="${report.fetchedAt}">${formatRelative(report.fetchedAt)}</span>
      <button class="link-btn" type="button" data-action="refresh">${glyph('refresh')} Refresh</button>
    </p>`;
}

const HOUR_WIDTH = 68;
const CHART_HEIGHT = 64;
const CHART_PAD = 18;

export function renderHourly(hours: HourlyPoint[], units: UnitSystem, timezone: string): string {
  if (!hours.length) return '<p class="empty">No hourly data available.</p>';

  const temps = hours.map((h) => (units === 'imperial' ? cToF(h.temperature) : h.temperature));
  const max = Math.max(...temps);
  const min = Math.min(...temps);
  const span = max - min || 1;
  const points = temps.map((t, i) => ({
    x: i * HOUR_WIDTH + HOUR_WIDTH / 2,
    y: CHART_PAD + (1 - (t - min) / span) * (CHART_HEIGHT - CHART_PAD * 1.4),
  }));
  const width = hours.length * HOUR_WIDTH;
  const line = points.map((p, i) => `${i ? 'L' : 'M'}${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ');
  const area = `${line} L${points.at(-1)!.x} ${CHART_HEIGHT} L${points[0]!.x} ${CHART_HEIGHT} Z`;

  const items = hours
    .map((h, i) => {
      const chance = h.precipitationChance ?? 0;
      const label = describeCode(h.code);
      return `<li class="hour" style="--x:${i}">
        <span class="hour-time">${i === 0 ? 'Now' : esc(formatHour(h.time, timezone))}</span>
        ${iconSvg(iconForCode(h.code, h.isDay), label, 'hour-icon')}
        <span class="hour-precip ${chance >= 30 ? 'is-wet' : ''}" title="Chance of precipitation">
          ${chance > 0 ? `${glyph('droplet')}${chance}%` : '&nbsp;'}
        </span>
        <span class="sr-only">${esc(label)}, ${formatTemp(h.temperature, units)}</span>
      </li>`;
    })
    .join('');

  const labels = points
    .map(
      (p, i) =>
        `<text x="${p.x.toFixed(1)}" y="${(p.y - 8).toFixed(1)}" text-anchor="middle">${formatTemp(hours[i]!.temperature, units)}</text>`,
    )
    .join('');

  return `
    <div class="hourly-scroll" tabindex="0" role="region" aria-label="Hourly forecast, scroll horizontally">
      <div class="hourly-track" style="width:${width}px">
        <svg class="hourly-chart" width="${width}" height="${CHART_HEIGHT}" viewBox="0 0 ${width} ${CHART_HEIGHT}" aria-hidden="true">
          <defs>
            <linearGradient id="hourly-fill" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0" stop-color="currentColor" stop-opacity=".35"/>
              <stop offset="1" stop-color="currentColor" stop-opacity="0"/>
            </linearGradient>
          </defs>
          <path d="${area}" fill="url(#hourly-fill)"/>
          <path d="${line}" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"/>
          ${points.map((p) => `<circle cx="${p.x.toFixed(1)}" cy="${p.y.toFixed(1)}" r="3"/>`).join('')}
          <g class="hourly-labels">${labels}</g>
        </svg>
        <ol class="hours">${items}</ol>
      </div>
    </div>`;
}

/** Maps a temperature (°C) to a hue between cold blue and hot red. */
function tempColor(celsius: number): string {
  const t = clamp((celsius + 10) / 45, 0, 1); // -10°C → 0, 35°C → 1
  const hue = 220 - t * 215;
  return `hsl(${hue.toFixed(0)} 85% 62%)`;
}

export function renderDaily(days: DailyPoint[], units: UnitSystem, timezone: string, nowSeconds: number): string {
  if (!days.length) return '<p class="empty">No daily forecast available.</p>';
  const lowest = Math.min(...days.map((d) => d.min));
  const highest = Math.max(...days.map((d) => d.max));
  const span = highest - lowest || 1;
  const todayKey = dayKey(nowSeconds, timezone);

  return `<ul class="days">${days
    .map((d) => {
      const label = describeCode(d.code);
      const isToday = dayKey(d.time + 12 * 3600, timezone) === todayKey;
      const left = ((d.min - lowest) / span) * 100;
      const right = ((d.max - lowest) / span) * 100;
      const chance = d.precipitationChance ?? 0;
      return `<li>
        <details class="day">
          <summary>
            <span class="day-name">${isToday ? 'Today' : esc(formatWeekday(d.time + 12 * 3600, timezone))}</span>
            ${iconSvg(iconForCode(d.code, true), label, 'day-icon')}
            <span class="day-precip ${chance >= 30 ? 'is-wet' : ''}">${chance >= 10 ? `${chance}%` : ''}</span>
            <span class="day-min">${formatTemp(d.min, units)}</span>
            <span class="range" aria-hidden="true">
              <span class="range-fill" style="left:${left.toFixed(1)}%;right:${(100 - right).toFixed(1)}%;--from:${tempColor(d.min)};--to:${tempColor(d.max)}"></span>
            </span>
            <span class="day-max">${formatTemp(d.max, units)}</span>
            <span class="sr-only">${esc(label)}</span>
          </summary>
          <dl class="day-details">
            <div><dt>Conditions</dt><dd>${esc(label)}</dd></div>
            <div><dt>Precipitation</dt><dd>${d.precipitationSum != null ? formatPrecip(d.precipitationSum, units) : '—'}${chance ? ` · ${chance}%` : ''}</dd></div>
            <div><dt>Max wind</dt><dd>${d.windSpeedMax != null ? formatSpeed(d.windSpeedMax, units) : '—'}</dd></div>
            <div><dt>UV index</dt><dd>${d.uvIndexMax != null ? `${Math.round(d.uvIndexMax)} · ${uvCategory(d.uvIndexMax)}` : '—'}</dd></div>
            <div><dt>Sunrise</dt><dd>${esc(formatClock(d.sunrise, timezone))}</dd></div>
            <div><dt>Sunset</dt><dd>${esc(formatClock(d.sunset, timezone))}</dd></div>
          </dl>
        </details>
      </li>`;
    })
    .join('')}</ul>`;
}

const tile = (title: string, icon: Parameters<typeof glyph>[0], body: string, extra = ''): string => `
  <article class="tile ${extra}">
    <h3 class="tile-title">${glyph(icon)}${title}</h3>
    ${body}
  </article>`;

const meter = (percent: number, className = ''): string =>
  `<div class="meter ${className}" aria-hidden="true"><span style="left:${clamp(percent, 0, 100).toFixed(1)}%"></span></div>`;

function sunTile(report: WeatherReport): string {
  const today = report.daily[0];
  if (!today) return '';
  const { sunrise, sunset } = today;
  const now = report.current.time;
  const progress = clamp((now - sunrise) / (sunset - sunrise), 0, 1);
  const daylight = Math.max(0, sunset - sunrise);
  const hours = Math.floor(daylight / 3600);
  const minutes = Math.round((daylight % 3600) / 60);
  // Sun position along a semicircle from (10,60) to (110,60).
  const angle = Math.PI * (1 - progress);
  const sx = 60 + Math.cos(angle) * 50;
  const sy = 60 - Math.sin(angle) * 50;
  const up = now >= sunrise && now <= sunset;
  return tile(
    'Sun',
    'sunrise',
    `<svg class="sun-arc" viewBox="0 0 120 68" aria-hidden="true">
       <path d="M10 60a50 50 0 0 1 100 0" fill="none" stroke="currentColor" stroke-opacity=".25" stroke-width="2" stroke-dasharray="3 4"/>
       <line x1="4" y1="60" x2="116" y2="60" stroke="currentColor" stroke-opacity=".3"/>
       ${up ? `<circle cx="${sx.toFixed(1)}" cy="${sy.toFixed(1)}" r="6" fill="var(--icon-sun)"/>` : ''}
     </svg>
     <div class="sun-times">
       <span><small>Sunrise</small>${esc(formatClock(sunrise, report.timezone))}</span>
       <span><small>Sunset</small>${esc(formatClock(sunset, report.timezone))}</span>
     </div>
     <p class="tile-note">${hours} h ${minutes} min of daylight</p>`,
    'tile-wide',
  );
}

export function renderHighlights(report: WeatherReport, units: UnitSystem): string {
  const c = report.current;
  const tiles: string[] = [];

  tiles.push(
    tile(
      'Wind',
      'wind',
      `<div class="wind">
        <div class="compass" aria-hidden="true">
          <span class="compass-n">N</span>
          <span class="compass-arrow" style="transform:rotate(${(c.windDirection + 180) % 360}deg)">${glyph('arrow')}</span>
        </div>
        <div>
          <p class="tile-value">${formatSpeed(c.windSpeed, units)}</p>
          <p class="tile-note">From ${compassDirection(c.windDirection)} · gusts ${formatSpeed(c.windGusts, units)}</p>
        </div>
      </div>`,
    ),
  );

  tiles.push(
    tile(
      'Humidity',
      'droplet',
      `<p class="tile-value">${Math.round(c.humidity)}%</p>
       ${meter(c.humidity, 'meter-humidity')}
       <p class="tile-note">${humidityComment(c.humidity)}</p>`,
    ),
  );

  const uv = c.uvIndex ?? report.daily[0]?.uvIndexMax ?? null;
  if (uv != null) {
    tiles.push(
      tile(
        'UV index',
        'sunGlyph',
        `<p class="tile-value">${Math.round(uv)} <small>${uvCategory(uv)}</small></p>
         ${meter((uv / 11) * 100, 'meter-uv')}
         <p class="tile-note">${uv >= 3 ? 'Sun protection recommended' : 'No protection needed'}</p>`,
      ),
    );
  }

  const aqi = report.airQuality?.usAqi;
  if (aqi != null) {
    const cat = aqiCategory(aqi);
    tiles.push(
      tile(
        'Air quality',
        'leaf',
        `<p class="tile-value">${Math.round(aqi)} <small>${esc(cat.label)}</small></p>
         ${meter((aqi / 300) * 100, 'meter-aqi')}
         <p class="tile-note">${report.airQuality?.pm25 != null ? `PM2.5 ${Math.round(report.airQuality.pm25)} µg/m³` : 'US AQI'}</p>`,
      ),
    );
  }

  tiles.push(
    tile(
      'Feels like',
      'thermometer',
      `<p class="tile-value">${formatTemp(c.feelsLike, units)}</p>
       <p class="tile-note">${
         Math.abs(c.feelsLike - c.temperature) < 1.5
           ? 'Similar to the actual temperature'
           : c.feelsLike < c.temperature
             ? 'Wind is making it feel cooler'
             : 'Humidity is making it feel warmer'
       }</p>`,
    ),
  );

  const precipToday = report.daily[0]?.precipitationSum ?? c.precipitation;
  tiles.push(
    tile(
      'Precipitation',
      'umbrella',
      `<p class="tile-value">${formatPrecip(c.precipitation, units)}</p>
       <p class="tile-note">${formatPrecip(precipToday, units)} expected today</p>`,
    ),
  );

  tiles.push(
    tile(
      'Pressure',
      'gauge',
      `<p class="tile-value">${formatPressure(c.pressure, units)}</p>
       <p class="tile-note">${c.pressure < 1009 ? 'Low pressure' : c.pressure > 1022 ? 'High pressure' : 'Normal'}</p>`,
    ),
  );

  if (c.visibility != null) {
    tiles.push(
      tile(
        'Visibility',
        'eye',
        `<p class="tile-value">${formatDistance(c.visibility, units)}</p>
         <p class="tile-note">${c.visibility >= 10000 ? 'Clear view' : c.visibility >= 4000 ? 'Moderate' : 'Poor visibility'}</p>`,
      ),
    );
  }

  tiles.push(sunTile(report));
  return tiles.join('');
}

export function renderFavorites(
  favorites: Place[],
  active: Place | null,
  isSame: (a: Place, b: Place) => boolean,
): string {
  return favorites
    .map((f, i) => {
      const current = active && isSame(f, active);
      return `<li>
        <button class="chip ${current ? 'is-active' : ''}" type="button" data-favorite="${i}" ${current ? 'aria-current="true"' : ''}>
          ${glyph('star')}<span>${esc(f.name)}</span>
        </button>
      </li>`;
    })
    .join('');
}

export function renderSuggestions(places: Place[], activeIndex: number): string {
  return places
    .map(
      (
        p,
        i,
      ) => `<li id="suggestion-${i}" role="option" class="suggestion" data-index="${i}" aria-selected="${i === activeIndex}">
        <span class="suggestion-name">${esc(p.name)}</span>
        ${p.region ? `<span class="suggestion-region">${esc(p.region)}</span>` : ''}
      </li>`,
    )
    .join('');
}
