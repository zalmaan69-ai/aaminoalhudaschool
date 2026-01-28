const CACHE_NAME = 'al-huda-cache-v1';
const ASSETS = [
    './',
    './index.html',
    './index.css',
    './app.js',
    './store.js',
    './logo.png',
    'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=Outfit:wght@500;600;700&display=swap',
    'https://unpkg.com/feather-icons'
];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(ASSETS);
        })
    );
});

self.addEventListener('fetch', (event) => {
    event.respondWith(
        caches.match(event.request).then((response) => {
            return response || fetch(event.request);
        })
    );
});
