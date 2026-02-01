// Service Worker for AI-Med-Agent
// Provides offline support, caching, and PWA capabilities

const CACHE_VERSION = 'v1';
const CACHE_NAMES = {
  static: `ai-med-agent-static-${CACHE_VERSION}`,
  dynamic: `ai-med-agent-dynamic-${CACHE_VERSION}`,
  api: `ai-med-agent-api-${CACHE_VERSION}`,
};

const STATIC_URLS = [
  '/',
  '/index.html',
  '/favicon.ico',
  '/manifest.json',
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAMES.static).then((cache) => {
      return cache.addAll(STATIC_URLS).catch(() => {
        // Gracefully handle missing files
      });
    })
  );
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((cacheName) => !Object.values(CACHE_NAMES).includes(cacheName))
          .map((cacheName) => caches.delete(cacheName))
      );
    })
  );
  self.clients.claim();
});

// Fetch event - implement caching strategy
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // API requests - network first, fallback to cache
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.ok) {
            const cache = caches.open(CACHE_NAMES.api);
            cache.then((c) => c.put(request, response.clone()));
          }
          return response;
        })
        .catch(() => {
          return caches.match(request);
        })
    );
    return;
  }

  // Static assets - cache first, fallback to network
  if (
    request.destination === 'style' ||
    request.destination === 'script' ||
    request.destination === 'font' ||
    request.destination === 'image'
  ) {
    event.respondWith(
      caches.match(request).then((response) => {
        if (response) {
          return response;
        }
        return fetch(request).then((response) => {
          if (!response || response.status !== 200 || response.type === 'error') {
            return response;
          }
          const cache = caches.open(CACHE_NAMES.static);
          cache.then((c) => c.put(request, response.clone()));
          return response;
        });
      })
    );
    return;
  }

  // HTML pages - network first, fallback to cache
  if (request.destination === 'document') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.ok) {
            const cache = caches.open(CACHE_NAMES.dynamic);
            cache.then((c) => c.put(request, response.clone()));
          }
          return response;
        })
        .catch(() => {
          return caches.match(request);
        })
    );
    return;
  }

  // Default - network first
  event.respondWith(
    fetch(request).catch(() => {
      return caches.match(request);
    })
  );
});

// Background sync for API calls
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-decisions') {
    event.waitUntil(syncDecisions());
  }
});

async function syncDecisions() {
  try {
    const cache = await caches.open(CACHE_NAMES.api);
    const requests = await cache.keys();
    const apiRequests = requests.filter((req) => req.url.includes('/api/'));
    
    for (const request of apiRequests) {
      try {
        await fetch(request);
      } catch (error) {
        console.log('Sync failed for:', request.url);
      }
    }
  } catch (error) {
    console.error('Background sync error:', error);
  }
}

// Push notifications (optional)
self.addEventListener('push', (event) => {
  if (event.data) {
    const options = {
      body: event.data.text(),
      icon: '/favicon-32x32.png',
      badge: '/favicon-16x16.png',
      tag: 'ai-med-agent-notification',
      requireInteraction: false,
    };
    event.waitUntil(
      self.registration.showNotification('AI-Med-Agent', options)
    );
  }
});
