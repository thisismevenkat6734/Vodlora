/* =========================================
   VIDLORA - SERVICE WORKER
   File: service-worker.js
========================================= */

"use strict";

const CACHE_NAME = "vidlora-cache-v1";

const APP_SHELL = [
  "./",
  "./index.html",
  "./css/style.css",
  "./css/responsive.css",
  "./js/app.js",
  "./js/downloader.js",
  "./manifest.json"
];


/* =========================================
   INSTALL
========================================= */

self.addEventListener("install", event => {

  event.waitUntil(

    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting())

  );

});


/* =========================================
   ACTIVATE
========================================= */

self.addEventListener("activate", event => {

  event.waitUntil(

    caches.keys()
      .then(cacheNames => {

        return Promise.all(

          cacheNames.map(cacheName => {

            if (
              cacheName !== CACHE_NAME &&
              cacheName.startsWith("vidlora-cache-")
            ) {

              return caches.delete(cacheName);

            }

            return Promise.resolve(false);

          })

        );

      })
      .then(() => self.clients.claim())

  );

});


/* =========================================
   FETCH
========================================= */

self.addEventListener("fetch", event => {

  const request = event.request;

  const url = new URL(request.url);

  // Only handle same-origin GET requests.
  if (
    request.method !== "GET" ||
    url.origin !== self.location.origin
  ) {

    return;

  }

  // Do not cache video/media requests.
  if (
    request.destination === "video" ||
    request.destination === "audio"
  ) {

    return;

  }

  // HTML navigation: network first, offline fallback.
  if (request.mode === "navigate") {

    event.respondWith(

      fetch(request)
        .then(response => {

          if (response.ok) {

            const copy = response.clone();

            caches.open(CACHE_NAME)
              .then(cache => cache.put(request, copy));

          }

          return response;

        })
        .catch(async () => {

          return (
            await caches.match(request) ||
            await caches.match("./index.html")
          );

        })

    );

    return;

  }

  // Static assets: cache first.
  event.respondWith(

    caches.match(request)
      .then(cachedResponse => {

        if (cachedResponse) {
          return cachedResponse;
        }

        return fetch(request)
          .then(response => {

            if (
              response.ok &&
              response.type === "basic"
            ) {

              const copy = response.clone();

              caches.open(CACHE_NAME)
                .then(cache => cache.put(request, copy));

            }

            return response;

          });

      })

  );

});


/* =========================================
   MESSAGE HANDLING
========================================= */

self.addEventListener("message", event => {

  if (event.data === "SKIP_WAITING") {

    self.skipWaiting();

  }

});
