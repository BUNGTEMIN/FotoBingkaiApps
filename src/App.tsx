import React, { useState, useEffect, useRef } from 'react';
import { 
  Upload, Sparkles, RefreshCw, Sliders, CircleHelp, Download, Maximize2, Edit2,
  FolderOpen, Camera, Laptop, Cpu, Layers, Settings2, Activity, Info, CheckCircle, MoveHorizontal,
  Undo, Redo, Type, ArrowUp, ArrowDown, ChevronsUp, ChevronsDown, Trash2, RotateCw, Move,
  Lock, Unlock, Image as ImageIcon, Maximize
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// Firebase and database setup
import { doc, setDoc, serverTimestamp, collection, getDocs, query, orderBy, deleteDoc, where } from 'firebase/firestore';
import { onAuthStateChanged, signInWithPopup, GoogleAuthProvider, signOut, User } from 'firebase/auth';
import { db, auth, handleFirestoreError, OperationType } from './firebase';

// Custom components
import BungteminHeader from './components/BungteminHeader';
import FrameSelector from './components/FrameSelector';
import ImageAdjuster from './components/ImageAdjuster';
import StickerSelector, { FUTURISTIC_FONTS, STICKER_COLORS } from './components/StickerSelector';
import { LazyImage } from './components/LazyImage';

// Types & presets
import { Frame, ImageSettings, PlacedSticker } from './types';
import { FRAMES, FILTER_PRESETS, PRESET_STICKERS } from './presets';
import { renderToCanvas, resolveApiUrl } from './canvasUtils';

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

export default function App() {
  // Google Authentication State
  const [user, setUser] = useState<User | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [authErrorDetail, setAuthErrorDetail] = useState<string | null>(null);
  const [showAuthWarning, setShowAuthWarning] = useState(false);

  // Page state: 'beranda' / 'bingkai' / 'misi' / 'galeri' / 'album'
  const [currentPage, setCurrentPage] = useState<'beranda' | 'bingkai' | 'misi' | 'galeri' | 'album'>('beranda');
  const [savedCreations, setSavedCreations] = useState<{ id: string; src: string; timestamp: string }[]>([]);

  // Cloud Firestore downloads state and fetching logic
  const [cloudDownloads, setCloudDownloads] = useState<any[]>([]);
  const [isLoadingCloudDownloads, setIsLoadingCloudDownloads] = useState(false);
  const [galleryTab, setGalleryTab] = useState<'cloud' | 'nufat'>('cloud');
  const [cloudSubTab, setCloudSubTab] = useState<'all' | 'mine' | 'others'>('all');

  const fetchCloudDownloads = async (targetSubTab?: 'all' | 'mine' | 'others') => {
    const activeSubTab = targetSubTab || cloudSubTab;
    setIsLoadingCloudDownloads(true);
    const currentUid = auth.currentUser?.uid || user?.uid;

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
          userAvatar: data.userAvatar || ''
        });
      });
      setCloudDownloads(items);
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
            userAvatar: data.userAvatar || ''
          });
        });
        items.sort((a, b) => b.id.localeCompare(a.id));
        setCloudDownloads(items);
      } catch (fallbackErr: any) {
        console.error("Gagal total mengambil koleksi cloud:", fallbackErr);
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
        fetchCloudDownloads();
      } catch (err: any) {
        console.error('Error delete cloud document:', err);
        triggerToast(`Gagal: ${err.message || err}`);
      }
    }
  };

  useEffect(() => {
    if (currentPage === 'galeri' || currentPage === 'album') {
      fetchCloudDownloads(cloudSubTab);
    }
  }, [currentPage, user, cloudSubTab]);

  // Nufat Live Community Gallery API integration
  const [comGalleryItems, setComGalleryItems] = useState<any[]>([]);
  const [isLoadingComGallery, setIsLoadingComGallery] = useState(false);
  const [comGalleryError, setComGalleryError] = useState<string | null>(null);

  const fetchComGalleryItems = async () => {
    setIsLoadingComGallery(true);
    setComGalleryError(null);
    try {
      const res = await fetch(resolveApiUrl('/api/external-images'));
      if (!res.ok) throw new Error('Gagal mengambil daftar kreasi dari Wabot Nufat API');
      const data = await res.json();
      
      const formatted = data.map((item: any, idx: number) => ({
        id: item.id && item.id.startsWith('nufat') ? item.id : `nufat-creation-${item.id || idx}`,
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
      console.error("Error loading Nufat creations:", err);
      setComGalleryError(err?.message || 'Gagal tersambung ke server Nufat API.');
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
  const [userImage, setUserImage] = useState<string | null>(DEFAULT_IMAGE);
  const [selectedFrame, setSelectedFrame] = useState<Frame>(FRAMES[0]);
  const [customFrames, setCustomFrames] = useState<Frame[]>([]);
  const [neonColor, setNeonColor] = useState('#00f2fe'); // default tech cyan
  const [imageSettings, setImageSettings] = useState<ImageSettings>(DEFAULT_SETTINGS);
  
  // Undo/Redo history states for ImageSettings
  const [history, setHistory] = useState<ImageSettings[]>([DEFAULT_SETTINGS]);
  const [historyIndex, setHistoryIndex] = useState<number>(0);
  const lastCommittedRef = useRef<ImageSettings>(DEFAULT_SETTINGS);
  const pendingHistoryTimerRef = useRef<NodeJS.Timeout | null>(null);
  const imageSettingsRef = useRef<ImageSettings>(DEFAULT_SETTINGS);

  const [filterPresetId, setFilterPresetId] = useState('none');
  const [stickers, setStickers] = useState<PlacedSticker[]>([]);
  const [selectedStickerId, setSelectedStickerId] = useState<string | null>(null);
  const [isHudOpen, setIsHudOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'adjust' | 'filter' | 'color' | 'stickers' | 'text' | 'layers' | 'ai' | 'download' | 'history' | null>(null);
  const [isPhotoLocked, setIsPhotoLocked] = useState(false);
  const [downloadSize, setDownloadSize] = useState<number>(1000);
  const [downloadFormat, setDownloadFormat] = useState<'png' | 'webp' | 'jpeg'>('png');

  useEffect(() => {
    setIsHudOpen(false);
  }, [selectedStickerId]);
  
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
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  
  const [aiSlogans, setAiSlogans] = useState<any[]>([]);
  const [isGeneratingSlogans, setIsGeneratingSlogans] = useState(false);
  
  // UI states
  const [isLoading, setIsLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState('SISTEM SIAP');
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
      const galleryPersisted = localStorage.getItem('bt_my_gallery');
      if (galleryPersisted) {
        const parsed = JSON.parse(galleryPersisted);
        const filteredGallery = parsed.filter((g: any) => 
          !(g.caption?.toLowerCase().includes('overload')) && 
          !(g.caption?.toLowerCase().includes('ahah')) &&
          !(g.frameName?.toLowerCase().includes('rose'))
        );
        setSavedCreations(filteredGallery);
        if (parsed.length !== filteredGallery.length) {
          localStorage.setItem('bt_my_gallery', JSON.stringify(filteredGallery));
        }
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
      console.error("Google login error:", err);
      setAuthErrorDetail(err.message || String(err));
      
      // Check if popup was closed, cancelled or blocked
      if (err.code === 'auth/popup-closed-by-user' || 
          err.code === 'auth/cancelled-popup-request' || 
          err.code === 'auth/popup-blocked' ||
          err.message?.includes('popup') ||
          err.message?.includes('closed') ||
          err.message?.includes('blocked')) {
        setShowAuthWarning(true);
        triggerToast("Login terputus karena browser memblokir pop-up. Menampilkan solusi... 🔐");
      } else {
        triggerToast(`Gagal masuk: ${err.message || err}`);
      }
    } finally {
      setIsAuthLoading(false);
    }
  };

  // Logout handler
  const handleLogout = async () => {
    try {
      setIsAuthLoading(true);
      await signOut(auth);
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
  const saveToGallery = (dataUrl: string) => {
    try {
      const item = {
        id: Date.now().toString(),
        src: dataUrl,
        timestamp: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' ' + new Date().toLocaleDateString('id-ID')
      };
      
      const existingStr = localStorage.getItem('bt_my_gallery') || '[]';
      const existing = JSON.parse(existingStr);
      const updated = [item, ...existing];
      setSavedCreations(updated);
      localStorage.setItem('bt_my_gallery', JSON.stringify(updated));
    } catch (e) {
      console.error(e);
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
  }, [userImage, selectedFrame, neonColor, imageSettings, stickers, downloadSize]);

  // Handle uploaded files
  const handleImageFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      triggerToast('Peringatan: File harus berupa gambar.');
      return;
    }

    setIsLoading(true);
    setStatusMessage('MEMBACA GAMBAR...');
    
    const reader = new FileReader();
    reader.onload = (e) => {
      if (typeof e.target?.result === 'string') {
        setUserImage(e.target.result);
        const startSettings = {
          ...DEFAULT_SETTINGS,
          scale: 1.0,
        };
        // Reset positioning settings for fresh images
        setImageSettings(startSettings);
        resetHistoryStack(startSettings);
        setFilterPresetId('none');
        setIsLoading(false);
        setStatusMessage('GAMBAR UNGGAHAN TERPASANG');
        triggerToast('Foto berhasil diunggah!');
      }
    };
    reader.onerror = () => {
      setIsLoading(false);
      setStatusMessage('SISTEM ERROR');
      triggerToast('Gagal memuat gambar.');
    };
    reader.readAsDataURL(file);
  };

  const onFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleImageFile(file);
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
    // If user clicks the canvas, we assume they want to deselect active layers
    if (selectedStickerId) {
      setSelectedStickerId(null);
      setIsHudOpen(false);
    }
    
    if (!userImage) return;

    // Track active pointer info
    activePointersRef.current[e.pointerId] = { clientX: e.clientX, clientY: e.clientY };
    const pointerIds = Object.keys(activePointersRef.current);
    hasMovedOrScaledRef.current = false;

    if (pointerIds.length === 1) {
      if (!isPhotoLocked) {
        setIsDraggingCanvas(true);
        dragStartRef.current = { x: e.clientX, y: e.clientY };
        startOffsetRef.current = { x: imageSettings.x, y: imageSettings.y };
      }
    } else if (pointerIds.length === 2 && !isPhotoLocked) {
      // Switch from drag state to dual pointer zoom state
      setIsDraggingCanvas(false);
      const p1 = activePointersRef.current[Number(pointerIds[0])];
      const p2 = activePointersRef.current[Number(pointerIds[1])];
      const distance = Math.hypot(p1.clientX - p2.clientX, p1.clientY - p2.clientY);
      initialPinchDistanceRef.current = distance;
      initialPinchScaleRef.current = imageSettings.scale;
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
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    delete activePointersRef.current[e.pointerId];
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch (err) {
      // Ignore fallback issues with capture release
    }

    const pointerIds = Object.keys(activePointersRef.current);
    if (pointerIds.length < 2) {
      initialPinchDistanceRef.current = null;
    }

    if (pointerIds.length === 0) {
      if (hasMovedOrScaledRef.current) {
        setIsGlitching(true);
        setTimeout(() => setIsGlitching(false), 300);
        hasMovedOrScaledRef.current = false;
      }
      setIsDraggingCanvas(false);
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
    triggerToast('Overlay ditambahkan!');
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
    if (selectedFrame.id === id) {
      setSelectedFrame(FRAMES[0]);
    }
  };

  // AI Generation actions using Google Gemini API on server proxy
  const handleGenerateAIImage = async () => {
    if (!aiPrompt.trim()) {
      setAiError('Silakan masukkan deskripsi atau prompt terlebih dahulu.');
      return;
    }
    setIsGeneratingAI(true);
    setAiError(null);
    try {
      const response = await fetch(resolveApiUrl('/api/ai/image'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: aiPrompt }),
      });
      const data = await response.json();
      if (!response.ok || data.error) {
        throw new Error(data.error || 'Gagal menghasilkan gambar');
      }
      setUserImage(data.image);
      triggerToast('SISTEM: Foto avatar AI berhasil dipasang!');
      setAiPrompt('');
    } catch (err: any) {
      console.error(err);
      setAiError(err.message || 'Gagal generate gambar. Cek API Key Anda.');
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
      console.error(err);
      setAiError(err.message || 'Gagal merancang bingkai. Cek API Key.');
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
      console.error(err);
      setAiError(err.message || 'Gagal generate slogan. Cek API Key.');
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
    triggerToast('Memproses file HD...', 2000);

    setTimeout(async () => {
      try {
        // Formulate pathsMap for SVG rendering
        const pathsMap: Record<string, string> = {};
        PRESET_STICKERS.forEach((st) => {
          pathsMap[st.id] = st.svgPath || '';
        });

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

        // Auto save to local gallery
        saveToGallery(dataUrl);

        // Compress and prepare compact base64 representation for Firebase Firestore storage (ensure < 1MB limit is structurally enforced)
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

        setIsLoading(false);
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
        setStatusMessage('GAGAL EKSPOR');
        alert('Gagal mendownload karena masalah keamanan CORS server internal. Silahkan ganti ke frame model "FUTURISTIK" kami yang beresolusi super tajam tanpa CORS!');
      }
    }, 800);
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
  const quest2Completed = selectedFrame !== null && selectedFrame.id !== FRAMES[0].id;
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
        completedQuests={completedCount}
        totalQuests={totalQuests}
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
                  {FRAMES.map((frame) => {
                    const isSelected = frame.id === selectedFrame.id;
                    return (
                      <button
                        key={frame.id}
                        onClick={() => {
                          setSelectedFrame(frame);
                          triggerToast(`Bingkai "${frame.name}" dipilih`);
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
                              dangerouslySetInnerHTML={{ __html: frame.renderSvg(neonColor) }}
                            />
                          ) : frame.src ? (
                            <img 
                              src={frame.src} 
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
                className={`w-full h-full object-contain pointer-events-none relative z-10 ${isGlitching ? 'glitch-active' : ''}`} 
                style={{ transform: 'translateZ(0px)', transformStyle: 'preserve-3d' }}
              />

              {/* Absolute interactive sticker & text overlays on screen */}
              {stickers.map((item) => {
                const isSelected = item.id === selectedStickerId;
                // Base size for preview overlay on screen (normalized multiplier)
                const baseSize = item.scale * 16;
                
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
                          fontSize: `${baseSize}px`,
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
                    ) : (
                      <svg 
                        width={baseSize * 1.5} 
                        height={baseSize * 1.5} 
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
                    <div className="grid grid-cols-5 gap-1 select-none">
                      {[
                        { id: 'plain', label: 'Polos' },
                        { id: 'neon', label: 'Neon' },
                        { id: 'glitch', label: 'Glitch' },
                        { id: 'chrome', label: 'Chrome' },
                        { id: 'hologram', label: 'Hologram' }
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
            transition={{ type: 'spring', damping: 26, stiffness: 340 }}
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
                {activeTab === 'filter' && <><Sliders className="w-3.5 h-3.5 text-neon-cyan" /> FILTER ESTETIK</>}
                {activeTab === 'color' && <><Cpu className="w-3.5 h-3.5 text-neon-cyan" /> KOREKSI WARNA & BLUR</>}
                {activeTab === 'stickers' && <><Layers className="w-3.5 h-3.5 text-neon-cyan" /> BADGE & DEKORASI</>}
                {activeTab === 'text' && <><Type className="w-3.5 h-3.5 text-neon-cyan" /> TEKS ESTETIK</>}
                {activeTab === 'layers' && <><Layers className="w-3.5 h-3.5 text-neon-cyan" /> MANAJEMEN LAYER</>}
                {activeTab === 'ai' && <><Sparkles className="w-3.5 h-3.5 text-amber-400 animate-pulse" /> AI GENERATE</>}
                {activeTab === 'download' && <><Download className="w-3.5 h-3.5 text-neon-cyan animate-bounce" /> FORMAT UNDUH & RESOLUSI</>}
                {activeTab === 'history' && <><Activity className="w-3.5 h-3.5 text-emerald-400 animate-pulse" /> RIWAYAT PERUBAHAN</>}
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
                <StickerSelector
                  stickers={stickers}
                  onAddSticker={handleAddSticker}
                  onUpdateSticker={handleUpdateSticker}
                  onDeleteSticker={handleDeleteSticker}
                  neonColor={neonColor}
                  selectedStickerId={selectedStickerId}
                  onSelectSticker={setSelectedStickerId}
                  theme={theme}
                  modeOnly="sticker"
                />
              )}

              {activeTab === 'text' && (
                <StickerSelector
                  stickers={stickers}
                  onAddSticker={handleAddSticker}
                  onUpdateSticker={handleUpdateSticker}
                  onDeleteSticker={handleDeleteSticker}
                  neonColor={neonColor}
                  selectedStickerId={selectedStickerId}
                  onSelectSticker={setSelectedStickerId}
                  theme={theme}
                  modeOnly="text"
                />
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
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 leading-none mb-1">
                            <span className="text-[7px] tracking-widest font-extrabold uppercase text-emerald-500/80">OVERLAY</span>
                            <span className="text-[7.5px] text-zinc-500 font-bold">#FIXED</span>
                            <Lock className="w-2.5 h-2.5 text-zinc-500 ml-1 opacity-50" />
                          </div>
                          <p className="text-[11px] font-sans font-semibold uppercase truncate">
                            {selectedFrame ? `BINGKAI: ${selectedFrame.name}` : 'TIDAK ADA BINGKAI AKTIF'}
                          </p>
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
                      onClick={() => { setAiMode('frame'); setAiError(null); }}
                      className={`flex-1 py-1 px-1 rounded font-mono text-[8.5px] font-black tracking-wider uppercase transition-all ${
                        aiMode === 'frame'
                          ? 'bg-[#00F0FF] text-black shadow-[0_0_10px_rgba(0,240,255,0.25)] font-black'
                          : theme === 'dark' ? 'text-zinc-550 hover:text-zinc-200' : 'text-zinc-500 hover:text-zinc-800'
                      }`}
                    >
                      🎨 BINGKAI AI
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
                      { label: 'Standard HD', value: 1000, desc: '1000x1000 px' },
                      { label: 'Super HD', value: 1500, desc: '1500x1500 px' },
                      { label: 'Ultra 4K', value: 2000, desc: '2000x2000 px' },
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
                onClick={() => setActiveTab(activeTab === 'ai' ? null : 'ai')}
                className={`snap-center flex-shrink-0 px-3.5 py-1.5 rounded-xl font-mono text-xs font-bold tracking-widest transition-all duration-150 flex flex-col items-center justify-center space-y-1 min-w-[76px] ${
                  activeTab === 'ai'
                    ? 'bg-amber-400/25 text-amber-400 border-t-2 border-amber-400 shadow-[0_0_15px_rgba(251,191,36,0.2)]'
                    : 'text-amber-500 hover:text-amber-400 hover:bg-amber-955/10'
                }`}
              >
                <Sparkles className="w-4 h-4 animate-pulse" />
                <span className="text-[8px] uppercase tracking-wider font-extrabold">AI GENERATE</span>
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

       {/* CREATIVE QUESTS PAGE TAB */}
      {currentPage === 'misi' && (
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
      <div className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-8">
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
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {FRAMES.map((frame) => {
            const isSelected = frame.id === selectedFrame.id;
            return (
              <div
                key={frame.id}
                onClick={() => {
                  setSelectedFrame(frame);
                  setCurrentPage('beranda');
                  triggerToast(`SISTEM: Bingkai "${frame.name}" aktif!`);
                }}
                className={`group cursor-pointer rounded-xl bg-[#0b0b0b] border p-4 flex flex-col items-center space-y-3.5 transition-all duration-300 relative overflow-hidden ${
                  isSelected
                    ? 'border-neon-cyan bg-cyan-950/20 shadow-[0_0_20px_rgba(0,240,255,0.15)]'
                    : 'border-white/10 hover:border-neon-cyan/40 hover:bg-white/[0.02]'
                }`}
              >
                {/* Decorative scanner lines */}
                <div className="scanlines absolute inset-0 opacity-10 pointer-events-none" />

                {/* Mini Viewport Preview */}
                <div className="relative aspect-square w-full rounded bg-black/60 overflow-hidden flex items-center justify-center p-4 border border-white/5">
                  {frame.renderSvg ? (
                    <div
                      className="w-full h-full scale-95 pointer-events-none"
                      dangerouslySetInnerHTML={{ __html: frame.renderSvg(neonColor) }}
                    />
                  ) : frame.src ? (
                    <img
                      src={frame.src}
                      alt={frame.name}
                      className="w-full h-full object-contain filter brightness-95 pointer-events-none"
                    />
                  ) : null}
                  <div className="absolute inset-0 bg-transparent group-hover:bg-cyan-950/10 transition-colors pointer-events-none" />
                </div>

                <div className="text-center w-full min-w-0">
                  <span className="text-[9px] font-mono text-neon-cyan tracking-wider uppercase font-bold px-1.5 py-0.5 rounded bg-cyan-950/30 border border-cyan-500/10">
                    {frame.category || 'PRESET'}
                  </span>
                  <h3 className="font-mono text-xs font-bold text-zinc-100 mt-2 truncate w-full group-hover:text-neon-cyan transition-colors">
                    {frame.name}
                  </h3>
                  <p className="text-[9.5px] text-zinc-500 truncate mt-0.5 w-full font-sans">
                    {frame.description || 'Bingkai estetik edisi digital futuristik'}
                  </p>
                </div>

                {/* Action button */}
                <div className="w-full pt-2 border-t border-white/5">
                  <button className="w-full py-1.5 rounded bg-white/5 hover:bg-neon-cyan hover:text-black font-mono text-[9px] font-bold tracking-wider transition-all uppercase">
                    GUNAKAN BINGKAI
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    )}

    {/* COMMUNITY WORKS WEB GALLERY PAGE */}
    {currentPage === 'galeri' && (
      <div className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between border-b border-white/10 pb-6 gap-4">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#39ff14]/10 text-neon-green border border-[#39ff14]/25 font-mono text-[9px] tracking-widest uppercase mb-1">
              <Sparkles className="w-3.5 h-3.5 text-neon-green animate-pulse" /> CLOUD & COMMUNITY GALLERY
            </div>
            <h2 className="text-2xl font-display font-extrabold tracking-tight text-white uppercase">
              GALERI KREASI MULTI-USER
            </h2>
            <p className="text-xs text-zinc-400">
              Lihat seluruh hasil unduhan twibbon, baik karya Anda sendiri maupun karya dari pengguna lain secara real-time.
            </p>
          </div>

          <div className="flex flex-wrap gap-2 shrink-0">
            <button
              onClick={() => {
                setGalleryTab('cloud');
                fetchCloudDownloads();
              }}
              className={`px-3 py-2 rounded font-mono text-[10px] uppercase font-bold tracking-wider flex items-center gap-1.5 transition-all border ${
                galleryTab === 'cloud'
                  ? 'bg-neon-cyan/20 border-neon-cyan text-white shadow-[0_0_15px_rgba(0,240,255,0.25)]'
                  : 'bg-zinc-950 border-white/10 text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <Activity className="w-3.5 h-3.5" /> Cloud Database (Real-time)
            </button>
            <button
              onClick={() => {
                setGalleryTab('nufat');
                fetchComGalleryItems();
              }}
              className={`px-3 py-2 rounded font-mono text-[10px] uppercase font-bold tracking-wider flex items-center gap-1.5 transition-all border ${
                galleryTab === 'nufat'
                  ? 'bg-neon-green/20 border-neon-green text-white shadow-[0_0_15px_rgba(57,255,20,0.25)]'
                  : 'bg-zinc-950 border-white/10 text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <RefreshCw className="w-3.5 h-3.5" /> Live API Wabot Nufat
            </button>
          </div>
        </div>

        {/* Tab 1: Cloud Downloads Category views ("Saya" vs "Orang Lain") */}
        {galleryTab === 'cloud' && (
          <div className="space-y-6">
            <div className="flex flex-wrap gap-2 border-b border-white/5 pb-4">
              <button
                onClick={() => setCloudSubTab('all')}
                className={`px-4 py-2 rounded-lg font-mono text-[9px] uppercase tracking-wider transition-all font-bold ${
                  cloudSubTab === 'all'
                    ? 'bg-white text-zinc-950'
                    : 'bg-zinc-900 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-850'
                }`}
              >
                Semua Karya Cloud {cloudSubTab === 'all' ? `(${cloudDownloads.length})` : ''}
              </button>
              <button
                onClick={() => setCloudSubTab('mine')}
                className={`px-4 py-2 rounded-lg font-mono text-[9px] uppercase tracking-wider transition-all font-bold flex items-center gap-1.5 ${
                  cloudSubTab === 'mine'
                    ? 'bg-neon-cyan text-zinc-950 shadow-[0_0_10px_rgba(0,240,255,0.2)]'
                    : 'bg-zinc-900 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-850'
                }`}
              >
                👤 Galeri Saya {cloudSubTab === 'all' ? `(${cloudDownloads.filter(item => {
                  const currentUid = auth.currentUser?.uid || user?.uid;
                  return currentUid && item.userId === currentUid;
                }).length})` : cloudSubTab === 'mine' ? `(${cloudDownloads.length})` : ''}
              </button>
              <button
                onClick={() => setCloudSubTab('others')}
                className={`px-4 py-2 rounded-lg font-mono text-[9px] uppercase tracking-wider transition-all font-bold flex items-center gap-1.5 ${
                  cloudSubTab === 'others'
                    ? 'bg-purple-600 text-white'
                    : 'bg-zinc-900 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-850'
                }`}
              >
                🌐 Galeri Orang Lain {cloudSubTab === 'all' ? `(${cloudDownloads.filter(item => {
                  const currentUid = auth.currentUser?.uid || user?.uid;
                  return !currentUid || item.userId !== currentUid;
                }).length})` : cloudSubTab === 'others' ? `(${cloudDownloads.length})` : ''}
              </button>

              <button
                onClick={() => fetchCloudDownloads()}
                disabled={isLoadingCloudDownloads}
                className="ml-auto px-3 py-1.5 text-zinc-400 hover:text-white rounded border border-white/5 bg-zinc-950 font-mono text-[9.5px] uppercase tracking-wider font-bold flex items-center gap-1.5 active:scale-95 disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoadingCloudDownloads ? 'animate-spin text-neon-cyan' : 'text-zinc-400'}`} /> SINKRONISASI
              </button>
            </div>

            {isLoadingCloudDownloads ? (
              <div className="py-24 text-center space-y-4">
                <div className="w-10 h-10 border-2 border-neon-cyan border-t-transparent rounded-full animate-spin mx-auto"></div>
                <h3 className="font-mono text-xs font-bold text-zinc-300 uppercase tracking-widest animate-pulse">SINKRONISASI DATABASE CLOUD...</h3>
              </div>
            ) : (
              (() => {
                const filteredCloud = cloudDownloads.filter(item => {
                  const currentUid = auth.currentUser?.uid || user?.uid;
                  const matchesUser = currentUid && item.userId === currentUid;
                  if (cloudSubTab === 'mine') {
                    return matchesUser;
                  }
                  if (cloudSubTab === 'others') {
                    return !matchesUser;
                  }
                  return true;
                });

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
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {filteredCloud.map((item) => {
                      const currentUid = auth.currentUser?.uid || user?.uid;
                      const matchesUser = currentUid && item.userId === currentUid;
                      return (
                        <div key={item.id} className="rounded-xl bg-[#0b0b0b] border border-white/10 overflow-hidden flex flex-col group hover:border-[#00F0FF]/30 transition-all duration-300 shadow-xl">
                          {/* User Header */}
                          <div className="p-3 bg-black/40 border-b border-white/5 flex items-center justify-between">
                            <div className="flex items-center space-x-2 min-w-0">
                              <img
                                referrerPolicy="no-referrer"
                                src={item.userAvatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=80&q=80'}
                                className="w-5 h-5 rounded-full border border-neon-cyan/40"
                                alt="U"
                              />
                              <span className="font-mono text-[10px] text-zinc-300 font-bold truncate max-w-[110px]" title={item.userEmail}>
                                {item.userName}
                              </span>
                            </div>
                            {matchesUser ? (
                              <span className="font-mono text-[8px] bg-[#00F0FF]/10 text-neon-cyan px-1.5 py-0.5 rounded border border-[#00F0FF]/20 font-bold uppercase tracking-wide">
                                SAYA 👤
                              </span>
                            ) : (
                              <span className="font-mono text-[8px] bg-purple-500/15 text-purple-400 px-1.5 py-0.5 rounded border border-purple-500/20 font-bold uppercase tracking-wide">
                                KELUARGA 🌐
                              </span>
                            )}
                          </div>

                          {/* Image Thumbnail */}
                          <div className="relative aspect-square bg-zinc-950 flex items-center justify-center p-0 overflow-hidden border-b border-white/5">
                            <LazyImage
                              src={item.imageUrl}
                              alt={item.fileName}
                              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105 pointer-events-none select-none"
                            />
                            <div className="absolute bottom-2 left-2 bg-black/85 px-1.5 py-0.5 rounded border border-white/10 font-mono text-[8px] text-neon-cyan tracking-wider">
                              FORMAT: {item.format.toUpperCase()}
                            </div>
                          </div>

                          {/* Details & Actions */}
                          <div className="p-4 flex-1 flex flex-col justify-between space-y-3.5">
                            <div className="space-y-1">
                              <h4 className="font-mono text-[10.5px] font-bold text-zinc-200 truncate" title={item.fileName}>
                                {item.fileName}
                              </h4>
                              <p className="text-[9px] text-zinc-500 font-mono leading-none">
                                Dimuat: {item.downloadedAt}
                              </p>
                            </div>

                            <div className="space-y-2 pt-1 border-t border-white/5">
                              <div className="grid grid-cols-2 gap-2">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setUserImage(item.imageUrl);
                                    setCurrentPage('beranda');
                                    triggerToast('Workspace dimuat ulang! Gunakan bingkai baru pada foto ini. 🔄✨');
                                  }}
                                  className="py-1.5 border border-white/10 hover:border-neon-cyan/50 bg-zinc-900/60 hover:bg-zinc-900 text-zinc-300 hover:text-white rounded font-mono text-[9px] uppercase font-bold transition-all"
                                  title="Gunakan foto ini kembali di Canvas Editor"
                                >
                                  EDIT ULANG 🔄
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    const a = document.createElement('a');
                                    a.href = item.imageUrl;
                                    a.download = item.fileName || 'unduhan-cloud.jpg';
                                    document.body.appendChild(a);
                                    a.click();
                                    document.body.removeChild(a);
                                    triggerToast('Unduhan berjalan lancar! 📥🛸');
                                  }}
                                  className="py-1.5 border border-white/10 hover:border-neon-green/50 bg-zinc-900/60 hover:bg-zinc-900 text-zinc-350 hover:text-white rounded font-mono text-[9px] uppercase font-bold transition-all"
                                >
                                  UNDUH 📥
                                </button>
                              </div>

                              {matchesUser && (
                                <button
                                  type="button"
                                  onClick={() => deleteCloudDownload(item.id)}
                                  className="w-full py-1 text-[8.5px] border border-red-500/20 text-red-400 hover:bg-red-500/10 font-mono uppercase font-bold rounded transition-all active:scale-[0.98]"
                                >
                                  SALURKAN / HAPUS AWAN 🗑️
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })()
            )}
          </div>
        )}

        {/* Tab 2: Nufat Live API images */}
        {galleryTab === 'nufat' && (
          <div className="space-y-6">
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {(comGalleryItems.length > 0 ? comGalleryItems : COMMUNITY_GALLERY).map((post) => (
                <div key={post.id} className="rounded-xl bg-[#0b0b0b] border border-white/10 overflow-hidden flex flex-col group hover:border-[#00F0FF]/30 transition-all duration-300 shadow-xl">
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
                            const targetFrame = FRAMES.find(f => f.id === post.frameId) || FRAMES[0];
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
        )}
      </div>
    )}

    {/* MY SAVED CREATIONS PERSISTANT ALBUM COBA PAGE */}
    {currentPage === 'album' && (
      <div className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#00F0FF]/10 text-neon-cyan border border-[#00F0FF]/25 font-mono text-[9px] tracking-widest uppercase mb-1">
              <FolderOpen className="w-3.5 h-3.5 animate-pulse" /> PENYIMPANAN WORKSPACE SAYA
            </div>
            <h2 className="text-2xl font-display font-extrabold tracking-tight text-white uppercase">
              ALBUM KREASI SAYA
            </h2>
            <p className="text-xs text-zinc-400">
              Penyimpanan lokal khusus untuk foto-foto yang diunduh atau disimpan dalam sesi penjelajahan ini.
            </p>
          </div>

          {savedCreations.length > 0 && (
            <button
              onClick={() => {
                if (confirm('Apakah Anda yakin ingin menghapus semua hasil kreasi di galeri lokal ini?')) {
                  setSavedCreations([]);
                  localStorage.removeItem('bt_my_gallery');
                  triggerToast('SISTEM: Semua album lokal dihapus.');
                }
              }}
              className="px-3 py-1.5 border border-red-500/30 hover:border-red-500 text-red-400 hover:bg-red-950/20 rounded font-mono text-[9px] transition-all"
            >
              KOSONGKAN ALBUM
            </button>
          )}
        </div>

        {savedCreations.length === 0 ? (
          <div className="py-20 text-center border border-white/5 bg-[#0b0b0b]/60 rounded-xl space-y-4 max-w-lg mx-auto">
            <div className="w-12 h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mx-auto">
              <FolderOpen className="w-6 h-6 text-zinc-500 animate-pulse" />
            </div>
            <div className="space-y-2">
              <h3 className="font-mono text-xs font-bold text-zinc-300">ALBUM SAYA MASIH KOSONG</h3>
              <p className="text-[11px] text-zinc-400 max-w-xs mx-auto">
                Unduh karya pertama Anda di menu Beranda untuk menyimpannya di koleksi galeri lokal ini secara otomatis!
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
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {savedCreations.map((creation) => (
              <div key={creation.id} className="rounded-xl bg-[#0b0b0b]/80 border border-white/10 overflow-hidden flex flex-col group relative">
                {/* Action Overlay bar */}
                <div className="absolute top-2 right-2 flex space-x-1.5 z-20 opacity-0 group-hover:opacity-100 transition-opacity duration-205">
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
                    className="p-1.5 bg-black/80 hover:bg-neon-cyan hover:text-black text-neon-cyan rounded border border-neon-cyan/25 font-bold shadow-lg shadow-black"
                    title="Download Ulang"
                  >
                    <Download className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => {
                      const updated = savedCreations.filter(c => c.id !== creation.id);
                      setSavedCreations(updated);
                      localStorage.setItem('bt_my_gallery', JSON.stringify(updated));
                      triggerToast('Karya dihapus dari album.');
                    }}
                    className="p-1.5 bg-black/80 hover:bg-red-500 hover:text-white text-zinc-400 rounded border border-white/10 font-bold shadow-lg shadow-black"
                    title="Hapus"
                  >
                    <span className="text-[10px]">✕</span>
                  </button>
                </div>

                {/* Render Target Image */}
                <div className="relative aspect-square backdrop-blur-md bg-zinc-950 border-b border-white/5 flex items-center justify-center p-0 group-hover:scale-[1.01] transition-transform duration-300">
                  {creation.src ? (
                    <img src={creation.src} alt="Kreasiku" className="w-full h-full object-cover pointer-events-none select-none" />
                  ) : null}
                  <div className="absolute inset-0 bg-transparent group-hover:bg-black/10 transition-colors pointer-events-none" />
                </div>

                <div className="p-3 bg-black/30 flex items-center justify-between">
                  <span className="font-mono text-[8px] text-zinc-500 uppercase">{creation.timestamp}</span>
                  <span className="font-mono text-[8.5px] text-neon-cyan px-1.5 rounded bg-cyan-950/20 border border-cyan-500/10 uppercase tracking-widest font-bold">SAVED HD</span>
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
          <span className="flex items-center gap-1">
            <CheckCircle className="w-3 h-3 text-neon-green" /> WORKSPACE CORE V3.0 STATUS: CONNECTED
          </span>
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
    </div>
  );
}
