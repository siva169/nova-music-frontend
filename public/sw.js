const CACHE_NAME = 'nova-music-v1';

self.addEventListener('install', e => {
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(clients.claim());
});

// Keep service worker alive for background audio
self.addEventListener('fetch', e => {
  // Let all requests pass through
  e.respondWith(fetch(e.request).catch(() => {
    return new Response('Offline', { status: 503 });
  }));
});

// Handle media session actions from lock screen
self.addEventListener('message', e => {
  if (e.data && e.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
