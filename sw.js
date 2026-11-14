const CACHE_NAME = 'neko-3ds-v11';

// Fichiers de base mis en cache dès l'installation
const CORE_ASSETS = [
  './',
  './index.html',
  './manifest.webmanifest',
  './icon-192.png',
  './icon-512.png'
];

// 1. Installation : mise en cache des fichiers essentiels
self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      // On ajoute chaque fichier individuellement pour éviter qu'un fichier manquant (ex: icône) ne bloque tout
      return Promise.allSettled(
        CORE_ASSETS.map((url) => cache.add(url))
      );
    })
  );
});

// 2. Activation : nettoyage automatique des anciens caches (neko-v1 à neko-v7)
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      );
    }).then(() => self.clients.claim())
  );
});

// 3. Interception réseau : Cache-First pour les modèles 3D (.glb) et Three.js, Network-First pour index.html
self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);

  // Pour la page principale (index.html), on cherche d'abord la dernière version sur le réseau
  if (req.mode === 'navigate' || url.pathname.endsWith('index.html')) {
    event.respondWith(
      fetch(req)
        .then((networkRes) => {
          const clone = networkRes.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(req, clone));
          return networkRes;
        })
        .catch(() => caches.match(req))
    );
    return;
  }

  // Pour les modèles 3D (.glb/.gltf), les icônes et Three.js (unpkg.com) : Cache d'abord, puis mise en cache dynamique
  event.respondWith(
    caches.match(req).then((cachedRes) => {
      if (cachedRes) return cachedRes;

      return fetch(req).then((networkRes) => {
        if (networkRes && networkRes.status === 200) {
          const clone = networkRes.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(req, clone));
        }
        return networkRes;
      });
    })
  );
});
