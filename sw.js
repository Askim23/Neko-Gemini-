const CACHE = 'pixelbot-v1';
const FILES = ['./', './index.html', './style.css', './app.js', './manifest.json',
  './assets/idle_1.png','./assets/idle_2.png','./assets/blink.png',
  './assets/sleep_1.png','./assets/sleep_2.png','./assets/curious.png','./assets/love.png',
  './assets/surprised.png','./assets/angry_1.png','./assets/angry_2.png',
  './assets/purr_1.png','./assets/purr_2.png','./assets/icon-192.png','./assets/icon-512.png'];
self.addEventListener('install', event => event.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES))));
self.addEventListener('activate', event => event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))));
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  event.respondWith(caches.match(event.request).then(cached => cached || fetch(event.request).then(response => {
    const copy = response.clone(); caches.open(CACHE).then(c => c.put(event.request, copy)); return response;
  }).catch(() => caches.match('./index.html'))));
});
