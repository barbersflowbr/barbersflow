/// <reference lib="webworker" />

declare const self: ServiceWorkerGlobalScope;

const CACHE_NAME = 'barbersflow-cache-v1';

// Minimal list of critical shell assets to cache on install
const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/logo.svg'
];

// Helper to check if a request is an API call
const isApiRequest = (url: URL): boolean => {
  return url.pathname.startsWith('/api/') || url.origin !== self.location.origin;
};

// Helper to check if a request should use SWR strategy
const isSWRRequest = (url: URL): boolean => {
  return (
    url.pathname.includes('/api/bookings') ||
    (url.hostname.endsWith('.supabase.co') && url.pathname.includes('barbearias'))
  );
};

// Install Event: Pre-cache critical static assets
self.addEventListener('install', (event: ExtendableEvent) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[Service Worker] Pre-caching static assets');
      return cache.addAll(PRECACHE_ASSETS);
    }).then(() => {
      // Force the waiting service worker to become active
      return self.skipWaiting();
    })
  );
});

// Activate Event: Clean up old caches and take control
self.addEventListener('activate', (event: ExtendableEvent) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('[Service Worker] Removing old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      // Take control of all open clients immediately
      return self.clients.claim();
    })
  );
});

// Push Event: Handle incoming push notifications
self.addEventListener('push', (event: any) => {
  const data = event.data ? event.data.text() : 'Nova atualização na Barbearia!';
  const options = {
    body: data,
    icon: '/logo.svg',
    badge: '/logo.svg'
  };

  event.waitUntil(
    self.registration.showNotification('BarbersFlow', options)
  );
});

// Fetch Event: Implement specialized caching strategies
self.addEventListener('fetch', (event: FetchEvent) => {
  const requestUrl = new URL(event.request.url);

  // Skip caching non-GET requests (e.g., POST appointments)
  if (event.request.method !== 'GET') {
    return;
  }

  // 1. API Caching Strategy: Stale-While-Revalidate for bookings and barber details, Network-First for others
  if (isApiRequest(requestUrl)) {
    if (isSWRRequest(requestUrl)) {
      event.respondWith(
        caches.open(CACHE_NAME).then(async (cache) => {
          const cachedResponse = await cache.match(event.request);
          const networkPromise = fetch(event.request)
            .then((networkResponse) => {
              if (networkResponse.status === 200) {
                cache.put(event.request, networkResponse.clone());
              }
              return networkResponse;
            })
            .catch((err) => {
              console.warn('[Service Worker] Revalidation failed:', err);
              if (cachedResponse) return cachedResponse;
              return new Response(
                JSON.stringify({ 
                  error: 'Você está offline', 
                  message: 'Não foi possível conectar ao servidor. Por favor, verifique sua conexão.' 
                }),
                { 
                  status: 503, 
                  headers: { 'Content-Type': 'application/json' } 
                }
              );
            });
          return cachedResponse || networkPromise;
        })
      );
      return;
    }

    event.respondWith(
      fetch(event.request)
        .then((response) => {
          // If the API call succeeded, cache a clone for offline read fallback
          if (response.status === 200 && requestUrl.pathname.includes('/api/bookings')) {
            const responseClone = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseClone);
            });
          }
          return response;
        })
        .catch(() => {
          // If offline, attempt to serve cached API response
          return caches.match(event.request).then((cachedResponse) => {
            if (cachedResponse) {
              return cachedResponse;
            }
            // Return a custom offline JSON error if no cache exists
            return new Response(
              JSON.stringify({ 
                error: 'Você está offline', 
                message: 'Não foi possível conectar ao servidor. Por favor, verifique sua conexão.' 
              }),
              { 
                status: 503, 
                headers: { 'Content-Type': 'application/json' } 
              }
            );
          });
        })
    );
    return;
  }

  // 2. Static Assets / Scripts Strategy: Stale-While-Revalidate
  // For standard files, images, bundles - serve fast from cache first, then update in background.
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      const fetchPromise = fetch(event.request).then((networkResponse) => {
        // Only cache valid successful GET responses
        if (networkResponse.status === 200) {
          const responseClone = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone);
          });
        }
        return networkResponse;
      }).catch((err) => {
        console.warn('[Service Worker] Fetch failed, network may be offline:', err);
        // Fallback to offline index.html for page navigation requests
        if (event.request.mode === 'navigate') {
          return caches.match('/index.html') as Promise<Response>;
        }
        throw err;
      });

      return cachedResponse || fetchPromise;
    })
  );
});
