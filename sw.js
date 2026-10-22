/*
 * Inkling service worker: keeps a copy of the app so it opens offline.
 *
 * IMPORTANT: whenever you change any file, change VERSION below
 * (for example inkling-v1 -> inkling-v2). That tells phones to refresh their copy.
 */
const VERSION = 'inkling-v1';

const FILES = [
  './',
  'index.html',
  'styles.css',
  'prompts.js',
  'logic.js',
  'app.js',
  'manifest.webmanifest',
  'icons/icon-192.png',
  'icons/icon-512.png',
  'icons/icon-maskable-512.png',
  'icons/apple-touch-icon.png',
  'icons/favicon-32.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(VERSION).then((cache) => cache.addAll(FILES)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// Network first, so updates show straight away when online.
// On a slow connection (2 seconds) or offline, use the saved copy instead.
self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  if (new URL(req.url).origin !== self.location.origin) return;
  event.respondWith(networkFirst(req));
});

async function fromCache(req) {
  return (await caches.match(req, { ignoreSearch: true })) ||
         (req.mode === 'navigate' ? await caches.match('index.html') : undefined);
}

function networkFirst(req) {
  return new Promise((resolve) => {
    let settled = false;
    const done = (res) => { if (!settled && res) { settled = true; resolve(res); } };

    const slow = setTimeout(() => { fromCache(req).then(done); }, 2000);

    fetch(req).then((res) => {
      clearTimeout(slow);
      if (res && res.ok) {
        const copy = res.clone();
        caches.open(VERSION).then((cache) => cache.put(req, copy));
      }
      if (settled) return;
      settled = true;
      resolve(res);
    }).catch(() => {
      clearTimeout(slow);
      fromCache(req).then((res) => {
        if (res) done(res);
        else if (!settled) { settled = true; resolve(Response.error()); }
      });
    });
  });
}
