/* Service Worker — کاشکردنی ڕووکار بۆ کارکردنی خێراتر و PWA */
const CACHE = "qarz-online-v7";
const ASSETS = [
  "./index.html",
  "./app.html",
  "./manifest.json",
  "./assets/css/style.css",
  "./assets/js/app.js",
  "./assets/js/db.js",
  "./assets/js/chart.umd.js",
  "./assets/fonts/Vazirmatn.woff2",
  "./assets/icons/icon-192.png",
  "./assets/icons/icon-512.png",
];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (e) => {
  const url = new URL(e.request.url);
  // داتای Firebase هەرگیز کاش ناکرێت (هەمیشە زیندوو)
  if (url.hostname.includes("firebase") || url.hostname.includes("googleapis") || url.hostname.includes("gstatic")) {
    return;
  }
  // ڕووکار: سەرەتا کاش، پاشان تۆڕ
  e.respondWith(
    caches.match(e.request).then((cached) => cached || fetch(e.request).catch(() => cached))
  );
});
