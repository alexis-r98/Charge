/*
 * Service worker — l'app fonctionne hors ligne (salle sans réseau, cuisine en mode avion).
 * Stratégie « réseau d'abord » : en ligne on a toujours la dernière version,
 * hors ligne on sert la copie en cache. Incrémenter VERSION à chaque livraison.
 */
const VERSION = 'charge-v5';
const ASSETS = [
  './',
  'index.html',
  'css/app.css',
  'js/app.js',
  'js/store.js',
  'js/generator.js',
  'js/weight.js',
  'js/data-recipes.js',
  'js/data-exercises.js',
  'js/data-recipes-extra.js',
  'js/foods.js',
  'js/figures.js',
  'js/calc.js',
  'js/progress.js',
  'js/native.js',
  'manifest.webmanifest',
  'icon.svg',
  'icon-192.png',
  'icon-512.png',
  'apple-touch-icon.png',
  'fonts/barlow-400.woff2',
  'fonts/barlow-500.woff2',
  'fonts/barlow-600.woff2',
  'fonts/barlow-700.woff2',
  'fonts/barlow-condensed-600.woff2',
  'fonts/barlow-condensed-700.woff2',
  'fonts/barlow-condensed-800.woff2',
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(VERSION).then((c) => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== location.origin) return;
  e.respondWith(
    fetch(req)
      .then((res) => {
        if (res.ok) {
          const copy = res.clone();
          caches.open(VERSION).then((c) => c.put(req, copy));
        }
        return res;
      })
      .catch(() => caches.match(req, { ignoreSearch: true })
        .then((hit) => hit || (req.mode === 'navigate' ? caches.match('index.html') : Response.error()))),
  );
});

// Tap sur une notification de repos : revenir dans l'app (séance en cours)
self.addEventListener('notificationclick', (e) => {
  e.notification.close();
  e.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((list) => {
      const c = list.find((w) => w.url.includes(self.registration.scope));
      if (c) return c.focus();
      return self.clients.openWindow('./#/seance');
    }),
  );
});
