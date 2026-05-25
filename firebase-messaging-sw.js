importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "AIzaSyBKKy3ZXGNPwbek-66MUqRc7XBxPgqnfNw",
  authDomain: "saporis-12c9f.firebaseapp.com",
  projectId: "saporis-12c9f",
  storageBucket: "saporis-12c9f.firebasestorage.app",
  messagingSenderId: "787748519692",
  appId: "1:787748519692:web:00b4812ef46dab61899329"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage(function(payload) {
  console.log('[FCM SW] Background message:', payload);
  const title = payload.notification?.title || 'Llamada Saporis';
  const body = payload.notification?.body || '';
  self.registration.showNotification(title, {
    body: body,
    icon: '/icons/icon-192.png',
    vibrate: [500, 200, 500, 200, 500, 200, 800],
    requireInteraction: true,
    tag: 'alerta-saporis',
    renotify: true
  });
});
