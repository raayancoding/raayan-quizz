/* Raayan Quizz service worker — app shell cached up front; quizzes, book manifests and
 * page images cached on first use (stale-while-revalidate) so the app works offline
 * for anything the kid has already opened. Bump VERSION on each release. */
const VERSION = "rq-v1.2.0";
const SHELL = [
  "./", "./index.html", "./css/styles.css",
  "./js/app.js", "./js/reader.js", "./js/game.js", "./js/practice.js",
  "./vendor/page-flip.browser.js", "./favicon.svg", "./logo.png", "./manifest.webmanifest",
  "./quizzes/index.json",
];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(VERSION).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", (e) => {
  e.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET" || new URL(req.url).origin !== location.origin) return;
  e.respondWith(
    caches.match(req).then((cached) => {
      const network = fetch(req).then((res) => {
        if (res && res.ok) caches.open(VERSION).then((c) => c.put(req, res.clone()));
        return res;
      }).catch(() => cached);
      // page images are immutable: cache-first; everything else: stale-while-revalidate
      if (cached && /\/(p|t)\/\d{3}\.webp$/.test(req.url)) return cached;
      return cached ? (network, cached) : network;
    })
  );
});
