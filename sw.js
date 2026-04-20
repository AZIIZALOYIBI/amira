/* ============================================================
 * Amira · Service Worker
 * Cache-first for app shell, stale-while-revalidate for the rest.
 * Update CACHE_VERSION whenever shipping new files.
 * ============================================================ */

const CACHE_VERSION = 'amira-quantum-v1';
const SHELL = [
    './',
    './index.html',
    './styles.css',
    './color-system.css',
    './theme-quantum.css',
    './theme-quantum-apply.css',
    './quantum-3d.css',
    './quantum-widgets.css',
    './chess.js',
    './ai.js',
    './app.js',
    './auth.js',
    './statistics.js',
    './puzzles.js',
    './achievements.js',
    './savesystem.js',
    './moveanalysis.js',
    './quantum-theme.js',
    './quantum-widgets.js',
    './quantum-keyboard.js',
    './manifest.webmanifest',
    './icons/icon-192.svg',
    './icons/icon-512.svg'
];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_VERSION).then((cache) => cache.addAll(SHELL)).then(() => self.skipWaiting())
    );
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((names) =>
            Promise.all(names.filter((n) => n !== CACHE_VERSION).map((n) => caches.delete(n)))
        ).then(() => self.clients.claim())
    );
});

self.addEventListener('fetch', (event) => {
    const req = event.request;
    if (req.method !== 'GET') return;
    const url = new URL(req.url);
    if (url.origin !== location.origin && !url.hostname.includes('fonts.')) return;

    // App shell: cache-first
    const isShell = SHELL.some((path) => url.pathname.endsWith(path.replace('./', '/')));
    if (isShell) {
        event.respondWith(
            caches.match(req).then((hit) => hit || fetch(req).then((res) => {
                const copy = res.clone();
                caches.open(CACHE_VERSION).then((c) => c.put(req, copy));
                return res;
            }))
        );
        return;
    }

    // Fonts + images: stale-while-revalidate
    event.respondWith(
        caches.match(req).then((hit) => {
            const net = fetch(req).then((res) => {
                if (res && res.status === 200) {
                    const copy = res.clone();
                    caches.open(CACHE_VERSION).then((c) => c.put(req, copy));
                }
                return res;
            }).catch(() => hit);
            return hit || net;
        })
    );
});
