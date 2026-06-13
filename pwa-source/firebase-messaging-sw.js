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
  const notificationOptions = {
    body: payload.notification?.body || 'Ada komentar baru di fotomu!',
    icon: '/icon-512.png',
    badge: '/icon.svg',
    data: payload.data,
    vibrate: [200, 100, 200]
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});
