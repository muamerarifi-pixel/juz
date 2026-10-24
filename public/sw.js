// Service worker i JUZ — punon plotësisht pa internet.
// RRITE VERSIONIN me çdo publikim të ri (p.sh. juz-v1.0.1), që pajisjet të marrin skedarët e rinj.
const VERSION = 'juz-v7.12.1-cf';
const FONT_CACHE = 'juz-font-1'; // mbetet mes versioneve
const QCF_CACHE = 'juz-qcf-1';   // fontet dhe kodet e texhvidit (QCF V4), mbeten mes versioneve

const JUZ = Array.from({ length: 30 }, (_, i) => `/data/juz-${String(i + 1).padStart(2, '0')}.json`);
const PRECACHE = [
  '/',
  '/index.html',
  '/style.css',
  '/app.js',
  '/merge.js',
  '/paper.js',
  '/manifest.json',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  '/icons/maskable-512.png',
  '/icons/apple-touch-icon.png',
  '/icons/favicon.png',
  '/fonts/inter-latin-ext-wght-normal.woff2',
  '/fonts/inter-latin-wght-normal.woff2',
  '/fonts/literata-latin-ext-wght-normal.woff2',
  '/fonts/literata-latin-wght-normal.woff2',
  '/fonts/lora-latin-ext-wght-normal.woff2',
  '/fonts/lora-latin-wght-normal.woff2',
  '/fonts/noto-naskh-arabic-arabic-wght-normal.woff2',
  '/fonts/harmattan-arabic-400-normal.woff2',
  '/fonts/harmattan-arabic-700-normal.woff2',
  '/fonts/noto-sans-arabic-arabic-wght-normal.woff2',
  '/fonts/noto-kufi-arabic-arabic-wght-normal.woff2',
  '/fonts/scheherazade-new-arabic-400-normal.woff2',
  '/fonts/scheherazade-new-arabic-500-normal.woff2',
  '/fonts/scheherazade-new-arabic-600-normal.woff2',
  '/fonts/scheherazade-new-arabic-700-normal.woff2',
  '/textures/grain-day.webp',
  '/textures/grain-night.webp',
  '/data/meta.json',
  '/data/pages.json',
  ...JUZ,
];

self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(VERSION);
    // cache: 'reload' anashkalon cache-in HTTP, që të merren skedarët e rinj.
    await cache.addAll(PRECACHE.map((u) => new Request(u, { cache: 'reload' })));
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter((k) => k !== VERSION && k !== FONT_CACHE && k !== QCF_CACHE).map((k) => caches.delete(k)));
    await self.clients.claim();
  })());
});

function refresh(cache, request, key) {
  return fetch(request).then((res) => {
    if (res && res.ok && res.type === 'basic') cache.put(key, res.clone());
    return res;
  });
}

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;
  // Fonti i Diyanetit: ruhet pas ngarkimit të parë që të punojë pa internet.
  if (url.pathname === '/api/font') {
    event.respondWith((async () => {
      const cache = await caches.open(FONT_CACHE);
      const hit = await cache.match('/api/font');
      if (hit) return hit;
      const res = await fetch(req);
      if (res.ok) cache.put('/api/font', res.clone());
      return res;
    })());
    return;
  }
  // Texhvidi (QCF V4): ruhet pas herës së parë, që xhuzet e lexuara të hapen edhe pa internet.
  if (url.pathname === '/api/qcf-text' || url.pathname === '/api/qcf-font') {
    event.respondWith((async () => {
      const cache = await caches.open(QCF_CACHE);
      const hit = await cache.match(req);
      if (hit) return hit;
      const res = await fetch(req);
      // një përgjigje e pjesshme ("more") nuk ruhet: vjen e plotë herën tjetër
      if (res.ok && !/no-store/.test(res.headers.get('Cache-Control') || '')) cache.put(req, res.clone());
      return res;
    })());
    return;
  }
  if (url.pathname.startsWith('/api/')) return; // sinkronizimi asnjëherë në cache

  // Manifesti: gjithmonë nga rrjeti (Chrome e lexon për të përditësuar aplikacionin e instaluar).
  if (url.pathname === '/manifest.json') {
    event.respondWith((async () => {
      const cache = await caches.open(VERSION);
      try { return await refresh(cache, req, '/manifest.json'); } catch { return (await cache.match('/manifest.json')) || Response.error(); }
    })());
    return;
  }

  // Navigimi: gjithmonë index.html (edhe me ?k=KODI ose #/j/5), cache-first.
  if (req.mode === 'navigate') {
    event.respondWith((async () => {
      const cache = await caches.open(VERSION);
      const cached = await cache.match('/index.html');
      const net = refresh(cache, '/index.html', '/index.html').catch(() => null);
      if (cached) {
        event.waitUntil(net);
        return cached;
      }
      return (await net) || new Response('Pa internet', { status: 503, headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
    })());
    return;
  }

  // Gjithçka tjetër: cache-first me rifreskim në sfond.
  event.respondWith((async () => {
    const cache = await caches.open(VERSION);
    const cached = await cache.match(req, { ignoreSearch: true });
    const net = refresh(cache, req, url.pathname).catch(() => null);
    if (cached) {
      event.waitUntil(net);
      return cached;
    }
    return (await net) || Response.error();
  })());
});
