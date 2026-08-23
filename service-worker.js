const CACHE_NAME = "voyages-40";

const FILES = [
    "index.html",
    "ajout.html",
    "voyages.html",
    "carte.html",
    "style.css",
    "carte.css",
    "script.js",
    "ajout.js",
    "voyages.js",
    "carte.js",
    "fond.png",
    "fond-ajouter.png",
    "fond-map.png",
    "btn-ajouter.png",
    "btn-voyages.png",
    "signet.png",
    "tampon.png",
    "icone-192.png",
    "icone-512.png",
    "manifest.webmanifest"
];

self.addEventListener("install", event => {

    self.skipWaiting();

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
        ).then(() => self.clients.claim())

    );
});

self.addEventListener("fetch", event => {

    event.respondWith(

        caches.match(event.request).then(response => {

            return response || fetch(event.request);

        })

    );
});
