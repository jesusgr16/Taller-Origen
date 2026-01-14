const CACHE_NAME = "ventas-cache-v2";
const BASE_PATH = "/Taller-Origen/";

const FILES_TO_CACHE = [
  BASE_PATH + "index.html",
  BASE_PATH + "style.css",
  BASE_PATH + "app.js",
  BASE_PATH + "manifest.json",
  BASE_PATH + "icon-ios.png",
  BASE_PATH + "icon-192.png",
  BASE_PATH + "icon-512.png"
];

self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(async cache => {
      for (const file of FILES_TO_CACHE) {
        try {
          await cache.add(file);
        } catch (e) {
          console.warn("No se pudo cachear:", file);
        }
      }
    })
  );
  self.skipWaiting();
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.map(key => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      )
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", event => {
  if (event.request.method !== "GET") return;

  event.respondWith(
    caches.match(event.request).then(cached => {
      return (
        cached ||
        fetch(event.request).catch(() => {
          return caches.match(BASE_PATH + "index.html");
        })
      );
    })
  );
});