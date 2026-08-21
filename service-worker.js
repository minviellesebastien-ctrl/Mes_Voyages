const CACHE_NAME = "mes-voyages41";

const FILES = [
    "index.html",
    "ajout.html",
    "voyages.html",
    "style.css",
    "script.js",
    "ajout.js",
    "voyages.js",
    "fond.png",
    "btn-ajouter.png",
    "btn-voyages.png",
    "icone-192.png",
    "icone-512.png",
    "manifest.webmanifest"
];

self.addEventListener("install", event => {
    event.waitUntil(
        caches.open(CACHE_NAME).then(cache => cache.addAll(FILES))
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
