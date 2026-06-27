const STATIC = 'wavr-static-v1';
const PAGES = 'wavr-pages-v1';
const ALL = [STATIC, PAGES];

self.addEventListener('install', () => self.skipWaiting());

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => !ALL.includes(k)).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);

  // Next.js static assets are content-hashed — safe to cache forever
  if (url.pathname.startsWith('/_next/static/')) {
    e.respondWith(
      caches.open(STATIC).then(c =>
        c.match(e.request).then(hit =>
          hit ?? fetch(e.request).then(r => { c.put(e.request, r.clone()); return r; })
        )
      )
    );
    return;
  }

  // Sign pages — network first, fall back to cached version when offline
  if (url.pathname.startsWith('/sign/') && e.request.mode === 'navigate') {
    e.respondWith(
      fetch(e.request)
        .then(r => { caches.open(PAGES).then(c => c.put(e.request, r.clone())); return r; })
        .catch(() => caches.match(e.request))
    );
    return;
  }

  // Images and fonts — cache first
  if (['image', 'font'].includes(e.request.destination)) {
    e.respondWith(
      caches.open(STATIC).then(c =>
        c.match(e.request).then(hit => {
          if (hit) return hit;
          return fetch(e.request).then(r => { c.put(e.request, r.clone()); return r; });
        })
      )
    );
  }
});
