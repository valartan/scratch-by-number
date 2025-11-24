const CACHE_NAME = "sbn-cache-v1";

const ASSETS = [
  "game.html",
  "manifest.webmanifest",
  "sw.js",
  "icons/icon-192.png",
  "icons/icon-512.png",
  "sounds/sound_pop_select.mp3",
  "sounds/sound_pop_done.mp3",
  "sounds/sound_scratch.mp3",
  "levels/levels.json"
  // Tu peux ajouter dynamiquement les niveaux plus tard
];


self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
      )
    )
  ); 
});

self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response ||
        fetch(event.request).catch(() => caches.match("game.html"));
    })
  );
});
