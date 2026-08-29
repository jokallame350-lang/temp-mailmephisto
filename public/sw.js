// MephistoMail Service Worker v2
const CACHE_NAME = 'mephisto-v2';
const STATIC_ASSETS = ['/', '/icon.png', '/logo.png'];
const APP_ORIGIN = self.location.origin;

const isSameOriginNavigation = (request) => request.method === 'GET' && request.mode === 'navigate' && new URL(request.url).origin === APP_ORIGIN;
const isCacheableStatic = (request, response) => request.method === 'GET' && new URL(request.url).origin === APP_ORIGIN && response.ok && response.type === 'basic' && !request.headers.has('authorization');

self.addEventListener('install', (event) => {
    event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(STATIC_ASSETS).catch(() => undefined)));
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key)))).then(() => self.clients.claim()));
});

self.addEventListener('fetch', (event) => {
    const { request } = event;
    if (request.method !== 'GET') return;
    const url = new URL(request.url);
    if (url.origin !== APP_ORIGIN) return;
    if (
        url.pathname.startsWith('/api/') ||
        url.pathname.startsWith('/_next/') ||
        url.pathname.startsWith('/messages/') ||
        url.pathname.startsWith('/attachment/') ||
        url.pathname.startsWith('/accounts') ||
        url.pathname.startsWith('/token') ||
        url.pathname.startsWith('/ajax.php') ||
        url.searchParams.has('mailbox')
    ) return;


    if (isSameOriginNavigation(request)) {
        event.respondWith(fetch(request).catch(() => caches.match('/').then(cached => cached || Response.error())));
        return;
    }

    event.respondWith(fetch(request).then(response => {
        if (isCacheableStatic(request, response)) {
            const clone = response.clone();
            event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.put(request, clone)));
        }
        return response;
    }).catch(() => caches.match(request).then(cached => cached || Response.error())));
});

self.addEventListener('push', (event) => {
    let data = { title: 'MephistoMail', body: 'Yeni bir e-posta geldi!', url: '/' };
    try {
        if (event.data) {
            const parsed = event.data.json();
            if (parsed && typeof parsed === 'object') data = { ...data, ...parsed };
        }
    } catch {
        if (event.data) data.body = event.data.text().slice(0, 500);
    }
    let target = '/';
    try {
        const candidate = new URL(typeof data.url === 'string' ? data.url : '/', APP_ORIGIN);
        if (candidate.origin === APP_ORIGIN && (candidate.protocol === 'https:' || candidate.protocol === 'http:')) target = candidate.href;
    } catch { /* keep safe default */ }
    const options = {
        body: typeof data.body === 'string' ? data.body.slice(0, 500) : 'Yeni bir e-posta mesajınız var.',
        icon: '/icon.png',
        badge: '/icon.png',
        data: { url: target }
    };
    event.waitUntil(self.registration.showNotification(typeof data.title === 'string' ? data.title.slice(0, 100) : 'MephistoMail', options));
});

self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    let target = '/';
    try {
        const candidate = new URL(event.notification.data?.url || '/', APP_ORIGIN);
        if (candidate.origin === APP_ORIGIN) target = candidate.href;
    } catch { /* safe default */ }
    event.waitUntil(clients.matchAll({ type: 'window', includeUncontrolled: true }).then(windowClients => {
        const sameOrigin = windowClients.find(client => new URL(client.url).origin === APP_ORIGIN);
        if (sameOrigin && 'focus' in sameOrigin) return sameOrigin.focus();
        return clients.openWindow ? clients.openWindow(target) : undefined;
    }));
});
