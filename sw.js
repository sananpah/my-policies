/* sw.js — Nami Portfolio Service Worker */
const CACHE = 'nami-v4';

const PRECACHE = [
    '/mobile.html',
    '/mobile.css',
    '/app.js',
    '/utils.js',
    '/loader.js',
    '/data.js',
    '/data_health.js',
    '/component_in.js',
    '/component_sg.js',
    '/health.js',
    '/avatar_self.png',
    '/avatar_wife.png',
    '/avatar_daughter.png',
    '/avatar_family.png',
    '/assets/logo/logo_AIA.png',
    '/assets/logo/logo_Prudential.png',
    '/assets/logo/logo_GreatEastern.png',
    '/assets/logo/logo_ManuLife.png',
    '/assets/logo/logo_HSBCLife.png',
    '/assets/logo/logo_SingLife.png',
    '/assets/logo/logo_ICICIPru.png',
    '/assets/logo/logo_KotakLife.png',
    '/assets/logo/logo_SBILife.png',
    '/assets/logo/logo_AxisMaxLife.png',
    '/assets/logo/logo_IndusIndNippon.png',
    '/assets/logo/logo_BajajLife.png',
    'https://cdn.tailwindcss.com',
    'https://fonts.googleapis.com/css2?family=Orbitron:wght@700;900&family=Inter:wght@400;500;600;700;900&display=swap',
    'https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200',
    'https://flagcdn.com/w40/in.png',
    'https://flagcdn.com/w40/sg.png'
];

self.addEventListener('install', e => {
    e.waitUntil(
        caches.open(CACHE).then(c => c.addAll(PRECACHE.map(url => new Request(url, { cache: 'reload' }))))
                          .catch(err => console.warn('Precache partial fail:', err))
    );
    self.skipWaiting();
});

self.addEventListener('activate', e => {
    e.waitUntil(
        caches.keys().then(keys =>
            Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
        )
    );
    self.clients.claim();
});

self.addEventListener('fetch', e => {
    // Always try network first for Google Sheets (live data)
    if (e.request.url.includes('docs.google.com')) {
        e.respondWith(
            fetch(e.request).catch(() => new Response('[]', { headers: { 'Content-Type': 'application/json' } }))
        );
        return;
    }

    // Cache-first for everything else
    e.respondWith(
        caches.match(e.request).then(cached => {
            if (cached) return cached;
            return fetch(e.request).then(res => {
                if (!res || res.status !== 200 || res.type === 'opaque') return res;
                const clone = res.clone();
                caches.open(CACHE).then(c => c.put(e.request, clone));
                return res;
            });
        })
    );
});
