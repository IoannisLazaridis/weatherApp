/** Date helpers that render unix timestamps in the forecast location's timezone. */

const formatterCache = new Map<string, Intl.DateTimeFormat>();

function formatter(timeZone: string, options: Intl.DateTimeFormatOptions): Intl.DateTimeFormat {
  const key = `${timeZone}|${JSON.stringify(options)}`;
  let fmt = formatterCache.get(key);
  if (!fmt) {
    try {
      fmt = new Intl.DateTimeFormat(undefined, { ...options, timeZone });
    } catch {
      // Unknown timezone identifiers throw a RangeError; fall back to the browser's zone.
      fmt = new Intl.DateTimeFormat(undefined, options);
    }
    formatterCache.set(key, fmt);
  }
  return fmt;
}

const toDate = (unixSeconds: number): Date => new Date(unixSeconds * 1000);

export function formatClock(unixSeconds: number, timeZone: string): string {
  return formatter(timeZone, { hour: 'numeric', minute: '2-digit' }).format(toDate(unixSeconds));
}

export function formatHour(unixSeconds: number, timeZone: string): string {
  return formatter(timeZone, { hour: 'numeric' }).format(toDate(unixSeconds));
}

export function formatWeekday(unixSeconds: number, timeZone: string, style: 'short' | 'long' = 'short'): string {
  return formatter(timeZone, { weekday: style }).format(toDate(unixSeconds));
}

export function formatFullDate(unixSeconds: number, timeZone: string): string {
  return formatter(timeZone, { weekday: 'long', day: 'numeric', month: 'long' }).format(toDate(unixSeconds));
}

/** Calendar date key (YYYY-MM-DD) of a timestamp in the given timezone. */
export function dayKey(unixSeconds: number, timeZone: string): string {
  return formatter(timeZone, { year: 'numeric', month: '2-digit', day: '2-digit' })
    .formatToParts(toDate(unixSeconds))
    .filter((p) => p.type !== 'literal')
    .map((p) => p.value)
    .join('-');
}

export function formatRelative(fromMs: number, nowMs = Date.now()): string {
  const minutes = Math.round((nowMs - fromMs) / 60000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.round(minutes / 60);
  return `${hours} h ago`;
}
