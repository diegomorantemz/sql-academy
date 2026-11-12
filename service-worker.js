const CACHE_VERSION = 'sql-academy-v41';
const APP_SHELL = [
    './',
    './index.html',
    './style.css',
    './datasets.js',
    './nosql-datasets.js',
    './install-guides.js',
    './courses.js',
    './course-content.js',
    './checkpoint-content.js',
    './nosql-engine.js',
    './script.js',
    './nosql.js',
    './autocomplete.js',
    './deckbuilder.js',
    './feria.html',
    './manifest.webmanifest',
    './assets/images/qr-yape.png',
    './assets/images/qr-plin.png',
    './assets/images/qr-demo.png',
    './assets/icons/icon.svg',
    './assets/icons/icon-32.png',
    './assets/icons/icon-96.png',
    './assets/icons/icon-180.png',
    './assets/icons/icon-192.png',
    './assets/icons/icon-512.png',
    './assets/icons/icon-maskable-512.png',
    './assets/icons/logo-mark.svg'
];
const CDN_HOSTS = new Set([
    'cdn.jsdelivr.net',
    'cdnjs.cloudflare.com'
]);

async function cacheResponse(request, response) {
    if (!response || (!response.ok && response.type !== 'opaque')) return response;
    try {
        const cache = await caches.open(CACHE_VERSION);
        await cache.put(request, response.clone());
    } catch (error) {
        // La respuesta se entrega aunque el navegador no permita escribir la caché.
    }
    return response;
}

async function networkFirst(request, fallbackUrl) {
    try {
        return await cacheResponse(request, await fetch(request));
    } catch (error) {
        const cached = await caches.match(request);
        if (cached) return cached;

        if (fallbackUrl) {
            const fallback = await caches.match(fallbackUrl);
            if (fallback) return fallback;
        }

        return new Response('', {
            status: 504,
            statusText: 'Sin conexión'
        });
    }
}

async function cacheFirst(request) {
    const cached = await caches.match(request);
    if (cached) return cached;

    try {
        return await cacheResponse(request, await fetch(request));
    } catch (error) {
        return new Response('', {
            status: 504,
            statusText: 'Sin conexión'
        });
    }
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
            event.respondWith(networkFirst(request, './index.html'));
            return;
        }

        // HTML, CSS y JS van primero a la red para evitar mezclar una versión
        // nueva de la interfaz con estilos o scripts viejos de la caché.
        if (url.pathname.startsWith('/assets/')) {
            event.respondWith(cacheFirst(request));
        } else {
            event.respondWith(networkFirst(request));
        }
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
