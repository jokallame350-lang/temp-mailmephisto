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

    // API ve Real-time/Worker istekleri her zaman doğrudan NATIVE tarayıcı fetch'ine bırakılır (SW müdahale etmez)
    if (
        url.hostname.includes('workers.dev') ||
        url.hostname.includes('api.mail.tm') ||
        url.hostname.includes('api.guerrillamail.com') ||
        url.hostname.includes('guerrillamail') ||
        url.hostname.includes('cloudflare') ||
        url.pathname.includes('/api/') ||
        request.method !== 'GET'
    ) {
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

// Push Bildirim Etkinliği (Web Push)
self.addEventListener('push', (event) => {
    let data = { title: 'MephistoMail', body: 'Yeni bir e-posta geldi!' };
    try {
        if (event.data) {
            data = event.data.json();
        }
    } catch (e) {
        if (event.data) {
            data.body = event.data.text();
        }
    }

    const options = {
        body: data.body || 'Yeni bir e-posta mesajınız var.',
        icon: '/icon.png',
        badge: '/icon.png',
        vibrate: [100, 50, 100],
        data: {
            url: data.url || '/'
        }
    };

    event.waitUntil(
        self.registration.showNotification(data.title || 'MephistoMail', options)
    );
});

// Bildirime Tıklama Etkinliği — Sekmeyi Odakla veya Aç
self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    const urlToOpen = event.notification.data?.url || '/';

    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
            for (let i = 0; i < windowClients.length; i++) {
                const client = windowClients[i];
                if (client.url.includes(self.location.origin) && 'focus' in client) {
                    return client.focus();
                }
            }
            if (clients.openWindow) {
                return clients.openWindow(urlToOpen);
            }
        })
    );
});
