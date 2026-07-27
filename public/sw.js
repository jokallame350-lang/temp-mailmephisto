// MephistoMail Service Worker v1.0
const CACHE_NAME = 'mephisto-v1';
const STATIC_ASSETS = [
    '/',
    '/icon.png',
    '/logo.png',
];

// Install — statik dosyaları önbelleğe al
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(STATIC_ASSETS);
        })
    );
    self.skipWaiting();
});

// Activate — eski cache'leri temizle
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((keys) => {
            return Promise.all(
                keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
            );
        })
    );
    self.clients.claim();
});

// Fetch — Network-first stratejisi (API istekleri network, statik dosyalar cache)
self.addEventListener('fetch', (event) => {
    const { request } = event;
    const url = new URL(request.url);

    // API ve Real-time SSE istekleri her zaman doğrudan Network (Asla önbellekleme)
    if (
        url.hostname.includes('api.mail.tm') ||
        url.hostname.includes('api.guerrillamail.com') ||
        url.hostname.includes('mercure') ||
        url.pathname.includes('/api/') ||
        request.method !== 'GET'
    ) {
        event.respondWith(fetch(request));
        return;
    }

    // Statik dosyalar: network-first, fallback cache
    event.respondWith(
        fetch(request)
            .then((response) => {
                // Başarılı response'u cache'e kaydet
                if (response.status === 200) {
                    const clone = response.clone();
                    caches.open(CACHE_NAME).then((cache) => {
                        cache.put(request, clone);
                    });
                }
                return response;
            })
            .catch(() => {
                // Network yoksa cache'den dön
                return caches.match(request);
            })
    );
});
