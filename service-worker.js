const CACHE_NAME = "mes-voyages-v1";

const FILES = [
    "index.html",
    "voyages.html",
    "ajouter.html",
    "style.css",
    "index.js",
    "voyages.js",
    "ajouter.js",
    "fond.png",
    "icon-192.png",
    "icon-512.png"
];

self.addEventListener("install", event => {
    event.waitUntil(
        caches.open(CACHE_NAME).then(cache => {
            return cache.addAll(FILES);
        })
    );
});

self.addEventListener("activate", event => {
    event.waitUntil(
        caches.keys().then(keys =>
            Promise.all(
                keys
                    .filter(key => key !== CACHE_NAME)
                    .map(key => caches.delete(key))
            )
        )
    );
});

self.addEventListener("fetch", event => {
    event.respondWith(
        caches.match(event.request).then(response => {
            return response || fetch(event.request);
        })
    );
});
