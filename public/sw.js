const CACHE_NAME = 'aramshkon-pwa-v1';
const OFFLINE_URL = '/offline.html';
const APP_SHELL = [
  '/',
  '/index.html',
  OFFLINE_URL,
  '/manifest.json',
  '/icons/icon-192.png',
  '/icons/icon-512.png'
];

// Install Event
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[Service Worker] Pre-caching offline pages and app shell...');
      return cache.addAll(APP_SHELL);
    }).then(() => self.skipWaiting())
  );
});

// Activate Event
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            console.log('[Service Worker] Deleting old cache:', cache);
            return caches.delete(cache);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch Event Handler
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // 1. NEVER cache any API requests, Gemini endpoints, or websocket endpoints
  if (
    url.pathname.startsWith('/api/') || 
    url.pathname.includes('/couple/') ||
    event.request.method !== 'GET'
  ) {
    event.respondWith(fetch(event.request));
    return;
  }

  // 2. Navigation requests (HTML pages / SPA routing)
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .catch(() => {
          // If network fetch fails, attempt to serve the SPA shell or the custom offline fallback page
          return caches.match('/')
            .then((response) => response || caches.match(OFFLINE_URL));
        })
    );
    return;
  }

  // 3. Static assets & other assets (Cache-first with network fallback)
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        // Fetch in background to update cache (Stale-While-Revalidate)
        fetch(event.request).then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, networkResponse);
            });
          }
        }).catch(() => { /* Ignore background fetch failures */ });
        
        return cachedResponse;
      }

      return fetch(event.request).then((networkResponse) => {
        // Don't cache non-200 or non-basic responses
        if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
          return networkResponse;
        }

        const responseToCache = networkResponse.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseToCache);
        });

        return networkResponse;
      }).catch(() => {
        // Return offline fallback page for images or major page requests if completely offline
        if (event.request.destination === 'image') {
          // You could return a placeholder svg/image if needed
        }
      });
    })
  );
});

// Handle update prompts
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
