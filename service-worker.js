const CACHE_NAME = 'price-calculator-v3'; // Versión actualizada
const urlsToCache = [
  'calculadora_precios.html',
  'admin.html', // Añadimos la nueva página
  'manifest.json',
  'logo.png' 
];

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(urlsToCache)));
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(() => caches.match('calculadora_precios.html'))
    );
    return;
  }
  
  event.respondWith(
    caches.open(CACHE_NAME).then(cache => {
      return fetch(event.request).then(networkResponse => {
        if (networkResponse.ok) {
          cache.put(event.request, networkResponse.clone());
        }
        return networkResponse;
      }).catch(() => {
        return cache.match(event.request);
      });
    })
  );
});

