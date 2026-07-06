const CACHE_NAME = 'fluentcards-v1';

// Assets to pre-cache on install
const PRECACHE_URLS = [
  '/app/',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png',
];

// Install — pre-cache core assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_URLS);
    })
  );
});

// Activate — clean old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((names) => {
      return Promise.all(
        names.filter((n) => n !== CACHE_NAME).map((n) => caches.delete(n))
      );
    })
  );
});

// Fetch — network-first for JS/CSS, cache-first for app shell
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Only handle fluencards.org requests
  if (url.hostname !== 'fluentcards.org' && !url.hostname.includes('pages.dev')) return;

  // For JS and CSS — network first, fall back to cache
  if (url.pathname.includes('/_astro/')) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          return response;
        })
        .catch(() => caches.match(event.request))
    );
    return;
  }

  // For the app shell — cache first, update in background
  if (url.pathname.startsWith('/app/')) {
    event.respondWith(
      caches.match(event.request).then((cached) => {
        const fetchPromise = fetch(event.request).then((response) => {
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, response.clone()));
          return response;
        });
        return cached || fetchPromise;
      })
    );
    return;
  }

  // For other static assets — network first
  event.respondWith(
    fetch(event.request)
      .catch(() => caches.match(event.request))
  );
});
