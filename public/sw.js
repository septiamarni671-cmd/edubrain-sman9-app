const CACHE_NAME = "edubrain-sman9-v12";
const APP_SHELL = [
  "/",
  "/manifest.webmanifest",
  "/logo-edubrain.svg"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)).catch(() => {})
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("fetch", (event) => {
  const request = event.request;

  if (request.method !== "GET") return;

  event.respondWith(
    fetch(request).catch(() => caches.match(request).then((cached) => cached || caches.match("/")))
  );
});
