importScripts('https://www.gstatic.com/firebasejs/12.11.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/12.11.0/firebase-messaging-compat.js');

// Config is injected at runtime via postMessage from the main app,
// but we also support a static fallback for browsers that cache the SW.
self.addEventListener('message', (event) => {
  if (event.data?.type === 'FIREBASE_CONFIG') {
    firebase.initializeApp(event.data.config);
    firebase.messaging();
  }
});

// Background message handler — shown when app is not in focus
const messaging = firebase.messaging.isSupported() ? firebase.messaging() : null;

if (messaging) {
  messaging.onBackgroundMessage((payload) => {
    const { title = 'SkyStalker', body = '', icon = '/icons/icon-192x192.png' } =
      payload.notification ?? {};

    self.registration.showNotification(title, {
      body,
      icon,
      badge: '/icons/badge.png',
      data: payload.data ?? {},
      tag: payload.data?.hex ?? 'skystalker',
      renotify: true,
    });
  });
}

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const hex = event.notification.data?.hex;
  const url = hex ? `/dashboard?hex=${hex}` : '/dashboard';
  event.waitUntil(clients.openWindow(url));
});
