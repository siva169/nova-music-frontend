// NOVA Music Service Worker - Background Play v3
const CACHE_NAME = 'nova-v3';
const STATIC_ASSETS = ['/', '/index.html', '/manifest.json'];

self.addEventListener('install', e => {
  self.skipWaiting();
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(STATIC_ASSETS).catch(() => {}))
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    Promise.all([
      clients.claim(),
      caches.keys().then(keys =>
        Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
      )
    ])
  );
});

// Cache static assets, pass through API calls
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);

  // Don't cache API calls or YouTube
  if (url.hostname.includes('railway.app') ||
      url.hostname.includes('youtube.com') ||
      url.hostname.includes('ytimg.com') ||
      url.pathname.startsWith('/api/') ||
      url.pathname.startsWith('/auth/')) {
    e.respondWith(fetch(e.request).catch(() => new Response('', { status: 503 })));
    return;
  }

  // Cache-first for static assets
  e.respondWith(
    caches.match(e.request).then(cached => {
      if (cached) return cached;
      return fetch(e.request).then(response => {
        if (response.ok && e.request.method === 'GET') {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(e.request, clone)).catch(() => {});
        }
        return response;
      }).catch(() => caches.match('/index.html'));
    })
  );
});

// Handle keep-alive pings from app
self.addEventListener('message', e => {
  if (e.data?.type === 'KEEP_ALIVE') {
    e.source?.postMessage({ type: 'ALIVE', timestamp: Date.now() });
  }
  if (e.data?.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// Background sync - keeps SW alive
self.addEventListener('sync', e => {
  if (e.tag === 'background-play') {
    e.waitUntil(Promise.resolve());
  }
});
