import type { IconKey } from './types';

/*
 * Hand-built SVG weather icons on a 64×64 grid. Colours come from CSS custom
 * properties so the set follows the active theme; motion is defined in CSS and
 * disabled under prefers-reduced-motion.
 */

const sun = (cx = 32, cy = 32, r = 11): string => {
  const rays = Array.from({ length: 8 }, (_, i) => {
    const a = (i * Math.PI) / 4;
    const x1 = cx + Math.cos(a) * (r + 5);
    const y1 = cy + Math.sin(a) * (r + 5);
    const x2 = cx + Math.cos(a) * (r + 10);
    const y2 = cy + Math.sin(a) * (r + 10);
    return `<line x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}"/>`;
  }).join('');
  return `<g class="wi-sun" style="transform-origin:${cx}px ${cy}px">
    <g class="wi-sun-rays" stroke="var(--icon-sun)" stroke-width="3" stroke-linecap="round">${rays}</g>
    <circle cx="${cx}" cy="${cy}" r="${r}" fill="var(--icon-sun)"/>
  </g>`;
};

const moon = (cx = 32, cy = 32, scale = 1): string =>
  `<g class="wi-moon" transform="translate(${cx - 32 * scale} ${cy - 32 * scale}) scale(${scale})">
    <path fill="var(--icon-moon)" d="M36 13a19 19 0 1 0 16 30A16 16 0 0 1 36 13z"/>
  </g>`;

const CLOUD_PATH = 'M46 50H20a11 11 0 0 1-1.6-21.9A14 14 0 0 1 45.2 24 10.5 10.5 0 0 1 46 50z';

const cloud = (dx = 0, dy = 0, scale = 1, tone = 'var(--icon-cloud)'): string =>
  `<g class="wi-cloud" transform="translate(${dx} ${dy}) scale(${scale})"><path fill="${tone}" d="${CLOUD_PATH}"/></g>`;

const drops = (count: number, color = 'var(--icon-rain)', length = 7): string =>
  Array.from({ length: count }, (_, i) => {
    const x = 24 + i * (16 / Math.max(count - 1, 1));
    return `<line class="wi-drop" style="animation-delay:${(i * 0.25).toFixed(2)}s" x1="${x}" y1="52" x2="${x - 2}" y2="${52 + length}" stroke="${color}" stroke-width="3" stroke-linecap="round"/>`;
  }).join('');

const flakes = (): string =>
  [22, 32, 42]
    .map(
      (x, i) =>
        `<g class="wi-flake" style="animation-delay:${(i * 0.4).toFixed(1)}s"><circle cx="${x}" cy="${i === 1 ? 58 : 55}" r="2.6" fill="var(--icon-snow)"/></g>`,
    )
    .join('');

const bolt = `<path class="wi-bolt" fill="var(--icon-bolt)" d="M33 44l-7 11h6l-3 8 10-12h-6l4-7z"/>`;

const fogLines = `<g class="wi-fog" stroke="var(--icon-cloud)" stroke-width="3.5" stroke-linecap="round">
  <line x1="12" y1="30" x2="52" y2="30"/><line x1="16" y1="39" x2="48" y2="39"/><line x1="10" y1="48" x2="54" y2="48"/>
</g>`;

const BODIES: Record<IconKey, string> = {
  'clear-day': sun(),
  'clear-night': moon(),
  'partly-cloudy-day': sun(24, 24, 9) + cloud(4, 6, 0.9),
  'partly-cloudy-night': moon(24, 24, 0.65) + cloud(4, 6, 0.9),
  cloudy: cloud(-8, -4, 0.85, 'var(--icon-cloud-dark)') + cloud(4, 2, 0.95),
  fog: fogLines,
  drizzle: cloud(0, -8) + drops(3, 'var(--icon-rain)', 4),
  rain: cloud(0, -8) + drops(3),
  'freezing-rain': cloud(0, -8) + drops(2, 'var(--icon-rain)', 5) + flakes(),
  snow: cloud(0, -8) + flakes(),
  thunderstorm: cloud(0, -10, 1, 'var(--icon-cloud-dark)') + bolt,
};

export function iconSvg(icon: IconKey, label?: string, className = ''): string {
  const a11y = label ? `role="img" aria-label="${label}"` : 'aria-hidden="true"';
  return `<svg class="wi ${className}" viewBox="0 0 64 64" ${a11y} focusable="false">${BODIES[icon]}</svg>`;
}

/** Small UI glyphs (stroke icons) used across the interface. */
const GLYPHS = {
  search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>',
  locate: '<circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3"/><circle cx="12" cy="12" r="7"/>',
  star: '<path d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1 6.2L12 17.3 6.5 20.2l1-6.2L3 9.6l6.2-.9z"/>',
  refresh: '<path d="M20 11a8 8 0 1 0-2.3 5.7"/><path d="M20 4v7h-7"/>',
  wind: '<path d="M3 8h10a3 3 0 1 0-3-3"/><path d="M3 12h15a3 3 0 1 1-3 3"/><path d="M3 16h7"/>',
  droplet: '<path d="M12 3s6 6.5 6 11a6 6 0 0 1-12 0c0-4.5 6-11 6-11z"/>',
  sunGlyph:
    '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
  gauge: '<path d="M12 14l4-4"/><path d="M3.3 17a9 9 0 1 1 17.4 0"/>',
  eye: '<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
  thermometer: '<path d="M14 14.8V5a2 2 0 0 0-4 0v9.8a4 4 0 1 0 4 0z"/>',
  leaf: '<path d="M5 19c0-8 5-14 15-14 0 10-6 15-14 15"/><path d="M5 19l7-7"/>',
  umbrella: '<path d="M3 12a9 9 0 0 1 18 0z"/><path d="M12 12v7a2 2 0 0 0 4 0"/>',
  sunrise:
    '<path d="M17 18a5 5 0 0 0-10 0"/><path d="M12 9V2M4.2 10.2l1.4 1.4M2 18h2M20 18h2M18.4 11.6l1.4-1.4M23 22H1M8 6l4-4 4 4"/>',
  close: '<path d="M6 6l12 12M18 6 6 18"/>',
  alert: '<circle cx="12" cy="12" r="9"/><path d="M12 8v5M12 16h.01"/>',
  arrow: '<path d="M12 19V5M6 11l6-6 6 6"/>',
} as const;

export type GlyphName = keyof typeof GLYPHS;

export function glyph(name: GlyphName, className = ''): string {
  return `<svg class="glyph ${className}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${GLYPHS[name]}</svg>`;
}
