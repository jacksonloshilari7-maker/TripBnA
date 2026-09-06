/**
 * TripBnA Service Worker
 * Production-ready PWA Service Worker with safe app-shell caching,
 * network-first navigation, and safe bypass for Firebase and cloud APIs.
 */

const CACHE_VERSION = 'tripbna-pwa-v1.0.3';
const STATIC_CACHE = `tripbna-static-${CACHE_VERSION}`;
const RUNTIME_CACHE = `tripbna-runtime-${CACHE_VERSION}`;

// Core static assets to precache for offline shell and search engines
const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/script.js',
  '/firebase.js',
  '/manifest.webmanifest',
  '/manifest.json',
  '/logo.png',
  '/og-image.png',
  '/icons/logo.svg',
  '/icons/logo-square.svg',
  '/icons/icon.svg',
  '/icons/icon-maskable.svg',
  '/icons/icon-48.png',
  '/icons/icon-72.png',
  '/icons/icon-96.png',
  '/icons/icon-128.png',
  '/icons/icon-144.png',
  '/icons/icon-152.png',
  '/icons/icon-192.png',
  '/icons/icon-384.png',
  '/icons/icon-512.png',
  '/icons/icon-maskable-512.png',
  '/icons/apple-touch-icon.png',
  '/favicon.png',
  '/favicon.ico'
];

// Domains and endpoints that must NEVER be cached by the service worker
const BYPASS_PATTERNS = [
  'firestore.googleapis.com',
  'identitytoolkit.googleapis.com',
  'securetoken.googleapis.com',
  'firebasestorage.googleapis.com',
  'googleapis.com',
  'firebaseapp.com/__/auth',
  '/api/ai/'
];

// Install Event - Precache App Shell
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      console.log('[TripBnA SW] Precaching app shell assets');
      return cache.addAll(PRECACHE_ASSETS).catch((err) => {
        console.warn('[TripBnA SW] Some precache assets failed to load:', err);
      });
    }).then(() => self.skipWaiting())
  );
});

// Activate Event - Clean up stale caches and claim clients
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== STATIC_CACHE && key !== RUNTIME_CACHE) {
            console.log('[TripBnA SW] Purging old cache:', key);
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch Event - Safe caching strategy
self.addEventListener('fetch', (event) => {
  const req = event.request;
  const url = new URL(req.url);

  // Only handle GET requests
  if (req.method !== 'GET') {
    return;
  }

  // Bypass Firebase Auth, Firestore, AI API, and cloud services
  const shouldBypass = BYPASS_PATTERNS.some((pattern) => req.url.includes(pattern));
  if (shouldBypass) {
    return; // Let browser and Firebase SDK handle network/persistence natively
  }

  // 1. Navigation requests (HTML pages) -> Network-first with Cache fallback
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req)
        .then((networkRes) => {
          if (networkRes && networkRes.status === 200) {
            const copy = networkRes.clone();
            caches.open(STATIC_CACHE).then((cache) => cache.put(req, copy));
          }
          return networkRes;
        })
        .catch(async () => {
          const cachedPage = await caches.match(req);
          if (cachedPage) return cachedPage;
          const fallbackShell = await caches.match('/index.html');
          if (fallbackShell) return fallbackShell;
          return caches.match('/');
        })
    );
    return;
  }

  // 2. Static same-origin assets (JS, CSS, icons, manifests) -> Stale-While-Revalidate
  if (url.origin === self.location.origin) {
    event.respondWith(
      caches.match(req).then((cachedRes) => {
        const fetchPromise = fetch(req).then((networkRes) => {
          if (networkRes && networkRes.status === 200) {
            const copy = networkRes.clone();
            caches.open(STATIC_CACHE).then((cache) => cache.put(req, copy));
          }
          return networkRes;
        }).catch(() => null);

        return cachedRes || fetchPromise;
      })
    );
    return;
  }

  // 3. CDN & third-party static assets (FontAwesome, Unsplash images, Google Fonts)
  // Cache-first with network fallback & runtime caching
  if (
    url.hostname.includes('cdnjs.cloudflare.com') ||
    url.hostname.includes('fonts.googleapis.com') ||
    url.hostname.includes('fonts.gstatic.com') ||
    url.hostname.includes('images.unsplash.com') ||
    url.hostname.includes('cdn.jsdelivr.net')
  ) {
    event.respondWith(
      caches.match(req).then((cachedRes) => {
        if (cachedRes) return cachedRes;
        return fetch(req).then((networkRes) => {
          if (networkRes && networkRes.status === 200) {
            const copy = networkRes.clone();
            caches.open(RUNTIME_CACHE).then((cache) => cache.put(req, copy));
          }
          return networkRes;
        }).catch(() => {
          // If offline and image, return placeholder if applicable
          return null;
        });
      })
    );
    return;
  }
});

// Listen for message events (e.g. skipWaiting trigger on update)
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
