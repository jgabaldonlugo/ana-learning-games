const CACHE = "ana-games-v3";
const ASSETS = [
  "./",
  "./index.html",
  "./math.html",
  "./reading.html",
  "./manifest.webmanifest",
  "./icon-192.png",
  "./icon-512.png",
  "./icon-192-maskable.png",
  "./icon-512-maskable.png",
  "./apple-touch-icon.png",
  "./favicon.png"
];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// HTML pages: network-first (always get the latest game), fall back to cache when offline.
// Other assets (icons): cache-first for speed.
self.addEventListener("fetch", e => {
  if (e.request.method !== "GET") return;
  const isHTML = e.request.mode === "navigate" ||
                 (e.request.headers.get("accept") || "").includes("text/html");
  if (isHTML) {
    e.respondWith(
      fetch(e.request)
        .then(res => { const copy = res.clone(); caches.open(CACHE).then(c => c.put(e.request, copy)); return res; })
        .catch(() => caches.match(e.request).then(hit => hit || caches.match("./index.html")))
    );
  } else {
    e.respondWith(
      caches.match(e.request).then(hit => hit || fetch(e.request).catch(() => caches.match("./index.html")))
    );
  }
});
