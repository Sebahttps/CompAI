/* w-note · service worker: deja abrir la app sin señal. Nunca guarda la API (las notas viven en localStorage). */
const CACHE = "wnote-v1";
const SHELL = ["./", "index.html", "manifest.webmanifest", "marca/wnote-logo.svg", "marca/wnote-192.png",
  "marca/apple-touch-icon.png", "../css/fuentes/spacegrotesk-var-latin.woff2"];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => Promise.allSettled(SHELL.map(u => c.add(u)))).then(() => self.skipWaiting()));
});
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});
self.addEventListener("fetch", e => {
  const url = new URL(e.request.url);
  if (e.request.method !== "GET" || url.origin !== location.origin) return; // API (Apps Script) va directo a la red
  // red primero (para recibir mejoras), caché si no hay señal
  e.respondWith(fetch(e.request).then(r => {
    if (r.ok) { const copy = r.clone(); caches.open(CACHE).then(c => c.put(e.request, copy)); }
    return r;
  }).catch(() => caches.match(e.request, { ignoreSearch: true }).then(r => r || caches.match("index.html"))));
});
