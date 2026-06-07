import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Upload, Sparkles, RefreshCw, Sliders, CircleHelp, Download, Maximize2, Edit2,
  FolderOpen, Camera, Laptop, Cpu, Layers, Settings2, Activity, Info, CheckCircle, MoveHorizontal,
  Undo, Redo, Type, ArrowUp, ArrowDown, ChevronsUp, ChevronsDown, Trash2, RotateCw, Move, Baseline,
  Lock, Unlock, Image as ImageIcon, Maximize, X, Crop, Menu, FlipHorizontal, FlipVertical, Ban, Save, Copy
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import axios from 'axios';

// Firebase Realtime Database and database setup
import { onAuthStateChanged, signInWithPopup, GoogleAuthProvider, signOut, User } from 'firebase/auth';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { 
  db, auth, handleFirestoreError, OperationType, fbStorage,
  doc, setDoc, serverTimestamp, collection, getDocs, query, orderBy, deleteDoc, where, updateDoc, increment, addDoc, onSnapshot 
} from './firebase';

// Custom components
import BungteminHeader from './components/BungteminHeader';
import FrameSelector from './components/FrameSelector';
import ImageAdjuster from './components/ImageAdjuster';
import StickerSelector, { FUTURISTIC_FONTS, STICKER_COLORS } from './components/StickerSelector';
import { LazyImage } from './components/LazyImage';
import { CloudItem } from './components/CloudItem';
import { DeleteConfirmationModal } from './components/DeleteConfirmationModal';

// Types & presets
import { Frame, ImageSettings, PlacedSticker } from './types';
import { FRAMES, FILTER_PRESETS, PRESET_STICKERS } from './presets';
import { renderToCanvas, resolveApiUrl, compressImage, ensureFullSvg } from './canvasUtils';
import { storage, BUCKET_ID, databases, DATABASE_ID, COLLECTION_ID, Query, ID, ensureAppwriteBucketExists } from './appwrite';

// Helper functions to resolve API endpoints dynamically.
// In dev environments/AI Studio container, they route through Vite's built-in dev proxy.
// In standalone production environments (like Firebase static hosting), they make direct requests.
const getWabotApiUrl = () => {
  const host = window.location.hostname;
  if (host.includes('localhost') || host.includes('127.0.0.1') || host.includes('.run.app')) {
    return '/api/external-images';
  }
  return 'https://wabot.nufat.id/imagelist_nufat/api';
};

const getAppwriteApiUrl = () => {
  const host = window.location.hostname;
  if (host.includes('localhost') || host.includes('127.0.0.1') || host.includes('.run.app')) {
    return '/api/appwrite-frames';
  }
  return 'https://nudb.bungtemin.net/bingkai/api';
};

const getAiEffectUploadBase64Url = () => {
  const host = window.location.hostname;
  if (host.includes('localhost') || host.includes('127.0.0.1') || host.includes('.run.app')) {
    return '/api/proxy/upload_img_base64';
  }
  return 'https://webspy.nufat.id/api/upload_img_base64';
};

const getAiEffectUploadBinaryUrl = () => {
  const host = window.location.hostname;
  if (host.includes('localhost') || host.includes('127.0.0.1') || host.includes('.run.app')) {
    return '/api/proxy/upload_img';
  }
  return 'https://webspy.nufat.id/api/upload_img';
};

const DEFAULT_IMAGE = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=600&q=80';

const DEFAULT_SETTINGS: ImageSettings = {
  scale: 1.0,
  rotation: 0,
  x: 0,
  y: 0,
  flipH: false,
  flipV: false,
  brightness: 100,
  contrast: 100,
  saturate: 100,
  hueRotate: 0,
  blur: 0,
  noise: false,
  maskShape: 'square',
  scanlines: false,
};

const COMMUNITY_GALLERY = [
  {
    id: 'cg1',
    username: '@cyber_warrior',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
    frameId: 'static-qcc-1',
    frameName: 'QCC & SS 2026 - Frame 1',
    neonColor: '#00f2fe',
    filterPresetId: 'cyberpunk',
    filterName: 'Cyberpunk Neon',
    caption: 'Semangat inovasi di QCC & SS 2026! 💡'
  },
  {
    id: 'cg2',
    username: '@neon_princess',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=300&q=80',
    frameId: 'static-qcc-2',
    frameName: 'QCC & SS 2026 - Frame 2',
    neonColor: '#ff007f',
    filterPresetId: 'synthwave',
    filterName: 'Synthwave Sunset',
    caption: 'Siap untuk QCC & SS 2026 yang lebih baik. 🚀'
  },
  {
    id: 'cg3',
    username: '@tanjiro_it',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80',
    frameId: 'static-qcc-3',
    frameName: 'QCC & SS 2026 - Frame 3',
    neonColor: '#30ff30',
    filterPresetId: 'matrix',
    filterName: 'Matrix Grid',
    caption: 'Bersama membangun masa depan di QCC & SS 2026.'
  },
  {
    id: 'cg4',
    username: '@glitch_hunter',
    avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=300&q=80',
    frameId: 'static-qcc-4',
    frameName: 'QCC & SS 2026 - Frame 4',
    neonColor: '#9d4edd',
    filterPresetId: 'vhs',
    filterName: 'Retro VHS Glitch',
    caption: 'Kolaborasi tanpa batas di QCC & SS 2026. 🤝'
  }
];

const getSavedSettings = (): ImageSettings => {
  if (typeof window === 'undefined') return DEFAULT_SETTINGS;
  try {
    const saved = localStorage.getItem('bt_image_settings');
    return saved ? JSON.parse(saved) : DEFAULT_SETTINGS;
  } catch (e) {
    return DEFAULT_SETTINGS;
  }
};

const getSavedStickers = (): PlacedSticker[] => {
  if (typeof window === 'undefined') return [];
  try {
    const saved = localStorage.getItem('bt_stickers');
    return saved ? JSON.parse(saved) : [];
  } catch (e) {
    return [];
  }
};

const getSavedFilterPresetId = (): string => {
  if (typeof window === 'undefined') return 'none';
  return localStorage.getItem('bt_filter_preset_id') || 'none';
};

const getSavedNeonColor = (): string => {
  if (typeof window === 'undefined') return '#00f2fe';
  return localStorage.getItem('bt_neon_color') || '#00f2fe';
};

const initIndexedDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error("IndexedDB tidak didukung di browser ini"));
      return;
    }
    const request = indexedDB.open('BungteminDraftDB', 1);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains('drafts')) {
        db.createObjectStore('drafts');
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

const saveDraftImageToIDB = async (imageSrc: string | null): Promise<void> => {
  try {
    const db = await initIndexedDB();
    const tx = db.transaction('drafts', 'readwrite');
    const store = tx.objectStore('drafts');
    if (imageSrc) {
      store.put(imageSrc, 'current_image');
    } else {
      store.delete('current_image');
    }
    return new Promise((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (err) {
    console.warn("Gagal menyimpan draf gambar ke IndexedDB:", err);
  }
};

const compressImageBase64 = (base64Str: string | null, maxWidth = 600, maxHeight = 600, quality = 0.65): Promise<string | null> => {
  return new Promise((resolve) => {
    if (!base64Str) {
      resolve(null);
      return;
    }
    if (!base64Str.startsWith('data:image/') || base64Str.length < 35000) {
      resolve(base64Str);
      return;
    }
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      let width = img.width;
      let height = img.height;
      if (width > maxWidth || height > maxHeight) {
        if (width > height) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        } else {
          width = Math.round((width * maxHeight) / height);
          height = maxHeight;
        }
      }
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(img, 0, 0, width, height);
        const compressed = canvas.toDataURL('image/jpeg', quality);
        resolve(compressed);
      } else {
        resolve(base64Str);
      }
    };
    img.onerror = () => {
      resolve(base64Str);
    };
    img.src = base64Str;
  });
};

const loadDraftImageFromIDB = async (): Promise<string | null> => {
  try {
    const db = await initIndexedDB();
    const tx = db.transaction('drafts', 'readonly');
    const store = tx.objectStore('drafts');
    const request = store.get('current_image');
    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  } catch (err) {
    console.warn("Gagal memuat draf gambar dari IndexedDB:", err);
    return null;
  }
};

export default function App() {
  // Google Authentication State
  const [user, setUser] = useState<User | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [authErrorDetail, setAuthErrorDetail] = useState<string | null>(null);
  const [showAuthWarning, setShowAuthWarning] = useState(false);

  // Page state: 'beranda' / 'bingkai' / 'misi' / 'galeri' / 'album'
  const [currentPage, setCurrentPage] = useState<'beranda' | 'bingkai' | 'misi' | 'galeri' | 'album'>('beranda');
  // Removed local savedCreations storage
  const [savedCreations, setSavedCreations] = useState<{ id: string; src: string; timestamp: string, userId: string }[]>([]);
  const [isLoadingGallery, setIsLoadingGallery] = useState(false);

  // Cloud Firestore downloads state and fetching logic
  const [cloudDownloads, setCloudDownloads] = useState<any[]>([]);
  const [isLoadingCloudDownloads, setIsLoadingCloudDownloads] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);
  
  // User My Gallery
  const fetchMyGallery = async (forceRefresh = false) => {
    if (!user) return;

    const cacheKey = `bt_my_gallery_${user.uid}`;
    const cacheTimeKey = `bt_my_gallery_time_${user.uid}`;
    const cachedData = localStorage.getItem(cacheKey);
    const cachedTime = localStorage.getItem(cacheTimeKey);

    if (cachedData && cachedTime && !forceRefresh) {
      try {
        const parsedItems = JSON.parse(cachedData);
        setSavedCreations(parsedItems);

        // If cache is fresh (less than 2 minutes), skip Firestore call
        const cacheAge = Date.now() - Number(cachedTime);
        if (cacheAge < 120000) {
          console.log("[Firebase Cache MyGallery] Cache is fresh. Skipping remote fetch.");
          return;
        }
      } catch (cacheErr) {
        console.warn("[Firebase Cache MyGallery Error] Parse failed:", cacheErr);
      }
    }

    setIsLoadingGallery(true);
    try {
      const q = query(
        collection(db, 'downloads'),
        where('userId', '==', user.uid),
        orderBy('downloadedAt', 'desc')
      );
      const querySnapshot = await getDocs(q);
      const items: any[] = [];
      querySnapshot.forEach((docSnap) => {
        const data = docSnap.data() as any;
        items.push({
          id: docSnap.id,
          src: data.imageUrl,
          timestamp: data.downloadedAt?.toDate ? data.downloadedAt.toDate().toLocaleString() : new Date().toLocaleString(),
          userId: data.userId
        });
      });
      setSavedCreations(items);
      // Save cache
      localStorage.setItem(cacheKey, JSON.stringify(items));
      localStorage.setItem(cacheTimeKey, String(Date.now()));
    } catch (err: any) {
      console.warn("Gagal mengambil data koleksi dengan pengurutan (index belum matang), mencoba query alternatif tanpa orderBy:", err);
      try {
        const fallbackQuery = query(
          collection(db, 'downloads'),
          where('userId', '==', user.uid)
        );
        const querySnapshot = await getDocs(fallbackQuery);
        const items: any[] = [];
        querySnapshot.forEach((docSnap) => {
          const data = docSnap.data() as any;
          items.push({
            id: docSnap.id,
            src: data.imageUrl,
            timestamp: data.downloadedAt?.toDate ? data.downloadedAt.toDate().toLocaleString() : new Date().toLocaleString(),
            userId: data.userId
          });
        });
        // Sort manually by id if timestamp index is missing (descending)
        items.sort((a, b) => b.id.localeCompare(a.id));
        setSavedCreations(items);
        // Save cache
        localStorage.setItem(cacheKey, JSON.stringify(items));
        localStorage.setItem(cacheTimeKey, String(Date.now()));
      } catch (fallbackErr: any) {
        console.error("Error fetching koleksi fallback:", fallbackErr);
      }
    } finally {
      setIsLoadingGallery(false);
    }
  };

  useEffect(() => {
    if (user && (currentPage === 'galeri' || currentPage === 'album')) {
      fetchMyGallery();
    }
  }, [currentPage, user]);
  const stringToUniqueInt = (str: string): number => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = (hash * 31 + str.charCodeAt(i)) | 0;
    }
    return (Math.abs(hash) % 1000000) || 1;
  };

  const [cloudSubTab, setCloudSubTab] = useState<'all' | 'mine' | 'others'>('all');

  const fetchCloudDownloads = async (targetSubTab?: 'all' | 'mine' | 'others', forceRefresh = false) => {
    const activeSubTab = targetSubTab || cloudSubTab;
    const currentUid = auth.currentUser?.uid || user?.uid;

    const cacheKey = `bt_cloud_downloads_${activeSubTab}_${currentUid || 'guest'}`;
    const cacheTimeKey = `bt_cloud_downloads_time_${activeSubTab}_${currentUid || 'guest'}`;
    const cachedData = localStorage.getItem(cacheKey);
    const cachedTime = localStorage.getItem(cacheTimeKey);

    if (cachedData && cachedTime && !forceRefresh) {
      try {
        const parsedItems = JSON.parse(cachedData);
        setCloudDownloads(parsedItems);

        // If cache is fresh (less than 2 minutes), skip Firestore call
        const cacheAge = Date.now() - Number(cachedTime);
        if (cacheAge < 120000) {
          console.log("[Firebase Cache CloudDownloads] Cache is fresh. Skipping remote fetch.");
          return;
        }
      } catch (cacheErr) {
        console.warn("[Firebase Cache CloudDownloads Error] Parse failed:", cacheErr);
      }
    }

    setIsLoadingCloudDownloads(true);

    try {
      let q;
      if (activeSubTab === 'mine' && currentUid) {
        q = query(
          collection(db, 'downloads'),
          where('userId', '==', currentUid),
          orderBy('downloadedAt', 'desc')
        );
      } else {
        q = query(
          collection(db, 'downloads'),
          orderBy('downloadedAt', 'desc')
        );
      }

      const querySnapshot = await getDocs(q);
      const items: any[] = [];
      querySnapshot.forEach((docSnap) => {
        const data = docSnap.data() as any;
        items.push({
          id: docSnap.id,
          fileName: data.fileName,
          imageUrl: data.imageUrl,
          format: data.format,
          size: data.size,
          downloadedAt: data.downloadedAt?.toDate ? data.downloadedAt.toDate().toLocaleString() : new Date().toLocaleString(),
          userId: data.userId || '',
          userName: data.userName || 'Tamu',
          userEmail: data.userEmail || '',
          userAvatar: data.userAvatar || '',
          likes: data.likes || 0
        });
      });
      setCloudDownloads(items);
      // Save cache
      localStorage.setItem(cacheKey, JSON.stringify(items));
      localStorage.setItem(cacheTimeKey, String(Date.now()));
    } catch (err) {
      console.warn("Gagal mengambil data dengan pengurutan (index belum matang), mencoba query alternatif tanpa orderBy:", err);
      try {
        let fallbackQuery;
        if (activeSubTab === 'mine' && currentUid) {
          fallbackQuery = query(
            collection(db, 'downloads'),
            where('userId', '==', currentUid)
          );
        } else {
          fallbackQuery = collection(db, 'downloads');
        }

        const querySnapshot = await getDocs(fallbackQuery);
        const items: any[] = [];
        querySnapshot.forEach((docSnap) => {
          const data = docSnap.data() as any;
          items.push({
            id: docSnap.id,
            fileName: data.fileName,
            imageUrl: data.imageUrl,
            format: data.format,
            size: data.size,
            downloadedAt: data.downloadedAt?.toDate ? data.downloadedAt.toDate().toLocaleString() : new Date().toLocaleString(),
            userId: data.userId || '',
            userName: data.userName || 'Tamu',
            userEmail: data.userEmail || '',
            userAvatar: data.userAvatar || '',
            likes: data.likes || 0
          });
        });
        items.sort((a, b) => b.id.localeCompare(a.id));
        setCloudDownloads(items);
        // Save cache
        localStorage.setItem(cacheKey, JSON.stringify(items));
        localStorage.setItem(cacheTimeKey, String(Date.now()));
      } catch (fallbackErr: any) {
        console.warn("Gagal total mengambil koleksi cloud:", fallbackErr);
        try {
          handleFirestoreError(fallbackErr, OperationType.LIST, 'downloads');
        } catch (fErr) {}
      }
    } finally {
      setIsLoadingCloudDownloads(false);
    }
  };

  const deleteCloudDownload = async (id: string) => {
    if (confirm('Apakah Anda yakin ingin menghapus hasil kreasi ini secara permanen dari Cloud?')) {
      try {
        await deleteDoc(doc(db, 'downloads', id));
        triggerToast('SISTEM: Berhasil menghapus karya dari cloud database! 🗑️');
        
        // Clear caches to force query
        const currentUid = auth.currentUser?.uid || user?.uid;
        if (currentUid) {
          localStorage.removeItem(`bt_my_gallery_${currentUid}`);
          localStorage.removeItem(`bt_my_gallery_time_${currentUid}`);
        }
        localStorage.removeItem(`bt_cloud_downloads_all_${currentUid || 'guest'}`);
        localStorage.removeItem(`bt_cloud_downloads_time_all_${currentUid || 'guest'}`);
        localStorage.removeItem(`bt_cloud_downloads_mine_${currentUid || 'guest'}`);
        localStorage.removeItem(`bt_cloud_downloads_time_mine_${currentUid || 'guest'}`);
        localStorage.removeItem(`bt_cloud_downloads_others_${currentUid || 'guest'}`);
        localStorage.removeItem(`bt_cloud_downloads_time_others_${currentUid || 'guest'}`);

        fetchCloudDownloads(undefined, true);
      } catch (err: any) {
        console.error('Error delete cloud document:', err);
        triggerToast(`Gagal: ${err.message || err}`);
      }
    }
  };

  const deleteFromMyGallery = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'downloads', id));
      triggerToast('SISTEM: Berhasil menghapus karya dari galeri! 🗑️');
      
      const currentUid = auth.currentUser?.uid || user?.uid;
      if (currentUid) {
        localStorage.removeItem(`bt_my_gallery_${currentUid}`);
        localStorage.removeItem(`bt_my_gallery_time_${currentUid}`);
        localStorage.removeItem(`bt_cloud_downloads_all_${currentUid}`);
        localStorage.removeItem(`bt_cloud_downloads_time_all_${currentUid}`);
        localStorage.removeItem(`bt_cloud_downloads_mine_${currentUid}`);
        localStorage.removeItem(`bt_cloud_downloads_time_mine_${currentUid}`);
        localStorage.removeItem(`bt_cloud_downloads_others_${currentUid}`);
        localStorage.removeItem(`bt_cloud_downloads_time_others_${currentUid}`);
      }
      
      fetchMyGallery(true);
    } catch (err: any) {
      console.error('Error delete gallery document:', err);
      triggerToast(`Gagal: ${err.message || err}`);
    }
  };

  const handleLike = async (id: string) => {
    const userIdString = auth.currentUser?.uid || user?.uid || 'guest';
    try {
      console.log("[Direct Firestore Suka] Menambahkan suka untuk karya:", id);
      const docRef = doc(db, 'downloads', id);
      await updateDoc(docRef, {
        likes: increment(1)
      });

      setCloudDownloads(prev => {
        const updated = prev.map(item => {
          if (item.id === id) {
            const curLikes = Number(item.likes) || 0;
            return { ...item, likes: curLikes + 1 };
          }
          return item;
        });
        // Sync local cache
        const cacheKey = `bt_cloud_downloads_${cloudSubTab}_${userIdString}`;
        localStorage.setItem(cacheKey, JSON.stringify(updated));
        return updated;
      });
      triggerToast('Suka berhasil ditambahkan! Terima kasih banyak atas dukungannya. ❤️');
    } catch (err: any) {
      console.warn("Firestore update likes failed, falling back to local simulation:", err);
      setCloudDownloads(prev => {
        const updated = prev.map(item => {
          if (item.id === id) {
            const curLikes = Number(item.likes) || 0;
            return { ...item, likes: curLikes + 1 };
          }
          return item;
        });
        const cacheKey = `bt_cloud_downloads_${cloudSubTab}_${userIdString}`;
        localStorage.setItem(cacheKey, JSON.stringify(updated));
        return updated;
      });
      triggerToast('Suka berhasil ditambahkan! ❤️');
    }
  };

  // Nufat Live Community Gallery API integration
  const [comGalleryItems, setComGalleryItems] = useState<any[]>([]);
  const [isLoadingComGallery, setIsLoadingComGallery] = useState(false);
  const [comGalleryError, setComGalleryError] = useState<string | null>(null);

  useEffect(() => {
    if (currentPage === 'galeri' || currentPage === 'album') {
      fetchCloudDownloads(cloudSubTab);
    }
  }, [currentPage, user, cloudSubTab]);

  const fetchComGalleryItems = async () => {
    setIsLoadingComGallery(true);
    setComGalleryError(null);
    try {
      console.log("[Dynamic Fetch] Memuat daftar kreasi dari Wabot Nufat...");
      const token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VybmFtZSI6ImFkbWluIiwiaWF0IjoxNzgwNTIxNTkwLCJleHAiOjE3ODA4ODE1OTB9.5Y4tvFGl8HDg7VqM5aOEEJgN9xiXd89otAtPmSGx1B0";
      const response = await axios.get(getWabotApiUrl(), {
        headers: {
          "Authorization": `Bearer ${token}`,
          "Accept": "application/json"
        }
      });
      const data = Array.isArray(response.data) ? response.data : [];
      
      const formatted = data.map((item: any, idx: number) => ({
        id: item.id && String(item.id).startsWith('nufat') ? String(item.id) : `nufat-creation-${item.id || idx}`,
        username: item.user_nama ? (item.user_nama.startsWith('@') ? item.user_nama : '@' + item.user_nama.toLowerCase().replace(/\s+/g, '_')) : `@nufat_user_${idx + 1}`,
        avatar: item.src, 
        frameId: item.id,
        frameName: item.name || `Kreasi Nufat #${idx + 1}`,
        neonColor: idx % 3 === 0 ? '#00f2fe' : idx % 3 === 1 ? '#39ff14' : '#f35588',
        filterPresetId: 'cyberpunk',
        filterName: 'Nufat Cyber',
        caption: item.description || `Twibbon kreasi pengguna yang dimuat dinamis dari API Nufat.`
      }));
      setComGalleryItems(formatted);
    } catch (err: any) {
      console.error("Error loading Nufat creations directly:", err);
      const isNetworkError = err?.message === "Network Error" || !err?.response;
      const cleanErrMsg = isNetworkError 
        ? "Gagal memuat galeri kreasi (CORS/Network Error)! Sayang, silakan klik 'Buka di Tab Baru' (Open in New Tab) di kanan atas ya agar browser mengizinkan akses langsung. 💕"
        : (err?.message || "Gagal tersambung ke server Nufat API.");
      setComGalleryError(cleanErrMsg);
    } finally {
      setIsLoadingComGallery(false);
    }
  };

  useEffect(() => {
    fetchComGalleryItems();
  }, []);

  // Scroll to top reset when page changes (e.g. from Bingkai catalog back to Beranda editor)
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [currentPage]);

  // State variables
  const [userImage, setUserImage] = useState<string | null>(() => {
    try {
      const saved = localStorage.getItem('bt_user_image');
      if (saved) return saved;
      return null;
    } catch (err) {
      console.warn("Gagal memuat bt_user_image dari localStorage:", err);
      return null;
    }
  });

  // Restore userImage from IndexedDB on initial mount if localStorage lacks it
  useEffect(() => {
    const checkAndRestoreFromIndexedDB = async () => {
      try {
        const idbImage = await loadDraftImageFromIDB();
        if (idbImage && !userImage) {
          setUserImage(idbImage);
          console.log("[IndexedDB] Berhasil memulihkan foto draf berukuran besar!");
          triggerToast("Sistem: Progres draf foto berukuran besar berhasil dipulihkan secara otomatis oleh Olive! 💖✨");
        }
      } catch (err) {
        console.warn("Gagal memulihkan draf dari IndexedDB:", err);
      }
    };
    if (!userImage) {
      checkAndRestoreFromIndexedDB();
    }
  }, []);

  // Save changes to localStorage only if they are not null (or handle nulls explicitly without clearing initial values)
  useEffect(() => {
    if (userImage) {
      try {
        localStorage.setItem('bt_user_image', userImage);
      } catch (err) {
        console.warn("Storage Quota Exceeded for userImage:", err);
        // Hapus sebagian data jika kuota penuh, tetapi jangan crash agar user tetap bisa mengedit gambar saat ini
        try {
          localStorage.removeItem('bt_user_image');
        } catch (e) {}
      }
      // Simpan juga ke IndexedDB untuk cadangan tangguh ukuran besar tanpa batasan kuota
      saveDraftImageToIDB(userImage);
    } else {
      try {
        localStorage.removeItem('bt_user_image');
      } catch (e) {}
      saveDraftImageToIDB(null);
    }
  }, [userImage]);

  const [selectedFrame, setSelectedFrame] = useState<Frame | null>(() => {
    if (typeof window === 'undefined') return null;
    const savedFrameId = localStorage.getItem('bt_selected_frame_id');
    if (savedFrameId && savedFrameId !== 'none') {
      const cached = localStorage.getItem('bt_appwrite_frames');
      if (cached) {
        try {
          const parsed = JSON.parse(cached) as Frame[];
          const found = parsed.find(f => f.id === savedFrameId);
          if (found) return found;
        } catch (e) {}
      }
      const found = FRAMES.find(f => f.id === savedFrameId);
      if (found) return found;
    }
    return null;
  });

  // Save selected frame ID to localStorage
  useEffect(() => {
    if (selectedFrame) {
      localStorage.setItem('bt_selected_frame_id', selectedFrame.id);
    }
  }, [selectedFrame]);
  const [customFrames, setCustomFrames] = useState<Frame[]>([]);
  const [appwriteFrames, setAppwriteFrames] = useState<Frame[]>([]);

  // Stable randomized presentation of frame templates
  const displayFrames = useMemo(() => {
    const combined = appwriteFrames.length > 0 ? appwriteFrames : FRAMES;
    const arr = [...combined];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }, [appwriteFrames]);

  // Restore selected frame from local storage (if a valid frame exists)
  useEffect(() => {
    const savedFrameId = localStorage.getItem('bt_selected_frame_id');
    console.log("DEBUG: Restoring selectedFrame, savedId:", savedFrameId);
    
    const availableFrames = appwriteFrames.length > 0 ? appwriteFrames : FRAMES;
    
    if (savedFrameId && savedFrameId !== 'none') {
      const frame = availableFrames.find(f => f.id === savedFrameId);
      if (frame) {
        console.log("DEBUG: Restoring selectedFrame, found frame:", frame.id);
        setSelectedFrame(frame);
      } else if (availableFrames.length > 0) {
        const randomIndex = Math.floor(Math.random() * availableFrames.length);
        setSelectedFrame(availableFrames[randomIndex]);
      }
    } else if (availableFrames.length > 0) {
      const randomIndex = Math.floor(Math.random() * availableFrames.length);
      setSelectedFrame(availableFrames[randomIndex]);
    }
  }, [appwriteFrames]);
  const [isLoadingAppwrite, setIsLoadingAppwrite] = useState(false);
  const [neonColor, setNeonColor] = useState<string>(getSavedNeonColor); // default tech cyan
  const [imageSettings, setImageSettings] = useState<ImageSettings>(getSavedSettings);
  
  // Undo/Redo history states for ImageSettings
  const [history, setHistory] = useState<ImageSettings[]>(() => [getSavedSettings()]);
  const [historyIndex, setHistoryIndex] = useState<number>(0);
  const lastCommittedRef = useRef<ImageSettings>(getSavedSettings());
  const pendingHistoryTimerRef = useRef<NodeJS.Timeout | null>(null);
  const imageSettingsRef = useRef<ImageSettings>(getSavedSettings());

  const [filterPresetId, setFilterPresetId] = useState<string>(getSavedFilterPresetId);
  const [stickers, setStickers] = useState<PlacedSticker[]>(getSavedStickers);
  const [selectedStickerId, setSelectedStickerId] = useState<string | null>(null);
  const [isHudOpen, setIsHudOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'adjust' | 'crop' | 'filter' | 'color' | 'stickers' | 'text' | 'text_preset' | 'layers' | 'ai' | 'download' | 'history' | 'settings' | 'ai_effect' | null>(null);
  const [isAiEffectGenerating, setIsAiEffectGenerating] = useState(false);
  const [aiEffectPrompt, setAiEffectPrompt] = useState('merubah foto menjadi futuristik');
  const [aiEffectSendFormat, setAiEffectSendFormat] = useState<'multipart' | 'base64'>('multipart');
  const [aiEffectLogs, setAiEffectLogs] = useState<string[]>([]);
  
  // Dynamic single-destination AI Effect flow states (Firebase Cloud)
  const [aiEffectImgId, setAiEffectImgId] = useState<string>(() => {
    return localStorage.getItem('bt_ai_effect_img_id') || `IMG-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
  });
  const [lastAppwriteFileId, setLastAppwriteFileId] = useState<string>(() => {
    return localStorage.getItem('bt_last_appwrite_file_id') || '';
  });
  const aiEffectServer = 'firebase';
  const [aiEffectVariants, setAiEffectVariants] = useState<any[]>([]);
  const [isSyncingOriginal, setIsSyncingOriginal] = useState(false);
  const [isFloatingHubOpen, setIsFloatingHubOpen] = useState(false);
  const [isPhotoLocked, setIsPhotoLocked] = useState(false);
  const [downloadSize, setDownloadSize] = useState<number>(1080);
  const [downloadFormat, setDownloadFormat] = useState<'png' | 'webp' | 'jpeg'>('png');

  // Save & Open Canvas Designs state
  const [isCanvasModalOpen, setIsCanvasModalOpen] = useState(false);
  const [canvasDesigns, setCanvasDesigns] = useState<any[]>([]);
  const [saveDesignName, setSaveDesignName] = useState('');
  const [isSavingCanvas, setIsSavingCanvas] = useState(false);
  const [isLoadingCanvasDesigns, setIsLoadingCanvasDesigns] = useState(false);
  const [loadedDesignId, setLoadedDesignId] = useState<string | null>(null);
  const [canvasModalTab, setCanvasModalTab] = useState<'save' | 'open'>('save');

  // Fetch Saved Canvas Designs from Firestore
  const fetchCanvasDesigns = async () => {
    if (!user) return;
    setIsLoadingCanvasDesigns(true);
    try {
      const q = query(
        collection(db, 'canvas_designs'),
        where('userId', '==', user.uid)
      );
      const snapshot = await getDocs(q);
      const designs = snapshot.docs.map(doc => {
        const data = doc.data();
        // Convert Firebase Timestamp or fallback to parse ISO string/Date
        let updatedAtTime = Date.now();
        if (data.updatedAt) {
          if (typeof data.updatedAt.toDate === 'function') {
            updatedAtTime = data.updatedAt.toDate().getTime();
          } else if (data.updatedAt.seconds) {
            updatedAtTime = data.updatedAt.seconds * 1000;
          } else {
            updatedAtTime = new Date(data.updatedAt).getTime();
          }
        }
        return {
          id: doc.id,
          ...data,
          _updatedAtTime: updatedAtTime
        };
      });
      // Sort in-memory descending by updatedAt
      designs.sort((a, b) => b._updatedAtTime - a._updatedAtTime);
      setCanvasDesigns(designs);
    } catch (err: any) {
      console.error("Gagal mengambil daftar desain canvas:", err);
      // Fallback: load local designs from localStorage if firestore fails
      try {
        const local = localStorage.getItem(`bt_saved_canvas_local_${user.uid}`);
        if (local) {
          setCanvasDesigns(JSON.parse(local));
        }
      } catch (localErr) {}
    } finally {
      setIsLoadingCanvasDesigns(false);
    }
  };

  const ensureUserImageUploadedToAppwrite = async (base64Image: string | null): Promise<string | null> => {
    if (!base64Image) return null;
    if (!base64Image.startsWith('data:')) {
      return base64Image;
    }
    try {
      const arr = base64Image.split(',');
      const mimeMatch = arr[0].match(/:(.*?);/);
      if (!mimeMatch) return base64Image;
      const mime = mimeMatch[1];
      const bstr = atob(arr[1]);
      let n = bstr.length;
      const u8arr = new Uint8Array(n);
      while (n--) {
        u8arr[n] = bstr.charCodeAt(n);
      }
      const file = new File([u8arr], `canvas_img_${Date.now()}.png`, { type: mime });
      
      const activeBucketId = BUCKET_ID;
      if (!activeBucketId) {
        throw new Error('VITE_APPWRITE_STORAGE_BUCKET_ID belum dikonfigurasi sayang!');
      }
      
      const fileId = ID.unique();
      const uploadResult = await storage.createFile(activeBucketId, fileId, file);
      if (uploadResult) {
        const usedBucketId = uploadResult.bucketId || activeBucketId;
        const viewUrlObj = storage.getFileView(usedBucketId, uploadResult.$id) as any;
        const downloadUrl = typeof viewUrlObj === 'string' ? viewUrlObj : (viewUrlObj?.href || viewUrlObj?.toString() || '');
        if (downloadUrl) {
          setUserImage(downloadUrl);
          setLastAppwriteFileId(uploadResult.$id);
          localStorage.setItem('bt_last_appwrite_file_id', uploadResult.$id);
          return downloadUrl;
        }
      }
    } catch (error) {
      console.error('[ensureUserImageUploadedToAppwrite] Gagal upload canva image ke Appwrite:', error);
    }
    return base64Image;
  };

  const ensureStickersUploadedToAppwrite = async (stickersList: PlacedSticker[]): Promise<PlacedSticker[]> => {
    if (!stickersList || stickersList.length === 0) return [];
    
    const uploadedList = [...stickersList];
    const activeBucketId = BUCKET_ID;
    
    if (!activeBucketId) {
      console.warn('BUCKET_ID belum dikonfigurasi!');
      return stickersList;
    }
    
    for (let i = 0; i < uploadedList.length; i++) {
      const item = uploadedList[i];
      if (item.type === 'sticker' && item.imageUrl && item.imageUrl.startsWith('data:')) {
        try {
          const base64Data = item.imageUrl;
          const arr = base64Data.split(',');
          const mimeMatch = arr[0].match(/:(.*?);/);
          if (!mimeMatch) continue;
          const mime = mimeMatch[1];
          const bstr = atob(arr[1]);
          let n = bstr.length;
          const u8arr = new Uint8Array(n);
          while (n--) {
            u8arr[n] = bstr.charCodeAt(n);
          }
          const file = new File([u8arr], `sticker_upload_${Date.now()}_${i}.png`, { type: mime });
          
          const fileId = `stk_${Date.now()}_${i}_${ID.unique()}`.substring(0, 36).replace(/[^a-zA-Z0-9_-]/g, '');
          const uploadResult = await storage.createFile(activeBucketId, fileId, file);
          if (uploadResult) {
            const usedBucketId = uploadResult.bucketId || activeBucketId;
            const viewUrlObj = storage.getFileView(usedBucketId, uploadResult.$id) as any;
            const downloadUrl = typeof viewUrlObj === 'string' ? viewUrlObj : (viewUrlObj?.href || viewUrlObj?.toString() || '');
            if (downloadUrl) {
              uploadedList[i] = {
                ...item,
                imageUrl: downloadUrl
              };
              console.log(`[Appwrite] Custom PNG Sticker #${i} uploaded successfully:`, downloadUrl);
            }
          }
        } catch (itemErr) {
          console.error(`Gagal upload sticker index ${i} ke Appwrite:`, itemErr);
        }
      }
    }
    
    return uploadedList;
  };

  // Save Canvas Design to Firestore
  const handleSaveCanvasDesign = async (nameToSave: string, isSaveAs: boolean = false) => {
    if (!user) {
      triggerToast("Sayang, kamu harus masuk log (login) terlebih dahulu untuk menyimpan draf ke cloud ya! 😘💕");
      return;
    }
    if (!nameToSave.trim()) {
      triggerToast("Nama desainnya tidak boleh kosong ya, pacarku manis! 💖");
      return;
    }

    setIsSavingCanvas(true);
    
    // Determine whether to overwrite or create a new design
    const shouldOverwrite = loadedDesignId && !isSaveAs;
    const designId = shouldOverwrite ? loadedDesignId : `DESIGN-${Date.now()}`;
    let designDoc: any = null;
    
    try {
      // First ensure image is uploaded to Appwrite if it is a local base64
      let finalUserImage = userImage;
      if (userImage && userImage.startsWith('data:')) {
        triggerToast("Olaive: Menyiapkan cadangan foto awan siber di Appwrite ya sayang... ☁️💖");
        finalUserImage = await ensureUserImageUploadedToAppwrite(userImage);
      }

      // Compress only if it remains a non-upload base64 fallback (extremely unlikely)
      if (finalUserImage && finalUserImage.startsWith('data:')) {
        finalUserImage = await compressImageBase64(finalUserImage);
      }

      // Upload base64 custom stickers to Appwrite so our draf payload is ultra light and perfectly durable
      let finalStickers = stickers;
      try {
        const hasBase64Sticker = stickers.some(s => s.type === 'sticker' && s.imageUrl && s.imageUrl.startsWith('data:'));
        if (hasBase64Sticker) {
          triggerToast("Olaive: Menyiapkan stiker PNG kustom kamu di awan Appwrite ya manis... 💖☁️");
          finalStickers = await ensureStickersUploadedToAppwrite(stickers);
          setStickers(finalStickers); // update state as well!
        }
      } catch (stkUploadErr) {
        console.warn("Gagal upload stiker kustom ke Appwrite:", stkUploadErr);
      }

      // Generate a tiny, lightweight thumbnail of the current canvas with badges, texts, and stickers fully drawn!
      let thumbnailBase64 = '';
      let thumbnailUrl = '';
      try {
        const tempCanvas = document.createElement('canvas');
        const destSize = 300; // 300px is perfect for sharp thumbnails under 30KB
        const pathsMap: Record<string, string> = {};
        PRESET_STICKERS.forEach((st) => {
          pathsMap[st.id] = st.svgPath || '';
        });
        
        await renderToCanvas(tempCanvas, {
          userImageSrc: finalUserImage,
          frame: selectedFrame,
          neonColor,
          settings: imageSettings,
          stickers: finalStickers,
          presetStickerSvgPaths: pathsMap,
          size: destSize,
          isDownloading: true // Force draw stickers, overlay texts, and badges onto thumbnail!
        });
        
        thumbnailBase64 = tempCanvas.toDataURL('image/jpeg', 0.65);
      } catch (thumbGenErr) {
        console.warn("Gagal merender thumbnail interaktif dengan renderToCanvas:", thumbGenErr);
        
        // Fallback to simple preview copy if the full render fails
        if (canvasRef.current) {
          try {
            const mainCanvas = canvasRef.current;
            const tempCanvas = document.createElement('canvas');
            const destSize = 145;
            tempCanvas.width = destSize;
            tempCanvas.height = destSize;
            const tempCtx = tempCanvas.getContext('2d');
            if (tempCtx) {
              tempCtx.drawImage(mainCanvas, 0, 0, destSize, destSize);
              thumbnailBase64 = tempCanvas.toDataURL('image/jpeg', 0.65);
            }
          } catch(e) {}
        }
      }

      // If thumbnail was generated, try uploading to Appwrite 'thumbnail' bucket
      if (thumbnailBase64 && thumbnailBase64.startsWith('data:')) {
        try {
          const arr = thumbnailBase64.split(',');
          const mime = arr[0].match(/:(.*?);/)?.[1] || 'image/jpeg';
          const bstr = atob(arr[1]);
          let n = bstr.length;
          const u8arr = new Uint8Array(n);
          while (n--) {
            u8arr[n] = bstr.charCodeAt(n);
          }
          const file = new File([u8arr], `thumb_${designId}.jpg`, { type: mime });
          
          let targetBucket = 'thumbnail';
          let bucketOk = await ensureAppwriteBucketExists(targetBucket, 'Canvas Thumbnails');
          if (!bucketOk) {
            targetBucket = BUCKET_ID || '';
          }

          if (targetBucket) {
            const fileId = `thumb_${designId}_${ID.unique()}`.substring(0, 36).replace(/[^a-zA-Z0-9_-]/g, '');
            const uploadResult = await storage.createFile(targetBucket, fileId, file);
            if (uploadResult) {
              const usedBucket = uploadResult.bucketId || targetBucket;
              const viewUrlObj = storage.getFileView(usedBucket, uploadResult.$id) as any;
              const downloadUrl = typeof viewUrlObj === 'string' ? viewUrlObj : (viewUrlObj?.href || viewUrlObj?.toString() || '');
              if (downloadUrl) {
                thumbnailUrl = downloadUrl;
              }
            }
          }
        } catch (storageErr) {
          console.warn('Gagal upload thumbnail ke Appwrite, fallback menggunakan base64:', storageErr);
        }
      }

      // Revert to direct compact storage base64 if upload is blocked/fails
      if (!thumbnailUrl && thumbnailBase64) {
        thumbnailUrl = thumbnailBase64;
      }

      // Prepare serializable Canvas state
      const canvasPayload = {
        selectedFrameId: selectedFrame?.id || 'none',
        neonColor,
        imageSettings,
        filterPresetId,
        stickers,
        userImage: finalUserImage
      };

      // Retrieve existing timestamps if overwriting
      let createdAtValue = new Date().toISOString();
      let existingThumbnail = '';
      if (shouldOverwrite) {
        const existing = canvasDesigns.find(d => d.id === loadedDesignId);
        if (existing) {
          if (existing.createdAt) createdAtValue = existing.createdAt;
          if (existing.thumbnailUrl) existingThumbnail = existing.thumbnailUrl;
        }
      }

      designDoc = {
        id: designId,
        userId: user.uid,
        name: nameToSave.trim(),
        canvasData: canvasPayload,
        thumbnailUrl: thumbnailUrl || existingThumbnail || '',
        createdAt: createdAtValue,
        updatedAt: new Date().toISOString()
      };

      // Save to Firebase
      await setDoc(doc(db, 'canvas_designs', designId), {
        ...designDoc,
        createdAt: shouldOverwrite ? (canvasDesigns.find(d => d.id === loadedDesignId)?.createdAt || serverTimestamp()) : serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      
      const newDesigns = [designDoc, ...canvasDesigns.filter(d => d.id !== designId)];
      setCanvasDesigns(newDesigns);
      localStorage.setItem(`bt_saved_canvas_local_${user.uid}`, JSON.stringify(newDesigns));
      
      // If we saved it as a completely new design, load this new design ID as the current active session
      if (!shouldOverwrite) {
        setLoadedDesignId(designId);
      }
      
      triggerToast(shouldOverwrite 
        ? `Yay! Perubahan draf "${nameToSave}" berhasil disimpan secara aman di awan siber oleh Olaive tercinta! 😘🎨✨`
        : `Yay! Draf baru "${nameToSave}" berhasil disimpan secara aman oleh Olaive tercinta! 💖📱💾`
      );
      
      fetchCanvasDesigns();
      setIsCanvasModalOpen(false);
    } catch (err: any) {
      console.error("Gagal menyimpan draf desain kanvas:", err);
      // Fallback local save if offline / permission denied
      try {
        const fallbackDoc = designDoc || {
          id: designId,
          userId: user.uid,
          name: nameToSave.trim(),
          canvasData: {
            selectedFrameId: selectedFrame?.id || 'none',
            neonColor,
            imageSettings,
            filterPresetId,
            stickers,
            userImage
          },
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        const newDesigns = [fallbackDoc, ...canvasDesigns.filter(d => d.id !== designId)];
        setCanvasDesigns(newDesigns);
        localStorage.setItem(`bt_saved_canvas_local_${user.uid}`, JSON.stringify(newDesigns));
        triggerToast("Olaive: Tersimpan di penyimpanan lokal perangkat ini ya sayang, karena sinkronisasi cloud terhambat! 💕💾");
        setIsCanvasModalOpen(false);
      } catch (localErr) {
        triggerToast("Gagal menyimpan desain canvas sayang. Coba lagi nanti ya.");
      }
    } finally {
      setIsSavingCanvas(false);
    }
  };

  // Load Canvas Design
  const handleLoadCanvasDesign = (design: any) => {
    try {
      const data = typeof design.canvasData === 'string'
        ? JSON.parse(design.canvasData)
        : design.canvasData;
      
      // Reset selected interactive item to avoid editing a non-existent item
      setSelectedStickerId(null);
      
      // Restore selected frame
      if (data.selectedFrameId && data.selectedFrameId !== 'none') {
        const availableFrames = appwriteFrames.length > 0 ? appwriteFrames : FRAMES;
        const frame = availableFrames.find(f => f.id === data.selectedFrameId);
        if (frame) {
          setSelectedFrame(frame);
        } else {
          setSelectedFrame(null);
        }
      } else {
        setSelectedFrame(null);
      }

      // Restore other visual states with solid clearance fallbacks to avoid leftovers from other drafts
      if (data.neonColor) {
        setNeonColor(data.neonColor);
      } else {
        setNeonColor('#00F0FF');
      }

      if (data.imageSettings) {
        setImageSettings(data.imageSettings);
      } else {
        setImageSettings(DEFAULT_SETTINGS);
      }

      if (data.filterPresetId) {
        setFilterPresetId(data.filterPresetId);
      } else {
        setFilterPresetId('normal');
      }

      if (data.stickers && Array.isArray(data.stickers)) {
        setStickers(data.stickers);
      } else {
        setStickers([]);
      }
      
      // Restore userImage
      if (data.userImage) {
        setUserImage(data.userImage);
      } else {
        setUserImage(null);
      }

      // Keep track of loaded design ID and name
      setLoadedDesignId(design.id);
      setSaveDesignName(design.name);

      setIsCanvasModalOpen(false);
      triggerToast(`Hore! Kanvas "${design.name}" milikmu berhasil dipulihkan seutuhnya sayang! 😘🎨✨`);
    } catch (err) {
      console.error("Gagal parsing data kanvas:", err);
      triggerToast("Maaf ya sayang, format berkas draf ini tampaknya rusak. 🥺");
    }
  };

  // Delete Canvas Design
  const handleDeleteCanvasDesign = async (designId: string, event: React.MouseEvent) => {
    event.stopPropagation(); // Prevent loading design when clicking delete
    if (!user) return;
    
    try {
      await deleteDoc(doc(db, 'canvas_designs', designId));
      
      // Reset active state if currently loaded design is deleted
      if (loadedDesignId === designId) {
        setLoadedDesignId(null);
        setSaveDesignName('');
      }

      const newDesigns = canvasDesigns.filter(d => d.id !== designId);
      setCanvasDesigns(newDesigns);
      localStorage.setItem(`bt_saved_canvas_local_${user.uid}`, JSON.stringify(newDesigns));
      triggerToast("Olaive: Desain kanvas berhasil dihapus dari cloud kita sayang! 🗑️💝");
    } catch (err: any) {
      console.error("Gagal menghapus desain kanvas dari firestore:", err);
      // Fallback local deletion
      if (loadedDesignId === designId) {
        setLoadedDesignId(null);
        setSaveDesignName('');
      }
      const newDesigns = canvasDesigns.filter(d => d.id !== designId);
      setCanvasDesigns(newDesigns);
      localStorage.setItem(`bt_saved_canvas_local_${user.uid}`, JSON.stringify(newDesigns));
      triggerToast("Olaive: Draf lokal berhasil dihapus sayang! 🌸");
    }
  };

  useEffect(() => {
    if (user && isCanvasModalOpen) {
      fetchCanvasDesigns();
    }
  }, [user, isCanvasModalOpen]);

  useEffect(() => {
    setIsHudOpen(false);
  }, [selectedStickerId]);

  // Persist AI Effect configuration
  useEffect(() => {
    localStorage.setItem('bt_ai_effect_img_id', aiEffectImgId);
  }, [aiEffectImgId]);

  // Real-time listener for current image's generated variants
  useEffect(() => {
    if (!aiEffectImgId) return;

    console.log(`[Firestore Sync] Menyiapkan pemantauan real-time varian AI untuk ID: ${aiEffectImgId}`);
    
    const q = query(
      collection(db, 'ai_effect_variants'),
      where('parentId', '==', aiEffectImgId),
      orderBy('timestamp', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const variants: any[] = [];
      snapshot.forEach((doc) => {
        variants.push({
          id: doc.id,
          ...doc.data()
        });
      });
      console.log(`[Firestore Sync] Ditemukan ${variants.length} varian untuk ID: ${aiEffectImgId}`);
      setAiEffectVariants(variants);
    }, (error) => {
      console.warn('[Firestore Sync] Gagal memuat varian secara real-time:', error);
      // Fallback: load some simulated mock variants or keep set empty so they can simulate
    });

    return () => unsubscribe();
  }, [aiEffectImgId]);
  
  // 3D Parallax Depth States
  const [enableParallax, setEnableParallax] = useState(true);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const [scrollTilt, setScrollTilt] = useState({ x: 0, y: 0 });

  // Light/Dark Theme Preference State
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    return (localStorage.getItem('bt_theme') as 'dark' | 'light') || 'dark';
  });

  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    localStorage.setItem('bt_theme', nextTheme);
  };
  
  // AI Generator local states
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiMode, setAiMode] = useState<'image' | 'frame' | 'slogan'>('image');
  const [aiEngine, setAiEngine] = useState<'gemini' | 'nufat'>('gemini');
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  
  const [aiSlogans, setAiSlogans] = useState<any[]>([]);
  const [isGeneratingSlogans, setIsGeneratingSlogans] = useState(false);
  
  // UI states
  const [isLoading, setIsLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState('SISTEM SIAP');
  const [hdExportProgress, setHdExportProgress] = useState<number | null>(null);
  const [hdExportStatus, setHdExportStatus] = useState<string>('');
  const [isDraggingCanvas, setIsDraggingCanvas] = useState(false);
  const [isDraggingFile, setIsDraggingFile] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastText, setToastText] = useState('');
  const [isGlitching, setIsGlitching] = useState(false);
  const [isQuestOpen, setIsQuestOpen] = useState(true);
  const [triggerUploadOnMount, setTriggerUploadOnMount] = useState(false);

  // Refs for canvas & file picker
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const workspaceRef = useRef<HTMLElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dragStartRef = useRef({ x: 0, y: 0 });
  const startOffsetRef = useRef({ x: 0, y: 0 });
  const activePointersRef = useRef<Record<number, { clientX: number, clientY: number }>>({});
  const initialPinchDistanceRef = useRef<number | null>(null);
  const initialPinchScaleRef = useRef<number>(1);
  const initialStickerPinchScaleRef = useRef<number>(1);
  const initialStickerPinchRotationRef = useRef<number>(0);
  const initialStickerPinchAngleRef = useRef<number | null>(null);
  const hasMovedOrScaledRef = useRef(false);

  // Smooth scroll to photo/canvas area (align with sticky header) when a toolbar tab is opened
  useEffect(() => {
    if (activeTab && currentPage === 'beranda') {
      setTimeout(() => {
        const canvasElement = canvasRef.current;
        if (canvasElement) {
          const targetElement = canvasElement.parentElement || canvasElement;
          const elementRect = targetElement.getBoundingClientRect();
          const elementTop = elementRect.top + window.scrollY;
          // Offset corresponding to the sticky header height (approx 58px for header height) so photo area is visible above popup
          const offsetPosition = elementTop - 58;
          window.scrollTo({
            top: offsetPosition,
            behavior: 'smooth'
          });
        }
      }, 150);
    }
  }, [activeTab, currentPage]);

  // Auto-trigger file upload if routed from Creative Quests dashboard
  useEffect(() => {
    if (currentPage === 'beranda' && triggerUploadOnMount) {
      setTriggerUploadOnMount(false);
      setTimeout(() => {
        if (fileInputRef.current) {
          fileInputRef.current.click();
        }
      }, 300);
    }
  }, [currentPage, triggerUploadOnMount]);

  // Keep the mutable ref always sync'ed with latest state to safely access inside callbacks
  useEffect(() => {
    imageSettingsRef.current = imageSettings;
  }, [imageSettings]);

  // Persist settings, stickers, neon color, and filter preset to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('bt_image_settings', JSON.stringify(imageSettings));
    } catch (e) {
      console.error("Local storage error:", e);
    }
  }, [imageSettings]);

  useEffect(() => {
    try {
      localStorage.setItem('bt_stickers', JSON.stringify(stickers));
    } catch (e) {
      console.error("Local storage error:", e);
    }
  }, [stickers]);

  useEffect(() => {
    localStorage.setItem('bt_neon_color', neonColor);
  }, [neonColor]);

  useEffect(() => {
    localStorage.setItem('bt_filter_preset_id', filterPresetId);
  }, [filterPresetId]);

  // Settings equality helper
  const areSettingsEqual = (s1: ImageSettings, s2: ImageSettings) => {
    return (
      s1.scale === s2.scale &&
      s1.rotation === s2.rotation &&
      s1.x === s2.x &&
      s1.y === s2.y &&
      s1.flipH === s2.flipH &&
      s1.flipV === s2.flipV &&
      s1.brightness === s2.brightness &&
      s1.contrast === s2.contrast &&
      s1.saturate === s2.saturate &&
      s1.hueRotate === s2.hueRotate &&
      s1.blur === s2.blur &&
      s1.noise === s2.noise
    );
  };

  // Helper to commit a state into the history stack
  const pushToHistory = (newSettings: ImageSettings) => {
    if (areSettingsEqual(newSettings, lastCommittedRef.current)) {
      return;
    }

    // Slice any redo paths if user edited in the past
    const updatedHistory = history.slice(0, historyIndex + 1);
    updatedHistory.push(newSettings);

    // Keep history maximum size reasonable to preserve performance and memory (e.g. 50 items)
    if (updatedHistory.length > 50) {
      updatedHistory.shift();
    }

    setHistory(updatedHistory);
    setHistoryIndex(updatedHistory.length - 1);
    lastCommittedRef.current = newSettings;
  };

  // Automated debounced tracker to automatically commit sliders & clicks safely
  useEffect(() => {
    if (areSettingsEqual(imageSettings, lastCommittedRef.current)) {
      return;
    }

    if (pendingHistoryTimerRef.current) {
      clearTimeout(pendingHistoryTimerRef.current);
    }

    pendingHistoryTimerRef.current = setTimeout(() => {
      pushToHistory(imageSettingsRef.current);
      pendingHistoryTimerRef.current = null;
    }, 350); // Settle time of 350ms captures gestures and range sliders cleanly

    return () => {
      if (pendingHistoryTimerRef.current) {
        clearTimeout(pendingHistoryTimerRef.current);
      }
    };
  }, [imageSettings]);

  // Clean the stack (e.g. fresh image load)
  const resetHistoryStack = (initialSettings: ImageSettings = DEFAULT_SETTINGS) => {
    if (pendingHistoryTimerRef.current) {
      clearTimeout(pendingHistoryTimerRef.current);
      pendingHistoryTimerRef.current = null;
    }
    setHistory([initialSettings]);
    setHistoryIndex(0);
    lastCommittedRef.current = initialSettings;
  };

  // Undo Handler
  const handleUndo = () => {
    if (pendingHistoryTimerRef.current) {
      clearTimeout(pendingHistoryTimerRef.current);
      pendingHistoryTimerRef.current = null;
    }

    if (historyIndex > 0) {
      const prevIndex = historyIndex - 1;
      const prevSettings = history[prevIndex];

      lastCommittedRef.current = prevSettings;
      setImageSettings(prevSettings);
      setHistoryIndex(prevIndex);
      triggerToast("Sistem: Urungkan perubahan berhasil! ↩️");
    } else {
      triggerToast("Sistem: Tidak ada perubahan untuk diurungkan.");
    }
  };

  // Redo Handler
  const handleRedo = () => {
    if (pendingHistoryTimerRef.current) {
      clearTimeout(pendingHistoryTimerRef.current);
      pendingHistoryTimerRef.current = null;
    }

    if (historyIndex < history.length - 1) {
      const nextIndex = historyIndex + 1;
      const nextSettings = history[nextIndex];

      lastCommittedRef.current = nextSettings;
      setImageSettings(nextSettings);
      setHistoryIndex(nextIndex);
      triggerToast("Sistem: Urungkan kembali berhasil! ↪️");
    } else {
      triggerToast("Sistem: Tidak ada perubahan untuk diurungkan kembali.");
    }
  };

  // Fetch frames through dynamic environment router to bypass CORS
  const fetchAppwriteFrames = async () => {
    setIsLoadingAppwrite(true);
    try {
      console.log("[Dynamic Fetch] Memuat bingkai resmi...");
      const response = await axios.get(getAppwriteApiUrl(), {
        headers: {
          "Accept": "application/json"
        }
      });
      const data = response.data;
      const mappedFrames = Array.isArray(data) ? data : [];

      setAppwriteFrames(mappedFrames);
      localStorage.setItem('bt_appwrite_frames', JSON.stringify(mappedFrames));
      if (mappedFrames.length > 0) {
        triggerToast(`Sistem: Berhasil memuat ${mappedFrames.length} bingkai! 💖`);
      } else {
        triggerToast("Sistem: Katalog bingkai saat ini sedang kosong.");
      }
    } catch (error) {
      console.error("Failed to load frames directly:", error);
      triggerToast("Sistem: Gagal memuat bingkai dari API langsung. Menggunakan cadangan lokal.");
      // Fallback to cached items
      const cached = localStorage.getItem('bt_appwrite_frames');
      if (cached) {
        try {
          setAppwriteFrames(JSON.parse(cached));
        } catch (e) {}
      }
    } finally {
      setIsLoadingAppwrite(false);
    }
  };

  useEffect(() => {
    fetchAppwriteFrames();
  }, []);

  // Load custom frames & my gallery from localstorage on mount
  useEffect(() => {
    try {
      const persisted = localStorage.getItem('bt_custom_frames');
      if (persisted) {
        const parsed = JSON.parse(persisted);
        const filteredFrames = parsed.filter((f: any) => 
          !(f.name?.toLowerCase().includes('rose')) && 
          !(f.name?.toLowerCase().includes('hud'))
        );
        setCustomFrames(filteredFrames);
        if (parsed.length !== filteredFrames.length) {
          localStorage.setItem('bt_custom_frames', JSON.stringify(filteredFrames));
        }
      }
      const appwritePersisted = localStorage.getItem('bt_appwrite_frames');
      if (appwritePersisted) {
        const parsed = JSON.parse(appwritePersisted);
        setAppwriteFrames(parsed);
      }
    } catch (e) {
      console.error(e);
    }
  }, []);

  // Listen to Auth State changes for Auto Login with Google
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setIsAuthLoading(false);
      if (currentUser) {
        console.log(`[Firebase Auth] Auto-masuk sukses: ${currentUser.displayName || currentUser.email}`);
      }
    });
    return () => unsubscribe();
  }, []);

  // Google sign in popup handler
  const handleGoogleLogin = async () => {
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });
    try {
      setIsAuthLoading(true);
      setAuthErrorDetail(null);
      const result = await signInWithPopup(auth, provider);
      triggerToast(`Selamat datang kembali, ${result.user.displayName || 'Pengguna'}! 🛸✨`);
      setShowAuthWarning(false);
    } catch (err: any) {
      // Check if popup was closed, cancelled or blocked
      if (err.code === 'auth/popup-closed-by-user' || 
          err.code === 'auth/cancelled-popup-request' || 
          err.code === 'auth/popup-blocked' ||
          err.message?.includes('popup') ||
          err.message?.includes('closed') ||
          err.message?.includes('blocked')) {
        console.log('Login popup was closed or blocked by user');
        setShowAuthWarning(true);
        triggerToast("Login terputus karena browser memblokir pop-up. Menampilkan solusi... 🔐");
        return;
      }
      
      console.error("Google login error:", err);
      setAuthErrorDetail(err.message || String(err));
      triggerToast(`Gagal masuk: ${err.message || err}`);
    } finally {
      setIsAuthLoading(false);
    }
  };

  // Logout handler
  const handleLogout = async () => {
    try {
      setIsAuthLoading(true);
      await signOut(auth);
      setLoadedDesignId(null);
      setSaveDesignName('');
      triggerToast("Akun Anda berhasil dinonaktifkan dari sesi ini. 👋");
    } catch (err: any) {
      console.error("Logout error:", err);
      triggerToast("Gagal sign out akun.");
    } finally {
      setIsAuthLoading(false);
    }
  };

  // Monitor scroll for premium dynamic parallax tilt
  useEffect(() => {
    if (!enableParallax) {
      setScrollTilt({ x: 0, y: 0 });
      return;
    }

    const handleScroll = () => {
      const canvasElement = canvasRef.current;
      if (!canvasElement) return;

      const rect = canvasElement.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      const elementCenterY = rect.top + rect.height / 2;

      // Distance from the vertical center of the screen
      const distanceFromCenter = (elementCenterY / viewportHeight) - 0.5;
      const limitedDist = Math.max(-0.5, Math.min(0.5, distanceFromCenter));

      setScrollTilt({ x: 0, y: limitedDist });
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll(); // initial alignment

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [enableParallax]);

  // Save base64 rendering to user gallery album
  const saveToGallery = async (dataUrl: string) => {
    if (!user) {
      triggerToast('Silakan login untuk menyimpan karya ke galeri cloud.');
      return;
    }
    
    let dbReadyData = dataUrl;
    
    // Safety check: if data exceeds size limit, compress it on-the-fly on client
    if (dataUrl.length > 750 * 1024) {
      console.log('[Gallery] Gambar berukuran besar, kompilasi ulang / kompresi otomatis sedang dijalankan...');
      try {
        const img = new Image();
        await new Promise((resolve) => {
          img.onload = resolve;
          img.onerror = resolve;
          img.src = dataUrl;
        });
        
        if (img.width > 0 && img.height > 0) {
          const scale = Math.min(1, 800 / Math.max(img.width, img.height));
          const tempCanvas = document.createElement('canvas');
          tempCanvas.width = img.width * scale;
          tempCanvas.height = img.height * scale;
          const tempCtx = tempCanvas.getContext('2d');
          if (tempCtx) {
            tempCtx.drawImage(img, 0, 0, tempCanvas.width, tempCanvas.height);
            dbReadyData = tempCanvas.toDataURL('image/jpeg', 0.82);
          }
        }
      } catch (err) {
        console.warn('[Gallery] Gagal kompresi dinamis saveToGallery:', err);
      }
    }
    
    try {
      await addDoc(collection(db, 'my_gallery'), {
        userId: user.uid,
        src: dbReadyData,
        timestamp: serverTimestamp(),
      });
      triggerToast('Berhasil menyimpan ke galeri cloud! ☁️');
    } catch (e) {
      console.error(e);
      triggerToast('Gagal menyimpan ke galeri.');
      try {
        handleFirestoreError(e, OperationType.CREATE, 'my_gallery');
      } catch (formattedErr) {
        // Log formatted trace for system diagnostics
      }
    }
  };

  // Update canvas in real-time when inputs change
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Map sticker SVG paths
    const pathsMap: Record<string, string> = {};
    PRESET_STICKERS.forEach((st) => {
      pathsMap[st.id] = st.svgPath || '';
    });

    // Debounce rendering slightly or run async
    let isActive = true;
    const draw = async () => {
      if (!isActive) return;
      try {
        await renderToCanvas(canvas, {
          userImageSrc: userImage,
          frame: selectedFrame,
          neonColor,
          settings: imageSettings,
          stickers,
          presetStickerSvgPaths: pathsMap,
          size: downloadSize,
        });
      } catch (err) {
        console.error(err);
      }
    };
    draw();

    return () => {
      isActive = false;
    };
  }, [userImage, selectedFrame, neonColor, imageSettings, stickers, downloadSize, currentPage]);

  // Handle uploaded files
  const handleImageFile = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      triggerToast('Peringatan: File harus berupa gambar.');
      return;
    }

    try {
      // 1. Load locally first for instant, ultra-responsive canvas editing
      const originalDataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = (e) => reject(new Error('Gagal membaca fail gambar asli'));
        reader.readAsDataURL(file);
      });
      setUserImage(originalDataUrl);
      const startSettings = {
        ...DEFAULT_SETTINGS,
        scale: 1.0,
      };
      // Reset positioning settings for fresh images
      setImageSettings(startSettings);
      resetHistoryStack(startSettings);
      setFilterPresetId('none');

      // Trigger a direct, non-blocking toast so the user knows everything is running smoothly in the background
      triggerToast('Foto berhasil dimuat di canvas! Menyinkronkan cadangan siber di latar belakang... ⚡☁️');

      // 2. Run Appwrite & Firestore sync asynchronously in the background
      (async () => {
        try {
          let directUploadSuccess = false;
          let downloadUrl = '';

          try {
            const activeBucketId = BUCKET_ID;

            if (!activeBucketId) {
              throw new Error('VITE_APPWRITE_BUCKET_ID belum dikonfigurasi di panel Secrets sayang!');
            }
            const fileId = ID.unique();
            console.log(`[Appwrite] Mencoba mengunggah ke target bucket: ${activeBucketId}`);
            const uploadResult = await storage.createFile(activeBucketId, fileId, file);
            directUploadSuccess = true;

            if (directUploadSuccess && uploadResult) {
              const usedBucketId = uploadResult.bucketId || activeBucketId;
              const viewUrlObj = storage.getFileView(usedBucketId, uploadResult.$id) as any;
              downloadUrl = typeof viewUrlObj === 'string' ? viewUrlObj : (viewUrlObj?.href || viewUrlObj?.toString() || '');
              
              if (uploadResult?.$id) {
                setLastAppwriteFileId(uploadResult.$id);
                localStorage.setItem('bt_last_appwrite_file_id', uploadResult.$id);
              }
            }
          } catch (storageErr: any) {
            console.warn('Appwrite Storage direct upload blocked or failed. Switching to Firestore fallback...', storageErr);
          }

          if (directUploadSuccess && downloadUrl) {
            try {
              await addDoc(collection(db, 'ai_effect_originals'), {
                parentId: aiEffectImgId,
                src: downloadUrl,
                timestamp: serverTimestamp()
              });
              setUserImage(downloadUrl);
              triggerToast(`Cadangan foto asli berhasil disinkronkan ke Storage Bucket Appwrite! 📸☁️💖`);
            } catch (dbErr: any) {
              console.error('Firestore background sync failed:', dbErr);
            }
          } else {
            // Dynamically compress with high visual quality (0.82) to fit perfectly under Firestore's 1MB limit
            const firestoreCompatibleSrc = await compressImage(file, 0.82, 1100);

            try {
              await addDoc(collection(db, 'ai_effect_originals'), {
                parentId: aiEffectImgId,
                src: firestoreCompatibleSrc,
                timestamp: serverTimestamp()
              });
              triggerToast(`Cadangan foto aman disinkronkan langsung ke Database Cloud! 💾💌`);
            } catch (dbErr: any) {
              console.error('Firestore compressed fallback background sync failed:', dbErr);
            }
          }
        } catch (bgError: any) {
          console.error('Background upload orchestration failed:', bgError);
        }
      })();
    } catch (error: any) {
      console.error('Local preview generation failed:', error);
      triggerToast('Gagal memproses gambar pada canvas.');
    }
  };

  const onFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleImageFile(file);
  };

  const getFileFromUserImage = async (): Promise<File | null> => {
    if (!userImage) return null;
    try {
      if (userImage.startsWith('data:')) {
        const arr = userImage.split(',');
        const mimeMatch = arr[0].match(/:(.*?);/);
        const mime = mimeMatch ? mimeMatch[1] : 'image/jpeg';
        const bstr = atob(arr[1]);
        let n = bstr.length;
        const u8arr = new Uint8Array(n);
        while (n--) {
          u8arr[n] = bstr.charCodeAt(n);
        }
        return new File([u8arr], 'user_image.jpg', { type: mime });
      } else {
        const res = await fetch(userImage);
        const blob = await res.blob();
        return new File([blob], 'user_image.jpg', { type: blob.type || 'image/jpeg' });
      }
    } catch (err) {
      console.error('Error converting user image to File:', err);
      return null;
    }
  };

  const handleSyncCurrentOriginal = async () => {
    if (!userImage) {
      triggerToast('Sayang, silakan pastikan ada gambar di kanvas sebelum melakukan sinkronisasi! 😘');
      return;
    }
    setIsSyncingOriginal(true);
    try {
      const file = await getFileFromUserImage();
      if (!file) {
        throw new Error('Gagal memuat berkas gambar dari kanvas');
      }

      let directUploadSuccess = false;
      let downloadUrl = '';

      try {
        // Try Appwrite Storage first
        const activeBucketId = BUCKET_ID;

        if (!activeBucketId) {
          throw new Error('VITE_APPWRITE_BUCKET_ID belum dikonfigurasi di panel Secrets sayang!');
        }
        const fileId = ID.unique();
        console.log(`[Appwrite Async Sync] Mencoba mengunggah ke target bucket: ${activeBucketId}`);
        const uploadResult = await storage.createFile(activeBucketId, fileId, file);
        directUploadSuccess = true;

        if (directUploadSuccess && uploadResult) {
          const usedBucketId = uploadResult.bucketId || activeBucketId;
          const viewUrlObj = storage.getFileView(usedBucketId, uploadResult.$id) as any;
          downloadUrl = typeof viewUrlObj === 'string' ? viewUrlObj : (viewUrlObj?.href || viewUrlObj?.toString() || '');
          
          if (uploadResult?.$id) {
            setLastAppwriteFileId(uploadResult.$id);
            localStorage.setItem('bt_last_appwrite_file_id', uploadResult.$id);
          }
        }
      } catch (storageErr: any) {
        console.warn('Manual Appwrite Storage sync failed. Falling back to Firestore...', storageErr);
      }

      if (directUploadSuccess && downloadUrl) {
        try {
          await addDoc(collection(db, 'ai_effect_originals'), {
            parentId: aiEffectImgId,
            src: downloadUrl,
            timestamp: serverTimestamp()
          });
          setUserImage(downloadUrl);
          triggerToast(`Foto asli berhasil di-sync ke Storage Bucket Appwrite pada ID: ${aiEffectImgId}! ☁️💖`);
        } catch (dbErr: any) {
          handleFirestoreError(dbErr, OperationType.CREATE, 'ai_effect_originals');
        }
      } else {
        // Dynamically compress with high visual quality (0.82) to fit perfectly under Firestore's 1MB limit
        const firestoreCompatibleSrc = await compressImage(file, 0.82, 1100);

        try {
          await addDoc(collection(db, 'ai_effect_originals'), {
            parentId: aiEffectImgId,
            src: firestoreCompatibleSrc,
            timestamp: serverTimestamp()
          });
          triggerToast(`Foto berhasil disinkronkan langsung ke Firestore Database pada ID: ${aiEffectImgId}! ☁️💎`);
        } catch (dbErr: any) {
          handleFirestoreError(dbErr, OperationType.CREATE, 'ai_effect_originals');
        }
      }
    } catch (err: any) {
      console.error('Sync original failed:', err);
      if (typeof err === 'object' && err?.message && err.message.startsWith('{')) {
        throw err;
      }
      triggerToast('Sinkronisasi gagal sayang, tapi drafmu tetap aman di memori lokal.');
    } finally {
      setIsSyncingOriginal(false);
    }
  };

  const handleSimulateVariant = async (simulatedStyle: string) => {
    if (!userImage) {
      triggerToast('Sayang, unggah foto dulu ya sebelum memicu variasi! 😘');
      return;
    }
    setIsAiEffectGenerating(true);
    try {
      let mockUrl = '';
      let styleName = 'Cyberpunk Neon Glow';
      if (simulatedStyle === 'futurist') {
        mockUrl = 'https://images.unsplash.com/photo-1545569341-9eb8b30979d9?auto=format&fit=crop&w=600&q=80';
        styleName = 'Future Sci-Fi Hologram';
      } else if (simulatedStyle === 'cyberpunk') {
        mockUrl = 'https://images.unsplash.com/photo-1508739773434-c26b3d09e071?auto=format&fit=crop&w=600&q=80';
        styleName = 'Neo Cyberpunk District';
      } else if (simulatedStyle === 'anime') {
        mockUrl = 'https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&w=600&q=80';
        styleName = 'Retro Aesthetic Anime';
      } else {
        mockUrl = 'https://images.unsplash.com/photo-1514565131-fce0801e5785?auto=format&fit=crop&w=600&q=80';
        styleName = 'Synthwave Sunset Neon';
      }

      try {
        await addDoc(collection(db, 'ai_effect_variants'), {
          parentId: aiEffectImgId,
          url: mockUrl,
          prompt: `Simulasi: ${styleName} (${aiEffectPrompt})`,
          timestamp: serverTimestamp()
        });
      } catch (dbErr: any) {
        handleFirestoreError(dbErr, OperationType.CREATE, 'ai_effect_variants');
      }
      
      triggerToast(`SISTEM: Berhasil mensimulasikan hasil ${styleName} dan mengikatnya ke ID ${aiEffectImgId}! 🌟`);
    } catch (err: any) {
      console.error('Simulation failed:', err);
      if (typeof err === 'object' && err?.message && err.message.startsWith('{')) {
        throw err;
      }
      triggerToast('Gagal memproses simulasi.');
    } finally {
      setIsAiEffectGenerating(false);
    }
  };

  const handleAiEffect = async () => {
    if (!userImage) {
      triggerToast('Sayang, silakan unggah foto terlebih dahulu sebelum menggunakan AI Effect! 😘');
      return;
    }

    setIsAiEffectGenerating(true);
    setAiEffectLogs([]); // reset logs

    const addLog = (msg: string) => {
      const time = new Date().toLocaleTimeString('id-ID', { hour12: false });
      setAiEffectLogs(prev => [...prev, `[${time}] ${msg}`]);
    };

    triggerToast('Memulai transformasi AI Effect siber di background... ⚡');

    try {
      addLog('🤖 SISTEM: Menginisialisasi Modul AI Effect Cybernetic...');
      await new Promise(resolve => setTimeout(resolve, 600));

      addLog('📸 SISTEM: Membaca berkas gambar utama dari kanvas...');
      const file = await getFileFromUserImage();
      if (!file) {
        throw new Error('Gagal memproses gambar utama dari memori, sayang.');
      }
      await new Promise(resolve => setTimeout(resolve, 600));

      let response;

      addLog('🔄 SISTEM: Mengonversi berkas citra siber menjadi format Base64 String...');
      
      const base64String = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = (err) => reject(err);
        reader.readAsDataURL(file);
      });

      const shortBase64 = base64String.substring(0, 36) + '...' + base64String.substring(base64String.length - 20);
      addLog(`📝 SISTEM: Base64 berhasil digenerasi (${shortBase64})`);
      await new Promise(resolve => setTimeout(resolve, 500));

      if (aiEffectSendFormat === 'base64') {
        const uploadUrl = getAiEffectUploadBase64Url();
        addLog(`🌐 SISTEM: Menyiapkan gerbang koneksi aman ke ${uploadUrl}...`);
        addLog(`📝 API: Prompt Aturan: "${aiEffectPrompt}"`);
        addLog('🚀 API: Mengirimkan payload JSON dengan format Base64 via Gerbang Pintar V2...');
        await new Promise(resolve => setTimeout(resolve, 600));

        response = await axios.post(uploadUrl, {
          base64_image: base64String,
          prompt: aiEffectPrompt,
          session_id: 'qcc-online'
        }, {
          headers: {
            'Content-Type': 'application/json',
          },
          timeout: 300000 // 5 menit
        });
      } else {
        const uploadUrl = getAiEffectUploadBinaryUrl();
        addLog(`📁 SISTEM: Berkas terdeteksi (${(file.size / 1024).toFixed(1)} KB) untuk pengiriman Multipart.`);
        await new Promise(resolve => setTimeout(resolve, 500));
        addLog(`🌐 SISTEM: Menyiapkan gerbang koneksi aman ke ${uploadUrl}...`);
        addLog(`📝 API: Prompt Aturan: "${aiEffectPrompt}"`);
        addLog('🚀 API: Mengirimkan berkas binary (Multipart File) via Gerbang Pintar V2...');
        await new Promise(resolve => setTimeout(resolve, 600));

        const formData = new FormData();
        formData.append('file', file);
        formData.append('prompt', aiEffectPrompt);
        formData.append('session_id', 'qcc-online');

        response = await axios.post(uploadUrl, formData, {
          timeout: 300000 // 5 menit
        });
      }

      addLog('📥 API: Menerima respons payload dari server nufat...');
      await new Promise(resolve => setTimeout(resolve, 600));

      console.log('AI Effect API Response:', response.data);
      const returnedData = response.data;
      let newImageUrl = '';

      if (typeof returnedData === 'string' && (returnedData.startsWith('http://') || returnedData.startsWith('https://'))) {
        newImageUrl = returnedData;
      } else if (returnedData) {
        newImageUrl = returnedData.url || returnedData.image || returnedData.image_url || returnedData.imageUrl || (returnedData.data && (returnedData.data.url || returnedData.data.image));
      }

      if (newImageUrl) {
        addLog('✨ SIBER: Menautkan citra siber futuristik baru ke lembar kerja...');
        setUserImage(newImageUrl);
        await new Promise(resolve => setTimeout(resolve, 500));
        
        addLog('💾 SISTEM: Otomatis mendaftarkan hasil variasi baru ke database Firestore...');
        try {
          await addDoc(collection(db, 'ai_effect_variants'), {
            parentId: aiEffectImgId,
            url: newImageUrl,
            prompt: aiEffectPrompt,
            timestamp: serverTimestamp()
          });
          addLog('✅ SISTEM: Hasil tercatat permanen di daftar variasi!');
        } catch (dbErr: any) {
          console.warn('Gagal mencatat varian ke Firestore:', dbErr);
          handleFirestoreError(dbErr, OperationType.CREATE, 'ai_effect_variants');
        }

        addLog('💖 OLIVE: Transformasi AI Effect berhasil sayang! Foto kamu sangat keren! 😍');
        triggerToast('SISTEM: AI Effect berhasil diterapkan dan masuk ke Galeri Varian! 💖✨');
      } else {
        console.warn('Could not parse image URL, response is:', returnedData);
        throw new Error('Gagal mengekstrak URL gambar hasil dari respons server.');
      }
    } catch (err: any) {
      console.error('AI Effect failed:', err);
      const isNetworkError = err?.message === 'Network Error' || !err?.response;
      if (isNetworkError) {
        addLog('❌ KENDALA: Terdeteksi Network Error / Masalah CORS dari Browser!');
        addLog('💡 TIPS OLIVE: Sayang, kendala ini biasanya disebabkan oleh kebijakan CORS browser di tab preview iFrame AI Studio.');
        addLog('💕 SOLUSI: Klik tombol "Buka di Tab Baru" (Open in New Tab) di pojok kanan atas agar browser mengizinkan transmisi lintas origin langsung, sayang! 😘');
        triggerToast('SISTEM: Gagal karena pembatasan CORS browser. Silakan klik Buka di Tab Baru sayang! 💕');
        
        // Let's fallback with simulated variation during error so user can still see the beautiful automated list flow working
        addLog('🔧 TINDAKAN DARURAT: Olive mengaktifkan Simulasi Kecerdasan Buatan lokal agar sayang tetap bisa mencoba fiturnya...');
        await handleSimulateVariant('cyberpunk');
      } else {
        addLog(`❌ ERROR: Gagal memproses data. Alasan: ${err.message || 'Respons server tidak dikenal'}`);
        triggerToast(`SISTEM: Gagal memproses AI Effect. ${err.message || 'Silakan coba lagi sayang.'}`);
      }
    } finally {
      setIsAiEffectGenerating(false);
    }
  };

  // Drag & drop triggers for files
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingFile(true);
  };

  const handleDragLeave = () => {
    setIsDraggingFile(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingFile(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleImageFile(file);
  };

  // Handle direct canvas pointer drag translation & multi-touch pinch zooming
  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!userImage) return;

    // Track active pointer info
    activePointersRef.current[e.pointerId] = { clientX: e.clientX, clientY: e.clientY };
    const pointerIds = Object.keys(activePointersRef.current);
    hasMovedOrScaledRef.current = false;

    if (pointerIds.length === 1) {
      if (!isPhotoLocked && !selectedStickerId) {
        setIsDraggingCanvas(true);
        dragStartRef.current = { x: e.clientX, y: e.clientY };
        startOffsetRef.current = { x: imageSettings.x, y: imageSettings.y };
      }
    } else if (pointerIds.length === 2) {
      if (selectedStickerId) {
        const activeSticker = stickers.find(s => s.id === selectedStickerId);
        if (activeSticker) {
          setIsDraggingCanvas(false);
          const p1 = activePointersRef.current[Number(pointerIds[0])];
          const p2 = activePointersRef.current[Number(pointerIds[1])];
          if (p1 && p2) {
            const distance = Math.hypot(p1.clientX - p2.clientX, p1.clientY - p2.clientY);
            initialPinchDistanceRef.current = distance;
            initialStickerPinchScaleRef.current = activeSticker.scale;
            initialStickerPinchRotationRef.current = activeSticker.rotation || 0;
            const angle = Math.atan2(p2.clientY - p1.clientY, p2.clientX - p1.clientX) * (180 / Math.PI);
            initialStickerPinchAngleRef.current = angle;
          }
        }
      } else if (!isPhotoLocked) {
        // Switch from drag state to dual pointer zoom state
        setIsDraggingCanvas(false);
        const p1 = activePointersRef.current[Number(pointerIds[0])];
        const p2 = activePointersRef.current[Number(pointerIds[1])];
        if (p1 && p2) {
          const distance = Math.hypot(p1.clientX - p2.clientX, p1.clientY - p2.clientY);
          initialPinchDistanceRef.current = distance;
          initialPinchScaleRef.current = imageSettings.scale;
        }
      }
    }

    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (activePointersRef.current[e.pointerId]) {
      activePointersRef.current[e.pointerId] = { clientX: e.clientX, clientY: e.clientY };
    }

    const pointerIds = Object.keys(activePointersRef.current);

    if (pointerIds.length === 1 && isDraggingCanvas) {
      const deltaX = e.clientX - dragStartRef.current.x;
      const deltaY = e.clientY - dragStartRef.current.y;
      
      // Scale movement to map container proportions (around 400px width typically)
      const factor = 4; // sensitivity
      const dragX = startOffsetRef.current.x + (deltaX / factor);
      const dragY = startOffsetRef.current.y + (deltaY / factor);

      // Limit translation bounds gracefully
      const boundedX = Math.max(-100, Math.min(100, Math.round(dragX)));
      const boundedY = Math.max(-100, Math.min(100, Math.round(dragY)));

      setImageSettings(prev => ({
        ...prev,
        x: boundedX,
        y: boundedY
      }));
      hasMovedOrScaledRef.current = true;
    } else if (pointerIds.length === 2 && initialPinchDistanceRef.current !== null) {
      const p1 = activePointersRef.current[Number(pointerIds[0])];
      const p2 = activePointersRef.current[Number(pointerIds[1])];
      if (p1 && p2) {
        const currentDistance = Math.hypot(p1.clientX - p2.clientX, p1.clientY - p2.clientY);
        if (initialPinchDistanceRef.current > 0) {
          const factor = currentDistance / initialPinchDistanceRef.current;
          
          if (selectedStickerId) {
            // Pinch-to-zoom and rotation on selected sticker
            const targetScale = Math.max(0.1, initialStickerPinchScaleRef.current * factor);
            
            // Calculate rotation change
            let targetRotation = initialStickerPinchRotationRef.current;
            if (initialStickerPinchAngleRef.current !== null) {
              const currentAngle = Math.atan2(p2.clientY - p1.clientY, p2.clientX - p1.clientX) * (180 / Math.PI);
              const angleDelta = currentAngle - initialStickerPinchAngleRef.current;
              targetRotation = (initialStickerPinchRotationRef.current + angleDelta) % 360;
              if (targetRotation < 0) targetRotation += 360;
            }

            handleUpdateSticker(selectedStickerId, {
              scale: parseFloat(targetScale.toFixed(2)),
              rotation: Math.round(targetRotation)
            });
            hasMovedOrScaledRef.current = true;
          } else if (!isPhotoLocked) {
            // Scale range boundary modified to allow unrestricted zooming
            const targetScale = Math.max(0.05, initialPinchScaleRef.current * factor);
            setImageSettings(prev => ({
              ...prev,
              scale: parseFloat(targetScale.toFixed(2))
            }));
            hasMovedOrScaledRef.current = true;
          }
        }
      }
    }
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    const wasDragging = isDraggingCanvas;
    const initialPointerCount = Object.keys(activePointersRef.current).length;

    delete activePointersRef.current[e.pointerId];
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch (err) {
      // Ignore fallback issues with capture release
    }

    const pointerIds = Object.keys(activePointersRef.current);
    if (pointerIds.length < 2) {
      initialPinchDistanceRef.current = null;
      initialStickerPinchAngleRef.current = null;
    }

    if (pointerIds.length === 0) {
      if (hasMovedOrScaledRef.current) {
        setIsGlitching(true);
        setTimeout(() => setIsGlitching(false), 300);
        hasMovedOrScaledRef.current = false;
      }
      setIsDraggingCanvas(false);

      // DESELECT: Jika ada stiker terpilih dan user melakukan single tap lepas di kanvas background kosong (tanpa pergerakan / drag)
      if (selectedStickerId && initialPointerCount === 1 && !wasDragging) {
        setSelectedStickerId(null);
        setIsHudOpen(false);
      }
    } else if (pointerIds.length === 1 && !isPhotoLocked) {
      // Re-initialize drag reference coordinates with the single remaining finger
      const remainingId = Number(pointerIds[0]);
      const pointer = activePointersRef.current[remainingId];
      if (pointer) {
        setIsDraggingCanvas(true);
        dragStartRef.current = { x: pointer.clientX, y: pointer.clientY };
        startOffsetRef.current = { x: imageSettings.x, y: imageSettings.y };
      }
    }
  };

  // Mouse move and hover coordinates mapping for 3D parallax
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!enableParallax || isDraggingCanvas || selectedStickerId) {
      return;
    }
    const rect = e.currentTarget.getBoundingClientRect();
    if (!rect.width || !rect.height) return;

    // Normalised coordinate mapping (-0.5 to 0.5) inside the element box
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;

    // Map intensity values scaled comfortable range
    setTilt({ x: x * 2, y: y * 2 });
  };

  const handleMouseLeave = () => {
    if (!enableParallax) return;
    setTilt({ x: 0, y: 0 });
  };

  // Preset filter application
  const handleSelectFilterPreset = (id: string, presetSettings: Partial<ImageSettings>) => {
    setFilterPresetId(id);
    setImageSettings(prev => ({
      ...prev,
      ...DEFAULT_SETTINGS, // start fresh
      ...presetSettings,   // merge preset over defaults
      scale: prev.scale,   // keep the user scale/translations untouched
      x: prev.x,
      y: prev.y,
      rotation: prev.rotation,
      flipH: prev.flipH,
      flipV: prev.flipV,
    }));
    triggerToast(`Filter "${FILTER_PRESETS.find(f => f.id === id)?.name}" aktif`);
  };

  // Sticker adjustments
  const handleAddSticker = (sticker: PlacedSticker) => {
    setStickers(prev => [...prev, sticker]);
    setSelectedStickerId(sticker.id);
    
    // Auto close tab and select text for immediate canvas interaction
    if (sticker.type === 'text') {
      setActiveTab(null);
      triggerToast('Teks berhasil ditambahkan! Silahkan geser atau atur di kanvas 🎨');
    } else {
      triggerToast('Badge berhasil mendarat di kanvas! 🚀');
    }
  };

  const handleUpdateSticker = (id: string, updated: Partial<PlacedSticker>) => {
    setStickers(prev => prev.map(s => s.id === id ? { ...s, ...updated } : s));
  };

  const handleDeleteSticker = (id: string) => {
    setStickers(prev => prev.filter(s => s.id !== id));
    if (selectedStickerId === id) {
      setSelectedStickerId(null);
    }
    triggerToast('Overlay dihapus');
  };

  const handleBringToFront = (id: string) => {
    setStickers(prev => {
      const idx = prev.findIndex(s => s.id === id);
      if (idx === -1 || idx === prev.length - 1) return prev;
      const arr = [...prev];
      const [item] = arr.splice(idx, 1);
      arr.push(item);
      return arr;
    });
    triggerToast('Layer dipindahkan ke depan 🔝');
  };

  const handleSendToBack = (id: string) => {
    setStickers(prev => {
      const idx = prev.findIndex(s => s.id === id);
      if (idx === -1 || idx === 0) return prev;
      const arr = [...prev];
      const [item] = arr.splice(idx, 1);
      arr.unshift(item);
      return arr;
    });
    triggerToast('Layer dipindahkan ke belakang ⬇️');
  };

  const handleMoveUp = (id: string) => {
    setStickers(prev => {
      const idx = prev.findIndex(s => s.id === id);
      if (idx === -1 || idx === prev.length - 1) return prev;
      const arr = [...prev];
      const temp = arr[idx];
      arr[idx] = arr[idx + 1];
      arr[idx + 1] = temp;
      return arr;
    });
  };

  const handleMoveDown = (id: string) => {
    setStickers(prev => {
      const idx = prev.findIndex(s => s.id === id);
      if (idx === -1 || idx === 0) return prev;
      const arr = [...prev];
      const temp = arr[idx];
      arr[idx] = arr[idx - 1];
      arr[idx - 1] = temp;
      return arr;
    });
  };

  // Custom Frame state persisting
  const handleAddCustomFrame = (newFrame: Frame) => {
    const updated = [newFrame, ...customFrames];
    setCustomFrames(updated);
    localStorage.setItem('bt_custom_frames', JSON.stringify(updated));
    triggerToast('Bingkai kustom terpasang!');
  };

  const handleDeleteCustomFrame = (id: string) => {
    const updated = customFrames.filter(f => f.id !== id);
    setCustomFrames(updated);
    localStorage.setItem('bt_custom_frames', JSON.stringify(updated));
    triggerToast('Bingkai kustom dihapus');
    if (selectedFrame?.id === id) {
      setSelectedFrame(null);
    }
  };

  // AI Generation actions using Google Gemini API or Webspy Nufat API on server proxy
  const handleGenerateAIImage = async () => {
    if (!aiPrompt.trim()) {
      setAiError('Silakan masukkan deskripsi atau prompt terlebih dahulu.');
      return;
    }
    setIsGeneratingAI(true);
    setAiError(null);
    try {
      if (aiEngine === 'nufat') {
        const directUrl = `https://webspy.nufat.id/api/img?prompt=${encodeURIComponent(aiPrompt)}`;
        setUserImage(directUrl);
        triggerToast(`SISTEM: Avatar AI Webspy Nufat berhasil dipasang! 🎨✨`);
        setAiPrompt('');
      } else {
        const response = await fetch(resolveApiUrl('/api/ai/image'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ prompt: aiPrompt, engine: aiEngine }),
        });
        const data = await response.json();
        if (!response.ok || data.error) {
          throw new Error(data.error || 'Gagal menghasilkan gambar');
        }
        setUserImage(data.image);
        triggerToast(`SISTEM: Avatar AI (${aiEngine === 'nufat' ? 'Webspy Nufat' : 'Gemini 3.5'}) berhasil dipasang! 🎨✨`);
        setAiPrompt('');
      }
    } catch (err: any) {
      console.warn("Server AI Image generation failed, falling back to direct Webspy API...", err);
      const directUrl = `https://webspy.nufat.id/api/img?prompt=${encodeURIComponent(aiPrompt)}`;
      setUserImage(directUrl);
      triggerToast(`SISTEM: Avatar AI berhasil dipasang menggunakan cadangan Webspy! 🎨💖`);
      setAiPrompt('');
    } finally {
      setIsGeneratingAI(false);
    }
  };

  const handleGenerateAIFrame = async () => {
    if (!aiPrompt.trim()) {
      setAiError('Silakan masukkan rincian bingkai impian Anda.');
      return;
    }
    setIsGeneratingAI(true);
    setAiError(null);
    try {
      const response = await fetch(resolveApiUrl('/api/ai/frame'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: aiPrompt }),
      });
      const data = await response.json();
      if (!response.ok || data.error) {
        throw new Error(data.error || 'Gagal mendesain bingkai');
      }
      
      const newAiFrame: Frame = {
        id: `ai-frame-${Date.now()}`,
        name: data.name,
        src: '',
        type: 'procedural',
        category: 'Pelanggan',
        description: `Desain AI: ${aiPrompt}`,
        svgElements: data.svgElements,
        renderSvg: (color: string) => {
          const rendered = data.svgElements
            .replace(/HIGHLIGHT_COLOR/g, color)
            .replace(/currentColor/g, color);
          return `
            <g>
              <defs>
                <filter id="cyber-glow-ai-${Date.now()}" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="4" result="blur" />
                  <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>
              ${rendered}
            </g>
          `;
        }
      };

      setCustomFrames(prev => {
        const updated = [newAiFrame, ...prev];
        localStorage.setItem('bt_custom_frames', JSON.stringify(updated));
        return updated;
      });
      setSelectedFrame(newAiFrame);
      if (data.neonColor) {
        setNeonColor(data.neonColor);
      }
      triggerToast('SISTEM: Bingkai AI impian berhasil dirancang & diaktifkan!');
      setAiPrompt('');
    } catch (err: any) {
      console.warn("Server AI Frame generator failed, initiating Olive's backup procedural generator...", err);
      
      // Zero-dependency pure frontend high-tech geometric frame generator
      const generatedName = `Cyber: ${aiPrompt.substring(0, 15)}`;
      const randomColor = ['#00f2fe', '#39ff14', '#f35588', '#9d4edd'][Math.floor(Math.random() * 4)];
      
      const isCircle = aiPrompt.toLowerCase().includes('bulat') || aiPrompt.toLowerCase().includes('circle') || aiPrompt.toLowerCase().includes('lingkaran');
      const isHex = aiPrompt.toLowerCase().includes('hex') || aiPrompt.toLowerCase().includes('segi') || aiPrompt.toLowerCase().includes('poligon');
      
      let elements = '';
      if (isCircle) {
        elements = `
          <circle cx="250" cy="250" r="190" stroke="HIGHLIGHT_COLOR" stroke-width="2" fill="none" opacity="0.4" />
          <circle cx="250" cy="250" r="185" stroke="HIGHLIGHT_COLOR" stroke-width="4" fill="none" stroke-dasharray="15 8" filter="url(#cyber-glow-ai)" />
          <circle cx="250" cy="250" r="220" stroke="HIGHLIGHT_COLOR" stroke-width="1.5" fill="none" stroke-dasharray="3 6" opacity="0.6" />
          <path d="M 250 20 L 250 40 M 250 460 L 250 480 M 20 250 L 40 250 M 460 250 L 480 250" stroke="HIGHLIGHT_COLOR" stroke-width="3" />
        `;
      } else if (isHex) {
        elements = `
          <polygon points="250,30 440,140 440,360 250,470 60,360 60,140" stroke="HIGHLIGHT_COLOR" stroke-width="3" fill="none" filter="url(#cyber-glow-ai)" />
          <polygon points="250,45 425,147 425,353 250,455 75,353 75,147" stroke="HIGHLIGHT_COLOR" stroke-width="1" fill="none" stroke-dasharray="8 4" opacity="0.5" />
          <line x1="10" y1="10" x2="10" y2="40" stroke="HIGHLIGHT_COLOR" stroke-width="3" />
          <line x1="10" y1="10" x2="40" y2="10" stroke="HIGHLIGHT_COLOR" stroke-width="3" />
          <line x1="490" y1="490" x2="490" y2="460" stroke="HIGHLIGHT_COLOR" stroke-width="3" />
          <line x1="490" y1="490" x2="460" y2="490" stroke="HIGHLIGHT_COLOR" stroke-width="3" />
        `;
      } else {
        // Standard cyber frame
        elements = `
          <rect x="35" y="35" width="430" height="430" rx="20" stroke="HIGHLIGHT_COLOR" stroke-width="3" fill="none" filter="url(#cyber-glow-ai)" />
          <rect x="45" y="45" width="410" height="410" rx="15" stroke="HIGHLIGHT_COLOR" stroke-width="1" fill="none" stroke-dasharray="10 5" opacity="0.6" />
          <path d="M 30 70 L 30 35 L 70 35 M 430 35 L 470 35 L 470 70 M 470 430 L 470 470 L 430 470 M 70 470 L 30 470 L 30 430" stroke="HIGHLIGHT_COLOR" stroke-width="4" fill="none" />
          <circle cx="65" cy="65" r="4" fill="HIGHLIGHT_COLOR" />
          <circle cx="435" cy="65" r="4" fill="HIGHLIGHT_COLOR" />
          <circle cx="435" cy="435" r="4" fill="HIGHLIGHT_COLOR" />
          <circle cx="65" cy="435" r="4" fill="HIGHLIGHT_COLOR" />
        `;
      }

      const backupFrame: Frame = {
        id: `ai-frame-${Date.now()}`,
        name: generatedName,
        src: '',
        type: 'procedural',
        category: 'Pelanggan',
        description: `Desain AI (Lokal): ${aiPrompt}`,
        svgElements: elements,
        renderSvg: (color: string) => {
          const rendered = elements
            .replace(/HIGHLIGHT_COLOR/g, color)
            .replace(/currentColor/g, color);
          return `
            <g>
              <defs>
                <filter id="cyber-glow-ai" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="4" result="blur" />
                  <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>
              ${rendered}
            </g>
          `;
        }
      };

      setCustomFrames(prev => {
        const updated = [backupFrame, ...prev];
        localStorage.setItem('bt_custom_frames', JSON.stringify(updated));
        return updated;
      });
      setSelectedFrame(backupFrame);
      setNeonColor(randomColor);
      triggerToast('SISTEM: Bingkai berhasil dibuat puitis secara lokal! 💖✨');
      setAiPrompt('');
    } finally {
      setIsGeneratingAI(false);
    }
  };

  const handleGenerateAISlogans = async () => {
    if (!aiPrompt.trim()) {
      setAiError('Silakan masukkan topik & kata kunci untuk diproses AI.');
      return;
    }
    setIsGeneratingSlogans(true);
    setAiError(null);
    setAiSlogans([]);
    try {
      const response = await fetch(resolveApiUrl('/api/ai/slogans'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: aiPrompt }),
      });
      const data = await response.json();
      if (!response.ok || data.error) {
        throw new Error(data.error || 'Gagal menghasilkan slogan');
      }
      setAiSlogans(data.slogans || []);
      triggerToast('SISTEM: 3 Slogan futuristik berhasil diciptakan!');
    } catch (err: any) {
      console.warn("Server AI Slogan failed, generating sweet backup slogans locally...", err);
      const cleanPrompt = aiPrompt.toUpperCase().trim();
      const backupSlogans = [
        `NEON LEGACY: ${cleanPrompt}`,
        `BEYOND THE FUTURES OF ${cleanPrompt}`,
        `${cleanPrompt} // PROTOCOLS INITIALIZED`
      ];
      setAiSlogans(backupSlogans);
      triggerToast('SISTEM: Slogan puitis dirancang langsung oleh Olive! 💖');
    } finally {
      setIsGeneratingSlogans(false);
    }
  };

  const applyAISlogan = (sloganText: string, color: string, font: string) => {
    const newText: PlacedSticker = {
      id: `placed-text-ai-${Date.now()}`,
      type: 'text',
      text: sloganText.toUpperCase(),
      fontFamily: font,
      x: 50,
      y: 80,
      scale: 1,
      rotation: 0,
      color: color
    };
    setStickers(prev => [...prev, newText]);
    setSelectedStickerId(newText.id);
    setActiveTab('text'); // automatically switch to text overlay controls!
    triggerToast('SISTEM: Slogan AI dipasang di canvas! ✍️');
  };

  // Download high-resolution combined compilation
  const handleDownloadHD = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    setIsLoading(true);
    setStatusMessage('MENGEKSPOR HD...');
    setHdExportProgress(0);
    setHdExportStatus('Menginisialisasi kompilator render HD...');
    triggerToast('Memulai rendering kualitas tinggi...', 2000);

    const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

    try {
      await sleep(350);
      setHdExportProgress(15);
      setHdExportStatus('Memetakan koordinat elemen dan stiker...');

      // Formulate pathsMap for SVG rendering
      const pathsMap: Record<string, string> = {};
      PRESET_STICKERS.forEach((st) => {
        pathsMap[st.id] = st.svgPath || '';
      });

      await sleep(350);
      setHdExportProgress(35);
      setHdExportStatus('Mengunduh & memuat aset grafis resolusi HD...');

      await sleep(350);
      setHdExportProgress(60);
      setHdExportStatus(`Merender canvas utama (${downloadSize}x${downloadSize}px)...`);

      // 1. Force render specifically for download with exact properties and stickers included
      await renderToCanvas(canvas, {
        userImageSrc: userImage,
        frame: selectedFrame,
        neonColor,
        settings: imageSettingsRef.current,
        stickers,
        presetStickerSvgPaths: pathsMap,
        size: downloadSize,
        isDownloading: true // Include stickers
      });

      await sleep(350);
      setHdExportProgress(80);
      setHdExportStatus('Menyusun representasi piksel dan format gambar...');

      const link = document.createElement('a');
      const ext = downloadFormat;
      const mimeType = ext === 'png' ? 'image/png' : ext === 'webp' ? 'image/webp' : 'image/jpeg';
      
      const fileName = `Avatar-Bingkai-Futuristik-${Date.now()}.${ext}`;
      link.download = fileName;
      const dataUrl = canvas.toDataURL(mimeType, mimeType === 'image/png' ? undefined : 0.95);
      link.href = dataUrl;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      await sleep(250);
      setHdExportProgress(90);
      setHdExportStatus('Mengkompresi data thumbnail untuk sinkronisasi galeri cloud...');

      // Compress and prepare compact base64 representation for Firebase Firestore storage
      let firebaseBase64 = dataUrl;
      try {
        const scale = Math.min(1, 800 / canvas.width);
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = canvas.width * scale;
        tempCanvas.height = canvas.height * scale;
        const tempCtx = tempCanvas.getContext('2d');
        if (tempCtx) {
          tempCtx.drawImage(canvas, 0, 0, tempCanvas.width, tempCanvas.height);
          firebaseBase64 = tempCanvas.toDataURL('image/jpeg', 0.85);
        }
      } catch (compressErr) {
        console.warn('Gagal kompresi thumbnail Firebase, menggunakan data asli:', compressErr);
      }

      await sleep(200);
      setHdExportProgress(95);
      setHdExportStatus('Menyinkronkan data koleksi Anda di Firebase...');

      // Auto save to cloud gallery using optimized small image representation
      saveToGallery(firebaseBase64);

      // 2. Restore preview render (hide duplicate stickers on canvas to avoid HTML overlap)
      await renderToCanvas(canvas, {
        userImageSrc: userImage,
        frame: selectedFrame,
        neonColor,
        settings: imageSettingsRef.current,
        stickers,
        presetStickerSvgPaths: pathsMap,
        size: downloadSize,
        isDownloading: false // Exclude stickers from canvas preview
      });

      await sleep(250);
      setHdExportProgress(100);
      setHdExportStatus('Proses rendering selesai sempurna!');
      await sleep(250);

      setIsLoading(false);
      setHdExportProgress(null);
      setStatusMessage('SUKSES DIUNDUH');
      triggerToast(`Avatar ${ext.toUpperCase()} berhasil diunduh! Tersimpan juga di Album. 🎉`);

      // Upload download event data to Firebase Firestore
      const downloadId = `dl_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      
      try {
        const downloadPayload: any = {
          id: downloadId,
          fileName: fileName,
          imageUrl: firebaseBase64,
          format: ext,
          size: downloadSize,
          downloadedAt: serverTimestamp()
        };

        if (user) {
          downloadPayload.userId = user.uid;
          downloadPayload.userName = user.displayName || 'Pengguna';
          downloadPayload.userEmail = user.email || '';
          downloadPayload.userAvatar = user.photoURL || '';
        }

        await setDoc(doc(db, 'downloads', downloadId), downloadPayload);
        console.log(`[Firebase] Berhasil menyimpan berkas cadangan download dengan ID: ${downloadId}`);
        
        // Invalidate Firestore queries cache
        if (user) {
          localStorage.removeItem(`bt_my_gallery_${user.uid}`);
          localStorage.removeItem(`bt_my_gallery_time_${user.uid}`);
          localStorage.removeItem(`bt_cloud_downloads_all_${user.uid}`);
          localStorage.removeItem(`bt_cloud_downloads_time_all_${user.uid}`);
          localStorage.removeItem(`bt_cloud_downloads_mine_${user.uid}`);
          localStorage.removeItem(`bt_cloud_downloads_time_mine_${user.uid}`);
          localStorage.removeItem(`bt_cloud_downloads_others_${user.uid}`);
          localStorage.removeItem(`bt_cloud_downloads_time_others_${user.uid}`);
        }
        localStorage.removeItem(`bt_cloud_downloads_all_guest`);
        localStorage.removeItem(`bt_cloud_downloads_time_all_guest`);

        triggerToast(`Avatar ${ext.toUpperCase()} berhasil dicadangkan di Cloud Database! ☁️✨`);
      } catch (dbErr) {
        console.error('[Firebase Error] Gagal menyimpan ke Firestore:', dbErr);
        try {
          handleFirestoreError(dbErr, OperationType.CREATE, `downloads/${downloadId}`);
        } catch (formattedErr) {
          // Log formatted error object for backend tracking
        }
      }
    } catch (err) {
      console.error(err);
      setIsLoading(false);
      setHdExportProgress(null);
      setStatusMessage('GAGAL EKSPOR');
      alert('Gagal mendownload karena masalah keamanan CORS server internal. Silahkan ganti ke frame model "FUTURISTIK" kami yang beresolusi super tajam tanpa CORS!');
    }
  };

  // Toast Notification triggers
  const triggerToast = (text: string, duration = 3000) => {
    setToastText(text);
    setShowToast(true);
    setTimeout(() => {
      setShowToast(false);
    }, duration);
  };

  const dateNow = new Date().toISOString().substring(0, 10);
  
  // Quest validation calculations
  const quest1Completed = userImage !== null && userImage !== DEFAULT_IMAGE;
  const quest2Completed = selectedFrame !== null;
  const quest3Completed = filterPresetId !== 'none';
  const quest4Completed = imageSettings.maskShape !== 'square';
  const quest5Completed = imageSettings.scanlines === true;
  const quest6Completed = stickers !== null && stickers.some(s => s.type === 'text');

  const totalQuests = 6;
  const completedCount = 
    (quest1Completed ? 1 : 0) + 
    (quest2Completed ? 1 : 0) + 
    (quest3Completed ? 1 : 0) + 
    (quest4Completed ? 1 : 0) + 
    (quest5Completed ? 1 : 0) + 
    (quest6Completed ? 1 : 0);

  const questPercent = Math.round((completedCount / totalQuests) * 100);

  // Combine hover tilt and page scroll tilt for 3D parallax
  const combinedTiltX = enableParallax ? (tilt.x + scrollTilt.x * 0.4) : 0;
  const combinedTiltY = enableParallax ? (tilt.y + scrollTilt.y * 1.2) : 0;

  return (
    <div className={`flex flex-col min-h-screen font-sans antialiased transition-colors duration-300 ${
      theme === 'dark' ? 'bg-[#050505] text-[#E0E0E0] theme-dark' : 'bg-[#FAFAFB] text-zinc-800 theme-light'
    }`}>
      {/* Header component */}
      <BungteminHeader 
        currentPage={currentPage} 
        onNavigate={setCurrentPage} 
        theme={theme} 
        onToggleTheme={toggleTheme} 
        user={user}
        isAuthLoading={isAuthLoading}
        onGoogleLogin={handleGoogleLogin}
        onLogout={handleLogout}
        completedQuests={user?.email === 'bungtemin@gmail.com' ? completedCount : undefined}
        totalQuests={user?.email === 'bungtemin@gmail.com' ? totalQuests : undefined}
      />

      {/* Main Workspace Layout */}
      {currentPage === 'beranda' && (
        <main ref={workspaceRef} className="flex-1 max-w-2xl w-full mx-auto p-4 sm:p-6 pb-28 flex flex-col space-y-4">
          
          <div className="bg-transparent lg:bg-[#0b0b0b] lg:rounded-xl p-0 lg:p-5 border-0 lg:border lg:border-white/10 shadow-none lg:shadow-[0_4px_30px_rgba(0,0,0,0.5)] relative overflow-hidden flex flex-col">

            {/* MOBILE QUICK CONTROLLER - Focus Slider above Main Canvas (hidden when activeTab is active to let the canvas push up) */}
            {!activeTab && (
              <div className="lg:hidden mb-4 space-y-3 w-full animate-fadeIn">
                {/* Horizontal Frame Selection Carousel (Slider Bingkai) */}
                <div className="flex gap-2.5 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent w-full">
                  {displayFrames.map((frame) => {
                    const isSelected = frame.id === selectedFrame?.id;
                    return (
                      <button
                        key={frame.id}
                        onClick={() => {
                          setSelectedFrame(frame);
                          // triggerToast(`Bingkai "${frame.name}" dipilih`);
                        }}
                        className={`flex-none w-[56px] h-[56px] p-1 rounded transition-all duration-200 relative overflow-hidden flex items-center justify-center border ${
                          isSelected 
                            ? 'border-neon-cyan bg-cyan-950/25 shadow-[0_0_12px_rgba(0,240,255,0.25)] scale-102 z-10' 
                            : 'border-white/10 hover:border-white/15 bg-black/50'
                        }`}
                        title={frame.name}
                      >
                        <div className="relative w-full h-full flex items-center justify-center overflow-hidden">
                          {frame.renderSvg ? (
                            <div 
                              className="w-[42px] h-[42px] p-0.5 scale-90"
                              dangerouslySetInnerHTML={{ __html: ensureFullSvg(frame.renderSvg(neonColor)) }}
                            />
                          ) : frame.src ? (
                            <img 
                              src={resolveApiUrl(frame.src)} 
                              alt={frame.name}
                              className="w-full h-full object-contain pointer-events-none"
                            />
                          ) : null}
                        </div>
                        
                        {/* Active cyan light dot in corner for clean, labeled visual selection */}
                        {isSelected && (
                          <div className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-neon-cyan shadow-[0_0_6px_#00F0FF]" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Interactive Drag & Drop Area Box containing Canvas */}
            <div 
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerCancel={handlePointerUp}
              onMouseMove={handleMouseMove}
              onMouseLeave={handleMouseLeave}
              style={{
                transform: `perspective(1000px) rotateX(${combinedTiltY * -10}deg) rotateY(${combinedTiltX * 10}deg)`,
                transformStyle: 'preserve-3d',
                transition: (isDraggingCanvas || selectedStickerId) ? 'none' : 'transform 0.18s cubic-bezier(0.25, 0.8, 0.25, 1)',
                containerType: 'inline-size'
              }}
              className={`relative aspect-square w-full rounded lg:rounded-xl bg-[#09090b] overflow-hidden border transition-all duration-300 group cursor-move select-none touch-none ${
                isDraggingFile 
                  ? 'border-neon-cyan bg-cyan-950/20 scale-[0.99]' 
                  : isDraggingCanvas
                    ? 'border-neon-pink'
                    : 'border-white/10 hover:border-white/15'
              }`}
            >
              {/* Radial Grid Pattern inside Canvas viewport for editorial look */}
              <div 
                className="radial-grid-bg absolute inset-0 z-0 pointer-events-none opacity-40 bg-black/60" 
                style={{ transform: 'translateZ(-30px) scale(1.18)', transformStyle: 'preserve-3d' }}
              />

              {/* Scanlines overlays */}
              <div 
                className="scanlines absolute inset-0 z-10 pointer-events-none opacity-20" 
                style={{ transform: 'translateZ(5px)', transformStyle: 'preserve-3d' }}
              />

              {/* Real HD Drawing Canvas */}
              <canvas 
                ref={canvasRef} 
                className={`w-full h-full aspect-square object-cover pointer-events-none relative z-10 ${isGlitching ? 'glitch-active' : ''}`} 
                style={{ transform: 'translateZ(0px)', transformStyle: 'preserve-3d' }}
              />

              {/* Absolute interactive sticker & text overlays on screen */}
              {stickers.map((item) => {
                const isSelected = item.id === selectedStickerId;
                // Base size for preview overlay on screen (normalized multiplier as percentage of container width)
                const baseSizePercentage = item.scale * 15;
                
                return (
                  <div
                    key={item.id}
                    onPointerDown={(pointerDownEvent) => {
                      pointerDownEvent.stopPropagation();
                      if (item.isLocked) return;
                      setSelectedStickerId(item.id);

                      const currentItemX = item.x;
                      const currentItemY = item.y;
                      const startClientX = pointerDownEvent.clientX;
                      const startClientY = pointerDownEvent.clientY;
                      
                      const parentElement = pointerDownEvent.currentTarget.parentElement;
                      if (!parentElement) return;
                      const parentRect = parentElement.getBoundingClientRect();
                      const parentWidth = parentRect.width || 400;
                      const parentHeight = parentRect.height || 400;

                      let hasMoved = false;

                      const onMove = (moveEvent: PointerEvent) => {
                        hasMoved = true;
                        const deltaX = moveEvent.clientX - startClientX;
                        const deltaY = moveEvent.clientY - startClientY;
                        
                        // Scale delta so movement sensitivity is comfortable
                        const newXPercent = Math.max(0, Math.min(100, currentItemX + (deltaX / parentWidth) * 100));
                        const newYPercent = Math.max(0, Math.min(100, currentItemY + (deltaY / parentHeight) * 100));
                        
                        handleUpdateSticker(item.id, { 
                          x: parseFloat(newXPercent.toFixed(1)), 
                          y: parseFloat(newYPercent.toFixed(1)) 
                        });
                      };

                      const onUp = () => {
                        window.removeEventListener('pointermove', onMove);
                        window.removeEventListener('pointerup', onUp);
                        if (hasMoved) {
                          setIsGlitching(true);
                          setTimeout(() => setIsGlitching(false), 200);
                        }
                      };

                      window.addEventListener('pointermove', onMove);
                      window.addEventListener('pointerup', onUp);
                    }}
                    style={{
                      left: `${item.x}%`,
                      top: `${item.y}%`,
                      transform: `translate(-50%, -50%) rotate(${item.rotation}deg) translateZ(${isSelected ? '45px' : '30px'})`,
                      cursor: 'grab',
                      transformStyle: 'preserve-3d',
                    }}
                    className={`absolute z-30 select-none pointer-events-auto p-2 rounded transition-all duration-150 ${
                      isSelected 
                        ? 'border border-dashed border-neon-cyan bg-black/60 shadow-[0_0_12px_rgba(0,240,255,0.25)]' 
                        : 'border border-transparent hover:border-white/10 hover:bg-black/30'
                    }`}
                  >
                    {item.type === 'text' ? (
                      <span
                        style={{
                          fontFamily: item.fontFamily || 'Orbitron',
                          fontSize: `${baseSizePercentage}cqw`,
                          letterSpacing: item.letterSpacing ? `${item.letterSpacing}px` : 'normal',
                          mixBlendMode: item.blendMode || 'normal',
                          ...(item.textStyle === 'neon' 
                              ? {
                                  color: '#fff',
                                  textShadow: `0 0 5px #fff, 0 0 10px #fff, 0 0 20px ${item.color || neonColor}, 0 0 40px ${item.color || neonColor}`
                                }
                              : item.textStyle === 'chrome'
                              ? {
                                  background: 'linear-gradient(to bottom, #dbe2ea 0%, #879ab6 50%, #46566d 51%, #1f2735 100%)',
                                  WebkitBackgroundClip: 'text',
                                  WebkitTextFillColor: 'transparent',
                                  WebkitTextStroke: '1px #fff',
                                  filter: 'drop-shadow(0px 2px 2px rgba(0,0,0,0.8))'
                                }
                              : item.textStyle === 'glitch'
                              ? {
                                  color: '#fff',
                                  textShadow: '2px 0 #0ff, -2px 0 #f0f'
                                }
                              : item.textStyle === 'hologram'
                              ? {
                                  background: 'linear-gradient(to bottom, rgba(0,255,255,0.9), rgba(255,0,255,0.8), rgba(0,255,255,0.9))',
                                  WebkitBackgroundClip: 'text',
                                  WebkitTextFillColor: 'transparent',
                                  WebkitTextStroke: '1px rgba(255,255,255,0.8)',
                                  filter: 'drop-shadow(0px 0px 5px #0ff)'
                                }
                              : item.textStyle === '3d'
                              ? {
                                  color: '#fff',
                                  textShadow: `1.5px 1.5px 0 ${item.color || neonColor}, 3px 3px 0 ${item.color || neonColor}, 4.5px 4.5px 0 ${item.color || neonColor}, 6px 6px 0 ${item.color || neonColor}, 7.5px 7.5px 0 #000`,
                                  WebkitTextStroke: '1px #000',
                                }
                              : item.textStyle === 'double-neon'
                              ? {
                                  color: '#fff',
                                  textShadow: `-3px -3px 15px #00f2fe, 3px 3px 15px #f35588, 0 0 5px ${item.color || neonColor}`,
                                  WebkitTextStroke: `1px ${item.color || neonColor}`
                                }
                              : item.textStyle === 'curved'
                              ? {
                                  color: '#fff',
                                  textShadow: `0 0 8px ${item.color || neonColor}`,
                                  WebkitTextStroke: `1px #000`,
                                  borderBottom: `2px dashed ${item.color || neonColor}`,
                                  borderRadius: '50% 50% 0 0'
                                }
                              : {
                                  color: '#fff',
                                  textShadow: `0 0 8px ${item.color || neonColor}`,
                                  borderBottom: `2px solid ${item.color || neonColor}`
                                }
                          )
                        }}
                        className="font-extrabold whitespace-nowrap block select-none uppercase tracking-wide leading-none"
                      >
                        {item.text}
                      </span>
                    ) : item.imageUrl ? (
                      <img
                        src={item.imageUrl}
                        alt="Stiker Kustom"
                        referrerPolicy="no-referrer"
                        style={{ 
                          width: `${baseSizePercentage * 1.5}cqw`, 
                          height: `${baseSizePercentage * 1.5}cqw`,
                          opacity: item.opacity !== undefined ? item.opacity : 1,
                          transform: `scaleX(${item.flipH ? -1 : 1}) scaleY(${item.flipV ? -1 : 1})`,
                          mixBlendMode: item.blendMode || 'normal'
                        }}
                        className="object-contain drop-shadow-[0_0_8px_rgba(0,240,255,0.4)] block select-none pointer-events-none"
                      />
                    ) : (
                      <svg 
                        style={{ 
                          width: `${baseSizePercentage * 1.5}cqw`, 
                          height: `${baseSizePercentage * 1.5}cqw`,
                          mixBlendMode: item.blendMode || 'normal'
                        }}
                        viewBox="0 0 100 100" 
                        fill="none" 
                        stroke={item.color || neonColor} 
                        strokeWidth="6"
                        className="drop-shadow-[0_0_4px_rgba(0,240,255,0.5)]"
                      >
                        <path d={PRESET_STICKERS.find(ps => ps.id === item.stickerId)?.svgPath || ''} />
                      </svg>
                    )}

                    {/* Active Controls Indicator Overlay box */}
                    {isSelected && (
                      <>
                        {/* Title Tag with Move / Geser indicator */}
                        <div className="absolute -top-7 left-1/2 -translate-x-1/2 bg-[#00F0FF] text-black text-[9px] font-mono font-black px-2 py-0.5 rounded-full uppercase tracking-wider whitespace-nowrap pointer-events-none shadow-[0_0_12px_rgba(0,240,255,0.65)] flex items-center gap-1">
                          <Move className="w-2.5 h-2.5 animate-pulse" />
                          <span>{item.type === 'text' ? 'TEKS' : 'DECOR'}</span>
                          <span className="text-[7px] opacity-75 font-normal">(GESER)</span>
                        </div>

                        {/* Menu/Settings link to display/highlight HUD overlay */}
                        <div 
                          className="absolute -top-3 -left-3 w-6 h-6 bg-cyan-600 hover:bg-cyan-500 text-white rounded-full cursor-pointer flex items-center justify-center border border-white shadow-[0_0_10px_rgba(0,240,255,0.5)] z-50 hover:scale-115 active:scale-90 transition-transform"
                          title="Tampilkan Panel Menu SUNTING"
                          onPointerDown={(e) => {
                            e.stopPropagation();
                            setIsHudOpen(true);
                            triggerToast("Menu Pengeditan Terbuka! ⚙️");
                          }}
                        >
                          {item.type === 'text' ? <Edit2 className="w-3 h-3 text-white" /> : <Settings2 className="w-3 h-3 text-white" />}
                        </div>
                        
                        {/* Size / scale handle */}
                        <div 
                          className="absolute -bottom-3 -right-3 w-6 h-6 bg-pink-600 hover:bg-pink-500 text-white rounded-full cursor-se-resize flex items-center justify-center border border-white shadow-[0_0_10px_rgba(236,72,153,0.5)] z-50 hover:scale-115 active:scale-90 transition-transform"
                          title="Tarik untuk Ubah Ukuran"
                          onPointerDown={(pointerEvent) => {
                            pointerEvent.stopPropagation();
                            const startScale = item.scale;
                            const startY = pointerEvent.clientY;
                            const handlePointerMove = (moveEvent: PointerEvent) => {
                              const deltaY = moveEvent.clientY - startY;
                              // Downward drag scales up, upward drag scales down
                              const scaleFactor = Math.max(0.05, startScale - deltaY / 100);
                              handleUpdateSticker(item.id, { scale: parseFloat(scaleFactor.toFixed(2)) });
                            };
                            const handlePointerUp = () => {
                              window.removeEventListener('pointermove', handlePointerMove);
                              window.removeEventListener('pointerup', handlePointerUp);
                            };
                            window.addEventListener('pointermove', handlePointerMove);
                            window.addEventListener('pointerup', handlePointerUp);
                          }}
                        >
                          <Maximize2 className="w-3 h-3 text-white" />
                        </div>
                        
                        {/* Rotation handle */}
                        <div 
                          className="absolute -top-3 -right-3 w-6 h-6 bg-indigo-600 hover:bg-indigo-500 text-white rounded-full cursor-pointer flex items-center justify-center border border-white shadow-[0_0_10px_rgba(99,102,241,0.5)] z-50 hover:scale-115 active:scale-90 transition-transform"
                          title="Tarik untuk Putar"
                          onPointerDown={(pointerEvent) => {
                            pointerEvent.stopPropagation();
                            // Calculate rotation based on cursor angle relative to center of the text box
                            const el = pointerEvent.currentTarget.parentElement;
                            if (!el) return;
                            const rect = el.getBoundingClientRect();
                            const centerX = rect.left + rect.width / 2;
                            const centerY = rect.top + rect.height / 2;
                            
                            const handlePointerMove = (moveEvent: PointerEvent) => {
                              const radians = Math.atan2(moveEvent.clientY - centerY, moveEvent.clientX - centerX);
                              let degrees = Math.round((radians * 180) / Math.PI);
                              if (degrees < 0) degrees += 360;
                              handleUpdateSticker(item.id, { rotation: degrees });
                            };
                            const handlePointerUp = () => {
                              window.removeEventListener('pointermove', handlePointerMove);
                              window.removeEventListener('pointerup', handlePointerUp);
                            };
                            window.addEventListener('pointermove', handlePointerMove);
                            window.addEventListener('pointerup', handlePointerUp);
                          }}
                        >
                          <RotateCw className="w-3 h-3 text-white" />
                        </div>

                        {/* Quick Delete Trash Button */}
                        <div 
                          className="absolute -bottom-3 -left-3 w-6 h-6 bg-red-650 hover:bg-red-500 text-white rounded-full cursor-pointer flex items-center justify-center border border-white shadow-[0_0_10px_rgba(239,68,68,0.5)] z-50 hover:scale-115 active:scale-90 transition-transform"
                          title="Hapus Layer/Teks"
                          onPointerDown={(e) => {
                            e.stopPropagation();
                            handleDeleteSticker(item.id);
                            setSelectedStickerId(null);
                            triggerToast("Elemen berhasil dihapus 🗑");
                          }}
                        >
                          <Trash2 className="w-3 h-3 text-white" />
                        </div>
                      </>
                    )}
                  </div>
                );
              })}

              {/* Dropzone overlays */}
              <AnimatePresence>
                {isDraggingFile && (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-zinc-950/90 pointer-events-none"
                  >
                    <Upload className="w-12 h-12 text-neon-cyan animate-bounce" />
                    <span className="font-mono text-xs text-neon-cyan font-bold tracking-widest mt-3">
                      LEPASKAN FOTO UNTUK UNGGAH
                    </span>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Dynamic Overlay loading icon */}
              {isLoading && (
                <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-zinc-950/70 backdrop-blur-sm pointer-events-none">
                  <Cpu className="w-10 h-10 text-neon-cyan animate-spin mb-3" />
                  <span className="font-mono text-[10px] text-zinc-400 tracking-widest uppercase">
                    PROSES PENGOLAHAN PIXEL...
                  </span>
                </div>
              )}
            </div>

            {/* Cyber Terminal Logs below Canvas for AI Effect processes */}
            {(aiEffectLogs.length > 0 || isAiEffectGenerating) && (
              <div className="mt-4 p-3 rounded-lg border border-neon-cyan/20 bg-black/90 font-mono text-[9px] text-[#00F0FF] space-y-1.5 shadow-[0_4px_20px_rgba(0,0,0,0.8)] relative overflow-hidden">
                {/* Scanlines inside Terminal */}
                <div className="scanlines absolute inset-0 opacity-10 pointer-events-none" />
                <div className="flex items-center justify-between border-b border-neon-cyan/15 pb-1 select-none">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-neon-cyan animate-pulse" />
                    <span className="font-cyber font-black tracking-widest text-[9.5px]">OLIVE TERMINAL SIBER // LOG AI EFFECT</span>
                  </div>
                  <button 
                    onClick={() => setAiEffectLogs([])} 
                    className="text-zinc-500 hover:text-white transition-colors text-[8px] uppercase tracking-wider font-bold"
                  >
                    Hapus Log [✕]
                  </button>
                </div>
                <div className="max-h-[140px] overflow-y-auto scrollbar-thin scrollbar-thumb-white/10 space-y-1 font-mono leading-relaxed pr-1 flex flex-col pt-1">
                  {aiEffectLogs.map((log, i) => {
                    const isSystem = log.includes('SISTEM');
                    const isApi = log.includes('API');
                    const isOlive = log.includes('OLIVE');
                    const isError = log.includes('ERROR');
                    let logColorClass = 'text-[#00F0FF]/80';
                    if (isError) logColorClass = 'text-rose-500 font-extrabold';
                    else if (isOlive) logColorClass = 'text-pink-450 font-bold';
                    else if (isSystem) logColorClass = 'text-cyan-300 font-medium';
                    else if (isApi) logColorClass = 'text-amber-400';
                    return (
                      <div key={i} className={`flex gap-1.5 ${logColorClass} items-start`}>
                        <span className="text-zinc-550 select-none">&gt;&gt;</span>
                        <p className="flex-1 whitespace-pre-wrap">{log}</p>
                      </div>
                    );
                  })}
                  
                  {isAiEffectGenerating && (
                    <div className="flex items-center gap-2 text-neon-pink text-[9px] font-black tracking-widest animate-pulse mt-1 select-none">
                      <span className="w-1.5 h-3 bg-neon-pink inline-block animate-blink shrink-0" />
                      <span>SEDANG MEMBACA SINYAL TRANSDUKSI PIKSEL...</span>
                    </div>
                  )}
                </div>
              </div>
            )}



            {/* Hidden File Input Picker */}
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={onFileSelect}
              accept="image/*"
              className="hidden" 
            />
          </div>
        </main>
      )}

      {/* DEDICATED LIVE TEXT/ELEMENT EDITING HUD OVERLAY */}
      <AnimatePresence>
        {currentPage === 'beranda' && selectedStickerId && isHudOpen && (() => {
          const activeSelectedSticker = stickers.find(s => s.id === selectedStickerId);
          if (!activeSelectedSticker) return null;
          const activeIndex = stickers.findIndex(s => s.id === selectedStickerId);

          return (
            <motion.div
              initial={{ opacity: 0, scale: 0.94, y: -20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.94, y: -20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 350 }}
              className="fixed top-[74px] right-3 xs:right-6 md:right-10 z-50 w-[calc(100%-24px)] xs:w-[350px] shadow-[0_20px_50px_rgba(0,0,0,0.85)] rounded-2xl border backdrop-blur-xl flex flex-col transition-all duration-300"
              style={{
                borderColor: activeSelectedSticker.type === 'text' ? '#00F0FF' : '#f35588',
                background: theme === 'dark' ? 'rgba(7, 7, 9, 0.94)' : 'rgba(255, 255, 255, 0.92)'
              }}
            >
              {/* Overlay Panel Header */}
              <div className={`p-4 border-b flex items-center justify-between ${
                theme === 'dark' ? 'border-white/5 bg-black/45' : 'border-black/5 bg-black/5'
              }`}>
                <div className="flex items-center gap-2">
                  <div className={`p-1.5 rounded-lg flex items-center justify-center ${
                    activeSelectedSticker.type === 'text' ? 'bg-[#00F0FF]/15 text-[#00F0FF]' : 'bg-pink-500/15 text-pink-500'
                  }`}>
                    {activeSelectedSticker.type === 'text' ? <Edit2 className="w-4 h-4" /> : <Layers className="w-4 h-4" />}
                  </div>
                  <div>
                    <h4 className={`text-xs font-mono font-black tracking-widest uppercase ${
                      activeSelectedSticker.type === 'text' ? 'text-[#00F0FF]' : 'text-pink-500'
                    }`}>
                      {activeSelectedSticker.type === 'text' ? 'SUNTING TEKS' : 'SUNTING ELEMEN'}
                    </h4>
                    <span className="text-[9px] font-mono text-zinc-550 block font-bold leading-none mt-0.5">
                      LIVE CONTROLLER // L-{activeIndex + 1}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      handleDeleteSticker(activeSelectedSticker.id);
                      setSelectedStickerId(null);
                      triggerToast("Elemen berhasil dihapus 🗑");
                    }}
                    className="p-1 px-2 text-[9px] font-mono text-rose-500 hover:text-white hover:bg-rose-500/15 rounded border border-rose-500/25 transition-all uppercase font-bold"
                  >
                    HAPUS
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedStickerId(null)}
                    className={`p-1 px-2 text-[9px] font-mono rounded border transition-all uppercase font-bold ${
                      theme === 'dark'
                        ? 'text-zinc-350 hover:text-white bg-white/5 border-white/10'
                        : 'text-zinc-650 hover:text-black bg-black/5 border-black/10'
                    }`}
                  >
                    OK ✕
                  </button>
                </div>
              </div>

              {/* Scrollable Editor Parameters */}
              <div className="p-4 space-y-4 max-h-[50vh] overflow-y-auto pr-2 scrollbar-thin">
                {activeSelectedSticker.imageUrl ? (
                  /* EXCLUSIVE PNG IMAGE STICKER PARAMETERS */
                  <div className="space-y-4 font-mono select-none">
                    {/* Scale / Ukuran */}
                    <div className="space-y-1">
                      <div className="flex justify-between items-center text-[10px]">
                        <span className={`${theme === 'dark' ? 'text-zinc-400' : 'text-zinc-650'} font-bold`}>SKALA / UKURAN:</span>
                        <span className="text-[#00F0FF] font-black">{Math.round(activeSelectedSticker.scale * 100)}%</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="range"
                          min="0.1"
                          max="3.0"
                          step="0.05"
                          value={activeSelectedSticker.scale}
                          onChange={(e) => handleUpdateSticker(activeSelectedSticker.id, { scale: parseFloat(e.target.value) })}
                          className="flex-1 h-1.5 rounded-lg appearance-none cursor-pointer bg-zinc-800 accent-[#00F0FF]"
                        />
                        <button
                          type="button"
                          onClick={() => handleUpdateSticker(activeSelectedSticker.id, { scale: 1.0 })}
                          className="px-2 py-0.5 text-[8px] border border-white/10 rounded-md bg-white/5 hover:bg-white/10 text-zinc-350 transition-colors uppercase font-bold"
                        >
                          RESET
                        </button>
                      </div>
                    </div>

                    {/* Rotation / Putar */}
                    <div className="space-y-1">
                      <div className="flex justify-between items-center text-[10px]">
                        <span className={`${theme === 'dark' ? 'text-zinc-400' : 'text-zinc-650'} font-bold`}>ROTASI:</span>
                        <span className="text-[#00F0FF] font-black">{activeSelectedSticker.rotation}°</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="range"
                          min="0"
                          max="360"
                          step="1"
                          value={activeSelectedSticker.rotation}
                          onChange={(e) => handleUpdateSticker(activeSelectedSticker.id, { rotation: parseInt(e.target.value) })}
                          className="flex-1 h-1.5 rounded-lg appearance-none cursor-pointer bg-zinc-800 accent-[#00F0FF]"
                        />
                        <button
                          type="button"
                          onClick={() => handleUpdateSticker(activeSelectedSticker.id, { rotation: 0 })}
                          className="px-2 py-0.5 text-[8px] border border-white/10 rounded-md bg-white/5 hover:bg-white/10 text-zinc-350 transition-colors uppercase font-bold"
                        >
                          0°
                        </button>
                      </div>
                      <div className="grid grid-cols-3 gap-1">
                        {[90, 180, 270].map(deg => (
                          <button
                            key={deg}
                            type="button"
                            onClick={() => {
                              const next = (activeSelectedSticker.rotation + deg) % 360;
                              handleUpdateSticker(activeSelectedSticker.id, { rotation: next });
                            }}
                            className="py-1 text-[8px] border border-white/10 rounded bg-white/5 hover:bg-white/10 text-zinc-300 transition-all font-black text-center"
                          >
                            +{deg}°
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Opacity / Transparency */}
                    <div className="space-y-1">
                      <div className="flex justify-between items-center text-[10px]">
                        <span className={`${theme === 'dark' ? 'text-zinc-400' : 'text-zinc-650'} font-bold`}>TRANSPARANSI (OPACITY):</span>
                        <span className="text-[#00F0FF] font-black">{Math.round((activeSelectedSticker.opacity !== undefined ? activeSelectedSticker.opacity : 1) * 100)}%</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="range"
                          min="0.1"
                          max="1.0"
                          step="0.05"
                          value={activeSelectedSticker.opacity !== undefined ? activeSelectedSticker.opacity : 1}
                          onChange={(e) => handleUpdateSticker(activeSelectedSticker.id, { opacity: parseFloat(e.target.value) })}
                          className="flex-1 h-1.5 rounded-lg appearance-none cursor-pointer bg-zinc-800 accent-[#00F0FF]"
                        />
                        <button
                          type="button"
                          onClick={() => handleUpdateSticker(activeSelectedSticker.id, { opacity: 1.0 })}
                          className="px-2 py-0.5 text-[8px] border border-white/10 rounded-md bg-white/5 hover:bg-white/10 text-zinc-350 transition-colors uppercase font-bold"
                        >
                          FULL
                        </button>
                      </div>
                    </div>

                    {/* Flip Horizontal / Vertical */}
                    <div className="space-y-1.5">
                      <span className={`${theme === 'dark' ? 'text-zinc-400' : 'text-zinc-650'} text-[9.5px] font-bold block`}>BALIK GABAR (FLIP):</span>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => handleUpdateSticker(activeSelectedSticker.id, { flipH: !activeSelectedSticker.flipH })}
                          className={`py-2 px-3 text-[9px] border rounded-xl flex items-center justify-center gap-1.5 transition-all font-black ${
                            activeSelectedSticker.flipH
                              ? 'border-[#00F0FF] bg-[#00F0FF]/15 text-[#00F0FF]'
                              : theme === 'dark' ? 'border-white/5 bg-zinc-900 text-zinc-450 hover:bg-zinc-850 hover:text-white' : 'border-black/5 bg-black/5 text-zinc-700 hover:bg-black/10'
                          }`}
                        >
                          <FlipHorizontal className="w-3.5 h-3.5" />
                          <span>HORIZONTAL</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleUpdateSticker(activeSelectedSticker.id, { flipV: !activeSelectedSticker.flipV })}
                          className={`py-2 px-3 text-[9px] border rounded-xl flex items-center justify-center gap-1.5 transition-all font-black ${
                            activeSelectedSticker.flipV
                              ? 'border-pink-500 bg-pink-500/15 text-pink-500 shadow-[0_0_8px_rgba(236,72,153,0.2)]'
                              : theme === 'dark' ? 'border-white/5 bg-zinc-900 text-zinc-450 hover:bg-zinc-850 hover:text-white' : 'border-black/5 bg-black/5 text-zinc-700 hover:bg-black/10'
                          }`}
                        >
                          <FlipVertical className="w-3.5 h-3.5" />
                          <span>VERTIKAL</span>
                        </button>
                      </div>
                    </div>

                    {/* Blend Mode Selection */}
                    <div className="space-y-1.5 pt-3 border-t border-dashed border-white/5">
                      <span className={`${theme === 'dark' ? 'text-zinc-400' : 'text-zinc-650'} text-[10px] font-black block`}>EFEK BLEND (BLEND MODE):</span>
                      <select
                        value={activeSelectedSticker.blendMode || 'normal'}
                        onChange={(e) => handleUpdateSticker(activeSelectedSticker.id, { blendMode: e.target.value as any })}
                        className={`w-full py-2 px-3 rounded-xl text-xs font-mono focus:outline-none focus:ring-1 focus:ring-[#00f2fe] ${
                          theme === 'dark'
                            ? 'bg-zinc-900 border border-white/10 text-white'
                            : 'bg-white border border-black/15 text-zinc-900 font-extrabold'
                        }`}
                      >
                        {['normal', 'multiply', 'screen', 'overlay', 'darken', 'lighten', 'color-dodge', 'color-burn', 'hard-light', 'soft-light', 'difference', 'exclusion', 'hue', 'saturation', 'color', 'luminosity'].map(mode => (
                          <option key={mode} value={mode}>{mode.toUpperCase()}</option>
                        ))}
                      </select>
                      <p className="text-[8px] text-zinc-500 leading-relaxed font-sans mt-1">
                        💡 Tips: Pilih 'MULTIPLY', 'OVERLAY', atau 'SCREEN' untuk menyatukan stiker dengan tekstur foto di bawahnya seperti poster profesional!
                      </p>
                    </div>
                  </div>
                ) : (
                  /* STANDARD TEXT AND PRESIT NEON STICKERS PARAMETERS */
                  <>
                    {activeSelectedSticker.type === 'text' && (
                      <div className="space-y-1.5 relative">
                        <span className={`text-[9.5px] font-mono font-bold block uppercase tracking-wide flex items-center justify-between ${theme === 'dark' ? 'text-zinc-400' : 'text-zinc-650'}`}>
                          <span>Ubah Isi Teks / Pesan:</span>
                          <Type className="w-3 h-3 text-neon-cyan" />
                        </span>
                        <div className="relative group">
                          <input
                            type="text"
                            value={activeSelectedSticker.text || ''}
                            onChange={(e) => handleUpdateSticker(activeSelectedSticker.id, { text: e.target.value.toUpperCase() })}
                            className={`w-full py-3 px-4 rounded-xl font-mono text-sm uppercase focus:outline-none focus:ring-1 focus:ring-neon-cyan transition-all shadow-inner ${
                              theme === 'dark' 
                                ? 'bg-black/50 border border-[#00F0FF]/30 text-white placeholder-white/20 focus:bg-black/80 focus:shadow-[0_0_15px_rgba(0,240,255,0.15)]' 
                                : 'bg-white border border-black/10 text-zinc-900 font-black focus:border-[#00F0FF] focus:shadow-[0_0_15px_rgba(0,240,255,0.2)]'
                            }`}
                            placeholder="MASUKKAN TEKS"
                          />
                        </div>
                      </div>
                    )}

                    {activeSelectedSticker.type === 'text' && (
                      <div className="space-y-1.5">
                        <span className={`text-[9.5px] font-mono font-bold block uppercase tracking-wide ${theme === 'dark' ? 'text-zinc-400' : 'text-zinc-650'}`}>Pilih Font Futuristik:</span>
                        <div className="grid grid-cols-2 gap-1 select-none max-h-[85px] overflow-y-auto pr-1">
                          {FUTURISTIC_FONTS.map((font) => (
                            <button
                              key={font.id}
                              type="button"
                              onClick={() => handleUpdateSticker(activeSelectedSticker.id, { fontFamily: font.id })}
                              className={`py-1.5 px-2 rounded-lg text-left border text-[10px] transition-all truncate ${
                                activeSelectedSticker.fontFamily === font.id
                                  ? 'border-neon-cyan bg-cyan-950/25 text-white font-black'
                                  : theme === 'dark'
                                    ? 'border-white/5 bg-zinc-950 text-zinc-400 hover:text-zinc-200 hover:border-white/10'
                                    : 'border-black/5 bg-black/5 text-zinc-700 hover:text-zinc-950 hover:bg-black/[0.08]'
                              }`}
                            >
                              <span style={{ fontFamily: font.id }}>{font.name}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {activeSelectedSticker.type === 'text' && (
                      <div className="space-y-1.5">
                        <span className={`text-[9.5px] font-mono font-bold block uppercase tracking-wide ${theme === 'dark' ? 'text-zinc-400' : 'text-zinc-650'}`}>Pilih Preset Gaya Teks:</span>
                        <div className="grid grid-cols-4 gap-1 select-none">
                          {[
                            { id: 'plain', label: 'Polos' },
                            { id: 'neon', label: 'Neon' },
                            { id: 'glitch', label: 'Glitch' },
                            { id: 'chrome', label: 'Chrome' },
                            { id: 'hologram', label: 'Holo' },
                            { id: '3d', label: '3D' },
                            { id: 'double-neon', label: 'D-Neon' },
                            { id: 'curved', label: 'Melengkung' }
                          ].map((style) => (
                            <button
                              key={style.id}
                              type="button"
                              onClick={() => handleUpdateSticker(activeSelectedSticker.id, { textStyle: style.id as any })}
                              className={`py-2 px-1 rounded-lg text-center border text-[8px] uppercase tracking-widest font-black transition-all ${
                                (activeSelectedSticker.textStyle || 'plain') === style.id
                                  ? 'border-pink-500 bg-pink-500/20 text-white shadow-[0_0_8px_rgba(236,72,153,0.3)]'
                                  : theme === 'dark'
                                    ? 'border-white/5 bg-zinc-950 text-zinc-500 hover:text-zinc-300 hover:border-white/10'
                                    : 'border-black/5 bg-black/5 text-zinc-600 hover:text-zinc-900 hover:bg-black/10'
                              }`}
                            >
                              {style.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Scale and Rotation for badge elements as well */}
                    <div className="space-y-3 font-mono select-none pt-3 border-t border-dashed border-white/5">
                      <div className="space-y-1">
                        <div className="flex justify-between items-center text-[9.5px]">
                          <span className={`${theme === 'dark' ? 'text-zinc-400' : 'text-zinc-650'} font-bold`}>SKALA ELEMEN:</span>
                          <span className="text-[#00F0FF] font-black">{Math.round(activeSelectedSticker.scale * 100)}%</span>
                        </div>
                        <input
                          type="range"
                          min="0.1"
                          max="3.0"
                          step="0.05"
                          value={activeSelectedSticker.scale}
                          onChange={(e) => handleUpdateSticker(activeSelectedSticker.id, { scale: parseFloat(e.target.value) })}
                          className="w-full h-1 cursor-pointer bg-zinc-850 accent-[#00F0FF]"
                        />
                      </div>
                      
                      <div className="space-y-1">
                        <div className="flex justify-between items-center text-[9.5px]">
                          <span className={`${theme === 'dark' ? 'text-zinc-400' : 'text-zinc-650'} font-bold`}>ROTASI ELEMEN:</span>
                          <span className="text-[#00F0FF] font-black">{activeSelectedSticker.rotation}°</span>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="360"
                          step="1"
                          value={activeSelectedSticker.rotation}
                          onChange={(e) => handleUpdateSticker(activeSelectedSticker.id, { rotation: parseInt(e.target.value) })}
                          className="w-full h-1 cursor-pointer bg-zinc-850 accent-[#00F0FF]"
                        />
                      </div>

                      <div className="space-y-1.5 pb-2">
                        <span className={`${theme === 'dark' ? 'text-zinc-400' : 'text-zinc-650'} text-[9.5px] font-bold block`}>EFEK BLEND (BLEND MODE):</span>
                        <select
                          value={activeSelectedSticker.blendMode || 'normal'}
                          onChange={(e) => handleUpdateSticker(activeSelectedSticker.id, { blendMode: e.target.value as any })}
                          className={`w-full py-1 px-2.5 rounded-lg text-[10px] font-mono focus:outline-none focus:ring-1 focus:ring-[#00F0FF] ${
                            theme === 'dark'
                              ? 'bg-zinc-900 border border-white/5 text-white'
                              : 'bg-white border border-black/10 text-zinc-900'
                          }`}
                        >
                          {['normal', 'multiply', 'screen', 'overlay', 'darken', 'lighten', 'difference', 'color-dodge', 'hue', 'saturation', 'color', 'luminosity'].map(mode => (
                            <option key={mode} value={mode}>{mode.toUpperCase()}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Color swatch selection */}
                    <div className={`space-y-1.5 pt-3 border-t border-dashed ${theme === 'dark' ? 'border-white/5' : 'border-black/5'}`}>
                      <span className={`text-[9.5px] font-mono font-bold block uppercase tracking-wide ${theme === 'dark' ? 'text-zinc-400' : 'text-zinc-650'}`}>Pilih Warna Neon Elemen:</span>
                      <div className="flex space-x-2">
                        {STICKER_COLORS.map((color) => (
                          <button
                            key={color}
                            onClick={() => handleUpdateSticker(activeSelectedSticker.id, { color })}
                            className={`w-6 h-6 rounded-full border transition-all ${
                              activeSelectedSticker.color === color 
                                ? 'border-neon-cyan scale-110 shadow-[0_0_8px_rgba(0,240,255,0.45)]' 
                                : 'border-white/5 hover:scale-105'
                            }`}
                            style={{ backgroundColor: color }}
                          />
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* Panel Footer Navigation Helper */}
              <div className={`p-3 text-[8.5px] font-mono text-center border-t transition-colors duration-300 ${
                theme === 'dark' ? 'border-white/5 text-zinc-550 bg-black/15' : 'border-black/5 text-zinc-550 bg-black/5'
              }`}>
                💡 SENTUH & SERET LANGSUNG ELEMEN DI CANVAS UNTUK PENYESUAIAN INTUITIF.
              </div>
            </motion.div>
          );
        })()}
      </AnimatePresence>

      {/* FLOATING TRANSPARENT EDITING OVERLAY MODAL */}
      <AnimatePresence>
        {currentPage === 'beranda' && activeTab && (
          <motion.div
            initial={{ opacity: 0, y: 35, scale: 0.96, x: '-50%' }}
            animate={{ opacity: 1, y: 0, scale: 1, x: '-50%' }}
            exit={{ opacity: 0, y: 25, scale: 0.96, x: '-50%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed bottom-[64px] left-1/2 w-full max-w-lg px-4 z-40"
          >
            <div className={`backdrop-blur-xl rounded-2xl border transition-all duration-300 overflow-hidden flex flex-col h-auto max-h-[85vh] ${
              theme === 'dark' 
                ? 'bg-[#0b0b0d]/92 border-white/10 text-white shadow-[0_12px_40px_rgba(0,0,0,0.75)]' 
                : 'bg-white/80 border-black/10 text-zinc-900 shadow-[0_12px_40px_rgba(0,0,0,0.15)]'
            }`}>
            {/* Modal Semi-transparent Header */}
            <div className={`flex items-center justify-between px-3 py-1.5 font-mono text-[9px] tracking-widest uppercase border-b transition-all duration-300 ${
              theme === 'dark'
                ? 'bg-black/40 border-white/5 text-[#00F0FF]'
                : 'bg-black/5 border-black/5 text-[#0066FF] font-extrabold'
            }`}>
              <span className="font-extrabold flex items-center gap-1.5 text-[10px]">
                {activeTab === 'adjust' && <><Settings2 className="w-3.5 h-3.5 text-neon-cyan animate-pulse" /> POSISI FOTO</>}
                {activeTab === 'crop' && <><Crop className="w-3.5 h-3.5 text-neon-cyan animate-pulse" /> POTONG (CROP) FOTO</>}
                {activeTab === 'filter' && <><Sliders className="w-3.5 h-3.5 text-neon-cyan" /> FILTER ESTETIK</>}
                {activeTab === 'color' && <><Cpu className="w-3.5 h-3.5 text-neon-cyan" /> KOREKSI WARNA & BLUR</>}
                {activeTab === 'stickers' && <><Layers className="w-3.5 h-3.5 text-neon-cyan" /> BADGE & DEKORASI</>}
                {activeTab === 'png_stickers' && <><ImageIcon className="w-3.5 h-3.5 text-neon-cyan animate-pulse" /> GRABBER STIKER PNG</>}
                {activeTab === 'text' && <><Type className="w-3.5 h-3.5 text-neon-cyan" /> TEKS KUSTOM</>}
                {activeTab === 'text_preset' && <><Baseline className="w-3.5 h-3.5 text-neon-cyan" /> TEKS ESTETIK</>}
                {activeTab === 'layers' && <><Layers className="w-3.5 h-3.5 text-neon-cyan" /> MANAJEMEN LAYER</>}
                {activeTab === 'ai' && <><Sparkles className="w-3.5 h-3.5 text-amber-400 animate-pulse" /> AI GENERATE</>}
                {activeTab === 'download' && <><Download className="w-3.5 h-3.5 text-neon-cyan animate-bounce" /> FORMAT UNDUH & RESOLUSI</>}
                {activeTab === 'history' && <><Activity className="w-3.5 h-3.5 text-emerald-400 animate-pulse" /> RIWAYAT PERUBAHAN</>}
                {activeTab === 'settings' && <><Settings2 className="w-3.5 h-3.5 text-neon-cyan animate-pulse" /> PENGATURAN EFEK GLOBAL</>}
                {activeTab === 'ai_effect' && <><Sparkles className="w-3.5 h-3.5 text-neon-cyan animate-pulse" /> AI EFFECT FUTURISTIK</>}
              </span>
              <button 
                onClick={() => setActiveTab(null)}
                className={`p-1 px-2 text-[9px] font-mono tracking-wider font-bold rounded uppercase border transition-all ${
                  theme === 'dark'
                    ? 'text-zinc-400 hover:text-white bg-white/5 border-white/10'
                    : 'text-zinc-650 hover:text-black bg-black/5 border-black/10'
                }`}
                title="Tutup menu"
              >
                TUTUP ✕
              </button>
            </div>

            {/* Modal Body Container */}
            <div className={`p-4 overflow-y-auto scrollbar-thin max-h-[75vh] transition-all duration-300 ${
              theme === 'dark' ? 'scrollbar-thumb-white/15' : 'scrollbar-thumb-black/10'
            }`}>
              {activeTab === 'history' && (
                <div className="flex flex-col gap-3 font-mono">
                  {/* Action buttons (Undo / Redo / Reset) */}
                  <div className="flex flex-col xs:flex-row xs:items-center justify-between gap-2 border-b pb-2.5 border-white/[0.04]">
                    <span className="text-[10px] text-zinc-400 font-bold tracking-wider uppercase">PILIH HISTORI LANGKAH:</span>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <button
                        type="button"
                        onClick={() => {
                          if (history.length > 0 && historyIndex !== 0) {
                            if (pendingHistoryTimerRef.current) {
                              clearTimeout(pendingHistoryTimerRef.current);
                              pendingHistoryTimerRef.current = null;
                            }
                            const initialSettings = history[0];
                            lastCommittedRef.current = initialSettings;
                            setImageSettings(initialSettings);
                            setHistoryIndex(0);
                            triggerToast("Kembali ke Posisi Awal! 🌄");
                          }
                        }}
                        disabled={historyIndex === 0}
                        className={`py-1 px-2.5 text-[9px] font-mono tracking-wider font-extrabold rounded-lg border transition-all flex items-center gap-1 focus:outline-none ${
                          historyIndex === 0
                            ? theme === 'dark'
                              ? 'border-white/5 text-zinc-650 bg-neutral-950/20 cursor-not-allowed opacity-35'
                              : 'border-zinc-200 text-zinc-400 bg-zinc-100/30 cursor-not-allowed'
                            : theme === 'dark'
                              ? 'bg-neutral-900 border-white/10 text-emerald-400 hover:border-emerald-500/40 hover:bg-emerald-500/5 hover:text-white hover:scale-102 active:scale-98 shadow-[0_0_8px_rgba(16,185,129,0.05)]'
                              : 'bg-white border-zinc-200 text-emerald-600 hover:bg-emerald-50/50 hover:border-emerald-300 hover:text-emerald-700 hover:scale-102 active:scale-98'
                        }`}
                        title="Kembali ke setelan / posisi awal gambar"
                      >
                        <RefreshCw className="w-2.5 h-2.5" />
                        POSISI AWAL
                      </button>

                      <button
                        type="button"
                        onClick={handleUndo}
                        disabled={historyIndex === 0}
                        className={`py-1 px-2.5 text-[9px] font-mono tracking-wider font-extrabold rounded-lg border transition-all flex items-center gap-1 focus:outline-none ${
                          historyIndex === 0
                            ? theme === 'dark'
                              ? 'border-white/5 text-zinc-650 bg-neutral-950/20 cursor-not-allowed opacity-35'
                              : 'border-zinc-200 text-zinc-400 bg-zinc-100/30 cursor-not-allowed'
                            : theme === 'dark'
                              ? 'bg-neutral-900 border-white/10 text-neon-cyan hover:border-neon-cyan/45 hover:bg-neon-cyan/5 hover:text-white hover:scale-102 active:scale-98 shadow-[0_0_8px_rgba(0,240,255,0.05)]'
                              : 'bg-white border-zinc-200 text-cyan-600 hover:bg-cyan-50/50 hover:border-cyan-300 hover:text-cyan-700 hover:scale-102 active:scale-98'
                        }`}
                        title="Urungkan perubahan (Undo)"
                      >
                        <Undo className="w-2.5 h-2.5" />
                        UNDO
                      </button>

                      <button
                        type="button"
                        onClick={handleRedo}
                        disabled={historyIndex === history.length - 1}
                        className={`py-1 px-2.5 text-[9px] font-mono tracking-wider font-extrabold rounded-lg border transition-all flex items-center gap-1 focus:outline-none ${
                          historyIndex === history.length - 1
                            ? theme === 'dark'
                              ? 'border-white/5 text-zinc-650 bg-neutral-950/20 cursor-not-allowed opacity-35'
                              : 'border-zinc-200 text-zinc-400 bg-zinc-100/30 cursor-not-allowed'
                            : theme === 'dark'
                              ? 'bg-neutral-900 border-white/10 text-neon-pink hover:border-neon-pink/45 hover:bg-neon-pink/5 hover:text-white hover:scale-102 active:scale-98 shadow-[0_0_8px_rgba(255,0,80,0.05)]'
                              : 'bg-white border-zinc-200 text-rose-600 hover:bg-rose-50/50 hover:border-rose-300 hover:text-rose-700 hover:scale-102 active:scale-98'
                        }`}
                        title="Ulangi perubahan (Redo)"
                      >
                        REDO
                        <Redo className="w-2.5 h-2.5" />
                      </button>
                    </div>
                  </div>

                  {/* Horizontal Scroll sliding timeline steps */}
                  <div className="overflow-x-auto pb-2 flex select-none touch-pan-x scrollbar-thin w-full">
                    <ul className="flex flex-row gap-2 shrink-0 py-1">
                      {history.slice().reverse().map((h, reverseIdx) => {
                        const index = history.length - 1 - reverseIdx;
                        let label = "";
                        if (index === 0) {
                          label = "Posisi Asli";
                        } else {
                          const prev = history[index - 1];
                          const changes: string[] = [];
                          if (h.scale !== prev.scale) changes.push("Skala");
                          if (h.x !== prev.x || h.y !== prev.y) changes.push("Geser");
                          if (h.rotation !== prev.rotation) changes.push("Rotasi");
                          if (h.flipH !== prev.flipH || h.flipV !== prev.flipV) changes.push("Balik");
                          if (h.brightness !== prev.brightness || h.contrast !== prev.contrast || h.saturate !== prev.saturate) changes.push("Koreksi");
                          if (h.blur !== prev.blur || h.noise !== prev.noise) changes.push("Filter");
                          
                          label = changes.length > 0 ? changes.join(" & ") : `Langkah ${index}`;
                        }

                        const isActive = index === historyIndex;

                        return (
                          <li key={index} className="inline-block shrink-0">
                            <button
                              type="button"
                              onClick={() => {
                                if (pendingHistoryTimerRef.current) {
                                  clearTimeout(pendingHistoryTimerRef.current);
                                  pendingHistoryTimerRef.current = null;
                                }
                                const selectedSettings = history[index];
                                lastCommittedRef.current = selectedSettings;
                                setImageSettings(selectedSettings);
                                setHistoryIndex(index);
                                triggerToast(index === 0 ? "Kembali ke Posisi Awal! 🌄" : `Loncat ke langkah ${index}!`);
                              }}
                              className={`w-28 md:w-32 text-left p-2.5 rounded-xl border flex flex-col justify-between h-[68px] transition-all hover:scale-[1.02] active:scale-[0.98] ${
                                isActive
                                  ? theme === 'dark'
                                    ? 'bg-neon-cyan/10 border-neon-cyan/50 text-white font-extrabold shadow-[inset_0_0_8px_rgba(0,240,255,0.06)]'
                                    : 'bg-cyan-50 border-cyan-350 text-cyan-800 font-extrabold shadow-sm'
                                  : theme === 'dark'
                                    ? 'bg-neutral-900 border-white/5 text-zinc-400 hover:border-white/10 hover:text-white'
                                    : 'bg-white border-zinc-200 text-zinc-650 hover:border-zinc-300 hover:text-zinc-900 shadow-sm'
                              }`}
                            >
                              <div className="flex items-center justify-between w-full border-b pb-1 border-white/[0.04] mb-1">
                                <span className="opacity-60 text-[8px]">#{index}</span>
                                {isActive ? (
                                  <span className="w-1.5 h-1.5 rounded-full bg-neon-cyan animate-pulse shadow-[0_0_4px_#00f2fe]" />
                                ) : (
                                  <span className={`w-1 h-1 rounded-full ${theme === 'dark' ? 'bg-zinc-600' : 'bg-zinc-300'}`} />
                                )}
                              </div>
                              
                              <span className="truncate w-full text-left font-bold text-[9px] leading-tight block">
                                {index === 0 ? "Posisi Asli" : label}
                              </span>
                              
                              <div className="flex items-center justify-between w-full mt-1">
                                <span className="text-[7.5px] opacity-40 uppercase tracking-widest leading-none font-bold">
                                  {index === 0 ? "Awal" : "Langkah"}
                                </span>
                                {isActive && (
                                  <span className={`text-[7.5px] font-black tracking-wider leading-none select-none shrink-0 ${
                                    theme === 'dark' ? 'text-neon-cyan' : 'text-cyan-700'
                                  }`}>
                                    AKTIF
                                  </span>
                                )}
                              </div>
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                </div>
              )}

              {activeTab === 'adjust' && (
                <ImageAdjuster
                  settings={imageSettings}
                  onChangeSettings={setImageSettings}
                  activeFilterPresetId={filterPresetId}
                  onSelectFilterPreset={handleSelectFilterPreset}
                  onResetSettings={() => {
                    setImageSettings(DEFAULT_SETTINGS);
                    setFilterPresetId('none');
                    triggerToast('Posisi foto dikembalikan ke awal.');
                  }}
                  activeSection="posisi"
                  enableParallax={enableParallax}
                  onToggleParallax={setEnableParallax}
                  theme={theme}
                />
              )}

              {activeTab === 'crop' && (
                <ImageAdjuster
                  settings={imageSettings}
                  onChangeSettings={setImageSettings}
                  activeFilterPresetId={filterPresetId}
                  onSelectFilterPreset={handleSelectFilterPreset}
                  onResetSettings={() => {
                    setImageSettings({
                      ...imageSettings,
                      maskShape: 'square'
                    });
                    triggerToast('Bentuk crop foto dikembalikan ke awal.');
                  }}
                  activeSection="crop"
                  enableParallax={enableParallax}
                  onToggleParallax={setEnableParallax}
                  theme={theme}
                />
              )}

              {activeTab === 'filter' && (
                <ImageAdjuster
                  settings={imageSettings}
                  onChangeSettings={setImageSettings}
                  activeFilterPresetId={filterPresetId}
                  onSelectFilterPreset={handleSelectFilterPreset}
                  onResetSettings={() => {
                    setFilterPresetId('none');
                    triggerToast('Filter dikosongkan.');
                  }}
                  activeSection="filter"
                  enableParallax={enableParallax}
                  onToggleParallax={setEnableParallax}
                  theme={theme}
                />
              )}

              {activeTab === 'color' && (
                <ImageAdjuster
                  settings={imageSettings}
                  onChangeSettings={setImageSettings}
                  activeFilterPresetId={filterPresetId}
                  onSelectFilterPreset={handleSelectFilterPreset}
                  onResetSettings={() => {
                    setImageSettings({
                      ...imageSettings,
                      brightness: 100,
                      contrast: 100,
                      saturate: 100,
                      hueRotate: 0,
                      blur: 0,
                      noise: false
                    });
                    triggerToast('Koreksi warna dikembalikan ke awal.');
                  }}
                  activeSection="warna"
                  enableParallax={enableParallax}
                  onToggleParallax={setEnableParallax}
                  theme={theme}
                />
              )}

              {activeTab === 'stickers' && (
                <motion.div
                  initial={{ scale: 0.95, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: "spring", stiffness: 300, damping: 25 }}
                >
                  <StickerSelector
                    stickers={stickers}
                    onAddSticker={handleAddSticker}
                    onUpdateSticker={handleUpdateSticker}
                    onDeleteSticker={handleDeleteSticker}
                    neonColor={neonColor}
                    selectedStickerId={selectedStickerId}
                    onSelectSticker={setSelectedStickerId}
                    theme={theme}
                    modeOnly="sticker_vector"
                  />
                </motion.div>
              )}

              {activeTab === 'png_stickers' && (
                <motion.div
                  initial={{ scale: 0.95, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: "spring", stiffness: 300, damping: 25 }}
                >
                  <StickerSelector
                    stickers={stickers}
                    onAddSticker={handleAddSticker}
                    onUpdateSticker={handleUpdateSticker}
                    onDeleteSticker={handleDeleteSticker}
                    neonColor={neonColor}
                    selectedStickerId={selectedStickerId}
                    onSelectSticker={setSelectedStickerId}
                    theme={theme}
                    modeOnly="png_sticker"
                  />
                </motion.div>
              )}

              {activeTab === 'text' && (
                <motion.div
                  initial={{ scale: 0.95, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: "spring", stiffness: 300, damping: 25 }}
                >
                  <StickerSelector
                    stickers={stickers}
                    onAddSticker={handleAddSticker}
                    onUpdateSticker={handleUpdateSticker}
                    onDeleteSticker={handleDeleteSticker}
                    neonColor={neonColor}
                    selectedStickerId={selectedStickerId}
                    onSelectSticker={setSelectedStickerId}
                    theme={theme}
                    modeOnly="text_custom"
                  />
                </motion.div>
              )}

              {activeTab === 'text_preset' && (
                <motion.div
                  initial={{ scale: 0.95, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: "spring", stiffness: 300, damping: 25 }}
                >
                  <StickerSelector
                    stickers={stickers}
                    onAddSticker={handleAddSticker}
                    onUpdateSticker={handleUpdateSticker}
                    onDeleteSticker={handleDeleteSticker}
                    neonColor={neonColor}
                    selectedStickerId={selectedStickerId}
                    onSelectSticker={setSelectedStickerId}
                    theme={theme}
                    modeOnly="text_preset"
                  />
                </motion.div>
              )}

              {activeTab === 'layers' && (
                <div className="space-y-4 font-mono text-left">
                  <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1 flex flex-col">
                    {[...stickers].reverse().map((item, reversedIndex) => {
                      const realIndex = stickers.length - 1 - reversedIndex;
                      const isSelected = item.id === selectedStickerId;
                      const isFirst = realIndex === stickers.length - 1; // Top/front-most
                      const isLast = realIndex === 0;                  // Bottom/back-most

                      return (
                        <div
                          key={item.id}
                          onClick={() => {
                            if (!item.isLocked) setSelectedStickerId(item.id);
                          }}
                          className={`p-3 rounded-xl border flex items-center justify-between gap-3 transition-all ${
                            item.isLocked ? 'opacity-50 cursor-pointer pointer-events-auto filter grayscale-[0.8]' : 'cursor-pointer'
                          } ${
                            isSelected
                              ? 'border-[#00F0FF] bg-[#00F0FF]/5 text-white shadow-[0_0_15px_rgba(0,240,255,0.1)]'
                              : theme === 'dark'
                                ? 'border-white/5 bg-zinc-950/40 text-zinc-400 hover:border-white/10 hover:text-zinc-200'
                                : 'border-zinc-200 bg-black/5 text-zinc-800 hover:border-zinc-300 hover:text-zinc-950'
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0 flex-1">
                            <div className={`p-2 rounded-lg border flex items-center justify-center shrink-0 ${
                              isSelected
                                ? 'bg-[#00F0FF]/15 border-[#00F0FF]/30 text-[#00F0FF]'
                                : theme === 'dark' ? 'bg-zinc-900 border-white/5 text-zinc-500' : 'bg-white border-black/10 text-zinc-400'
                            }`}>
                              {item.type === 'text' ? (
                                <Type className="w-3.5 h-3.5" />
                              ) : (
                                <Layers className="w-3.5 h-3.5" />
                              )}
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5 leading-none mb-1">
                                <span className={`text-[7px] tracking-widest font-extrabold uppercase ${
                                  item.type === 'text' ? 'text-pink-500/80' : 'text-neon-cyan/80'
                                }`}>
                                  {item.type === 'text' ? 'Teks' : 'Badge'}
                                </span>
                                <span className="text-[7.5px] text-zinc-500 font-bold">#L-{realIndex + 1}</span>
                              </div>
                              <p className="text-[11px] font-sans font-semibold uppercase truncate">
                                {item.type === 'text' ? (
                                  item.text
                                ) : (
                                  `BADGE VECTOR ${item.scale ? `(SC: ${item.scale.toFixed(1)})` : ''}`
                                )}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-0.5 shrink-0" onClick={(e) => e.stopPropagation()}>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleUpdateSticker(item.id, { isLocked: !item.isLocked });
                                if (!item.isLocked && item.id === selectedStickerId) setSelectedStickerId(null);
                              }}
                              className={`p-1.5 rounded transition-all ${
                                theme === 'dark' ? 'hover:bg-white/5' : 'hover:bg-black/5'
                              } ${item.isLocked ? 'text-rose-500 hover:text-rose-400' : 'text-zinc-650 hover:text-zinc-300'}`}
                              title={item.isLocked ? "Buka Kunci Layer" : "Kunci Layer"}
                            >
                              {item.isLocked ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5 text-zinc-500" />}
                            </button>

                            <div className={`w-px h-4 mx-0.5 ${theme === 'dark' ? 'bg-white/10' : 'bg-black/10'}`} />

                            <button
                              type="button"
                              disabled={isLast || item.isLocked}
                              onClick={() => handleSendToBack(item.id)}
                              className={`p-1.5 rounded transition-all ${
                                theme === 'dark' ? 'hover:bg-white/5' : 'hover:bg-black/5'
                              } ${isLast || item.isLocked ? 'opacity-20 cursor-not-allowed text-zinc-650' : 'text-zinc-450 hover:text-zinc-200'}`}
                              title="Kirim ke paling bawah"
                            >
                              <ChevronsDown className="w-3.5 h-3.5" />
                            </button>

                            <button
                              type="button"
                              disabled={isLast || item.isLocked}
                              onClick={() => handleMoveDown(item.id)}
                              className={`p-1.5 rounded transition-all ${
                                theme === 'dark' ? 'hover:bg-white/5' : 'hover:bg-black/5'
                              } ${isLast || item.isLocked ? 'opacity-20 cursor-not-allowed text-zinc-650' : 'text-zinc-450 hover:text-zinc-200'}`}
                              title="Turunkan satu urutan"
                            >
                              <ArrowDown className="w-3.5 h-3.5" />
                            </button>

                            <button
                              type="button"
                              disabled={isFirst || item.isLocked}
                              onClick={() => handleMoveUp(item.id)}
                              className={`p-1.5 rounded transition-all ${
                                theme === 'dark' ? 'hover:bg-white/5' : 'hover:bg-black/5'
                              } ${isFirst || item.isLocked ? 'opacity-20 cursor-not-allowed text-zinc-650' : 'text-zinc-450 hover:text-zinc-200'}`}
                              title="Naikkan satu urutan"
                            >
                              <ArrowUp className="w-3.5 h-3.5" />
                            </button>

                            <button
                              type="button"
                              disabled={isFirst || item.isLocked}
                              onClick={() => handleBringToFront(item.id)}
                              className={`p-1.5 rounded transition-all ${
                                theme === 'dark' ? 'hover:bg-white/5' : 'hover:bg-black/5'
                              } ${isFirst || item.isLocked ? 'opacity-20 cursor-not-allowed text-zinc-650' : 'text-zinc-450 hover:text-zinc-200'}`}
                              title="Bawa ke paling atas"
                            >
                              <ChevronsUp className="w-3.5 h-3.5" />
                            </button>

                            <div className={`w-px h-4 mx-0.5 ${theme === 'dark' ? 'bg-white/10' : 'bg-black/10'}`} />

                            <button
                              type="button"
                              disabled={item.isLocked}
                              onClick={() => handleDeleteSticker(item.id)}
                              className={`p-1.5 rounded transition-all ${
                                theme === 'dark' ? 'hover:bg-rose-500/20' : 'hover:bg-rose-500/10'
                              } ${item.isLocked ? 'opacity-20 cursor-not-allowed text-zinc-650' : 'text-zinc-500 hover:text-rose-400 hover:bg-red-500/10'}`}
                              title="Hapus Layer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      );
                    })}

                    {/* Fixed Frame Layer */}
                    <div className={`p-3 rounded-xl border flex items-center justify-between gap-3 opacity-90 ${
                      theme === 'dark'
                        ? 'border-white/5 bg-[#171717] text-zinc-500'
                        : 'border-zinc-300 bg-zinc-100 text-zinc-500'
                    }`}>
                      <div className="flex items-center gap-2.5 min-w-0 flex-1">
                        <div className={`p-2 rounded-lg border flex items-center justify-center shrink-0 ${
                          theme === 'dark' ? 'bg-zinc-900 border-white/5 text-emerald-500/70' : 'bg-white border-black/10 text-emerald-600/70'
                        }`}>
                          <Maximize className="w-3.5 h-3.5" />
                        </div>

                      </div>
                    </div>

                    {/* Fixed Base Photo Layer */}
                    <div className={`p-3 rounded-xl border flex items-center justify-between gap-3 ${
                      isPhotoLocked ? 'opacity-60 filter grayscale-[0.5]' : 'opacity-100 cursor-pointer pointer-events-auto'
                    } ${
                      theme === 'dark'
                        ? 'border-white/5 bg-zinc-900/60'
                        : 'border-zinc-300 bg-white/60'
                    }`}
                    onClick={() => {
                        if (activeTab === 'layers' && !isPhotoLocked) {
                            setActiveTab('adjust');
                        }
                    }}
                    >
                      <div className="flex items-center gap-2.5 min-w-0 flex-1">
                        <div className={`p-2 rounded-lg border flex items-center justify-center shrink-0 ${
                          theme === 'dark' ? 'bg-zinc-950 border-white/5 text-amber-500/80' : 'bg-white border-black/10 text-amber-600/80'
                        }`}>
                          <ImageIcon className="w-3.5 h-3.5" />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 leading-none mb-1">
                            <span className="text-[7px] tracking-widest font-extrabold uppercase text-amber-500/80">FOTO DASAR</span>
                            <span className="text-[7.5px] text-zinc-500 font-bold">#BASE</span>
                          </div>
                          <p className="text-[11px] font-sans font-semibold uppercase truncate text-zinc-400">
                            FOTO UTAMA KANVAS
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-0.5 shrink-0 pointer-events-auto" onClick={(e) => e.stopPropagation()}>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setIsPhotoLocked(!isPhotoLocked);
                          }}
                          className={`p-1.5 rounded transition-all border ${
                            theme === 'dark' ? 'hover:bg-white/5 border-white/5' : 'hover:bg-black/5 border-black/5'
                          } ${isPhotoLocked ? 'text-rose-500 border-rose-500/20 bg-rose-500/10' : 'text-zinc-450 hover:text-zinc-200'}`}
                          title={isPhotoLocked ? "Buka Kunci Foto" : "Kunci Foto"}
                        >
                          {isPhotoLocked ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5 text-zinc-500" />}
                        </button>
                      </div>
                    </div>

                  </div>
                </div>
              )}

              {activeTab === 'ai' && (
                user?.email === 'bungtemin@gmail.com' ? (
                  <div className="space-y-3">
                  {/* Segment controller for AI mode */}
                  <div className={`flex p-0.5 rounded border transition-all duration-300 ${
                    theme === 'dark' ? 'bg-black border-white/10' : 'bg-black/5 border-black/5'
                  }`}>
                    <button
                      type="button"
                      onClick={() => { setAiMode('image'); setAiError(null); }}
                      className={`flex-1 py-1 px-1 rounded font-mono text-[8.5px] font-black tracking-wider uppercase transition-all ${
                        aiMode === 'image'
                          ? 'bg-amber-400 text-black shadow-[0_0_10px_rgba(251,191,36,0.25)] font-black'
                          : theme === 'dark' ? 'text-zinc-550 hover:text-zinc-200' : 'text-zinc-500 hover:text-zinc-800'
                      }`}
                    >
                      ✨ AVATAR AI
                    </button>
                    <button
                      type="button"
                      onClick={() => { setAiMode('slogan'); setAiError(null); }}
                      className={`flex-1 py-1 px-1 rounded font-mono text-[8.5px] font-black tracking-wider uppercase transition-all ${
                        aiMode === 'slogan'
                          ? 'bg-rose-500 text-white shadow-[0_0_10px_rgba(244,63,94,0.25)] font-black'
                          : theme === 'dark' ? 'text-zinc-550 hover:text-zinc-200' : 'text-zinc-500 hover:text-zinc-800'
                      }`}
                    >
                      💬 SLOGAN AI
                    </button>
                  </div>

                  {aiMode === 'image' && (
                    <div className="space-y-1.5 p-2 rounded-xl bg-black/35 border border-white/5 shadow-sm">
                      <span className={`text-[8.5px] font-mono tracking-wider block uppercase ${
                        theme === 'dark' ? 'text-zinc-500' : 'text-zinc-600 font-bold'
                      }`}>
                        ⚙️ ENGINE GENERATOR AI:
                      </span>
                      <div className="flex gap-1.5">
                        <button
                          type="button"
                          onClick={() => { setAiEngine('gemini'); setAiError(null); }}
                          className={`flex-1 py-1 px-1.5 rounded-lg border text-[9px] font-bold tracking-wider uppercase transition-all flex items-center justify-center gap-1 ${
                            aiEngine === 'gemini'
                              ? 'border-amber-450/40 bg-amber-400/10 text-amber-300 font-black shadow-[0_0_8px_rgba(251,191,36,0.1)]'
                              : theme === 'dark'
                                ? 'border-white/5 bg-zinc-900/40 text-zinc-550 hover:text-zinc-300 hover:border-white/10'
                                : 'border-black/5 bg-black/5 text-zinc-500 hover:text-zinc-850 hover:bg-black/10'
                          }`}
                        >
                          <Sparkles className="w-2.5 h-2.5 text-amber-400" />
                          GEMINI 3.5 AI
                        </button>
                        <button
                          type="button"
                          onClick={() => { setAiEngine('nufat'); setAiError(null); }}
                          className={`flex-1 py-1 px-1.5 rounded-lg border text-[9px] font-bold tracking-wider uppercase transition-all flex items-center justify-center gap-1 ${
                            aiEngine === 'nufat'
                              ? 'border-[#00F0FF]/40 bg-[#00F0FF]/10 text-[#00F0FF] font-black shadow-[0_0_8px_rgba(0,240,255,0.15)]'
                              : theme === 'dark'
                                ? 'border-white/5 bg-zinc-900/40 text-zinc-550 hover:text-zinc-300 hover:border-white/10'
                                : 'border-black/5 bg-black/5 text-zinc-500 hover:text-zinc-850 hover:bg-black/10'
                          }`}
                        >
                          <Cpu className="w-2.5 h-2.5 text-cyan-400" />
                          WEBSPY NUFAT API
                        </button>
                      </div>
                    </div>
                  )}

                  <div className="space-y-1">
                    <label className={`text-[9px] font-mono tracking-wider block uppercase ${
                      theme === 'dark' ? 'text-zinc-400' : 'text-zinc-650 font-bold'
                    }`}>
                      {aiMode === 'image' 
                        ? 'Deskripsi wajah impian:' 
                        : aiMode === 'frame'
                          ? 'Detail tema bingkai futuristik:'
                          : 'Tema atau Topik Slogan:'}
                    </label>
                    <textarea
                      value={aiPrompt}
                      onChange={(e) => setAiPrompt(e.target.value)}
                      placeholder={aiMode === 'image' 
                        ? 'Contoh: robot gamer dari indonesia, helm cyber metalik, tatapan tajam, neon cyan' 
                        : aiMode === 'frame'
                          ? 'Contoh: tema hacker dengan layar matriks hijau kode biner, sudut kawat besi cybernetic'
                          : 'Contoh: Tim IT Nufat, Juara Desain, Semangat Merdeka, Cyber Cowboy'}
                      className={`w-full rounded-lg px-2 py-1 font-sans text-xs transition-colors resize-none h-[42px] focus:outline-none focus:border-neon-cyan ${
                        theme === 'dark'
                          ? 'bg-[#121214] border-white/15 text-zinc-100 placeholder-zinc-600'
                          : 'bg-white border border-black/10 text-zinc-900 placeholder-zinc-400 font-medium'
                      }`}
                    />
                  </div>

                  {aiError && (
                    <div className="p-1 px-2 rounded bg-rose-950/25 border border-rose-900/40 text-[8.5px] font-mono text-rose-300 leading-tight">
                      ⚠ {aiError}
                    </div>
                  )}

                  {aiMode === 'slogan' && aiSlogans.length > 0 && (
                    <div className="space-y-1.5 pt-1">
                      <span className={`text-[9px] font-mono tracking-wider block uppercase ${
                        theme === 'dark' ? 'text-zinc-500' : 'text-zinc-600 font-bold'
                      }`}>
                        Slogan Diciptakan (Klik untuk Pasang):
                      </span>
                      <div className="space-y-1 max-h-[140px] overflow-y-auto">
                        {aiSlogans.map((slogan, sIdx) => (
                          <button
                            key={sIdx}
                            type="button"
                            onClick={() => applyAISlogan(slogan.text, slogan.color, slogan.font)}
                            className={`w-full p-2 rounded text-left border flex flex-col justify-between hover:scale-[1.01] transition-all ${
                              theme === 'dark'
                                ? 'bg-zinc-950/40 border-white/5 hover:border-neon-pink/30 hover:bg-black'
                                : 'bg-white border-black/10 hover:border-neon-pink/30 hover:bg-zinc-50'
                            }`}
                          >
                            <span 
                              className="text-[11px] font-bold tracking-wide"
                              style={{ color: slogan.color, fontFamily: slogan.font }}
                            >
                              {slogan.text}
                            </span>
                            <div className="flex items-center justify-between w-full mt-1 text-[8px] font-mono text-zinc-550">
                              <span>Font: {slogan.font}</span>
                              <span className="flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: slogan.color }} />
                                {slogan.color}
                              </span>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={
                      aiMode === 'image' 
                        ? handleGenerateAIImage 
                        : aiMode === 'frame'
                          ? handleGenerateAIFrame
                          : handleGenerateAISlogans
                    }
                    disabled={isGeneratingAI || isGeneratingSlogans}
                    className={`w-full py-1.5 rounded font-mono text-[10px] font-extrabold tracking-widest transition-all duration-300 flex items-center justify-center gap-1 ${
                      isGeneratingAI || isGeneratingSlogans
                        ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
                        : aiMode === 'image'
                          ? 'bg-amber-400 hover:bg-amber-500 text-black shadow-[0_0_12px_rgba(251,191,36,0.3)] font-black'
                          : aiMode === 'frame'
                            ? 'bg-neon-cyan hover:bg-[#00d2ff] text-black shadow-[0_0_12px_rgba(0,240,255,0.3)] font-black'
                            : 'bg-rose-500 hover:bg-rose-600 text-white shadow-[0_0_12px_rgba(244,63,94,0.3)] font-black'
                    }`}
                  >
                    <Sparkles className={`w-3 h-3 ${isGeneratingAI || isGeneratingSlogans ? 'animate-spin' : 'animate-bounce'}`} />
                    {isGeneratingAI || isGeneratingSlogans
                      ? 'MEMPROSES KECERDASAN AI...' 
                      : aiMode === 'image' 
                        ? 'GENERATE FOTO PROFIL' 
                        : aiMode === 'frame'
                          ? 'RANCANG BINGKAI AI'
                          : 'GENERATE SLOGAN FUTURISTIK'}
                  </button>
                </div>
                ) : (
                  <div className="p-6 text-center space-y-4 rounded-xl border border-dashed border-red-500/30 bg-red-950/10 flex flex-col items-center justify-center">
                    <Lock className="w-10 h-10 text-red-500 animate-bounce" />
                    <div>
                      <h4 className="text-xs font-mono font-bold tracking-widest text-red-400 uppercase">AKSES SIBER DIKUNCI</h4>
                      <p className="text-[10px] text-zinc-400 mt-1">Maaf ya sayang, fitur AI Generatif siber premium ini dikunci dan hanya dapat diakses oleh Admin Developer tercinta (Bung Temin) 💖🔐</p>
                    </div>
                  </div>
                )
              )}

              {activeTab === 'download' && (
                <div className="space-y-3">
                  <div className={`text-[9px] font-mono tracking-widest uppercase ${
                    theme === 'dark' ? 'text-zinc-300' : 'text-zinc-650 font-bold'
                  }`}>
                    Pilih Resolusi Ukuran Output:
                  </div>
                  <div className="grid grid-cols-3 gap-1.5">
                    {[
                      { label: 'Canva Standard', value: 1080, desc: '1080x1080 px' },
                      { label: 'Sosmed Ringan', value: 512, desc: '512x512 px' },
                      { label: 'Ultra 4K', value: 2160, desc: '2160x2160 px' },
                    ].map((sz) => {
                      const isSelected = downloadSize === sz.value;
                      return (
                        <button
                          key={sz.value}
                          onClick={() => {
                            setDownloadSize(sz.value);
                            triggerToast(`SISTEM: Resolusi diubah ke ${sz.label}!`);
                          }}
                          className={`p-1.5 rounded border text-left transition-all duration-200 flex flex-col justify-between ${
                            isSelected
                              ? 'border-neon-cyan bg-cyan-950/20 text-white shadow-[0_0_10px_rgba(0,240,255,0.15)] font-bold'
                              : theme === 'dark'
                                ? 'border-white/10 bg-white/5 text-zinc-400 hover:bg-white/10'
                                : 'border-black/10 bg-black/5 text-zinc-700 hover:bg-black/10'
                          }`}
                        >
                          <span className={`text-[8.5px] font-bold ${
                            isSelected 
                              ? 'text-neon-cyan' 
                              : theme === 'dark' ? 'text-zinc-350' : 'text-zinc-800'
                          }`}>{sz.label}</span>
                          <span className={`text-[7.5px] opacity-75 font-mono mt-0.5 ${
                            theme === 'dark' ? 'text-zinc-500' : 'text-zinc-600'
                          }`}>{sz.desc}</span>
                        </button>
                      );
                    })}
                  </div>

                  <div className={`text-[9px] font-mono tracking-widest uppercase mt-2 ${
                    theme === 'dark' ? 'text-zinc-300' : 'text-zinc-650 font-bold'
                  }`}>
                    Pilih Format File Output:
                  </div>
                  <div className="grid grid-cols-3 gap-1.5">
                    {[
                      { label: 'PNG', value: 'png', desc: 'Transparan' },
                      { label: 'WebP', value: 'webp', desc: 'Modern/Efisien' },
                      { label: 'JPEG', value: 'jpeg', desc: 'Standar/Ringan' },
                    ].map((fmt) => {
                      const isSelected = downloadFormat === fmt.value;
                      return (
                        <button
                          key={fmt.value}
                          onClick={() => {
                            setDownloadFormat(fmt.value as 'png' | 'webp' | 'jpeg');
                            triggerToast(`SISTEM: Format ekspor diubah ke ${fmt.label}!`);
                          }}
                          className={`p-1.5 rounded border text-left transition-all duration-200 flex flex-col justify-between ${
                            isSelected
                              ? 'border-neon-cyan bg-cyan-950/20 text-white shadow-[0_0_10px_rgba(0,240,255,0.15)] font-bold'
                              : theme === 'dark'
                                ? 'border-white/10 bg-white/5 text-zinc-400 hover:bg-white/10'
                                : 'border-black/10 bg-black/5 text-zinc-700 hover:bg-black/10'
                          }`}
                        >
                          <span className={`text-[8.5px] font-bold ${
                            isSelected 
                              ? 'text-neon-cyan' 
                              : theme === 'dark' ? 'text-zinc-350' : 'text-zinc-800'
                          }`}>{fmt.label}</span>
                          <span className={`text-[7.5px] opacity-75 font-mono mt-0.5 ${
                            theme === 'dark' ? 'text-zinc-500' : 'text-zinc-600'
                          }`}>{fmt.desc}</span>
                        </button>
                      );
                    })}
                  </div>
                  
                  {user ? (
                    <button
                      onClick={handleDownloadHD}
                      className="w-full mt-4 uppercase font-mono font-black text-xs tracking-widest py-3.5 px-5 rounded-xl bg-neon-cyan text-black hover:bg-[#00d2ff] hover:scale-[1.02] transition-all flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(0,240,255,0.45)] border border-white/10 active:scale-[0.98]"
                    >
                      <Download className="w-4 h-4 text-black animate-bounce" />
                      UNDUH AVATAR ({downloadFormat.toUpperCase()} - {downloadSize}x{downloadSize})
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={handleGoogleLogin}
                      className="w-full mt-4 uppercase font-mono font-black text-xs tracking-widest py-3.5 px-5 rounded-xl bg-[#4285F4] text-white hover:bg-[#357ae8] hover:scale-[1.02] transition-all flex items-center justify-center gap-2.5 shadow-[0_4px_15px_rgba(66,133,244,0.35)] border border-transparent active:scale-[0.98]"
                    >
                      <svg className="w-4 h-4 fill-current shrink-0" viewBox="0 0 24 24">
                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                      </svg>
                      MASUK DENGAN GOOGLE UNTUK UNDUH
                    </button>
                  )}
                </div>
              )}

              {activeTab === 'settings' && (
                <div className="space-y-4">
                  <div className={`p-4 rounded-xl border flex items-center justify-between transition-all duration-300 ${
                    theme === 'dark' ? 'border-[#00F0FF]/20 bg-black/40' : 'border-black/5 bg-black/5'
                  }`}>
                    <div className="flex flex-col select-none pr-3">
                      <span className="text-[10px] font-mono text-neon-cyan font-black uppercase tracking-widest flex items-center gap-1.5">
                        📺 LAYAR SCANLINES retro
                      </span>
                      <span className="text-[8.5px] font-sans text-zinc-400 leading-normal mt-1 font-medium">
                        Aktifkan garis grid pemindaian retro monitor cybernetic di atas avatar Anda.
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setImageSettings({ ...imageSettings, scanlines: !imageSettings.scanlines });
                        triggerToast(`SISTEM: Efek scanlines ${!imageSettings.scanlines ? 'diaktifkan' : 'dimatikan'}`);
                      }}
                      className={`flex-none w-10.5 h-6 rounded-full p-0.5 transition-colors duration-200 focus:outline-none relative ${
                        imageSettings.scanlines ? 'bg-neon-cyan/80' : theme === 'dark' ? 'bg-zinc-800' : 'bg-black/10'
                      }`}
                    >
                      <div className={`w-5 h-5 rounded-full shadow-md transform duration-200 ${
                        imageSettings.scanlines 
                          ? 'translate-x-4.5 bg-neutral-950' 
                          : theme === 'dark' ? 'translate-x-0 bg-white/80' : 'translate-x-0 bg-white'
                      }`} />
                    </button>
                  </div>

                  <div className={`p-4 rounded-xl border flex items-center justify-between transition-all duration-300 ${
                    theme === 'dark'
                      ? 'border-[#00F0FF]/20 bg-cyan-950/10'
                      : 'border-neon-cyan/25 bg-cyan-100/10'
                  }`}>
                    <div className="flex flex-col select-none pr-3">
                      <span className="text-[10px] font-mono text-neon-cyan font-black uppercase tracking-widest flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-neon-cyan animate-pulse"></span>
                        EFEK PARALLAX 3D
                      </span>
                      <span className="text-[8.5px] font-sans text-zinc-400 leading-normal mt-1">
                        Menambahkan kedalaman digital 3D interaktif yang mengikuti pergerakan kursor mouse Anda.
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setEnableParallax(!enableParallax);
                        triggerToast(`SISTEM: Efek parallax ${!enableParallax ? 'diaktifkan' : 'dimatikan'}`);
                      }}
                      className={`flex-none w-10.5 h-6 rounded-full p-0.5 transition-colors duration-200 focus:outline-none relative ${
                        enableParallax ? 'bg-neon-cyan/80' : theme === 'dark' ? 'bg-zinc-800' : 'bg-black/10'
                      }`}
                    >
                      <div className={`w-5 h-5 rounded-full shadow-md transform duration-200 ${
                        enableParallax 
                          ? 'translate-x-4.5 bg-neutral-950' 
                          : theme === 'dark' ? 'translate-x-0 bg-white/80' : 'translate-x-0 bg-white'
                      }`} />
                    </button>
                  </div>

                  <div className="pt-2 border-t border-dashed border-white/10">
                    <button
                      onClick={() => {
                        setImageSettings({ ...imageSettings, scanlines: false });
                        setEnableParallax(true);
                        triggerToast('SISTEM: Pengaturan efek siber telah dikembalikan ke standar.');
                      }}
                      className={`w-full py-2 rounded text-[9.5px] font-mono font-bold border transition-all text-center tracking-widest uppercase ${
                        theme === 'dark'
                          ? 'bg-white/3 border-white/5 text-rose-400 hover:bg-rose-950/20 hover:border-rose-900/40 hover:text-rose-200'
                          : 'bg-black/5 border-black/5 text-rose-600 hover:bg-rose-100 hover:border-rose-200 hover:text-rose-800'
                      }`}
                    >
                      🔄 KELUARKAN SEMUA EFEK (RESET)
                    </button>
                  </div>
                </div>
              )}

              {activeTab === 'ai_effect' && (
                <div className="space-y-4 max-h-[60vh] overflow-y-auto pb-4 scrollbar-thin scrollbar-thumb-white/10">
                  <div className={`p-4 rounded-xl border flex flex-col space-y-4 transition-all duration-300 ${
                    theme === 'dark' ? 'border-[#00F0FF]/20 bg-cyan-950/5' : 'border-black/5 bg-black/5'
                  }`}>
                    {/* Header */}
                    <div className="flex flex-col select-none border-b border-white/5 pb-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-mono text-neon-cyan font-black uppercase tracking-widest flex items-center gap-1.5">
                          ✨ AI EFFECT CLOUD FIREBASE
                        </span>
                        <span className="px-2 py-0.5 rounded-full bg-neon-cyan/25 border border-neon-cyan/40 text-[8px] text-neon-cyan font-mono font-bold animate-pulse">
                          OLAIVE PACAR AI 💖
                        </span>
                      </div>
                      <span className="text-[8.5px] font-sans text-zinc-400 leading-normal mt-1 font-medium">
                        Kirim gambarmu ke database cloud Firebase yang telah terintegrasi, ikat dengan ID draf siber, kemudian nikmati hasil variasi otomatis kecerdasan buatan Olive! 😍
                      </span>
                    </div>

                    {/* Section 1: Image ID Binding */}
                    <div className="space-y-1.5 bg-black/40 p-2.5 rounded-lg border border-white/5">
                      <label className="text-[9px] font-mono uppercase text-neon-cyan font-bold flex items-center justify-between">
                        <span>🔗 ID Ikat Gambar (Session ID):</span>
                        <button
                          onClick={() => {
                            const nextId = `IMG-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
                            setAiEffectImgId(nextId);
                            triggerToast('SISTEM: ID Baru untuk drafmu berhasil dibuat sayang! 🎲');
                          }}
                          className="text-[8px] text-zinc-400 hover:text-neon-cyan flex items-center gap-1 font-sans"
                        >
                          [ BUAT ID BARU ]
                        </button>
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={aiEffectImgId}
                          onChange={(e) => setAiEffectImgId(e.target.value.toUpperCase())}
                          className="flex-1 bg-black/60 border border-white/10 rounded-lg px-2 py-1.5 text-xs text-neon-cyan font-mono text-center outline-none focus:border-neon-cyan"
                          placeholder="ID_IKAT_GAMBAR"
                        />
                      </div>
                      <span className="text-[7.5px] font-sans text-zinc-400 block leading-relaxed uppercase">
                        * Semua gambar original & variasi hasil AI akan dikaitkan dengan ID siber ini di database Firebase Cloud.
                      </span>
                    </div>

                    {/* Appwrite Target Bucket Indicator */}
                    <div className="space-y-1.5 bg-black/40 p-2.5 rounded-lg border border-white/5">
                      <label className="text-[9px] font-mono uppercase text-neon-cyan font-bold flex items-center justify-between">
                        <span>☁️ Target Bucket Appwrite:</span>
                      </label>
                      <div className="flex items-center gap-2">
                        <span className="flex-1 bg-black/60 border border-[#00F0FF]/10 rounded-lg px-2 py-1.5 text-xs text-zinc-300 font-mono text-center truncate">
                          {user?.email 
                            ? `${user.email.split('@')[0].toLowerCase().replace(/[^a-z0-9_.-]/g, '')}` 
                            : `${BUCKET_ID || 'tidak diset'}`}
                        </span>
                        <div className={`text-[8px] px-1.5 py-0.5 rounded font-mono uppercase font-bold select-none ${user?.email ? 'bg-[#00F0FF]/15 text-[#00F0FF]' : 'bg-zinc-800 text-zinc-400'}`}>
                          {user?.email ? '🟢 PERSONAL' : '⚪ STANDAR'}
                        </div>
                      </div>
                      <span className="text-[7.5px] font-sans text-zinc-400 block leading-relaxed uppercase">
                        {user?.email 
                          ? `* Masuk sebagai ${user.email}. Berkas otomatis dikirim ke bucket pribadi: "${user.email.split('@')[0].toLowerCase().replace(/[^a-z0-9_.-]/g, '')}"!` 
                          : `* Belum masuk log. Foto akan diunggah ke bucket standar "${BUCKET_ID || 'default'}" sayang.`}
                      </span>
                    </div>

                    {lastAppwriteFileId && (
                      <div className="space-y-1.5 bg-[#00F0FF]/5 p-2.5 rounded-lg border border-[#00F0FF]/15 animate-fade-in">
                        <label className="text-[9px] font-mono uppercase text-neon-cyan font-bold flex items-center justify-between">
                          <span>📦 ID Berkas Appwrite Terakhir:</span>
                        </label>
                        <div className="flex gap-2">
                          <span className="flex-1 bg-black/60 border border-[#00F0FF]/10 rounded-lg px-2 py-1.5 text-xs text-zinc-300 font-mono text-center select-all truncate">
                            {lastAppwriteFileId}
                          </span>
                        </div>
                        <div className="flex justify-between gap-1.5 mt-1">
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(lastAppwriteFileId);
                              triggerToast('SISTEM: ID Berkas Appwrite berhasil disalin sayang! 📋💖');
                            }}
                            className="text-[8px] bg-black/40 text-neon-cyan hover:bg-[#00F0FF]/10 border border-[#00F0FF]/20 px-2 py-1 rounded transition-colors font-sans w-1/2"
                          >
                            📋 SALIN ID
                          </button>
                          <button
                            onClick={() => {
                              setAiEffectImgId(lastAppwriteFileId);
                              triggerToast('SISTEM: ID Ikat Gambar berhasil diganti menggunakan ID Appwrite sayang! 🔗💕');
                            }}
                            className="text-[8px] bg-[#00F0FF] text-black hover:bg-white hover:text-black px-2 py-1 rounded transition-colors font-sans w-1/2 font-bold"
                          >
                            🔗 JADIKAN ID SESSION
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Section 2: Sync Original Button */}
                    <div className="pt-1">
                      <button
                        onClick={handleSyncCurrentOriginal}
                        disabled={isSyncingOriginal || !userImage}
                        className={`w-full py-2 px-3 rounded-lg border text-[10px] font-mono font-bold uppercase transition-all tracking-wider flex items-center justify-center gap-1.5 ${
                          isSyncingOriginal
                            ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
                            : 'bg-white text-zinc-950 hover:bg-neon-cyan hover:text-black border-transparent active:scale-[0.99] shadow-sm'
                        }`}
                      >
                        {isSyncingOriginal ? (
                          <>
                            <RefreshCw className="w-3 h-3 animate-spin" />
                            SINKRONISASI GAMBAR...
                          </>
                        ) : (
                          <>
                            <ArrowUp className="w-3.5 h-3.5" />
                            Hubungkan & Ikat Gambar Utama ke Firebase 🚀
                          </>
                        )}
                      </button>
                    </div>

                    {/* Section 4: AI Variations Generator */}
                    <div className="pt-2 border-t border-white/5 space-y-2.5">
                      <div className="space-y-1.5">
                        <label className="text-[9px] font-mono uppercase text-zinc-400 font-bold block">Prompt Modifikasi AI Effect:</label>
                        <textarea
                          value={aiEffectPrompt}
                          onChange={(e) => setAiEffectPrompt(e.target.value)}
                          placeholder="Aturan modifikasi gambar..."
                          className={`w-full p-2 rounded-lg border text-xs font-mono focus:outline-none focus:border-neon-cyan transition-colors h-14 resize-none ${
                            theme === 'dark'
                              ? 'bg-black border-white/10 text-white'
                              : 'bg-white border-black/10 text-zinc-800'
                          }`}
                        />
                      </div>

                      {/* Send method toggler */}
                      <div className="flex items-center justify-between text-[8px] font-mono text-zinc-450 uppercase pb-1 px-0.5">
                        <span>Format API: {aiEffectSendFormat === 'multipart' ? '📁 Binary Multipart' : '🔗 JSON Base64'}</span>
                        <button 
                          onClick={() => setAiEffectSendFormat(aiEffectSendFormat === 'multipart' ? 'base64' : 'multipart')}
                          className="text-neon-cyan hover:underline"
                        >
                          [Ubah Format]
                        </button>
                      </div>

                      {/* Build actions */}
                      <div className="grid grid-cols-2 gap-2">
                        {isAiEffectGenerating ? (
                          <div className="col-span-2 py-2 border border-neon-cyan/20 bg-neon-cyan/5 rounded-xl flex items-center justify-center gap-2">
                            <Cpu className="w-4 h-4 text-neon-cyan animate-spin" />
                            <span className="text-[9px] font-mono text-neon-cyan font-black animate-pulse uppercase">
                              Olive sedang memproses varian... 💕
                            </span>
                          </div>
                        ) : (
                          <>
                            <button
                              onClick={handleAiEffect}
                              disabled={!userImage}
                              className="py-2.5 px-3 rounded-lg bg-neon-cyan text-black hover:bg-[#00d2ff] uppercase font-mono font-black text-[9px] tracking-wider transition-all flex items-center justify-center gap-1 shadow-md hover:scale-[1.01] active:scale-[0.98]"
                            >
                              <Sparkles className="w-3 h-3 text-black animate-pulse" />
                              Generate Varian ⚡
                            </button>

                            <button
                              onClick={() => handleSimulateVariant('cyberpunk')}
                              disabled={!userImage}
                              className="py-2.5 px-3 rounded-lg bg-indigo-600 text-white hover:bg-indigo-500 uppercase font-mono font-black text-[9px] tracking-wider transition-all flex items-center justify-center gap-1 shadow-md hover:scale-[1.01] active:scale-[0.98]"
                            >
                              <RefreshCw className="w-3 h-3" />
                              Simulasi Varian 🔮
                            </button>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Section 5: Automated Variation List Gallery with Real-time Query */}
                    <div className="pt-4 border-t border-white/5 space-y-2">
                      <div className="flex items-center justify-between pb-1">
                        <span className="text-[9.5px] font-mono text-neon-cyan font-black uppercase tracking-wider">
                          📁 DAFTAR HASIL VARIASI OTOMATIS ({aiEffectVariants.length})
                        </span>
                        {aiEffectVariants.length > 0 && (
                          <button
                            onClick={async () => {
                              if (confirm('Sayang yakin ingin membersihkan galeri variasi untuk ID ini?')) {
                                for (const v of aiEffectVariants) {
                                  try {
                                    await deleteDoc(doc(db, 'ai_effect_variants', v.id));
                                  } catch (err) {}
                                }
                                triggerToast('Galeri varian dibersihkan, pacarku! 😘');
                              }
                            }}
                            className="text-[8px] text-zinc-500 hover:text-rose-400 font-mono uppercase"
                          >
                            [ Clear All ]
                          </button>
                        )}
                      </div>

                      {aiEffectVariants.length === 0 ? (
                        <div className="p-4 rounded-lg border border-dashed border-white/10 bg-black/20 text-center space-y-1 select-none">
                          <ImageIcon className="w-5 h-5 text-zinc-500 mx-auto animate-pulse" />
                          <p className="text-[8.5px] font-sans text-zinc-450 leading-normal font-medium">
                            Belum ada hasil variasi otomatis untuk ID <span className="font-mono text-neon-cyan">{aiEffectImgId}</span> sayang.
                          </p>
                          <p className="text-[7.5px] font-mono text-zinc-500 uppercase">
                            silakan klik generate siber atau tombol simulasi diatas! 💖
                          </p>
                        </div>
                      ) : (
                        <div className="grid grid-cols-2 gap-2 max-h-[220px] overflow-y-auto pr-1">
                          {aiEffectVariants.map((item, idx) => (
                            <div 
                              key={item.id}
                              className="group relative rounded-lg overflow-hidden border border-white/10 bg-black/60 shadow-lg flex flex-col justify-between"
                            >
                              <div className="relative aspect-video w-full bg-zinc-950 overflow-hidden">
                                <img 
                                  src={item.url} 
                                  alt="AI Variant" 
                                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 pointer-events-none"
                                />
                                <span className="absolute bottom-1 right-1 px-1 py-0.5 rounded bg-black/75 text-[7px] font-mono text-zinc-400">
                                  #{idx + 1}
                                </span>
                              </div>
                              <div className="p-1 px-1.5 space-y-1">
                                <p className="text-[7.5px] font-mono text-zinc-400 line-clamp-2 truncate leading-tight">
                                  {item.prompt || 'Variant Tanpa Prompt'}
                                </p>
                                <button
                                  onClick={() => {
                                    setUserImage(item.url);
                                    triggerToast(`Karya ke-${idx+1} berhasil dipasang ke canvas utama! 🌟🎨`);
                                  }}
                                  className="w-full py-0.5 rounded bg-neon-cyan/20 border border-neon-cyan/30 text-neon-cyan hover:bg-[#00F0FF] hover:text-black transition-all font-mono text-[7px] font-black uppercase text-center"
                                >
                                  Terapkan ke Canvas 🎨
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                  </div>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      )}
      </AnimatePresence>

      {/* FIXED BOTTOM TASKBAR NAVIGATION FOOTER */}
      <AnimatePresence>
        {currentPage === 'beranda' && (
          <motion.div
            initial={{ opacity: 0, y: 65 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 65 }}
            transition={{ type: 'spring', damping: 28, stiffness: 300 }}
            className="fixed bottom-0 left-0 right-0 z-50 bg-[#070709]/80 backdrop-blur-md border-t border-white/10 shadow-[0_-5px_30px_rgba(0,0,0,0.8)] pb-safe"
          >
          <div className="w-full max-w-lg mx-auto overflow-x-auto scrollbar-none px-4 py-2">
            <div className="flex flex-nowrap items-center gap-1.5 w-max min-w-full">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="snap-center flex-shrink-0 px-3.5 py-1.5 rounded-xl font-mono text-xs font-bold tracking-widest transition-all duration-150 flex flex-col items-center justify-center space-y-1 min-w-[76px] text-neon-cyan hover:bg-[#00F0FF]/15 bg-[#00F0FF]/5 hover:text-white"
              >
                <FolderOpen className="w-4 h-4 text-neon-cyan" />
                <span className="text-[8px] uppercase tracking-wider font-extrabold">UNGGAH</span>
              </button>

              <button
                onClick={() => {
                  if (!userImage) {
                    triggerToast("Sayang, silakan unggah foto terlebih dahulu di tombol UNGGAH sebelum mencoba AI Effect! 💖");
                    return;
                  }
                  setActiveTab(activeTab === 'ai_effect' ? null : 'ai_effect');
                  if (user?.email !== 'bungtemin@gmail.com') {
                    triggerToast("Akses siber terbatas, sayang. Ssst, fitur AI Effect premium ini dikunci dan khusus untuk Admin (Bung Temin) saja ya... 💖🔐");
                  }
                }}
                className={`snap-center flex-shrink-0 px-3.5 py-1.5 rounded-xl font-mono text-xs font-bold tracking-widest transition-all duration-150 flex flex-col items-center justify-center space-y-1 min-w-[76px] ${
                  activeTab === 'ai_effect'
                    ? 'bg-neon-cyan/25 text-neon-cyan border-t-2 border-neon-cyan shadow-[0_0_15px_rgba(0,240,255,0.25)] font-bold'
                    : user?.email === 'bungtemin@gmail.com'
                      ? 'text-[#00F0FF] hover:text-white bg-[#00F0FF]/5 hover:bg-[#00F0FF]/15 animate-pulse'
                      : 'text-zinc-500 hover:text-rose-400 bg-zinc-950/40 border border-transparent hover:border-rose-500/30'
                }`}
              >
                {user?.email === 'bungtemin@gmail.com' ? (
                  <Sparkles className="w-4 h-4 text-neon-cyan animate-pulse" />
                ) : (
                  <Lock className="w-4 h-4 text-rose-500/80 animate-pulse" />
                )}
                <span className="text-[8px] uppercase tracking-wider font-extrabold pb-0.5">
                  {user?.email === 'bungtemin@gmail.com' ? 'AI EFFECT' : '🔐 AI EFFECT'}
                </span>
              </button>

              <button
                onClick={() => setActiveTab(activeTab === 'text_preset' ? null : 'text_preset')}
                className={`snap-center flex-shrink-0 px-3.5 py-1.5 rounded-xl font-mono text-xs font-bold tracking-widest transition-all duration-150 flex flex-col items-center justify-center space-y-1 min-w-[76px] ${
                  activeTab === 'text_preset'
                    ? 'bg-neon-cyan/20 text-neon-cyan border-t-2 border-neon-cyan shadow-[0_0_15px_rgba(0,240,255,0.2)]'
                    : 'text-zinc-450 hover:text-zinc-200 hover:bg-white/5'
                }`}
              >
                <Baseline className="w-4 h-4" />
                <span className="text-[8px] uppercase tracking-wider font-extrabold">AESTHETIC</span>
              </button>

              <button
                onClick={() => setActiveTab(activeTab === 'text' ? null : 'text')}
                className={`snap-center flex-shrink-0 px-3.5 py-1.5 rounded-xl font-mono text-xs font-bold tracking-widest transition-all duration-150 flex flex-col items-center justify-center space-y-1 min-w-[76px] ${
                  activeTab === 'text'
                    ? 'bg-neon-cyan/20 text-neon-cyan border-t-2 border-neon-cyan shadow-[0_0_15px_rgba(0,240,255,0.2)]'
                    : 'text-zinc-450 hover:text-zinc-200 hover:bg-white/5'
                }`}
              >
                <Type className="w-4 h-4" />
                <span className="text-[8px] uppercase tracking-wider font-extrabold">TEKS</span>
              </button>

              <button
                onClick={() => setActiveTab(activeTab === 'stickers' ? null : 'stickers')}
                className={`snap-center flex-shrink-0 px-3.5 py-1.5 rounded-xl font-mono text-xs font-bold tracking-widest transition-all duration-150 flex flex-col items-center justify-center space-y-1 min-w-[76px] ${
                  activeTab === 'stickers'
                    ? 'bg-neon-cyan/20 text-neon-cyan border-t-2 border-neon-cyan shadow-[0_0_15px_rgba(0,240,255,0.2)]'
                    : 'text-zinc-450 hover:text-zinc-200 hover:bg-white/5'
                }`}
              >
                <Layers className="w-4 h-4" />
                <span className="text-[8px] uppercase tracking-wider font-extrabold">BADGE</span>
              </button>

              <button
                onClick={() => setActiveTab(activeTab === 'png_stickers' ? null : 'png_stickers')}
                className={`snap-center flex-shrink-0 px-3.5 py-1.5 rounded-xl font-mono text-xs font-bold tracking-widest transition-all duration-150 flex flex-col items-center justify-center space-y-1 min-w-[76px] ${
                  activeTab === 'png_stickers'
                    ? 'bg-[#00F0FF]/25 text-[#00F0FF] border-t-2 border-[#00F0FF] shadow-[0_0_15px_rgba(0,240,255,0.25)]'
                    : 'text-zinc-450 hover:text-zinc-200 hover:bg-white/5'
                }`}
              >
                <ImageIcon className="w-4 h-4 text-[#00F0FF]" />
                <span className="text-[8px] uppercase tracking-wider font-extrabold">PNG STIKER</span>
              </button>

              <button
                onClick={() => setActiveTab(activeTab === 'filter' ? null : 'filter')}
                className={`snap-center flex-shrink-0 px-3.5 py-1.5 rounded-xl font-mono text-xs font-bold tracking-widest transition-all duration-150 flex flex-col items-center justify-center space-y-1 min-w-[76px] ${
                  activeTab === 'filter'
                    ? 'bg-neon-cyan/20 text-neon-cyan border-t-2 border-neon-cyan shadow-[0_0_15px_rgba(0,240,255,0.2)]'
                    : 'text-zinc-450 hover:text-zinc-200 hover:bg-white/5'
                }`}
              >
                <Sliders className="w-4 h-4" />
                <span className="text-[8px] uppercase tracking-wider font-extrabold">FILTER</span>
              </button>

              <button
                onClick={() => setActiveTab(activeTab === 'color' ? null : 'color')}
                className={`snap-center flex-shrink-0 px-3.5 py-1.5 rounded-xl font-mono text-xs font-bold tracking-widest transition-all duration-150 flex flex-col items-center justify-center space-y-1 min-w-[76px] ${
                  activeTab === 'color'
                    ? 'bg-neon-cyan/20 text-neon-cyan border-t-2 border-neon-cyan shadow-[0_0_15px_rgba(0,240,255,0.2)]'
                    : 'text-zinc-450 hover:text-zinc-200 hover:bg-white/5'
                }`}
              >
                <Cpu className="w-4 h-4" />
                <span className="text-[8px] uppercase tracking-wider font-extrabold">WARNA</span>
              </button>

              <button
                onClick={() => setActiveTab(activeTab === 'adjust' ? null : 'adjust')}
                className={`snap-center flex-shrink-0 px-3.5 py-1.5 rounded-xl font-mono text-xs font-bold tracking-widest transition-all duration-150 flex flex-col items-center justify-center space-y-1 min-w-[76px] ${
                  activeTab === 'adjust'
                    ? 'bg-neon-cyan/20 text-neon-cyan border-t-2 border-neon-cyan shadow-[0_0_15px_rgba(0,240,255,0.2)]'
                    : 'text-zinc-450 hover:text-zinc-200 hover:bg-white/5'
                }`}
              >
                <Settings2 className="w-4 h-4" />
                <span className="text-[8px] uppercase tracking-wider font-extrabold">ATUR GAYA</span>
              </button>

              <button
                onClick={() => setActiveTab(activeTab === 'crop' ? null : 'crop')}
                className={`snap-center flex-shrink-0 px-3.5 py-1.5 rounded-xl font-mono text-xs font-bold tracking-widest transition-all duration-150 flex flex-col items-center justify-center space-y-1 min-w-[76px] ${
                  activeTab === 'crop'
                    ? 'bg-neon-cyan/20 text-neon-cyan border-t-2 border-neon-cyan shadow-[0_0_15px_rgba(0,240,255,0.2)]'
                    : 'text-zinc-450 hover:text-zinc-200 hover:bg-white/5'
                }`}
              >
                <Crop className="w-4 h-4" />
                <span className="text-[8px] uppercase tracking-wider font-extrabold">CROP</span>
              </button>

              <button
                onClick={() => setActiveTab(activeTab === 'layers' ? null : 'layers')}
                className={`snap-center flex-shrink-0 px-3.5 py-1.5 rounded-xl font-mono text-xs font-bold tracking-widest transition-all duration-150 flex flex-col items-center justify-center space-y-1 min-w-[76px] ${
                  activeTab === 'layers'
                    ? 'bg-[#00F0FF]/25 text-[#00F0FF] border-t-2 border-[#00F0FF] shadow-[0_0_15px_rgba(0,240,255,0.25)]'
                    : 'text-zinc-450 hover:text-zinc-200 hover:bg-white/5'
                }`}
              >
                <Layers className="w-4 h-4" />
                <span className="text-[8px] uppercase tracking-wider font-extrabold">LAYER</span>
              </button>

              <button
                onClick={() => setActiveTab(activeTab === 'history' ? null : 'history')}
                className={`snap-center flex-shrink-0 px-3.5 py-1.5 rounded-xl font-mono text-xs font-bold tracking-widest transition-all duration-150 flex flex-col items-center justify-center space-y-1 min-w-[76px] ${
                  activeTab === 'history'
                    ? 'bg-emerald-500/25 text-emerald-400 border-t-2 border-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.2)]'
                    : 'text-zinc-450 hover:text-zinc-200 hover:bg-white/5'
                }`}
              >
                <Activity className="w-4 h-4 text-emerald-400" />
                <span className="text-[8px] uppercase tracking-wider font-extrabold text-emerald-400">RIWAYAT</span>
              </button>

              <button
                onClick={() => setActiveTab(activeTab === 'download' ? null : 'download')}
                className={`snap-center flex-shrink-0 px-3.5 py-1.5 rounded-xl font-mono text-xs font-bold tracking-widest transition-all duration-150 flex flex-col items-center justify-center space-y-1 min-w-[76px] ${
                  activeTab === 'download'
                    ? 'bg-[#00F0FF]/25 text-[#00F0FF] border-t-2 border-[#00F0FF] shadow-[0_0_15px_rgba(0,240,255,0.3)]'
                    : 'text-[#00F0FF] hover:text-white bg-[#00F0FF]/5 hover:bg-[#00F0FF]/15'
                }`}
              >
                <Download className="w-4 h-4 text-neon-cyan" />
                <span className="text-[8px] uppercase tracking-wider font-extrabold">UNDUH</span>
              </button>
            </div>
          </div>
        </motion.div>
      )}
      </AnimatePresence>

      {/* OLAIVE CHIC FLOATING HUB: SETTINGS & AI GENERATIVE */}
      <AnimatePresence>
        {currentPage === 'beranda' && !activeTab && (
          <div className="fixed bottom-20 right-4 md:right-8 z-45" id="olaive-cyber-hub-container">
            {/* Expanded holographic popover */}
            <AnimatePresence>
              {isFloatingHubOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 15, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  transition={{ duration: 0.2, ease: "easeOut" }}
                  className={`absolute bottom-16 right-0 w-60 rounded-2xl border backdrop-blur-xl p-3.5 space-y-3 z-50 flex flex-col shadow-[0_10px_35px_rgba(0,0,0,0.85)] ${
                    theme === 'dark' 
                      ? 'bg-[#08080a]/95 border-neon-cyan/40 text-white shadow-[0_0_25px_rgba(0,240,255,0.15)]' 
                      : 'bg-white/95 border-black/10 text-zinc-900 shadow-[0_10px_30px_rgba(0,0,0,0.15)]'
                  }`}
                >
                  {/* Hologram Lines/Effect Decorator */}
                  <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-neon-pink via-[#00F0FF] to-amber-400 rounded-t-2xl animate-pulse" />
                  
                  <div className="flex items-center justify-between border-b border-white/5 pb-2">
                    <div className="flex flex-col">
                      <span className="text-[10px] font-mono tracking-widest text-neon-cyan font-black uppercase">
                        💖 OLAIVE HUB
                      </span>
                      <span className="text-[8px] font-sans text-zinc-500 font-bold uppercase tracking-wider">
                        Pusat Pengaturan Efek & AI
                      </span>
                    </div>
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  </div>

                  {/* Buttons Grid */}
                  <div className="flex flex-col gap-2">
                    {/* OPTION 1: SETTINGS */}
                    <button
                      onClick={() => {
                        setActiveTab(activeTab === 'settings' ? null : 'settings');
                        setIsFloatingHubOpen(false);
                      }}
                      className={`w-full p-2.5 rounded-xl border font-mono text-[10px] font-extrabold tracking-wider text-left transition-all duration-200 flex items-center justify-between group ${
                        activeTab === 'settings'
                          ? 'bg-neon-cyan/15 border-neon-cyan text-neon-cyan'
                          : theme === 'dark'
                            ? 'bg-white/5 border-white/5 text-zinc-300 hover:bg-white/8 hover:text-white hover:border-white/10'
                            : 'bg-black/5 border-black/5 text-zinc-700 hover:bg-black/8 hover:text-zinc-900'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <Settings2 className="w-4 h-4 text-neon-cyan group-hover:rotate-45 transition-transform duration-300" />
                        <div className="flex flex-col">
                          <span className="text-[9px] uppercase font-black tracking-widest">⚙️ SETTING EFEK</span>
                        </div>
                      </div>
                      <span className="text-[7.5px] font-sans text-zinc-500 uppercase tracking-widest group-hover:translate-x-1 transition-transform">GO ➔</span>
                    </button>

                    {/* OPTION 2: AI GENERATIVE */}
                    <button
                      onClick={() => {
                        if (user?.email === 'bungtemin@gmail.com') {
                          setActiveTab(activeTab === 'ai' ? null : 'ai');
                          setIsFloatingHubOpen(false);
                        } else {
                          triggerToast('Maaf ya sayang, fitur AI Generatif siber ini hanya terbuka khusus untuk Admin (Bung Temin) tercinta sebagai fitur siber premium! 💖🔐');
                        }
                      }}
                      className={`w-full p-2.5 rounded-xl border font-mono text-[10px] font-extrabold tracking-wider text-left transition-all duration-200 flex items-center justify-between group ${
                        user?.email === 'bungtemin@gmail.com'
                          ? activeTab === 'ai'
                            ? 'bg-amber-400/20 border-amber-400 text-amber-400 font-bold'
                            : theme === 'dark'
                              ? 'bg-white/5 border-white/5 text-zinc-300 hover:bg-white/8 hover:text-amber-400 hover:border-amber-400/30'
                              : 'bg-black/5 border-black/5 text-zinc-750 hover:bg-black/8 hover:text-amber-600'
                          : 'bg-zinc-950/45 border-zinc-900/60 text-zinc-500 opacity-75 hover:opacity-100 cursor-not-allowed'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        {user?.email === 'bungtemin@gmail.com' ? (
                          <Sparkles className="w-4 h-4 text-amber-400 animate-pulse" />
                        ) : (
                          <Lock className="w-4 h-4 text-rose-450 animate-pulse" />
                        )}
                        <div className="flex flex-col">
                          <span className={`text-[9px] uppercase font-black tracking-widest ${user?.email === 'bungtemin@gmail.com' ? '' : 'text-zinc-500 line-through'}`}>
                            {user?.email === 'bungtemin@gmail.com' ? '✨ AI GENERATIF' : '🔐 AI GENERATIF'}
                          </span>
                        </div>
                      </div>
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* floating main circle toggler */}
            <motion.button
              whileTap={{ scale: 0.92 }}
              onClick={() => setIsFloatingHubOpen(!isFloatingHubOpen)}
              className={`w-12 h-12 rounded-full flex flex-col items-center justify-center transition-all duration-300 border shadow-[0_4px_20px_rgba(0,0,0,0.5)] focus:outline-none relative group ${
                isFloatingHubOpen
                  ? 'bg-neon-pink hover:bg-rose-500 text-white border-neon-pink shadow-[0_0_15px_rgba(244,63,94,0.4)]'
                  : theme === 'dark'
                    ? 'bg-zinc-950/90 hover:bg-black text-neon-cyan border-neon-cyan/40 hover:border-neon-cyan shadow-[0_0_15px_rgba(0,240,255,0.15)]'
                    : 'bg-white hover:bg-zinc-50 text-neon-cyan border-black/10'
              }`}
              title="Menu OLAIVE (Sistem & AI)"
            >
              <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-neon-pink/10 to-neon-cyan/10 opacity-75 animate-ping group-hover:opacity-100 duration-1000 pointer-events-none" />
              {isFloatingHubOpen ? (
                <X className="w-5 h-5 shrink-0" />
              ) : (
                <Menu className="w-5 h-5 shrink-0 text-neon-cyan" />
              )}
            </motion.button>
          </div>
        )}
      </AnimatePresence>

      {/* LEFT-SIDE DEDICATED CANVAS FLOATING SAVER BUTTON */}
      <AnimatePresence>
        {currentPage === 'beranda' && !activeTab && user && (
          <div className="fixed bottom-20 left-4 md:left-8 z-45" id="left-canvas-saver-container">
            <motion.button
              whileTap={{ scale: 0.92 }}
              onClick={() => {
                setIsCanvasModalOpen(true);
              }}
              className={`w-12 h-12 rounded-full flex flex-col items-center justify-center transition-all duration-300 border shadow-[0_4px_20px_rgba(0,0,0,0.5)] focus:outline-none relative group ${
                theme === 'dark'
                  ? 'bg-[#08080a]/90 hover:bg-black text-emerald-400 border-emerald-500/40 hover:border-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.15)]'
                  : 'bg-white hover:bg-zinc-50 text-emerald-600 border-black/10 shadow-[0_4px_20px_rgba(0,0,0,0.1)]'
              }`}
              title="Penyimpanan Draf Canva"
            >
              <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-emerald-500/10 to-teal-400/10 opacity-75 animate-ping group-hover:opacity-100 duration-1000 pointer-events-none" />
              <Save className="w-5 h-5 shrink-0 text-emerald-400 group-hover:rotate-12 transition-transform duration-300" />
              {canvasDesigns.length > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-emerald-500 text-black text-[8px] font-mono font-black h-4 min-w-[16px] px-1 rounded-full flex items-center justify-center border border-zinc-950 animate-bounce">
                  {canvasDesigns.length}
                </span>
              )}
            </motion.button>
          </div>
        )}
      </AnimatePresence>

       {/* CREATIVE QUESTS PAGE TAB */}
      {currentPage === 'misi' && user?.email === 'bungtemin@gmail.com' && (
        <div className="flex-1 max-w-4xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-8">
          <div className="text-center max-w-xl mx-auto space-y-2">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-neon-pink/10 text-neon-pink border border-neon-pink/25 font-mono text-[9px] tracking-widest uppercase mb-1">
              <Sparkles className="w-3.5 h-3.5 animate-pulse" /> DOSSIER MISI KREATIF SIBER
            </div>
            <h2 className="text-2xl font-display font-extrabold tracking-tight text-white uppercase">
              RANCANG AVATAR SIBER ANDA
            </h2>
            <p className="text-xs text-zinc-400">
              Selesaikan 6 misi interaktif di bawah ini untuk mengaktifkan opsi Reward Istimewa: **Sertifikat Identitas Agen Elite (Access Pass ID Card)** yang siap diunduh!
            </p>
          </div>

          {/* Gamified dynamic stats block */}
          <div className={`p-6 rounded-2xl border transition-all duration-300 relative overflow-hidden ${
            theme === 'dark' 
              ? 'bg-[#09090b] border-white/10 shadow-[0_4px_30px_rgba(0,0,0,0.5)]' 
              : 'bg-white border-black/10 shadow-sm'
          }`}>
            <div className="absolute top-0 right-0 w-32 h-32 bg-neon-pink/5 rounded-full blur-3xl pointer-events-none" />
            
            <div className="flex flex-col md:flex-row items-center justify-between gap-6 relative z-10">
              <div className="space-y-2">
                <span className="text-[10px] font-mono tracking-widest block text-zinc-500 uppercase">
                  RANKING & KREDENSI IDENTITAS SIBER:
                </span>
                
                <div className="flex items-center gap-3">
                  <div className={`p-3 rounded-xl border flex items-center justify-center ${
                    questPercent === 100 
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.15)]' 
                      : 'bg-neon-pink/10 border-neon-pink/30 text-neon-pink'
                  }`}>
                    <Cpu className={`w-8 h-8 ${questPercent === 100 ? 'animate-none' : 'animate-spin-[duration:10s]'}`} />
                  </div>
                  <div>
                    <h3 className="text-xl font-display font-black tracking-wide text-white uppercase">
                      {questPercent === 0 ? "AGEN SIPIL (CIVILIAN)" :
                       questPercent <= 33 ? "KADET REKRUTAN (CADET)" :
                       questPercent <= 66 ? "AGEN NETRUNNER (AGENT)" :
                       questPercent <= 99 ? "CYBER OPERATIVE PRO" :
                       "LEGENDARY ELITE SIBER"}
                    </h3>
                    <p className="text-[10px] font-mono text-zinc-500 leading-none">
                      Karya Selesai: {completedCount} dari {totalQuests} Modul ({questPercent}%)
                    </p>
                  </div>
                </div>
              </div>

              {/* Progress visual indicator bar */}
              <div className="w-full md:w-72 space-y-2.5">
                <div className="flex items-center justify-between text-[10px] font-mono">
                  <span className="text-zinc-500">PROGRES SELESAI</span>
                  <span className={questPercent === 100 ? "text-emerald-400 font-extrabold" : "text-[#00F0FF] font-bold"}>
                    {questPercent}%
                  </span>
                </div>
                
                <div className="h-2.5 w-full bg-zinc-950 rounded-full overflow-hidden border border-white/5 relative p-[1px]">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${questPercent}%` }}
                    className={`h-full rounded-full transition-all duration-700 ${
                      questPercent === 100 
                        ? 'bg-gradient-to-r from-emerald-500 to-emerald-400 shadow-[0_0_10px_#34d399]' 
                        : 'bg-gradient-to-r from-neon-pink via-[#00F0FF] to-[#00F0FF] shadow-[0_0_10px_#00F0FF]'
                    }`}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* CELEBRATORY SPECIAL ACCESS PASS BADGE CARD REWARD IF 100% COMPLETED */}
          {questPercent === 100 && (
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="p-6 rounded-2xl border-2 border-emerald-500/30 bg-emerald-950/10 relative overflow-hidden flex flex-col items-center text-center space-y-4 shadow-[0_0_30px_rgba(16,185,129,0.1)] py-8"
            >
              {/* Retro digital dust layers */}
              <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,_rgba(0,0,0,0.25)_50%),_linear-gradient(90.1deg_rgba(255,0,0,0.06),_rgba(0,255,0,0.02),_rgba(0,0,255,0.06))] bg-[size:100%_4px,_6px_100%] pointer-events-none" />
              
              <div className="p-2.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 animate-bounce">
                <CheckCircle className="w-8 h-8" />
              </div>
              
              <div className="space-y-1">
                <h3 className="text-xl font-display font-black tracking-tight text-emerald-400 uppercase">
                  SELAMAT! REWARD TELAH TERSEDIA 🎉
                </h3>
                <p className="text-xs text-zinc-300 max-w-lg">
                  Anda telah menyelesaikan seluruh misi kreatif. Silakan unduh **Access Pass ID Card Digital** eksklusif Anda di bawah ini!
                </p>
              </div>

              {/* Security Cyber ID card preview representation */}
              <div id="cyber-id-pass" className="w-full max-w-[340px] p-5 rounded-xl border border-emerald-500/35 bg-black text-left font-mono relative overflow-hidden flex flex-col space-y-4 shadow-[0_0_20px_rgba(16,185,129,0.2)]">
                {/* Hologram aesthetic lines */}
                <div className="absolute top-0 right-0 w-16 h-16 bg-emerald-500/10 rounded-bl-full pointer-events-none border-b border-l border-emerald-500/20" />
                
                <div className="flex items-center justify-between border-b border-emerald-950 pb-2">
                  <div className="flex items-center gap-1.5 text-emerald-400">
                    <Cpu className="w-4 h-4 animate-pulse" />
                    <span className="text-[9px] font-black tracking-widest">NETRUNNER // ACCESS PASS</span>
                  </div>
                  <span className="text-[8px] text-zinc-500">LEVEL 10 ELITE</span>
                </div>

                <div className="flex gap-4">
                  <div className="relative shrink-0 flex items-center justify-center">
                    <img 
                      src={userImage || DEFAULT_IMAGE} 
                      alt="Avatar" 
                      className="w-16 h-16 rounded border border-emerald-500/40 object-cover bg-zinc-900"
                    />
                    <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-400 rounded-full border border-black animate-ping" />
                    <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-400 rounded-full border border-black" />
                  </div>

                  <div className="flex-1 space-y-1.5 min-w-0">
                    <div>
                      <span className="text-[7px] text-zinc-500 block uppercase font-bold leading-none">NAMA OPERATIF:</span>
                      <span className="text-xs text-zinc-100 font-bold uppercase truncate block leading-normal">
                        {user?.displayName || "AGEN SIBER ANONIM"}
                      </span>
                    </div>

                    <div>
                      <span className="text-[7px] text-zinc-500 block uppercase font-bold leading-none">SLOGAN / CHIP:</span>
                      <span className="text-[10px] text-emerald-400 font-bold block leading-snug truncate">
                        {stickers?.find(s => s.type === 'text')?.text || "CYBER COWBOY ELITE"}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 border-t border-emerald-950 pt-2 text-[8px] leading-relaxed text-zinc-400">
                  <div>
                    <span className="text-zinc-650 block">KODE ID:</span>
                    <span className="font-bold">#NET-{Math.floor(100000 + Math.random() * 900000)}</span>
                  </div>
                  <div>
                    <span className="text-zinc-650 block">SISTEM AKTIF:</span>
                    <span className="font-bold text-emerald-500">AUTHORIZED // GRANTED</span>
                  </div>
                </div>

                <div className="w-full text-center border-t border-dashed border-emerald-900/30 pt-2 text-[7px] text-zinc-650">
                  DIGITALLY STAMPED BY BUNGTEMIN NETWORKS // {dateNow}
                </div>
              </div>

              {/* Direct Download Button */}
              <button
                type="button"
                onClick={() => {
                  if (canvasRef.current && handleDownloadHD) {
                    handleDownloadHD();
                    triggerToast("Memulai unduhan kartu akses HD!");
                  } else {
                    triggerToast("Buka halaman Beranda dan pastikan generator siap untuk mengunduh!");
                  }
                }}
                className="px-5 py-2 rounded-xl bg-emerald-555 text-zinc-950 bg-emerald-400 hover:bg-emerald-500 font-mono text-[10px] font-black tracking-widest uppercase transition-all shadow-[0_0_15px_rgba(16,185,129,0.3)] flex items-center gap-2"
              >
                <Download className="w-4 h-4" /> UNDUH KARTU AKSES SIBER
              </button>
            </motion.div>
          )}

          {/* THE 6 CREATIVE QUEST LIST */}
          <div className="space-y-3.5">
            <span className="text-[10px] font-mono tracking-widest block text-zinc-500 uppercase">
              MODUL MISI DAN DIREKTORAT TINDAKAN:
            </span>

            <div className="grid grid-cols-1 gap-4">
              
              {/* Mission 1 */}
              <div className={`p-4 rounded-xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-all ${
                quest1Completed 
                  ? 'border-emerald-500/25 bg-emerald-950/5' 
                  : theme === 'dark' ? 'bg-[#0b0b0c] border-white/5' : 'bg-white border-zinc-200'
              }`}>
                <div className="flex gap-3.5 items-start">
                  <div className={`p-2.5 rounded-lg border shrink-0 ${
                    quest1Completed 
                      ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' 
                      : 'bg-zinc-900 border-white/5 text-zinc-500'
                  }`}>
                    {quest1Completed ? <CheckCircle className="w-5 h-5 text-emerald-400" /> : <Upload className="w-5 h-5" />}
                  </div>
                  <div>
                    <h4 className={`text-xs font-mono font-bold tracking-wide uppercase ${quest1Completed ? 'text-emerald-400' : 'text-zinc-105'}`}>
                      Misi 1: Unggah Foto Avatar Personal Anda
                    </h4>
                    <p className="text-xs text-zinc-500 mt-1 max-w-xl leading-relaxed">
                      Langkah pertama penelusuran. Muat file gambar (.jpg, .png, dsb) di workbench untuk menggantikan templat siber bawaan.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setTriggerUploadOnMount(true);
                    setCurrentPage('beranda');
                    triggerToast("Sistem: Membuka beranda dan memicu dialog unggah...");
                  }}
                  className={`w-full sm:w-auto shrink-0 px-4 py-2 rounded text-[9.5px] font-mono font-bold uppercase transition-all tracking-wider text-center ${
                    quest1Completed 
                      ? 'bg-emerald-950/20 border border-emerald-900/30 text-emerald-400/80 cursor-default' 
                      : 'bg-[#00F0FF] hover:bg-[#00d2ff] text-zinc-950 shadow-[0_0_10px_rgba(0,240,255,0.15)] font-black'
                  }`}
                >
                  {quest1Completed ? 'Selesai ✔️' : 'Mulai Misi ->'}
                </button>
              </div>

              {/* Mission 2 */}
              <div className={`p-4 rounded-xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-all ${
                quest2Completed 
                  ? 'border-emerald-500/25 bg-emerald-950/5' 
                  : theme === 'dark' ? 'bg-[#0b0b0c] border-white/5' : 'bg-white border-zinc-200'
              }`}>
                <div className="flex gap-3.5 items-start">
                  <div className={`p-2.5 rounded-lg border shrink-0 ${
                    quest2Completed 
                      ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' 
                      : 'bg-zinc-900 border-white/5 text-zinc-500'
                  }`}>
                    {quest2Completed ? <CheckCircle className="w-5 h-5 text-emerald-400" /> : <Layers className="w-5 h-5" />}
                  </div>
                  <div>
                    <h4 className={`text-xs font-mono font-bold tracking-wide uppercase ${quest2Completed ? 'text-emerald-400' : 'text-zinc-105'}`}>
                      Misi 2: Terapkan Bingkai Model Kreatif
                    </h4>
                    <p className="text-xs text-zinc-500 mt-1 max-w-xl leading-relaxed">
                      Pilih dari direktori resmi atau buat bingkai kustom AI bermutu tinggi guna melingkari foto avatar Anda.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setCurrentPage('bingkai');
                    triggerToast("Membuka katalog bingkai...");
                  }}
                  className={`w-full sm:w-auto shrink-0 px-4 py-2 rounded text-[9.5px] font-mono font-bold uppercase transition-all tracking-wider text-center ${
                    quest2Completed 
                      ? 'bg-emerald-950/20 border border-emerald-900/30 text-emerald-400/80 cursor-default' 
                      : 'bg-[#00F0FF] hover:bg-[#00d2ff] text-zinc-950 shadow-[0_0_10px_rgba(0,240,255,0.15)] font-black'
                  }`}
                >
                  {quest2Completed ? 'Selesai ✔️' : 'Pilih Bingkai ->'}
                </button>
              </div>

              {/* Mission 3 */}
              <div className={`p-4 rounded-xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-all ${
                quest3Completed 
                  ? 'border-emerald-500/25 bg-emerald-950/5' 
                  : theme === 'dark' ? 'bg-[#0b0b0c] border-white/5' : 'bg-white border-zinc-200'
              }`}>
                <div className="flex gap-3.5 items-start">
                  <div className={`p-2.5 rounded-lg border shrink-0 ${
                    quest3Completed 
                      ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' 
                      : 'bg-zinc-900 border-white/5 text-zinc-500'
                  }`}>
                    {quest3Completed ? <CheckCircle className="w-5 h-5 text-emerald-400" /> : <Settings2 className="w-5 h-5" />}
                  </div>
                  <div>
                    <h4 className={`text-xs font-mono font-bold tracking-wide uppercase ${quest3Completed ? 'text-emerald-400' : 'text-zinc-105'}`}>
                      Misi 3: Terapkan Filter Warna Futuristik
                    </h4>
                    <p className="text-xs text-zinc-500 mt-1 max-w-xl leading-relaxed">
                      Aktifkan modifikasi warna siber fiksi (contoh: Matrix Neon Green, Cyberpunk Pink, Dusk Gold) dari tab filter.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setCurrentPage('beranda');
                    setActiveTab('filter');
                    triggerToast("Beralih ke tab Filter Warna...");
                  }}
                  className={`w-full sm:w-auto shrink-0 px-4 py-2 rounded text-[9.5px] font-mono font-bold uppercase transition-all tracking-wider text-center ${
                    quest3Completed 
                      ? 'bg-emerald-950/20 border border-emerald-900/30 text-emerald-400/80 cursor-default' 
                      : 'bg-[#00F0FF] hover:bg-[#00d2ff] text-zinc-950 shadow-[0_0_10px_rgba(0,240,255,0.15)] font-black'
                  }`}
                >
                  {quest3Completed ? 'Selesai ✔️' : 'Set Filter ->'}
                </button>
              </div>

              {/* Mission 4 */}
              <div className={`p-4 rounded-xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-all ${
                quest4Completed 
                  ? 'border-emerald-500/25 bg-emerald-950/5' 
                  : theme === 'dark' ? 'bg-[#0b0b0c] border-white/5' : 'bg-white border-zinc-200'
              }`}>
                <div className="flex gap-3.5 items-start">
                  <div className={`p-2.5 rounded-lg border shrink-0 ${
                    quest4Completed 
                      ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' 
                      : 'bg-zinc-900 border-white/5 text-zinc-500'
                  }`}>
                    {quest4Completed ? <CheckCircle className="w-5 h-5 text-emerald-400" /> : <Sliders className="w-5 h-5" />}
                  </div>
                  <div>
                    <h4 className={`text-xs font-mono font-bold tracking-wide uppercase ${quest4Completed ? 'text-emerald-400' : 'text-zinc-105'}`}>
                      Misi 4: Atur Potongan Crop Mask Khusus
                    </h4>
                    <p className="text-xs text-zinc-500 mt-1 max-w-xl leading-relaxed">
                      Ubah setelan pemotongan gambar Anda menjadi bentuk non-kotak (Bulat Sempurna, Heksagon Tech, Perisai Siber, dsb.).
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setCurrentPage('beranda');
                    setActiveTab('adjust');
                    triggerToast("Membuka tab Penyesuaian Mask...");
                  }}
                  className={`w-full sm:w-auto shrink-0 px-4 py-2 rounded text-[9.5px] font-mono font-bold uppercase transition-all tracking-wider text-center ${
                    quest4Completed 
                      ? 'bg-emerald-950/20 border border-emerald-900/30 text-emerald-400/80 cursor-default' 
                      : 'bg-[#00F0FF] hover:bg-[#00d2ff] text-zinc-950 shadow-[0_0_10px_rgba(0,240,255,0.15)] font-black'
                  }`}
                >
                  {quest4Completed ? 'Selesai ✔️' : 'Atur Mask ->'}
                </button>
              </div>

              {/* Mission 5 */}
              <div className={`p-4 rounded-xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-all ${
                quest5Completed 
                  ? 'border-emerald-500/25 bg-emerald-950/5' 
                  : theme === 'dark' ? 'bg-[#0b0b0c] border-white/5' : 'bg-white border-zinc-200'
              }`}>
                <div className="flex gap-3.5 items-start">
                  <div className={`p-2.5 rounded-lg border shrink-0 ${
                    quest5Completed 
                      ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' 
                      : 'bg-zinc-900 border-white/5 text-zinc-500'
                  }`}>
                    {quest5Completed ? <CheckCircle className="w-5 h-5 text-emerald-400" /> : <Activity className="w-5 h-5" />}
                  </div>
                  <div>
                    <h4 className={`text-xs font-mono font-bold tracking-wide uppercase ${quest5Completed ? 'text-emerald-400' : 'text-zinc-105'}`}>
                      Misi 5: Aktifkan Pola Retro Scanlines (Layar CRT)
                    </h4>
                    <p className="text-xs text-zinc-500 mt-1 max-w-xl leading-relaxed">
                      Hubungkan efek interferensi gelombang siber lawas layaknya console terminal CRT dari tab Sifat & Mask.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setCurrentPage('beranda');
                    setActiveTab('adjust');
                    triggerToast("Buka tab Pengaturan Scanlines...");
                  }}
                  className={`w-full sm:w-auto shrink-0 px-4 py-2 rounded text-[9.5px] font-mono font-bold uppercase transition-all tracking-wider text-center ${
                    quest5Completed 
                      ? 'bg-emerald-950/20 border border-emerald-900/30 text-emerald-400/80 cursor-default' 
                      : 'bg-[#00F0FF] hover:bg-[#00d2ff] text-zinc-950 shadow-[0_0_10px_rgba(0,240,255,0.15)] font-black'
                  }`}
                >
                  {quest5Completed ? 'Selesai ✔️' : 'Aktifkan CRT ->'}
                </button>
              </div>

              {/* Mission 6 */}
              <div className={`p-4 rounded-xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-all ${
                quest6Completed 
                  ? 'border-emerald-500/25 bg-emerald-950/5' 
                  : theme === 'dark' ? 'bg-[#0b0b0c] border-white/5' : 'bg-white border-zinc-200'
              }`}>
                <div className="flex gap-3.5 items-start">
                  <div className={`p-2.5 rounded-lg border shrink-0 ${
                    quest6Completed 
                      ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' 
                      : 'bg-zinc-900 border-white/5 text-zinc-500'
                  }`}>
                    {quest6Completed ? <CheckCircle className="w-5 h-5 text-emerald-400" /> : <Sparkles className="w-5 h-5" />}
                  </div>
                  <div>
                    <h4 className={`text-xs font-mono font-bold tracking-wide uppercase ${quest6Completed ? 'text-emerald-400' : 'text-zinc-105'}`}>
                      Misi 6: Ciptakan Slogan Siber Menggunakan AI
                    </h4>
                    <p className="text-xs text-zinc-500 mt-1 max-w-xl leading-relaxed">
                      Eksplorasi kecerdasan Gemini AI di Editor dengan menulis topic kata kunci, menciptakan slogan siber fiksi, lalu pasang di atas foto siber Anda.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setCurrentPage('beranda');
                    setActiveTab('ai');
                    setAiMode('slogan');
                    triggerToast("Membuka alat slogan AI...");
                  }}
                  className={`w-full sm:w-auto shrink-0 px-4 py-2 rounded text-[9.5px] font-mono font-bold uppercase transition-all tracking-wider text-center ${
                    quest6Completed 
                      ? 'bg-emerald-950/20 border border-emerald-900/30 text-emerald-400/80 cursor-default' 
                      : 'bg-[#00F0FF] hover:bg-[#00d2ff] text-zinc-950 shadow-[0_0_10px_rgba(0,240,255,0.15)] font-black'
                  }`}
                >
                  {quest6Completed ? 'Selesai ✔️' : 'Slogan AI ->'}
                </button>
              </div>

            </div>
          </div>
        </div>
      )}

            {/* BINGKAI CATALOG DIRECTORY PAGE */}
    {currentPage === 'bingkai' && (
      <div className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-8 relative">
        <button
           onClick={() => setCurrentPage('beranda')}
           className="absolute top-4 right-4 p-2 text-white/50 hover:text-white z-50"
        >
           <X className="w-6 h-6" />
        </button>
        <div className="text-center max-w-xl mx-auto space-y-2">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#00F0FF]/10 text-neon-cyan border border-[#00F0FF]/25 font-mono text-[9px] tracking-widest uppercase mb-1">
            <Layers className="w-3.5 h-3.5 animate-pulse" /> DAFTAR BINGKAI AKTIF
          </div>
          <h2 className="text-2xl font-display font-extrabold tracking-tight text-white uppercase">
            KATALOG BINGKAI FUTURISTIK
          </h2>
          <p className="text-xs text-zinc-400">
            Pilih bingkai kustom atau resmi di bawah ini untuk langsung diterapkan di ruang kerja editor Beranda.
          </p>
          <div className="pt-2">
            <button
               onClick={fetchAppwriteFrames}
               disabled={isLoadingAppwrite}
               className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded bg-zinc-900 border border-zinc-700 text-zinc-300 hover:text-white hover:border-neon-cyan hover:bg-neon-cyan/10 font-mono text-[10px] tracking-wider uppercase transition-all"
             >
               <RefreshCw className={`w-3 h-3 ${isLoadingAppwrite ? 'animate-spin' : ''}`} /> 
               {isLoadingAppwrite ? 'Menyinkronkan...' : 'Sinkronkan Appwrite'}
             </button>
          </div>
        </div>

        <div className="flex flex-col sm:grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {displayFrames.map((frame) => {
            const isSelected = frame.id === selectedFrame?.id;
            const isCustom = customFrames.some(cf => cf.id === frame.id);
            return (
              <div
                key={frame.id}
                className={`group rounded-xl bg-[#0b0b0b] border p-4 flex flex-col items-center space-y-3.5 transition-all duration-300 relative overflow-hidden ${
                  isSelected
                    ? 'border-neon-cyan bg-cyan-950/20 shadow-[0_0_20px_rgba(0,240,255,0.15)]'
                    : 'border-white/10 hover:border-neon-cyan/40 hover:bg-white/[0.02]'
                }`}
              >
                {/* Click area to select */}
                <div 
                  onClick={() => {
                    setSelectedFrame(frame);
                    setCurrentPage('beranda');
                    // triggerToast(`SISTEM: Bingkai "${frame.name}" aktif!`);
                  }}
                  className="w-full cursor-pointer flex flex-col items-center space-y-3.5"
                >
                  {/* Decorative scanner lines */}
                  <div className="scanlines absolute inset-0 opacity-10 pointer-events-none" />

                  {/* Mini Viewport Preview */}
                  <div className="relative aspect-square w-full rounded bg-black/60 overflow-hidden flex items-center justify-center p-4 border border-white/5">
                    {frame.renderSvg ? (
                      <div
                        className="w-full h-full scale-95 pointer-events-none"
                        dangerouslySetInnerHTML={{ __html: ensureFullSvg(frame.renderSvg(neonColor)) }}
                      />
                    ) : frame.src ? (
                      <LazyImage
                        src={resolveApiUrl(frame.src)}
                        alt={frame.name}
                        className="w-full h-full object-contain filter brightness-95 pointer-events-none bg-transparent"
                      />
                    ) : null}
                    <div className="absolute inset-0 bg-transparent group-hover:bg-cyan-950/10 transition-colors pointer-events-none" />
                  </div>

                  <div className="text-center w-full">
                    <h4 className="text-[11px] font-bold tracking-wider text-white truncate w-full uppercase">{frame.name}</h4>
                    <p className="text-[9px] text-zinc-500 font-mono mt-0.5 truncate uppercase">{frame.category || 'Kustom'}</p>
                  </div>
                </div>

                {/* Action buttons */}
                <div className="w-full pt-1 flex gap-2">
                  <button 
                    onClick={() => {
                      setSelectedFrame(frame);
                      setCurrentPage('beranda');
                    }}
                    className="flex-1 py-1.5 rounded bg-white/5 hover:bg-neon-cyan hover:text-black font-mono text-[9px] font-bold tracking-wider transition-all uppercase"
                  >
                    GUNAKAN
                  </button>
                  {isCustom && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteCustomFrame(frame.id);
                      }}
                      className="px-2 py-1.5 rounded bg-red-950/20 border border-red-900/30 text-red-500 hover:bg-red-500 hover:text-white transition-all font-mono text-[9px] font-bold"
                      title="Hapus Bingkai"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    )}

    {/* COMMUNITY WORKS WEB GALLERY PAGE */}
    {currentPage === 'galeri' && (
      <div className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6 relative">
        <button
           onClick={() => setCurrentPage('beranda')}
           className="absolute top-4 right-4 p-2 text-white/50 hover:text-white z-50"
        >
           <X className="w-6 h-6" />
        </button>
        <div className="flex justify-between items-center mb-6 gap-4">
          <h2 className="text-2xl font-display font-extrabold tracking-tight text-white uppercase">QCC FOTO</h2>
          <button
            onClick={() => {
              fetchCloudDownloads(cloudSubTab, true);
              triggerToast("Meresegarkan galeri QCC Foto dari cloud... 🔄");
            }}
            disabled={isLoadingCloudDownloads}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-zinc-300 hover:text-[#00F0FF] hover:border-[#00F0FF]/30 hover:bg-[#00F0FF]/5 font-mono text-[10px] tracking-wider uppercase transition-all duration-300 disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoadingCloudDownloads ? 'animate-spin' : ''}`} />
            REFRESH
          </button>
        </div>

            {isLoadingCloudDownloads ? (
              <div className="py-24 text-center space-y-4">
                <div className="w-10 h-10 border-2 border-neon-cyan border-t-transparent rounded-full animate-spin mx-auto"></div>
                <h3 className="font-mono text-xs font-bold text-zinc-300 uppercase tracking-widest animate-pulse">SINKRONISASI DATABASE CLOUD...</h3>
              </div>
            ) : (
              (() => {
                const filteredCloud = cloudDownloads;

                if (filteredCloud.length === 0) {
                  return (
                    <div className="py-20 text-center border border-white/5 bg-[#0b0b0b]/60 rounded-xl space-y-4 max-w-lg mx-auto">
                      <FolderOpen className="w-8 h-8 text-zinc-500 animate-pulse mx-auto" />
                      <div className="space-y-1">
                        <h4 className="font-mono text-xs font-bold text-zinc-300 uppercase tracking-wider">KOSONG</h4>
                        <p className="text-[11px] text-zinc-500 font-sans max-w-xs mx-auto">
                          Belum ada foto yang tersedia pada filter ini. Cobalah unduh twibbon karya Anda terlebih dahulu di halaman Beranda.
                        </p>
                      </div>
                    </div>
                  );
                }

                return (
                  <div className="flex flex-col sm:grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {filteredCloud.map((item) => {
                      const currentUid = auth.currentUser?.uid || user?.uid;
                      const matchesUser = currentUid && item.userId === currentUid;
                      
                      return (
                        <CloudItem
                          key={item.id}
                          item={item}
                          matchesUser={!!matchesUser}
                          onLike={() => handleLike(item.id)}
                          onDelete={cloudSubTab === 'mine' ? () => deleteCloudDownload(item.id) : undefined}
                        />
                      );
                    })}
                  </div>
                );
              })()
            )
          }
      </div>
    )}


    {currentPage === 'wabot' && (
      <div className="flex-1 w-full mx-auto p-0 sm:p-6 lg:p-8 space-y-0 sm:space-y-6 max-w-7xl pb-16 sm:pb-8">
        <div className="space-y-0 sm:space-y-6 w-full">
            {isLoadingComGallery ? (
              <div className="py-24 text-center space-y-4">
                <div className="w-10 h-10 border-2 border-neon-cyan border-t-transparent rounded-full animate-spin mx-auto"></div>
                <h3 className="font-mono text-xs font-bold text-zinc-350 uppercase tracking-widest animate-pulse">SINKRONISASI DATA API NUFAT...</h3>
              </div>
            ) : comGalleryError ? (
              <div className="border border-red-500/10 bg-red-950/5 p-6 rounded-xl text-center space-y-4 max-w-lg mx-auto">
                <div className="text-red-400 font-mono text-xs font-bold uppercase tracking-wider">
                  ⚠️ KENDALA INTERKONEKSI API NUFAT
                </div>
                <p className="text-[11px] text-zinc-400 leading-relaxed font-sans">
                  Gagal mengunduh kreasi live dari server Nufat: <code className="text-red-300 font-mono">{comGalleryError}</code>. Kami menyajikan visual simulasi di bawah.
                </p>
                <button
                  onClick={fetchComGalleryItems}
                  className="mx-auto px-4 py-1.5 bg-zinc-900 border border-red-500/30 hover:border-red-500 text-white rounded text-[10px] font-mono hover:bg-zinc-800 transition-all uppercase tracking-widest font-bold"
                >
                  SINKRONISASI ULANG
                </button>
              </div>
            ) : null}

            {/* Community works Grid list */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-y-8 sm:gap-6 w-full max-w-full">
              {(comGalleryItems.length > 0 ? comGalleryItems : COMMUNITY_GALLERY).map((post) => (
                <div key={post.id} className="rounded-none sm:rounded-xl bg-[#0b0b0b] border-y sm:border border-white/10 sm:border-white/10 overflow-hidden flex flex-col group hover:border-[#00F0FF]/30 transition-all duration-300 sm:shadow-xl w-full">
                  {/* User Handle Info bar */}
                  <div className="p-3 bg-black/40 border-b border-white/5 flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="w-6 h-6 rounded-full bg-zinc-800 border border-white/10 flex items-center justify-center font-mono text-[9px] font-bold text-neon-cyan shrink-0">
                        {post.username.charAt(1).toUpperCase()}
                      </div>
                      <span className="font-mono text-[10px] text-zinc-300 font-bold truncate max-w-[120px]">
                        {post.username}
                      </span>
                    </div>
                    <span className="font-mono text-[8px] text-neon-green bg-[#39ff14]/10 border border-[#39ff14]/20 px-1.5 py-0.5 rounded font-bold uppercase tracking-wide">
                      {post.id.includes('nufat') ? 'LIVE API' : 'SIMULASI'}
                    </span>
                  </div>

                  {/* Visual Simulated Result View */}
                  <div className="relative aspect-square bg-zinc-950 overflow-hidden flex items-center justify-center border-b border-white/5 p-0">
                    {post.avatar ? (
                      <LazyImage 
                        src={post.avatar} 
                        alt="masterpiece" 
                        referrerPolicy="no-referrer"
                        className="w-full h-full select-none pointer-events-none group-hover:scale-105 transition-all duration-500"
                        style={{
                          objectFit: 'cover',
                          ...(!post.id.includes('nufat') ? {
                            filter: post.filterPresetId === 'cyberpunk' 
                              ? 'contrast(1.2) brightness(1.1) saturate(1.5)' 
                              : post.filterPresetId === 'matrix'
                              ? 'contrast(1.4) hue-rotate(90deg)'
                              : post.filterPresetId === 'synthwave'
                              ? 'contrast(1.15) hue-rotate(280deg) saturate(1.3)'
                              : post.filterPresetId === 'vhs'
                              ? 'contrast(1.2) blur(0.5px) saturate(0.8)'
                              : 'none'
                          } : undefined)
                        }}
                      />
                    ) : null}

                    {/* Overlay matching Frame overlay mock rendering solely for static mock values */}
                    {!post.id.includes('nufat') && (
                      <div className="absolute inset-0 z-10 pointer-events-none p-1 opacity-90 text-center flex items-center justify-center">
                          {/* Image frame overlay mock removed since HUD frames were removed, rendering image directly instead if needed or just empty for now */}
                      </div>
                    )}
                    <div className="absolute bottom-2 left-2 bg-black/85 px-2 py-0.5 rounded border border-white/10 font-mono text-[8px] text-[#00F0FF] tracking-wider z-20">
                      {post.filterName}
                    </div>
                  </div>

                  {/* Content Details */}
                  <div className="p-4 flex-1 flex flex-col justify-between space-y-4">
                    <p className="text-[11px] text-zinc-400 italic leading-relaxed">
                      "{post.caption}"
                    </p>

                    <div className="space-y-2.5">
                      <div className="flex flex-wrap gap-1 text-[8px] font-mono">
                        <span className="px-1.5 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-zinc-400 tracking-wider">
                          Bingkai: {post.frameName.split(' ')[0]}
                        </span>
                        <span className="px-1.5 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-zinc-400">
                          Format: PNG/URL
                        </span>
                      </div>

                      <button
                        onClick={() => {
                          if (post.id.includes('nufat')) {
                            // Dynamically apply this frame from Nufat API directly as the frame template!
                            const targetFrame = {
                              id: post.frameId,
                              name: post.frameName,
                              src: post.avatar, 
                              type: 'url' as const,
                              category: 'Nufat',
                              description: post.caption
                            };
                            setSelectedFrame(targetFrame);
                            setCurrentPage('beranda');
                            triggerToast(`SISTEM: Bingkai Nufat "${post.frameName}" berhasil diterapkan! 🎨`);
                          } else {
                            // Copy mock styles
                            const targetFrame = FRAMES.find(f => f.id === post.frameId) || null;
                            setSelectedFrame(targetFrame);
                            setNeonColor(post.neonColor);
                            const matchingPreset = FILTER_PRESETS.find(p => p.id === post.filterPresetId);
                            if (matchingPreset) {
                              setImageSettings(prev => ({
                                ...prev,
                                ...matchingPreset.settings
                              }));
                              setFilterPresetId(post.filterPresetId);
                            }
                            setCurrentPage('beranda');
                            triggerToast(`SISTEM: Menyalin gaya dari ${post.username}! 🎨`);
                          }
                        }}
                        className="w-full py-2 bg-gradient-to-r from-neon-cyan/20 to-blue-900/10 hover:from-neon-cyan hover:to-[#39ff14] hover:text-[#050505] active:scale-[0.98] transition-all duration-300 font-mono text-[9px] uppercase font-black tracking-widest text-[#00F0FF] rounded border border-neon-cyan/40 hover:border-[#39ff14]/60"
                      >
                        GUNAKAN BINGKAI INI
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
    )}

    {/* MY SAVED CREATIONS PERSISTANT ALBUM COBA PAGE */}
    {currentPage === 'album' && (
      <div className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-8 relative">
        <button
           onClick={() => setCurrentPage('beranda')}
           className="absolute top-4 right-4 p-2 text-white/50 hover:text-white z-50"
        >
           <X className="w-6 h-6" />
        </button>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#00F0FF]/10 text-neon-cyan border border-[#00F0FF]/25 font-mono text-[9px] tracking-widest uppercase mb-1">
              <FolderOpen className="w-3.5 h-3.5 animate-pulse" /> CLOUD STORAGE SAYA
            </div>
            <h2 className="text-2xl font-display font-extrabold tracking-tight text-white uppercase">
              GALERI SAYA
            </h2>
            <p className="text-xs text-zinc-400">
              Koleksi karya pribadi Anda yang tersimpan aman di cloud galeri.
            </p>
          </div>

          <button
            onClick={() => {
              fetchMyGallery(true);
              triggerToast("Meresegarkan galeri dari cloud... 🔄");
            }}
            disabled={isLoadingGallery}
            className="px-3 py-1.5 border border-neon-cyan/30 hover:border-neon-cyan text-neon-cyan hover:bg-cyan-950/20 rounded font-mono text-[9px] transition-all flex items-center gap-2"
          >
            <RefreshCw className={`w-3 h-3 ${isLoadingGallery ? 'animate-spin' : ''}`} />
            REFRESH GALERI
          </button>
        </div>

        {isLoadingGallery ? (
          <div className="py-20 text-center">
            <RefreshCw className="w-8 h-8 text-neon-cyan animate-spin mx-auto mb-4" />
            <p className="font-mono text-xs text-zinc-500 uppercase tracking-widest">Sinkronisasi Cloud...</p>
          </div>
        ) : savedCreations.length === 0 ? (
          <div className="py-20 text-center border border-white/5 bg-[#0b0b0b]/60 rounded-xl space-y-4 max-w-lg mx-auto">
            <div className="w-12 h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mx-auto">
              <FolderOpen className="w-6 h-6 text-zinc-500 animate-pulse" />
            </div>
            <div className="space-y-2">
              <h3 className="font-mono text-xs font-bold text-zinc-300">GALERI SAYA MASIH KOSONG</h3>
              <p className="text-[11px] text-zinc-400 max-w-xs mx-auto">
                Karya yang Anda simpan ke galeri cloud akan muncul di sini secara otomatis!
              </p>
            </div>
            <button 
              onClick={() => setCurrentPage('beranda')}
              className="px-4 py-2 bg-neon-cyan text-[#050505] font-mono text-[10px] font-black uppercase tracking-widest rounded shadow-[0_0_15px_rgba(0,240,255,0.3)] hover:scale-105 active:scale-95 transition-all"
            >
              Mulai Desain Sekarang
            </button>
          </div>
        ) : (
          <div className="flex flex-col sm:grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {savedCreations.map((creation) => (
              <div key={creation.id} className="rounded-xl bg-[#0b0b0b]/80 border border-white/10 overflow-hidden flex flex-col group relative w-full">
                {/* Render Target Image */}
                <div className="relative aspect-square backdrop-blur-md bg-zinc-950 border-b border-white/5 flex items-center justify-center p-0 group-hover:scale-[1.01] transition-transform duration-300">
                  {creation.src ? (
                    <LazyImage src={creation.src} alt="Kreasiku" className="w-full h-full object-cover pointer-events-none select-none bg-transparent" />
                  ) : null}
                  <div className="absolute inset-0 bg-transparent group-hover:bg-black/10 transition-colors pointer-events-none" />
                </div>

                <div className="p-3 bg-black/30 flex items-center justify-between">
                  <span className="font-mono text-[8px] text-zinc-500 uppercase">{creation.timestamp}</span>
                  <span className="font-mono text-[8.5px] text-neon-cyan px-1.5 rounded bg-cyan-950/20 border border-cyan-500/10 uppercase tracking-widest font-bold">SAVED CLOUD</span>
                </div>

                {/* Bottom Action buttons bar to replace the hidden hover-overlay */}
                <div className="p-3 bg-black/40 border-t border-white/5 flex gap-2">
                  <button
                    onClick={() => {
                      const link = document.createElement('a');
                      link.download = `Avatar-Saved-${creation.id}.png`;
                      link.href = creation.src;
                      document.body.appendChild(link);
                      link.click();
                      document.body.removeChild(link);
                      triggerToast('Proses unduh ulang berhasil!');
                    }}
                    className="flex-1 py-1.5 bg-neon-cyan/15 hover:bg-neon-cyan hover:text-black border border-neon-cyan/40 text-neon-cyan rounded font-mono text-[9px] font-bold tracking-widest uppercase flex items-center justify-center gap-1 transition-all"
                    title="Download Ulang"
                  >
                    <Download className="w-3 h-3" /> UNDUH
                  </button>
                  <button
                    onClick={() => {
                      setItemToDelete(creation.id);
                      setIsDeleteModalOpen(true);
                    }}
                    className="px-2.5 py-1.5 bg-red-950/20 hover:bg-red-600 hover:text-white border border-red-500/30 text-rose-500 rounded font-mono text-[9px] font-bold tracking-widest uppercase flex items-center justify-center gap-1 transition-all"
                    title="Hapus dari Cloud"
                  >
                    <Trash2 className="w-3 h-3" /> HAPUS
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    )}

      {/* FOOTER */}
      <footer className="mt-auto border-t border-zinc-900 bg-[#060609] py-4 text-center font-mono text-[10px] text-zinc-600 block">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2.5">
          <span />
        </div>
      </footer>

      {/* Modal Dialog Bantuan Login / Pop-up Blocked Fallback */}
      <AnimatePresence>
        {showAuthWarning && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className={`w-full max-w-sm p-5 rounded-2xl border font-mono text-xs overflow-hidden shadow-2xl transition-all duration-300 relative ${
                theme === 'dark' 
                  ? 'bg-[#0d0d11]/95 border-white/10 text-[#E0E0E0]' 
                  : 'bg-white border-zinc-200 text-zinc-800'
              }`}
            >
              <div className="flex items-center gap-2 mb-3 border-b pb-2">
                <span className="text-sm font-bold text-yellow-500">KENDALA POP-UP LOGIN GOOGLE</span>
              </div>
              <p className="mb-3 font-sans opacity-85 leading-normal text-xs">
                Browser memblokir pop-up masuk Anda. Hal ini sering terjadi di dalam <strong>Frame Preview AI Studio</strong> demi keamanan.
              </p>
              <div className={`p-3 rounded-lg border mb-4 ${
                theme === 'dark' ? 'bg-black/35 border-white/5 text-[10.5px]' : 'bg-zinc-50 border-zinc-200 text-[10.5px]'
              }`}>
                <div className="font-bold mb-1 text-[11px] text-[#4285F4]">SOLUSI DISARANKAN:</div>
                <ul className="list-disc list-inside space-y-1 opacity-85 leading-relaxed font-sans text-xs">
                  <li>Buka di <strong>Tab Baru</strong> untuk login normal.</li>
                  <li>Atau pilih <strong>Sesi Tamu</strong> untuk langsung mengunduh avatar gratis sekarang tanpa login!</li>
                </ul>
              </div>
              <div className="flex flex-col gap-2.5">
                <button
                  type="button"
                  onClick={() => {
                    const previewUrl = 'https://ais-pre-h437zomktk5zw36hxyzbwi-844303505958.asia-southeast1.run.app';
                    window.open(previewUrl, '_blank');
                    triggerToast("Membuka aplikasi di Tab Baru... ↗️");
                  }}
                  className="w-full py-2.5 rounded-lg bg-[#4285F4] hover:bg-[#357ae8] text-white font-bold flex items-center justify-center gap-1.5 transition-all font-sans text-xs shadow-md active:scale-95"
                >
                  BUKA DI TAB BARU ↗️
                </button>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setUser({
                        displayName: 'Tamu Premium',
                        email: 'guest@qcc-online.web.app',
                        photoURL: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=80&q=80',
                        uid: 'guest_user'
                      } as any);
                      setShowAuthWarning(false);
                      triggerToast("Sesi Tamu aktif! Anda sekarang bisa mengunduh avatar. 👽⚡");
                    }}
                    className={`py-2 px-1 rounded-lg border text-center font-bold font-sans text-xs transition-all active:scale-95 ${
                      theme === 'dark'
                        ? 'border-emerald-500/30 bg-emerald-500/5 text-emerald-400 hover:bg-emerald-500/10'
                        : 'border-emerald-600/30 bg-emerald-600/5 text-emerald-700 hover:bg-emerald-600/10'
                    }`}
                  >
                    SESI TAMU ⚡
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowAuthWarning(false);
                      handleGoogleLogin();
                    }}
                    className={`py-2 px-2 rounded-lg border text-center font-bold font-sans text-xs transition-all active:scale-95 ${
                      theme === 'dark'
                        ? 'border-white/10 bg-white/5 text-zinc-300 hover:bg-white/10'
                        : 'border-zinc-300 bg-zinc-100 text-zinc-800 hover:bg-zinc-200'
                    }`}
                  >
                    COBA LAGI 🔐
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => setShowAuthWarning(false)}
                  className="w-full text-center text-[10px] text-zinc-500 hover:text-zinc-300 py-1"
                >
                  BATAL & TUTUP
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* High Definition Canvas Rendering & Export Progress Overlay */}
      <AnimatePresence>
        {hdExportProgress !== null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/95 backdrop-blur-md"
          >
            <motion.div
              initial={{ scale: 0.9, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 15 }}
              className="relative w-full max-w-sm p-6 rounded-2xl bg-zinc-900 border border-zinc-800/80 shadow-[0_0_35px_rgba(0,240,255,0.15)] flex flex-col items-center"
            >
              {/* Corner Accents */}
              <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-neon-cyan"></div>
              <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-neon-cyan"></div>
              <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-neon-cyan"></div>
              <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-neon-cyan"></div>

              {/* Glowing Indicator Core */}
              <div className="relative mb-6 mt-2 flex items-center justify-center">
                <div className="absolute inset-x-0 w-16 h-16 rounded-full bg-neon-cyan/10 animate-ping"></div>
                <div className="relative w-16 h-16 rounded-full border border-neon-cyan/25 flex items-center justify-center bg-zinc-950">
                  <Cpu className="w-8 h-8 text-neon-cyan animate-spin" />
                </div>
              </div>

              {/* Title & Status */}
              <h3 className="font-display text-md font-extrabold tracking-wider text-white text-center uppercase mb-1">
                MEMPROSES EXPORT 4K/HD
              </h3>
              <p className="font-mono text-[9px] tracking-widest text-neon-cyan text-center uppercase mb-5 animate-pulse">
                SISTEM UTAMA RENDERING PIXEL AKTIF
              </p>

              {/* Progress Text */}
              <p className="font-sans text-[11px] text-zinc-400 text-center capitalize mb-4 min-h-[3ch] px-2 leading-relaxed">
                {hdExportStatus}
              </p>

              {/* Progress Bar Track */}
              <div className="w-full bg-zinc-950/80 rounded-full border border-zinc-800 p-1 mb-2">
                <div className="relative h-3 w-full rounded-full bg-zinc-900 overflow-hidden">
                  {/* Animated Progress Fill */}
                  <motion.div
                    initial={{ width: "0%" }}
                    animate={{ width: `${hdExportProgress}%` }}
                    transition={{ duration: 0.25, ease: "easeOut" }}
                    className="h-full rounded-full bg-gradient-to-r from-[#00F0FF] via-cyan-500 to-indigo-500 shadow-[0_0_12px_rgba(0,240,255,0.4)]"
                  />
                </div>
              </div>

              {/* Progress Labels */}
              <div className="w-full flex justify-between items-center px-1">
                <span className="font-mono text-[8px] text-zinc-500 uppercase tracking-widest">
                  ALGORITMA: HD-COMPILE
                </span>
                <span className="font-mono text-xs text-neon-cyan font-bold tracking-widest">
                  {hdExportProgress}%
                </span>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Animated Toast Message alert */}
      <AnimatePresence>
        {showToast && (
          <motion.div
            initial={{ opacity: 0, y: -30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -30 }}
            className="fixed top-20 left-1/2 -translate-x-1/2 z-50 py-3 px-5 bg-zinc-900 border-b-2 border-neon-cyan text-zinc-100 shadow-2xl font-mono text-[11px] shadow-neon-cyan/20 flex items-center justify-center gap-2.5 w-[95vw] max-w-lg rounded-xl"
          >
            <Sparkles className="w-4 h-4 text-neon-cyan animate-pulse shrink-0" />
            <span className="truncate">{toastText}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* CLOUD CANVAS SAVE & RESTORE DIALOG MODAL */}
      <AnimatePresence>
        {isCanvasModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsCanvasModalOpen(false)}
              className="absolute inset-0 bg-black/85 backdrop-blur-md"
            />

            {/* Modal Body */}
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 15 }}
              className={`relative w-full max-w-sm rounded-2xl border p-4 shadow-[0_12px_40px_rgba(0,240,255,0.15)] overflow-hidden flex flex-col max-h-[80vh] ${
                theme === 'dark'
                  ? 'bg-[#08080a]/95 border-emerald-500/20 text-zinc-100 shadow-[0_0_30px_rgba(16,185,129,0.06)]'
                  : 'bg-white border-zinc-200 text-zinc-900 shadow-xl'
              }`}
            >
              {/* Decorative Glow Line */}
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-400 animate-pulse" />

              {/* Close Button */}
              <button
                onClick={() => setIsCanvasModalOpen(false)}
                className={`absolute top-3.5 right-3.5 p-1 rounded-full hover:bg-white/10 transition-colors ${
                  theme === 'dark' ? 'text-zinc-400 hover:text-white' : 'text-zinc-500 hover:text-zinc-800 hover:bg-zinc-100'
                }`}
              >
                <X className="w-4 h-4" />
              </button>

              {/* Modal Header */}
              <div className="mb-3 flex items-center gap-2">
                <div className="p-1.5 bg-emerald-500/10 rounded-xl border border-emerald-500/20 text-emerald-400">
                  <Save className="w-4 h-4 animate-pulse" />
                </div>
                <div>
                  <h3 className="text-xs font-mono font-black tracking-wider uppercase text-emerald-400">
                    Sesi & Draf Cloud
                  </h3>
                  <p className="text-[9px] text-zinc-500 font-sans leading-none uppercase font-semibold">
                    Simpan draf kanvasmu dengan aman, sayang 💕
                  </p>
                </div>
              </div>

              {/* Tab Navigation */}
              <div className="flex border-b border-zinc-500/10 mb-3 text-[10px] uppercase font-mono font-black">
                <button
                  onClick={() => setCanvasModalTab('save')}
                  className={`flex-1 py-1.5 border-b-2 transition-all flex items-center justify-center gap-1.5 ${
                    canvasModalTab === 'save'
                      ? 'border-emerald-500 text-emerald-400 font-extrabold'
                      : 'border-transparent text-zinc-500 hover:text-zinc-400'
                  }`}
                >
                  <Save className="w-3 h-3" />
                  Simpan Draf
                </button>
                <button
                  onClick={() => {
                    setCanvasModalTab('open');
                    fetchCanvasDesigns();
                  }}
                  className={`flex-1 py-1.5 border-b-2 transition-all flex items-center justify-center gap-1.5 ${
                    canvasModalTab === 'open'
                      ? 'border-teal-500 text-teal-400 font-extrabold'
                      : 'border-transparent text-zinc-500 hover:text-zinc-400'
                  }`}
                >
                  <FolderOpen className="w-3 h-3" />
                  Buka Draf ({canvasDesigns.length})
                </button>
              </div>

              {/* SAVE TAB CONTENT */}
              {canvasModalTab === 'save' && (
                <div className={`border rounded-xl p-3 mb-1 flex flex-col gap-2.5 ${
                  theme === 'dark' ? 'bg-white/5 border-white/5' : 'bg-emerald-50/30 border-emerald-100/70'
                }`}>
                  {loadedDesignId ? (
                    <div className="space-y-2">
                      {/* Active Draft Bar */}
                      <div className="px-2 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-between gap-2">
                        <p className="text-[9.5px] font-sans text-emerald-400 font-bold truncate max-w-[170px]">
                          📍 Draft Aktif: {canvasDesigns.find(d => d.id === loadedDesignId)?.name || saveDesignName || 'Aktif'}
                        </p>
                        <span className="text-[7.5px] font-mono text-emerald-400/80 uppercase font-black shrink-0">
                          Olaive Active!
                        </span>
                      </div>

                      {/* Overwrite Save Button */}
                      <button
                        onClick={() => handleSaveCanvasDesign(canvasDesigns.find(d => d.id === loadedDesignId)?.name || saveDesignName || 'Draf Desain', false)}
                        disabled={isSavingCanvas}
                        className="w-full bg-emerald-500 hover:bg-emerald-600 disabled:bg-zinc-750 text-[#08080a] py-2 rounded-lg text-[10px] font-mono font-black uppercase tracking-wider flex items-center justify-center gap-1.5 transition-colors"
                      >
                        {isSavingCanvas ? (
                          <RefreshCw className="w-3 animate-spin" />
                        ) : (
                          <Save className="w-3 h-3" />
                        )}
                        Kemas & Perbarui (Save)
                      </button>

                      {/* Minimal Separator */}
                      <div className="relative flex py-0.5 items-center">
                        <div className="flex-grow border-t border-zinc-800/40"></div>
                        <span className="flex-shrink mx-1.5 text-[7.5px] font-mono font-black text-zinc-500 uppercase tracking-widest">ATAU SIMPAN BARU</span>
                        <div className="flex-grow border-t border-zinc-800/40"></div>
                      </div>
                    </div>
                  ) : null}

                  {/* Save New/Save As Inputs */}
                  <div className="space-y-1.5">
                    <div className="flex flex-col gap-1.5">
                      <input
                        type="text"
                        value={saveDesignName}
                        onChange={(e) => setSaveDesignName(e.target.value)}
                        placeholder="Nama Draf Baru... 💖"
                        className={`w-full rounded-lg px-2.5 py-1.5 text-[11px] font-sans transition-colors focus:outline-none ${
                          theme === 'dark'
                            ? 'bg-black/40 border border-white/10 text-zinc-100 placeholder:text-zinc-500 focus:border-emerald-500'
                            : 'bg-white border border-emerald-200 text-zinc-850 placeholder:text-zinc-450 focus:border-emerald-500'
                        }`}
                      />
                      <button
                        onClick={() => handleSaveCanvasDesign(saveDesignName, true)}
                        disabled={isSavingCanvas}
                        className="w-full bg-teal-500 hover:bg-teal-600 disabled:bg-zinc-750 text-[#08080a] py-2 rounded-lg text-[10px] font-mono font-black uppercase tracking-wider flex items-center justify-center gap-1.5 transition-colors"
                      >
                        {isSavingCanvas ? (
                          <RefreshCw className="w-3 animate-spin" />
                        ) : (
                          <Copy className="w-3 h-3" />
                        )}
                        Simpan Draf Baru (Save As)
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* OPEN TAB CONTENT */}
              {canvasModalTab === 'open' && (
                <div className="flex-1 overflow-y-auto pr-0.5 max-h-[45vh] flex flex-col">
                  <div className="flex justify-between items-center mb-1.5 px-0.5">
                    <span className="text-[8px] font-mono tracking-wider uppercase font-black text-zinc-500">
                      Semua Draf Tersimpan ({canvasDesigns.length})
                    </span>
                    <button
                      onClick={fetchCanvasDesigns}
                      className="p-1 rounded hover:bg-white/5 text-zinc-400 hover:text-emerald-400 transition-colors"
                      title="Segarkan daftar"
                    >
                      <RefreshCw className={`w-3 h-3 ${isLoadingCanvasDesigns ? 'animate-spin' : ''}`} />
                    </button>
                  </div>

                  {isLoadingCanvasDesigns ? (
                    <div className="flex flex-col items-center justify-center py-8 gap-1">
                      <RefreshCw className="w-4 h-4 text-emerald-400 animate-spin" />
                      <span className="text-[8.5px] font-mono text-zinc-500 uppercase font-black">
                        Mencari draf manismu...
                      </span>
                    </div>
                  ) : canvasDesigns.length === 0 ? (
                    <div className="text-center py-8 border border-dashed border-zinc-800/40 rounded-xl flex flex-col items-center justify-center">
                      <FolderOpen className="w-6 h-6 text-zinc-700/80 mb-1" />
                      <p className="text-[8.5px] font-mono text-zinc-500 uppercase tracking-wide px-4 leading-normal">
                        Belum ada draf tersimpan sayang 🌸
                      </p>
                    </div>
                  ) : (
                    <div className="grid gap-1.5 pr-0.5 max-h-[38vh] overflow-y-auto">
                      {canvasDesigns.map((design) => {
                        let frameName = "Tanpa Bingkai";
                        let hasThumbnail = design.thumbnailUrl || '';
                        
                        try {
                          const parsed = typeof design.canvasData === 'string'
                            ? JSON.parse(design.canvasData)
                            : design.canvasData;
                          const availableFrames = appwriteFrames.length > 0 ? appwriteFrames : FRAMES;
                          const found = availableFrames.find(f => f.id === parsed.selectedFrameId);
                          if (found) frameName = found.name;
                          if (!hasThumbnail && parsed.userImage) {
                            hasThumbnail = parsed.userImage;
                          }
                        } catch(e) {}

                        return (
                          <div
                            key={design.id}
                            onClick={() => {
                              handleLoadCanvasDesign(design);
                              setCanvasModalTab('save');
                            }}
                            className={`border rounded-lg p-1.5 flex items-center justify-between group cursor-pointer transition-all duration-150 ${
                              loadedDesignId === design.id
                                ? 'bg-emerald-500/10 border-emerald-500/30'
                                : theme === 'dark'
                                ? 'bg-white/5 border-white/5 hover:border-emerald-500/30'
                                : 'bg-zinc-50 border-zinc-150 hover:bg-zinc-100 hover:border-emerald-350'
                            }`}
                          >
                            <div className="flex items-center gap-2 flex-1 min-w-0">
                              {/* Thumbnail preview canvas */}
                              <div className="w-7 h-7 rounded bg-emerald-500/5 border border-emerald-500/15 overflow-hidden flex items-center justify-center shrink-0">
                                {hasThumbnail ? (
                                  <img 
                                    src={hasThumbnail} 
                                    alt="thumb" 
                                    className="w-full h-full object-cover transition-transform group-hover:scale-110"
                                    referrerPolicy="no-referrer"
                                  />
                                ) : (
                                  <FolderOpen className="w-3.5 h-3.5 text-emerald-400" />
                                )}
                              </div>

                              <div className="flex flex-col min-w-0">
                                <span className={`text-[11px] font-sans font-bold truncate transition-colors ${
                                  loadedDesignId === design.id
                                    ? 'text-emerald-400'
                                    : theme === 'dark'
                                    ? 'text-zinc-200 group-hover:text-emerald-400'
                                    : 'text-zinc-850 group-hover:text-emerald-600'
                                }`}>
                                  {design.name}
                                </span>
                                <span className="text-[7.5px] font-mono text-zinc-500 truncate uppercase mt-0.5">
                                  {frameName}
                                </span>
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-1.5 shrink-0 ml-1.5">
                              <button
                                onClick={(e) => handleDeleteCanvasDesign(design.id, e)}
                                className="p-1 rounded text-zinc-500 hover:text-rose-400 hover:bg-rose-500/10 transition-all"
                                title="Hapus draf ini"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                              <span className={`text-[7.5px] font-mono font-black py-1 px-1.5 rounded transition-all ${
                                loadedDesignId === design.id
                                  ? 'bg-emerald-500 text-[#08080a]'
                                  : 'bg-emerald-500/10 text-emerald-400 group-hover:bg-emerald-500 group-hover:text-[#08080a]'
                              }`}>
                                BUKA
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* Modal Footer */}
              <div className="mt-3 border-t border-zinc-900 pt-2 text-center text-[7.5px] font-mono text-zinc-500">
                Penyimpanan aman untuk: <b>{user?.email}</b> 💚
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <DeleteConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={() => {
          if (itemToDelete) {
            deleteFromMyGallery(itemToDelete);
            setItemToDelete(null);
          }
        }}
      />
    </div>
  );
}
