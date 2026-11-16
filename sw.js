const CACHE_NAME = 'reading-evaluation-app-v1';
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './manifest.json',
  './sw.js'
];

// ដំឡើង និងរក្សាទុកឯកសារស្នូលក្នុង Cache
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
  self.skipWaiting();
});

// លុប Cache ចាស់ៗចោលពេលមានការអាប់ដេតកំណែថ្មី
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

// គ្រប់គ្រងសំណើទាញទិន្នន័យ (Network First, Fallback to Cache)
self.addEventListener('fetch', (event) => {
  // មិនរក្សាទុក API របស់ Google Apps Script ក្នុង Cache ទេ
  if (event.request.url.includes('script.google.com') || event.request.method !== 'GET') {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then((networkResponse) => {
        // រក្សាទុកឯកសារដែលទាញបានថ្មីចូល Cache ដោយស្វ័យប្រវត្តិ
        if (networkResponse && networkResponse.status === 200) {
          const responseClone = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone);
          });
        }
        return networkResponse;
      })
      .catch(() => {
        // ប្រើប្រាស់ទិន្នន័យពី Cache ពេលគ្មានអ៊ីនធឺណិត
        return caches.match(event.request).then((cachedResponse) => {
          return cachedResponse || caches.match('./index.html');
        });
      })
  );
});
