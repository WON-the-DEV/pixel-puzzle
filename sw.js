// Service Worker — Pixel Puzzle (Nonogram)
const CACHE_NAME = 'pixel-puzzle-v1';
const BASE = '/pixel-puzzle/';

// 프리캐시할 에셋
const PRECACHE_URLS = [
  BASE,
  BASE + 'index.html',
  BASE + 'manifest.json',
  BASE + 'icon-192.png',
  BASE + 'icon-512.png',
];

// Install — 주요 에셋 프리캐시
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_URLS);
    })
  );
  self.skipWaiting();
});

// Activate — 이전 캐시 정리
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((names) => {
      return Promise.all(
        names
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    })
  );
  self.clients.claim();
});

// Fetch — cache-first 전략
self.addEventListener('fetch', (event) => {
  // 같은 origin만 캐시
  if (!event.request.url.startsWith(self.location.origin)) return;

  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) {
        // 캐시 히트 → 반환하면서 백그라운드에서 업데이트
        const fetchPromise = fetch(event.request)
          .then((response) => {
            if (response && response.status === 200) {
              const clone = response.clone();
              caches.open(CACHE_NAME).then((cache) => {
                cache.put(event.request, clone);
              });
            }
            return response;
          })
          .catch(() => {});
        // stale-while-revalidate
        return cached;
      }

      // 캐시 미스 → 네트워크에서 가져와서 캐시
      return fetch(event.request)
        .then((response) => {
          if (!response || response.status !== 200) return response;
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, clone);
          });
          return response;
        })
        .catch(() => {
          // 오프라인이고 캐시도 없으면 빈 응답
          return new Response('오프라인 상태입니다.', {
            status: 503,
            statusText: 'Service Unavailable',
          });
        });
    })
  );
});
