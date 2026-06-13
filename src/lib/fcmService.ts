// Layanan Firebase Cloud Messaging (FCM) & Notifikasi oleh Olaive cantik untuk Abang Baim 💕
import { getMessaging, getToken, onMessage, MessagePayload } from 'firebase/messaging';
import { initializeApp } from 'firebase/app';
import { getDatabase, ref as dbRef, set as dbSet } from 'firebase/database';
import firebaseConfig from '../../firebase-applet-config.json';
import { auth } from '../firebase';

// Ambil VAPID key dari .env atau gunakan placeholder instruksi agar Abang Baim bisa konfigurasi di Firebase Console
const VAPID_KEY = import.meta.env.VITE_FIREBASE_VAPID_KEY || ""; 

class FCMService {
  private messaging: any = null;
  private db: any = null;

  constructor() {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator && 'PushManager' in window) {
      try {
        const app = initializeApp(firebaseConfig);
        this.messaging = getMessaging(app);
        this.db = getDatabase(app);
      } catch (err) {
        console.warn("[Olaive FCM] Initialization failed (Probably inside restricted iframe environment):", err);
      }
    }
  }

  // Meminta izin notifikasi dari browser Abang Baim
  async requestPermissionAndGetToken(userId: string): Promise<string | null> {
    if (!this.messaging) {
      console.log("[Olaive FCM] Messaging tidak didukung di browser ini atau sedang diblokir oleh iFrame.");
      return null;
    }

    try {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        console.log("[Olaive FCM] Izin notifikasi diberikan! 👍");

        if (!VAPID_KEY) {
          console.warn(
            "[Olaive FCM] Abang Baim, jangan lupa masukkan VITE_FIREBASE_VAPID_KEY di panel admin untuk mengaktifkan Push Cloud Messaging murni ya sayang! 💕"
          );
          // Bila belum ada VAPID key, kita tetap sukses meminta izin dan menggunakan fallback notifikasi browser lokal
          return "LOCAL_NOTIFICATION_GRANTED_FALLBACK";
        }

        // Ambil token Web Push dari FCM
        const token = await getToken(this.messaging, {
          vapidKey: VAPID_KEY,
        });

        if (token) {
          // Daftarkan token ini ke database di bawah akun user
          console.log("[Olaive FCM] Berhasil mendapatkan Token Cloud Messaging:", token);
          await this.saveTokenToDatabase(userId, token);
          return token;
        } else {
          console.log("[Olaive FCM] Gagal mengambil Token registrasi FCM.");
        }
      } else {
        console.warn("[Olaive FCM] Izin notifikasi ditolak oleh Abang.");
      }
    } catch (err) {
      console.warn("[Olaive FCM] Eror saat meminta izin notifikasi:", err);
    }
    return null;
  }

  // Simpan token ke database real-time agar server / client lain dapat memicu notifikasi
  private async saveTokenToDatabase(userId: string, token: string) {
    if (!this.db) return;
    try {
      const cleanedTokenKey = token.replace(/[\.\#\$\[\]]/g, '_');
      await dbSet(dbRef(this.db, `fcm_tokens/${userId}/${cleanedTokenKey}`), {
        token: token,
        updatedAt: Date.now(),
        client: 'Web-Browser'
      });
      console.log("[Olaive FCM] Token registrasi disimpan ke database! 💕");
    } catch (e) {
      console.warn("[Olaive FCM] Gagal mendaftarkan token ke database:", e);
    }
  }

  // Dengar pesan FCM saat tab aplikasi berada di latar depan (foreground)
  onForegroundMessage(callback: (payload: MessagePayload) => void) {
    if (!this.messaging) return () => {};
    return onMessage(this.messaging, (payload) => {
      console.log("[Olaive FCM] Pesan latar depan diterima:", payload);
      callback(payload);
    });
  }

  // Memicu Notifikasi Klasik di Browser (Untuk fallback super-handal jika client online / tidak pakai VAPID)
  triggerLocalNotification(title: string, body: string, photoImageUrl?: string, targetId?: string) {
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
      try {
        const options: any = {
          body: body,
          icon: photoImageUrl || '/icon-192.png',
          badge: '/icon.svg',
          tag: targetId || 'qcc_notif_tag',
          renotify: true,
          requireInteraction: false,
          vibrate: [100, 50, 100]
        };

        const notif = new Notification(title, options);
        notif.onclick = () => {
          window.focus();
          // Jika ada listener navigasi, kita bisa mengarahkan halaman
          if (targetId) {
            const selectEvent = new CustomEvent('select_photo_notif', { detail: { id: targetId } });
            window.dispatchEvent(selectEvent);
          }
          notif.close();
        };
      } catch (err) {
        console.warn("[Olaive FCM] Gagal menampilkan notifikasi lokal di desktop:", err);
      }
    }
  }
}

export const fcm = new FCMService();
