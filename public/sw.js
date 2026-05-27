/**
 * Monk Mode Activated — service worker
 *
 * Minimal "app-shell" SW: caches the entry document + static assets on
 * activation and serves them with a network-first / cache-fallback strategy
 * for navigations, and a cache-first strategy for static assets. Just enough
 * to satisfy PWA installability and survive a flaky connection.
 *
 * We intentionally do NOT cache Supabase REST/Realtime traffic — the user's
 * habit/journal data should always come from the live DB so RLS + JWT
 * expiry behave correctly.
 */

const CACHE_NAME = "monk-mode-v1";
const APP_SHELL = [
  "/",
  "/manifest.webmanifest",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
  "/icons/apple-touch-icon.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;

  const url = new URL(req.url);

  // Never intercept anything that isn't the app's own origin
  if (url.origin !== self.location.origin) return;

  // Never cache the Supabase or auth API surface (we don't host either,
  // but this is a guardrail in case we ever proxy through /api/*)
  if (url.pathname.startsWith("/api/") || url.pathname.includes("supabase")) return;

  // SPA navigations: network-first, fall back to cached index for offline
  if (req.mode === "navigate") {
    event.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE_NAME).then((c) => c.put("/", copy));
          return res;
        })
        .catch(() => caches.match("/"))
    );
    return;
  }

  // Static assets: cache-first, fall back to network, populate cache opportunistically
  event.respondWith(
    caches.match(req).then((cached) => {
      if (cached) return cached;
      return fetch(req)
        .then((res) => {
          if (res.ok && res.type === "basic") {
            const copy = res.clone();
            caches.open(CACHE_NAME).then((c) => c.put(req, copy));
          }
          return res;
        })
        .catch(() => cached);
    })
  );
});
