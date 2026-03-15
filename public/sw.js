// NOVA Music Service Worker - Background Play
const CACHE_NAME = 'nova-v2';

self.addEventListener('install', e => {
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(clients.claim());
});

// Keep service worker alive - this is what enables background audio
self.addEventListener('fetch', e => {
  e.respondWith(
    fetch(e.request).catch(() => {
      return caches.match(e.request);
    })
  );
});

// Handle messages from main app
self.addEventListener('message', e => {
  if (e.data?.type === 'KEEP_ALIVE') {
    // Respond to keep alive pings from the app
    e.source?.postMessage({ type: 'ALIVE' });
  }
});

// This keeps the service worker active even when app is in background
self.addEventListener('notificationclick', e => {
  e.notification.close();
  e.waitUntil(clients.openWindow('/'));
});
