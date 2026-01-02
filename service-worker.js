self.addEventListener("install", event => {
  event.waitUntil(
    caches.open("ventas-cache").then(cache => {
      return cache.addAll([
        "/",
        "/index.html",
        "/style.css",
        "/app.js",
        "/firebase.js"
      ]);
    })
  );
});
