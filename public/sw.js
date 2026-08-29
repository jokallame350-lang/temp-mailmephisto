// MephistoMail Service Worker v1.1
const CACHE_NAME = 'mephisto-v2';
const STATIC_ASSETS = ['/', '/icon.png', '/logo.png'];

const isSameOrigin = (url) => url.origin === self.location.origin;
const safeNotificationUrl = (value) => {
    try {
        const url = new URL(typeof value === 'string' ? value : '/', self.location.origin);
        return isSameOrigin(url) && (url.protocol === 'https:' || url.protocol === 'http:')
            ? url.href
            : self.location.origin + '/';
    } catch {
        return self.location.origin + '/';
    }
};

self.addEventListener('install', (event) => {
    event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS)));
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((keys) => Promise.all(
            keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
        ))
    );
    self.clients.claim();
});

self.addEventListener('fetch', (event) => {
    const { request } = event;
    const url = new URL(request.url);

    if (!isSameOrigin(url) || request.method !== 'GET' || url.pathname.startsWith('/api/')) return;

    event.respondWith(
        fetch(request).then((response) => {
            if (response.ok && response.type === 'basic') {
                const clone = response.clone();
                event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.put(request, clone)));
            }
            return response;
        }).catch(() => caches.match(request).then((cached) => cached || caches.match('/')))
    );
});

self.addEventListener('push', (event) => {
    let data = { title: 'MephistoMail', body: 'Yeni bir e-posta geldi!', url: '/' };
    try {
        if (event.data) data = { ...data, ...event.data.json() };
    } catch {
        if (event.data) data.body = event.data.text();
    }

    const options = {
        body: String(data.body || 'Yeni bir e-posta mesajınız var.').slice(0, 500),
        icon: '/icon.png',
        badge: '/icon.png',
        vibrate: [100, 50, 100],
        data: { url: safeNotificationUrl(data.url) },
    };

    event.waitUntil(self.registration.showNotification(String(data.title || 'MephistoMail').slice(0, 100), options));
});

self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    const urlToOpen = safeNotificationUrl(event.notification.data?.url);

    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
            const existing = windowClients.find((client) => isSameOrigin(new URL(client.url)));
            if (existing && 'focus' in existing) return existing.focus();
            return clients.openWindow ? clients.openWindow(urlToOpen) : undefined;
        })
    );
});
