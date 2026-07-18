// パソコン購入プラン比較 — オフライン対応サービスワーカー
// 版数を上げると古いキャッシュを破棄して中身を更新する（内容変更のたびに +1 する）
const CACHE = 'pc-plan-v25';
const ASSETS = [
  './',
  './index.html',
  './manifest.webmanifest',
  './icon-180.png',
  './icon-192.png',
  './icon-512.png',
  './icon-512-maskable.png',
  './sapo1.jpeg',
  './sapo2.jpeg',
  './uirusu.jpeg',
  './nojima-logo.png',
  './mascot.jpeg',
  './aircon-leaflet.jpeg',
  './aircon-repair.jpeg',
  './tv-leaflet.jpeg',
  './tv-repair.jpeg',
  './reizoko-leaflet.jpeg',
  './reizoko-repair.jpeg',
  './sentakuki-leaflet.jpeg',
  './sentakuki-repair.jpeg'
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE).then((c) => c.addAll(ASSETS)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
      .then(() => self.clients.matchAll({ type: 'window', includeUncontrolled: true }))
      .then((clients) => clients.forEach((client) => client.navigate(client.url)))
  );
});

self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;

  const isHTML = e.request.mode === 'navigate' ||
    (e.request.headers.get('accept') || '').includes('text/html');

  if (isHTML) {
    // HTML はネットワーク優先：オンライン時は常に最新、オフライン時はキャッシュへフォールバック
    e.respondWith(
      fetch(e.request).then((resp) => {
        const copy = resp.clone();
        caches.open(CACHE).then((c) => c.put('./index.html', copy));
        return resp;
      }).catch(() => caches.match(e.request).then((r) => r || caches.match('./index.html')))
    );
    return;
  }

  // それ以外（アイコン等）はキャッシュ優先＋裏で更新
  e.respondWith(
    caches.match(e.request).then((cached) => {
      const network = fetch(e.request).then((resp) => {
        const copy = resp.clone();
        caches.open(CACHE).then((c) => c.put(e.request, copy));
        return resp;
      }).catch(() => cached);
      return cached || network;
    })
  );
});
