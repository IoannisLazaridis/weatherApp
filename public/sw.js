/*
 * Offline support: the app shell is cached as it is fetched (stale-while-revalidate),
 * forecast API responses are network-first with a cached fallback so the last
 * forecast is still shown when the device is offline.
 */
const VERSION = 'v2';
const SHELL_CACHE = `shell-${VERSION}`;
const DATA_CACHE = `data-${VERSION}`;
const DATA_HOSTS = ['api.open-meteo.com', 'air-quality-api.open-meteo.com'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(SHELL_CACHE)
      .then((cache) => cache.addAll(['/', '/manifest.webmanifest', '/favicon.svg']))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((k) => ![SHELL_CACHE, DATA_CACHE].includes(k)).map((k) => caches.delete(k))),
      )
      .then(() => self.clients.claim()),
  );
});

const MAX_DATA_ENTRIES = 30;

async function trimCache(cache, max) {
  const keys = await cache.keys();
  await Promise.all(keys.slice(0, Math.max(0, keys.length - max)).map((key) => cache.delete(key)));
}

/** Network-first; `cacheKey` lets every navigation share a single cached shell entry. */
async function networkFirst(request, cacheName, cacheKey = request) {
  const cache = await caches.open(cacheName);
  try {
    const response = await fetch(request);
    if (response.ok) {
      await cache.put(cacheKey, response.clone());
      if (cacheName === DATA_CACHE) trimCache(cache, MAX_DATA_ENTRIES);
    }
    return response;
  } catch (error) {
    const cached = await cache.match(cacheKey);
    if (cached) return cached;
    throw error;
  }
}

async function staleWhileRevalidate(request) {
  const cache = await caches.open(SHELL_CACHE);
  const cached = await cache.match(request);
  const network = fetch(request)
    .then((response) => {
      if (response.ok) cache.put(request, response.clone());
      return response;
    })
    .catch(() => cached);
  return cached || network;
}

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);

  if (request.mode === 'navigate') {
    event.respondWith(networkFirst(request, SHELL_CACHE, '/'));
    return;
  }

  if (DATA_HOSTS.includes(url.hostname)) {
    event.respondWith(networkFirst(request, DATA_CACHE));
    return;
  }

  if (
    url.origin === self.location.origin ||
    url.hostname.endsWith('fonts.gstatic.com') ||
    url.hostname === 'fonts.googleapis.com'
  ) {
    event.respondWith(staleWhileRevalidate(request));
  }
});
