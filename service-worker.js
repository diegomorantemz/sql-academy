const CACHE_VERSION = 'sql-academy-v52';
const APP_SHELL = [
    './',
    './index.html',
    './styles/base.css',
    './styles/learning.css',
    './styles/editor.css',
    './styles/challenges.css',
    './styles/components.css',
    './styles/layout.css',
    './styles/themes.css',
    './styles/nosql.css',
    './styles/learning-path.css',
    './styles/games.css',
    './styles/library.css',
    './styles/install-guides.css',
    './styles/courses.css',
    './styles/lessons.css',
    './styles/mobile.css',
    './styles/trompo.css',
    './js/core/state.js',
    './js/core/storage.js',
    './js/core/dom.js',
    './js/core/format.js',
    './js/core/database.js',
    './js/data/datasets.js',
    './js/data/nosql-datasets.js',
    './js/data/install-guides.js',
    './js/data/courses.js',
    './js/data/course-content.js',
    './js/data/checkpoint-content.js',
    './js/features/nosql/engine.js',
    './js/app.js',
    './js/app/navigation.js',
    './js/features/onboarding.js',
    './js/features/nosql/challenges.js',
    './js/features/fair-tour.js',
    './js/features/progress.js',
    './js/features/donations.js',
    './js/features/database-managers.js',
    './js/features/learn-library.js',
    './js/features/challenges.js',
    './js/features/debug-challenges.js',
    './js/features/skill-test.js',
    './js/features/learning-path.js',
    './js/features/courses.js',
    './js/features/dashboard.js',
    './js/features/lessons.js',
    './js/features/assistant.js',
    './js/features/results.js',
    './js/features/explorer.js',
    './js/features/examples.js',
    './js/features/nosql/ui.js',
    './js/features/autocomplete.js',
    './js/games/deckbuilder.js',
    './js/games/trompo.js',
    './js/global-exports.js',
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
    './assets/icons/logo-mark.svg',
    './assets/game/mammoth-run.png',
    './assets/game/mammoth-green.png',
    './assets/game/mammoth-skate.png',
    './assets/game/mammoth-surf.png',
    './assets/game/dolphin.png',
    './assets/game/orca.png',
    './assets/game/whale.png',
    './assets/game/cockroach.png',
    './assets/game/mantis.png',
    './assets/game/cricket.png',
    './assets/game/tarantula.png',
    './assets/game/beetle.png'
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
