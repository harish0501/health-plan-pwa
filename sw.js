const CACHE_NAME = 'health-plan-v1';
const urlsToCache = [
  './',
  './index.html',
  './manifest.json',
  // Add any additional resources you want to cache
];

// Install Service Worker
self.addEventListener('install', (event) => {
  console.log('Service Worker: Install');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Service Worker: Caching Files');
        return cache.addAll(urlsToCache);
      })
      .then(() => {
        console.log('Service Worker: Cached All Files');
        return self.skipWaiting();
      })
  );
});

// Activate Service Worker
self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activate');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            console.log('Service Worker: Clearing Old Cache');
            return caches.delete(cache);
          }
        })
      );
    }).then(() => {
      console.log('Service Worker: Claiming Clients');
      return self.clients.claim();
    })
  );
});

// Fetch Event - Serve from cache when offline
self.addEventListener('fetch', (event) => {
  console.log('Service Worker: Fetching');
  
  // Skip cross-origin requests
  if (!event.request.url.startsWith(self.location.origin)) {
    return;
  }
  
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Return cached version or fetch from network
        if (response) {
          console.log('Service Worker: Serving from Cache', event.request.url);
          return response;
        }
        
        // Not in cache, fetch from network
        return fetch(event.request)
          .then((response) => {
            // Check if valid response
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }
            
            // Clone the response
            const responseToCache = response.clone();
            
            // Add to cache for future use
            caches.open(CACHE_NAME)
              .then((cache) => {
                cache.put(event.request, responseToCache);
              });
            
            return response;
          })
          .catch(() => {
            // Network failed, try to serve a fallback page if available
            if (event.request.destination === 'document') {
              return caches.match('./index.html');
            }
          });
      })
  );
});

// Background Sync (for future enhancements)
self.addEventListener('sync', (event) => {
  console.log('Service Worker: Background Sync', event.tag);
  // Handle background sync tasks here
});

// Push Notifications (for future enhancements)
self.addEventListener('push', (event) => {
  console.log('Service Worker: Push Received');
  
  const options = {
    body: event.data ? event.data.text() : 'Time for your health routine!',
    icon: './icons/icon-192x192.png',
    badge: './icons/badge-72x72.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      {
        action: 'explore',
        title: 'View Plan',
        icon: './icons/checkmark.png'
      },
      {
        action: 'close',
        title: 'Close',
        icon: './icons/xmark.png'
      }
    ]
  };
  
  event.waitUntil(
    self.registration.showNotification('Health Plan Reminder', options)
  );
});

// Notification Click Handler
self.addEventListener('notificationclick', (event) => {
  console.log('Service Worker: Notification Click');
  
  event.notification.close();
  
  if (event.action === 'explore') {
    // Open the app
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});

// Handle app shortcuts
self.addEventListener('message', (event) => {
  console.log('Service Worker: Message Received', event.data);
  
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// Periodic Background Sync (for future enhancements)
self.addEventListener('periodicsync', (event) => {
  console.log('Service Worker: Periodic Sync', event.tag);
  
  if (event.tag === 'health-reminder') {
    event.waitUntil(
      // Send a gentle reminder notification
      self.registration.showNotification('Daily Health Check', {
        body: 'Don\'t forget your daily health routine!',
        icon: './icons/icon-192x192.png',
        tag: 'health-reminder'
      })
    );
  }
});

console.log('Service Worker: Loaded');