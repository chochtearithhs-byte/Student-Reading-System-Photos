const CACHE_NAME = 'reading-eval-app-v1';
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './manifest.json'
];

// ដំឡើង Service Worker និងរក្សាទុកឯកសារមូលដ្ឋាន
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
  self.skipWaiting();
});

// លុប Cache ចាស់ៗចោលពេលមានកំណែថ្មី
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

// គ្រប់គ្រងការទាញយកទិន្នន័យ (Network First, Fallback to Cache)
self.addEventListener('fetch', (event) => {
  // មិនធ្វើ Cache ចំពោះការតភ្ជាប់ទៅ Google Apps Script API ទេ
  if (event.request.url.includes('script.google.com') || event.request.method !== 'GET') {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then((networkResponse) => {
        // រក្សាទុកច្បាប់ចម្លងថ្មីចូល Cache ប្រសិនបើទាញយកជោគជ័យ
        if (networkResponse && networkResponse.status === 200) {
          const responseClone = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone);
          });
        }
        return networkResponse;
      })
      .catch(() => caches.match(event.request))
  );
});