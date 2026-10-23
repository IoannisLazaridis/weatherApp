import { describe, expect, it } from 'vitest';
import { buildReport } from '../src/transform';
import { esc } from '../src/ui/dom';
import { renderDaily, renderHero, renderHighlights, renderHourly, renderSuggestions } from '../src/ui/render';
import { airQuality, makeForecast } from './fixtures';

const report = buildReport(
  { name: 'Athens', region: 'Attica, Greece', latitude: 37.98, longitude: 23.72 },
  makeForecast(),
  airQuality,
);

describe('render', () => {
  it('escapes HTML', () => {
    expect(esc('<img src=x onerror="alert(1)">')).toBe('&lt;img src=x onerror=&quot;alert(1)&quot;&gt;');
  });

  it('renders the hero in the selected units', () => {
    const metric = renderHero(report, 'metric', false);
    expect(metric).toContain('Athens');
    expect(metric).toContain('25°');
    expect(metric).toContain('Mainly clear');
    expect(metric).toContain('aria-pressed="false"');
    const imperial = renderHero(report, 'imperial', true);
    expect(imperial).toContain('76°');
    expect(imperial).toContain('aria-pressed="true"');
  });

  it('never injects place names as HTML', () => {
    const evil = { ...report, place: { ...report.place, name: '<script>x</script>' } };
    expect(renderHero(evil, 'metric', false)).not.toContain('<script>');
    expect(renderSuggestions([evil.place], 0)).not.toContain('<script>');
  });

  it('renders 24 hourly slots and 10 days', () => {
    const hourly = renderHourly(report.hourly, 'metric', report.timezone);
    expect(hourly.match(/class="hour"/g)).toHaveLength(24);
    expect(hourly).toContain('Now');
    const daily = renderDaily(report.daily, 'metric', report.timezone, report.current.time);
    expect(daily.match(/<details/g)).toHaveLength(10);
    expect(daily).toContain('Today');
  });

  it('renders highlight tiles including air quality', () => {
    const html = renderHighlights(report, 'metric');
    for (const title of ['Wind', 'Humidity', 'UV index', 'Air quality', 'Pressure', 'Visibility', 'Sun']) {
      expect(html).toContain(title);
    }
    expect(html).toContain('From NW');
  });

  it('handles empty data', () => {
    expect(renderHourly([], 'metric', 'UTC')).toContain('No hourly data');
    expect(renderDaily([], 'metric', 'UTC', 0)).toContain('No daily forecast');
  });
});
