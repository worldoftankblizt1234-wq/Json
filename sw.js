// Service Worker
const CACHE_NAME = 'aoh-v1';
const ASSETS = [
    'index.html',
    'css/style.css',
    'js/config.js',
    'js/buildings.js',
    'js/map.js',
    'js/game.js',
    'js/ai.js',
    'js/multiplayer.js',
    'js/ui.js',
    'js/auth.js',
    'js/lobby.js',
    'js/main.js',
    'manifest.json'
];

self.addEventListener('install', (e) => {
    e.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => cache.addAll(ASSETS))
            .then(() => self.skipWaiting())
    );
});

self.addEventListener('activate', (e) => {
    e.waitUntil(
        caches.keys().then(keys => {
            return Promise.all(
                keys.filter(key => key !== CACHE_NAME)
                    .map(key => caches.delete(key))
            );
        })
    );
});

self.addEventListener('fetch', (e) => {
    e.respondWith(
        caches.match(e.request)
            .then(response => response || fetch(e.request))
            .catch(() => caches.match('index.html'))
    );
});
