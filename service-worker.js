// service-worker.js
// Minimal app-shell cache for offline-friendly behavior.
//
// Notes:
// - This caches only local assets. External libraries loaded from CDN are not cached here.
// - Extend later: add a user prompt, versioning strategy, and optional CDN caching.

const CACHE_NAME = 'workbook-viewer-v13';

const APP_SHELL = [
  './',
  './index.html',
  './styles.css',
  './correlationReader.js',
  './app.js',
  './kmlBuilder.js',
  './testPointLoader.js',
  './utils.js',
  './manifest.json',
  './icons/icon.svg',
  './icons/maskable.svg',
];

self.addEventListener('install', (event) => {
  // Use a resilient install step: try to cache app shell items individually
  // so a single missing/404 resource won't abort installation.
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE_NAME);
      for (const url of APP_SHELL) {
        try {
          const resp = await fetch(url, { cache: 'no-store' });
          if (resp && resp.ok) await cache.put(url, resp.clone());
        } catch (err) {
          // Ignore individual asset failures (dev-friendly).
          console.warn('[service-worker] failed to cache', url, err);
        }
      }
      // Activate the new service worker ASAP (dev-friendly).
      await self.skipWaiting();
    })()
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      // Delete only caches that are not the current cache name.
      const toDelete = keys.filter((k) => k !== CACHE_NAME);
      await Promise.all(toDelete.map((k) => caches.delete(k)));
      await self.clients.claim();
    })()
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  const url = new URL(req.url);

  // Only handle same-origin requests for the app shell.
  if (url.origin !== self.location.origin) return;

  // Dev-friendly: for page navigations, prefer network so updates show up.
  if (req.mode === 'navigate') {
    event.respondWith(
      (async () => {
        try {
          const fresh = await fetch(req);
          const cache = await caches.open(CACHE_NAME);
          cache.put('./index.html', fresh.clone());
          return fresh;
        } catch {
          const cached = await caches.match('./index.html');
          return cached || Response.error();
        }
      })()
    );
    return;
  }

  event.respondWith(
    (async () => {
      const cached = await caches.match(req);
      if (cached) return cached;

      try {
        const res = await fetch(req);
        // Cache GET requests (best-effort).
        if (req.method === 'GET' && res && res.ok) {
          const cache = await caches.open(CACHE_NAME);
          cache.put(req, res.clone());
        }
        return res;
      } catch (err) {
        // Network failure: return cached fallback if available.
        const fallback = await caches.match(req);
        return fallback || Response.error();
      }
    })()
  );
});
