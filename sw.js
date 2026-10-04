/* Tapehead Pro service worker — network-first shell with offline fallback */
const CACHE='tapehead-v11048';
const SHELL = ['./index.html', './cloud-config.js', './manifest.webmanifest', './icon-192.png', './icon-512.png'];

self.addEventListener('install', (e) => {
  self.skipWaiting();
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL).catch(() => {})));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('message', (e) => {
  if (e.data && e.data.type === 'SKIP_WAITING') self.skipWaiting();
});

self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  const url = new URL(e.request.url);

  // Never cache API responses: auth, Pro status, AI, payments and account
  // operations must always reach the server and must never be served stale.
  if (url.pathname.startsWith('/api/')) {
    e.respondWith(fetch(e.request, { cache: 'no-store' }));
    return;
  }

  const isShell =
    e.request.mode === 'navigate' ||
    url.pathname.endsWith('.html') ||
    url.pathname.endsWith('/') ||
    url.pathname.endsWith('sw.js') ||
    url.pathname.endsWith('cloud-config.js') ||
    url.pathname.endsWith('manifest.webmanifest');

  if (isShell) {
    e.respondWith(
      fetch(e.request, { cache: 'no-store' })
        .then((res) => {
          if (res && res.ok) {
            const copy = res.clone();
            // Cache each file under its own URL (never store one page under another page's key).
            caches.open(CACHE).then((c) => c.put(e.request, copy)).catch(() => {});
          }
          return res;
        })
        .catch(() =>
          caches.match(e.request).then((hit) =>
            hit || (e.request.mode === 'navigate' ? caches.match('./index.html') : undefined) || Response.error()
          )
        )
    );
    return;
  }

  e.respondWith(
    fetch(e.request)
      .then((res) => {
        if (res && res.ok) {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(e.request, copy)).catch(() => {});
        }
        return res;
      })
      .catch(() => caches.match(e.request))
  );
});
