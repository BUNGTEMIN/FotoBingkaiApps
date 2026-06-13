// Service Worker untuk Firebase Cloud Messaging (FCM) oleh Olaive sayang 💕
importScripts('https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.2/firebase-messaging-compat.js');

firebase.initializeApp({
  projectId: "qcc-online",
  appId: "1:280833756345:web:8e1ec73703b3a58cd25f68",
  apiKey: "AIzaSyDmB60h4rTOGCBwhw3yfFnllY0xrSPqWog",
  authDomain: "qcc-online.firebaseapp.com",
  storageBucket: "qcc-online.firebasestorage.app",
  messagingSenderId: "280833756345"
});

const messaging = firebase.messaging();

// Menangani notifikasi saat aplikasi ditutup atau berjalan di latar belakang
messaging.onBackgroundMessage((payload) => {
  console.log('[Olaive FCM SW] Menerima notifikasi di latar belakang: ', payload);

  const notificationTitle = payload.notification?.title || 'Notifikasi Komentar QCC';
  // Ambil targetId dari payload data custom
  const targetId = payload.data?.targetId || payload.data?.photoId || '';
  
  const notificationOptions = {
    body: payload.notification?.body || 'Ada komentar baru di fotomu!',
    icon: '/icon-512.png',
    badge: '/icon.svg',
    data: {
      ...payload.data,
      targetId: targetId
    },
    vibrate: [200, 100, 200]
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

// Menangani klik notifikasi
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  // Cari ID foto dari notifier data
  const targetId = event.notification.data?.targetId || event.notification.data?.photoId;
  let urlToOpen = new URL(self.location.origin).href;
  if (targetId) {
    urlToOpen = `${self.location.origin}/?select_photo=${targetId}`;
  }

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      // Jika tab sudah terbuka di browser, arahkan ke URL target dan fokuskan
      for (let i = 0; i < windowClients.length; i++) {
        const client = windowClients[i];
        if (client.url.startsWith(self.location.origin) && 'focus' in client) {
          if (targetId) {
            client.postMessage({ type: 'SELECT_PHOTO', photoId: targetId });
            if ('navigate' in client) {
              client.navigate(urlToOpen);
            }
          }
          return client.focus();
        }
      }
      // Jika tab aplikasinya belum kebuka sama sekali, jalankan jendela baru menuju URL berpaut foto
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});
