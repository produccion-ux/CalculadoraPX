// CAMBIO: Incrementamos la versión del caché. Cada vez que hagas un cambio importante
// en el service worker, es buena idea cambiar este nombre.
const CACHE_NAME = 'price-calculator-v2';
const urlsToCache = [
  'calculadora_precios.html',
  'manifest.json',
  'logo.png' // Agregamos el logo para que también funcione offline
];

// Durante la instalación, guardamos los archivos base en la caché.
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(urlsToCache);
    })
  );
  // CAMBIO: Forzamos al nuevo Service Worker a activarse inmediatamente.
  self.skipWaiting();
});

self.addEventListener('message', event => {
  if (event.data.action === 'skipWaiting') {
    self.skipWaiting();
  }
});

// Durante la activación, limpiamos las cachés viejas.
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
  // CAMBIO: Le decimos que tome el control de la página inmediatamente.
  self.clients.claim();
});

// CAMBIO: Nueva estrategia para manejar las peticiones.
// Esto se llama "Stale-While-Revalidate".
self.addEventListener('fetch', event => {
  // Ignoramos peticiones que no son GET (como POST, etc.)
  if (event.request.method !== 'GET') {
    return;
  }

  event.respondWith(
    caches.open(CACHE_NAME).then(cache => {
      return cache.match(event.request).then(response => {
        // 1. Intenta obtener el recurso de la red en segundo plano.
        const fetchPromise = fetch(event.request).then(networkResponse => {
          // Si la petición a la red es exitosa, la guardamos en la caché
          // para la próxima vez que se abra la app.
          if (networkResponse.ok) {
            cache.put(event.request, networkResponse.clone());
          }
          return networkResponse;
        }).catch(err => {
          // El fetch falló, probablemente porque no hay conexión.
          // En este caso, no hacemos nada y confiamos en la caché.
        });

        // 2. Mientras tanto, devuelve la versión que ya está en la caché (si existe).
        // Si no hay nada en la caché, espera a que la petición de red termine.
        return response || fetchPromise;
      });
    })
  );
});
