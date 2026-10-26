const CACHE_VERSION = 'sql-academy-v2';
const APP_SHELL = [
    './',
    './index.html',
    './style.css',
    './datasets.js',
    './script.js',
    './manifest.webmanifest',
    './icons/icon-192.png',
    './icons/icon-512.png',
    './icons/icon-maskable-512.png'
];
const CDN_HOSTS = new Set([
    'cdn.jsdelivr.net',
    'cdnjs.cloudflare.com'
]);

async function cacheResponse(request, response) {
    if (!response || (!response.ok && response.type !== 'opaque')) return response;
    const cache = await caches.open(CACHE_VERSION);
    await cache.put(request, response.clone());
    return response;
}

self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_VERSION)
            .then(cache => cache.addAll(APP_SHELL))
            .then(() => self.skipWaiting())
    );
});

self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys()
            .then(keys => Promise.all(
                keys.filter(key => key !== CACHE_VERSION).map(key => caches.delete(key))
            ))
            .then(() => self.clients.claim())
    );
});

self.addEventListener('fetch', event => {
    const request = event.request;
    if (request.method !== 'GET') return;

    const url = new URL(request.url);

    // El asistente IA siempre debe ir a la red; nunca se cachea.
    if (url.pathname.startsWith('/api/')) return;

    if (url.origin === self.location.origin) {
        if (request.mode === 'navigate') {
            event.respondWith(
                fetch(request)
                    .then(response => cacheResponse(request, response))
                    .catch(() => caches.match('./index.html'))
            );
            return;
        }

        event.respondWith(
            caches.match(request).then(cached => {
                if (cached) return cached;
                return fetch(request).then(response => cacheResponse(request, response));
            })
        );
        return;
    }

    if (CDN_HOSTS.has(url.hostname)) {
        event.respondWith(
            (async () => {
                const cached = await caches.match(request);
                const network = fetch(request)
                    .then(response => cacheResponse(request, response))
                    .catch(() => null);

                if (cached) {
                    event.waitUntil(network);
                    return cached;
                }

                return (await network) || new Response('', {
                    status: 504,
                    statusText: 'Sin conexión'
                });
            })()
        );
    }
});
