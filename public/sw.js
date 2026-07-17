const STATIC_CACHE = 'filmsitem-static-v1';
const MAX_CACHE_ITEMS = 1000;

const IMAGE_HOSTS = [
    'm.media-amazon.com',
    'image.tmdb.org',
    'img.youtube.com',
    'i.ytimg.com',
];

self.addEventListener('install', () => {
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        Promise.all([
            // Eski cache sürümlerini temizle
            caches.keys().then((cacheNames) =>
                Promise.all(
                    cacheNames.map((cacheName) => {
                        if (
                            cacheName.startsWith('filmsitem-static-') &&
                            cacheName !== STATIC_CACHE
                        ) {
                            return caches.delete(cacheName);
                        }

                        return Promise.resolve();
                    })
                )
            ),

            self.clients.claim(),
        ])
    );
});

self.addEventListener('fetch', (event) => {
    const request = event.request;

    if (request.method !== 'GET') return;

    const url = new URL(request.url);

    if (!shouldCacheRequest(request, url)) return;

    event.respondWith(cacheFirst(request));
});

function shouldCacheRequest(request, url) {
    const isSameOrigin = url.origin === self.location.origin;

    // Next.js tarafından oluşturulan statik JS, CSS ve font dosyaları
    const isNextStatic =
        isSameOrigin && url.pathname.startsWith('/_next/static/');

    // Next.js optimize edilmiş görselleri
    const isNextImage =
        isSameOrigin && url.pathname.startsWith('/_next/image');

    // Tarayıcının dosya türüne göre belirlediği statik kaynaklar
    const isStaticDestination = [
        'image',
        'style',
        'script',
        'font',
    ].includes(request.destination);

    // Bilinen harici görsel sunucuları
    const isRemoteImage = IMAGE_HOSTS.includes(url.hostname);

    // Public klasöründeki yaygın statik dosyalar
    const isPublicAsset =
        isSameOrigin &&
        /\.(?:png|jpg|jpeg|webp|avif|gif|svg|ico|css|js|woff|woff2|ttf|otf)$/i.test(
            url.pathname
        );

    const isManifest =
        isSameOrigin &&
        (url.pathname.endsWith('/manifest.json') ||
            url.pathname.endsWith('/manifest.webmanifest'));

    return (
        isNextStatic ||
        isNextImage ||
        isStaticDestination ||
        isRemoteImage ||
        isPublicAsset ||
        isManifest
    );
}

async function cacheFirst(request) {
    const cache = await caches.open(STATIC_CACHE);
    const cachedResponse = await cache.match(request);

    if (cachedResponse) {
        return cachedResponse;
    }

    try {
        const networkResponse = await fetch(request);

        // Opaque yanıtlar harici görsellerde görülebilir.
        const canCache =
            networkResponse.ok || networkResponse.type === 'opaque';

        if (canCache) {
            await cache.put(request, networkResponse.clone());
            await limitCacheSize(cache, MAX_CACHE_ITEMS);
        }

        return networkResponse;
    } catch (error) {
        // Cache'de yoksa isteğin normal şekilde başarısız olmasına izin ver.
        throw error;
    }
}

async function limitCacheSize(cache, maxItems) {
    const keys = await cache.keys();

    if (keys.length <= maxItems) return;

    const deleteCount = keys.length - maxItems;

    await Promise.all(
        keys.slice(0, deleteCount).map((request) => cache.delete(request))
    );
}