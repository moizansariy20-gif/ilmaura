
const CACHE_NAME = 'ilmaura-cache-v1';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/ilmaura-mascot.png',
  '/manifest.json'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  event.waitUntil(clients.claim());
});

self.addEventListener('fetch', (event) => {
  // We only care about GET requests for caching
  if (event.request.method !== 'GET') return;

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // If successful, clone and store in cache
        const resClone = response.clone();
        caches.open(CACHE_NAME).then((cache) => {
          // Don't cache chrome-extension or other non-http schemes
          if (event.request.url.startsWith('http')) {
            cache.put(event.request, resClone);
          }
        });
        return response;
      })
      .catch(() => {
        // If fetch fails (offline), try the cache
        return caches.match(event.request).then((response) => {
          if (response) return response;
          
          // If navigation request fails, return the cached index.html
          if (event.request.mode === 'navigate' || 
             (event.request.method === 'GET' && event.request.headers.get('accept').includes('text/html'))) {
            return caches.match('/');
          }
          
          // Fallback for images
          if (event.request.destination === 'image') {
            return caches.match('/ilmaura-mascot.png');
          }
        });
      })
  );
});
