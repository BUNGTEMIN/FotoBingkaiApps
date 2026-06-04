import React, { useState, useEffect, useRef } from 'react';
import { 
  Upload, Sparkles, RefreshCw, Sliders, CircleHelp, Download, Maximize2, 
  FolderOpen, Camera, Laptop, Cpu, Layers, Settings2, Activity, Info, CheckCircle, MoveHorizontal
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// Firebase and database setup
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { onAuthStateChanged, signInWithPopup, GoogleAuthProvider, signOut, User } from 'firebase/auth';
import { db, auth, handleFirestoreError, OperationType } from './firebase';

// Custom components
import BungteminHeader from './components/BungteminHeader';
import FrameSelector from './components/FrameSelector';
import ImageAdjuster from './components/ImageAdjuster';
import StickerSelector from './components/StickerSelector';
import { LazyImage } from './components/LazyImage';

// Types & presets
import { Frame, ImageSettings, PlacedSticker } from './types';
import { FRAMES, FILTER_PRESETS, PRESET_STICKERS } from './presets';
import { renderToCanvas } from './canvasUtils';

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
};

const COMMUNITY_GALLERY = [
  {
    id: 'cg1',
    username: '@cyber_warrior',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
    frameId: 'cyber-hud-1',
    frameName: 'Cybernetic HUD Pro',
    neonColor: '#00f2fe',
    filterPresetId: 'cyberpunk',
    filterName: 'Cyberpunk Neon',
    caption: 'Konfigurasi visual grid paling tajam masa kini! 🦾⚡'
  },
  {
    id: 'cg2',
    username: '@neon_princess',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=300&q=80',
    frameId: 'tech-brackets-1',
    frameName: 'HUD Tech Brackets',
    neonColor: '#ff007f',
    filterPresetId: 'synthwave',
    filterName: 'Synthwave Sunset',
    caption: 'Estetika synthwave berpadu harmonis dengan ornamen fiksi ilmiah. 🌅✨'
  },
  {
    id: 'cg3',
    username: '@tanjiro_it',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80',
    frameId: 'neon-border-1',
    frameName: 'Neon Tech Border',
    neonColor: '#30ff30',
    filterPresetId: 'matrix',
    filterName: 'Matrix Grid',
    caption: 'Masuk ke dalam directory system code Bungtemin.'
  },
  {
    id: 'cg4',
    username: '@glitch_hunter',
    avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=300&q=80',
    frameId: 'vhs-retro-1',
    frameName: 'VHS Glitch Border',
    neonColor: '#9d4edd',
    filterPresetId: 'vhs',
    filterName: 'Retro VHS Glitch',
    caption: 'Kehilangan sinyal telemetri sistem. Mohon rewind pita kaset analog! 📠📺'
  }
];

export default function App() {
  // Google Authentication State
  const [user, setUser] = useState<User | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);

  // Page state: 'beranda' / 'bingkai' / 'galeri' / 'album'
  const [currentPage, setCurrentPage] = useState<'beranda' | 'bingkai' | 'galeri' | 'album'>('beranda');
  const [savedCreations, setSavedCreations] = useState<{ id: string; src: string; timestamp: string }[]>([]);

  // Nufat Live Community Gallery API integration
  const [comGalleryItems, setComGalleryItems] = useState<any[]>([]);
  const [isLoadingComGallery, setIsLoadingComGallery] = useState(false);
  const [comGalleryError, setComGalleryError] = useState<string | null>(null);

  const fetchComGalleryItems = async () => {
    setIsLoadingComGallery(true);
    setComGalleryError(null);
    try {
      const res = await fetch('/api/external-images');
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
  const [filterPresetId, setFilterPresetId] = useState('none');
  const [stickers, setStickers] = useState<PlacedSticker[]>([]);
  const [selectedStickerId, setSelectedStickerId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'adjust' | 'filter' | 'color' | 'overlays' | 'ai' | 'download' | null>('adjust');
  const [downloadSize, setDownloadSize] = useState<number>(1000);
  const [downloadFormat, setDownloadFormat] = useState<'png' | 'webp' | 'jpeg'>('png');
  
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
  const [aiMode, setAiMode] = useState<'image' | 'frame'>('image');
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  
  // UI states
  const [isLoading, setIsLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState('SISTEM SIAP');
  const [isDraggingCanvas, setIsDraggingCanvas] = useState(false);
  const [isDraggingFile, setIsDraggingFile] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastText, setToastText] = useState('');
  const [isGlitching, setIsGlitching] = useState(false);

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

  // Load custom frames & my gallery from localstorage on mount
  useEffect(() => {
    try {
      const persisted = localStorage.getItem('bt_custom_frames');
      if (persisted) {
        setCustomFrames(JSON.parse(persisted));
      }
      const galleryPersisted = localStorage.getItem('bt_my_gallery');
      if (galleryPersisted) {
        setSavedCreations(JSON.parse(galleryPersisted));
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
      const result = await signInWithPopup(auth, provider);
      triggerToast(`Selamat datang kembali, ${result.user.displayName || 'Pengguna'}! 🛸✨`);
    } catch (err: any) {
      console.error("Google login error:", err);
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
        // Reset positioning settings for fresh images
        setImageSettings({
          ...DEFAULT_SETTINGS,
          scale: 1.0,
        });
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
    if (!userImage) return;

    // Track active pointer info
    activePointersRef.current[e.pointerId] = { clientX: e.clientX, clientY: e.clientY };
    const pointerIds = Object.keys(activePointersRef.current);
    hasMovedOrScaledRef.current = false;

    if (pointerIds.length === 1) {
      setIsDraggingCanvas(true);
      dragStartRef.current = { x: e.clientX, y: e.clientY };
      startOffsetRef.current = { x: imageSettings.x, y: imageSettings.y };
    } else if (pointerIds.length === 2) {
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
          // Scale range boundary matching the input options from 0.1x to 3.0x
          const targetScale = Math.max(0.1, Math.min(3.0, initialPinchScaleRef.current * factor));
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
    } else if (pointerIds.length === 1) {
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
      const response = await fetch('/api/ai/image', {
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
      const response = await fetch('/api/ai/frame', {
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

  // Download high-resolution combined compilation
  const handleDownloadHD = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    setIsLoading(true);
    setStatusMessage('MENGEKSPOR HD...');
    triggerToast('Memproses file HD...', 2000);

    setTimeout(async () => {
      try {
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

        setIsLoading(false);
        setStatusMessage('SUKSES DIUNDUH');
        triggerToast(`Avatar ${ext.toUpperCase()} berhasil diunduh! Tersimpan juga di Album. 🎉`);

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

        // Upload download event data to Firebase Firestore
        const downloadId = `dl_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
        
        try {
          await setDoc(doc(db, 'downloads', downloadId), {
            id: downloadId,
            fileName: fileName,
            imageUrl: firebaseBase64,
            format: ext,
            size: downloadSize,
            downloadedAt: serverTimestamp()
          });
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
      />

      {/* Main Workspace Layout */}
      {currentPage === 'beranda' && (
        <main ref={workspaceRef} className="flex-1 max-w-2xl w-full mx-auto p-4 sm:p-6 pb-28 flex flex-col space-y-4">
          <div className="bg-transparent lg:bg-[#0b0b0b] lg:rounded-xl p-0 lg:p-5 border-0 lg:border lg:border-white/10 shadow-none lg:shadow-[0_4px_30px_rgba(0,0,0,0.5)] relative overflow-hidden flex flex-col">
            {/* Ambient retro-tech decorations */}
            <div className="hidden lg:block absolute top-0 left-0 w-8 h-8 border-t border-l border-neon-cyan/30 rounded-tl pointer-events-none" />
            <div className="hidden lg:block absolute top-0 right-0 w-8 h-8 border-t border-r border-neon-cyan/30 rounded-tr pointer-events-none" />
            <div className="hidden lg:block absolute bottom-0 left-0 w-8 h-8 border-b border-l border-neon-cyan/30 rounded-bl pointer-events-none" />
            <div className="hidden lg:block absolute bottom-0 right-0 w-8 h-8 border-b border-r border-neon-cyan/30 rounded-br pointer-events-none" />

            {/* Display Top HUD status */}
            <div className="hidden lg:flex items-center justify-between font-mono text-[9px] tracking-widest text-[#a0a0a0] mb-3 border-b border-white/5 pb-2">
              <span className="flex items-center gap-1.5 text-neon-cyan font-bold">
                <span className="w-1.5 h-1.5 rounded-full bg-neon-cyan" />
                SYSTEM // WORKSPACE_VIEW
              </span>
              <span>1000 x 1000 HD</span>
              <span className="text-zinc-600 hidden sm:inline">MATRIX_FLN_ACTIVE</span>
            </div>

            {/* MOBILE QUICK CONTROLLER - Focus Slider above Main Canvas (hidden when activeTab is active to let the canvas push up) */}
            {!activeTab && (
              <div className="lg:hidden mb-4 space-y-3 w-full animate-fadeIn">
                {/* Horizontal Frame Selection Carousel (Slider Bingkai) */}
                <div className="flex gap-2.5 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent w-full">
                  {FRAMES.concat(customFrames).map((frame) => {
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
              {/* Corner Accents inside the visual workspace wrapper */}
              <div 
                className="absolute top-3 left-3 w-6 h-6 border-t-2 border-l-2 border-neon-cyan pointer-events-none z-20" 
                style={{ transform: 'translateZ(15px)', transformStyle: 'preserve-3d' }}
              />
              <div 
                className="absolute bottom-3 right-3 w-6 h-6 border-b-2 border-r-2 border-neon-cyan pointer-events-none z-20" 
                style={{ transform: 'translateZ(15px)', transformStyle: 'preserve-3d' }}
              />
              
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
                      setSelectedStickerId(item.id);
                      setActiveTab('overlays');

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
                          color: item.color || neonColor,
                          fontSize: `${baseSize}px`,
                          textShadow: `0 0 6px ${item.color || neonColor}`,
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
                        {/* Title Tag */}
                        <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-[#00F0FF] text-black text-[8px] font-mono font-black px-1.5 py-0.5 rounded uppercase tracking-wider whitespace-nowrap pointer-events-none shadow-[0_0_8px_rgba(0,240,255,0.4)]">
                          {item.type === 'text' ? 'TEKS' : 'DECOR'}
                        </div>
                        
                        {/* Size / scale handle */}
                        <div 
                          className="absolute -bottom-1.5 -right-1.5 w-3.5 h-3.5 bg-neon-pink rounded-full cursor-se-resize flex items-center justify-center border border-white shadow-xl z-50 hover:scale-110 active:scale-95 transition-transform"
                          title="Tarik untuk Ubah Ukuran"
                          onPointerDown={(pointerEvent) => {
                            pointerEvent.stopPropagation();
                            const startScale = item.scale;
                            const startY = pointerEvent.clientY;
                            const handlePointerMove = (moveEvent: PointerEvent) => {
                              const deltaY = moveEvent.clientY - startY;
                              // Downward drag scales up, upward drag scales down
                              const scaleFactor = Math.max(0.2, Math.min(3, startScale - deltaY / 100));
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
                          <span className="text-[7px] text-white font-black">↔</span>
                        </div>
                        
                        {/* Rotation handle */}
                        <div 
                          className="absolute -top-1.5 -right-1.5 w-3.5 h-3.5 bg-cyan-500 rounded-full cursor-pointer flex items-center justify-center border border-white shadow-xl z-50 hover:scale-110 active:scale-95 transition-transform"
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
                          <span className="text-[7px] text-white font-black">↻</span>
                        </div>

                        {/* Quick Delete Trash Button */}
                        <div 
                          className="absolute -bottom-1.5 -left-1.5 w-3.5 h-3.5 bg-rose-600 hover:bg-rose-500 rounded-full cursor-pointer flex items-center justify-center border border-white shadow-xl z-50 hover:scale-110 active:scale-95 transition-transform"
                          title="Hapus Layer/Teks"
                          onPointerDown={(e) => {
                            e.stopPropagation();
                            handleDeleteSticker(item.id);
                          }}
                        >
                          <span className="text-[7px] text-white font-black">✕</span>
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
                {activeTab === 'overlays' && <><Layers className="w-3.5 h-3.5 text-neon-cyan" /> TEKS DAN BADGE</>}
                {activeTab === 'ai' && <><Sparkles className="w-3.5 h-3.5 text-amber-400 animate-pulse" /> AI GENERATE</>}
                {activeTab === 'download' && <><Download className="w-3.5 h-3.5 text-neon-cyan animate-bounce" /> FORMAT UNDUH & RESOLUSI</>}
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

              {activeTab === 'overlays' && (
                <StickerSelector
                  stickers={stickers}
                  onAddSticker={handleAddSticker}
                  onUpdateSticker={handleUpdateSticker}
                  onDeleteSticker={handleDeleteSticker}
                  neonColor={neonColor}
                  selectedStickerId={selectedStickerId}
                  onSelectSticker={setSelectedStickerId}
                  theme={theme}
                />
              )}

              {activeTab === 'ai' && (
                <div className="space-y-3">
                  {/* Segment controller for AI mode */}
                  <div className={`flex p-0.5 rounded border transition-all duration-300 ${
                    theme === 'dark' ? 'bg-black border-white/10' : 'bg-black/5 border-black/5'
                  }`}>
                    <button
                      onClick={() => { setAiMode('image'); setAiError(null); }}
                      className={`flex-1 py-1 px-2 rounded font-mono text-[9px] font-black tracking-widest uppercase transition-all ${
                        aiMode === 'image'
                          ? 'bg-amber-400 text-black shadow-[0_0_10px_rgba(251,191,36,0.25)] font-black'
                          : theme === 'dark' ? 'text-zinc-400 hover:text-zinc-200' : 'text-zinc-500 hover:text-zinc-800'
                      }`}
                    >
                      ✨ GAMBAR AVATAR AI
                    </button>
                    <button
                      onClick={() => { setAiMode('frame'); setAiError(null); }}
                      className={`flex-1 py-1 px-2 rounded font-mono text-[9px] font-black tracking-widest uppercase transition-all ${
                        aiMode === 'frame'
                          ? 'bg-[#00F0FF] text-black shadow-[0_0_10px_rgba(0,240,255,0.25)] font-black'
                          : theme === 'dark' ? 'text-zinc-400 hover:text-zinc-200' : 'text-zinc-500 hover:text-zinc-800'
                      }`}
                    >
                      🎨 DESAIN BINGKAI AI
                    </button>
                  </div>

                  <div className="space-y-1">
                    <label className={`text-[9px] font-mono tracking-wider block uppercase ${
                      theme === 'dark' ? 'text-zinc-400' : 'text-zinc-650 font-bold'
                    }`}>
                      {aiMode === 'image' 
                        ? 'Deskripsi wajah impian:' 
                        : 'Detail tema bingkai futuristik:'}
                    </label>
                    <textarea
                      value={aiPrompt}
                      onChange={(e) => setAiPrompt(e.target.value)}
                      placeholder={aiMode === 'image' 
                        ? 'Contoh: robot gamer dari indonesia, helm cyber metalik, tatapan tajam, neon cyan' 
                        : 'Contoh: tema hacker dengan layar matriks hijau kode biner, sudut kawat besi cybernetic'}
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

                  <button
                    onClick={aiMode === 'image' ? handleGenerateAIImage : handleGenerateAIFrame}
                    disabled={isGeneratingAI}
                    className={`w-full py-1.5 rounded font-mono text-[10px] font-extrabold tracking-widest transition-all duration-300 flex items-center justify-center gap-1 ${
                      isGeneratingAI
                        ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
                        : aiMode === 'image'
                          ? 'bg-amber-400 hover:bg-amber-500 text-black shadow-[0_0_12px_rgba(251,191,36,0.3)] font-black'
                          : 'bg-neon-cyan hover:bg-[#00d2ff] text-black shadow-[0_0_12px_rgba(0,240,255,0.3)] font-black'
                    }`}
                  >
                    <Sparkles className={`w-3 h-3 ${isGeneratingAI ? 'animate-spin' : 'animate-bounce'}`} />
                    {isGeneratingAI 
                      ? 'MEMPROSES KECERDASAN AI...' 
                      : aiMode === 'image' 
                        ? 'GENERATE FOTO PROFIL' 
                        : 'RANCANG BINGKAI SEKARANG'}
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
                onClick={() => setActiveTab(activeTab === 'overlays' ? null : 'overlays')}
                className={`snap-center flex-shrink-0 px-3.5 py-1.5 rounded-xl font-mono text-xs font-bold tracking-widest transition-all duration-150 flex flex-col items-center justify-center space-y-1 min-w-[76px] ${
                  activeTab === 'overlays'
                    ? 'bg-neon-cyan/20 text-neon-cyan border-t-2 border-neon-cyan shadow-[0_0_15px_rgba(0,240,255,0.2)]'
                    : 'text-zinc-450 hover:text-zinc-200 hover:bg-white/5'
                }`}
              >
                <Layers className="w-4 h-4" />
                <span className="text-[8px] uppercase tracking-wider font-extrabold">TEKS</span>
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
          {FRAMES.concat(customFrames).map((frame) => {
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
              <Sparkles className="w-3.5 h-3.5 text-neon-green animate-pulse" /> GALERI UTAMA KOMUNITAS NUFAT
            </div>
            <h2 className="text-2xl font-display font-extrabold tracking-tight text-white uppercase">
              KREASI USER LAINNYA
            </h2>
            <p className="text-xs text-zinc-400">
              Karya interaktif dan bingkai twibbon yang dimuat langsung dari server <code className="text-neon-cyan">wabot.nufat.id</code> menggunakan otentikasi JWT Bearer terverifikasi.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-2 shrink-0">
            <div className="bg-zinc-950 px-3 py-2 rounded-lg border border-white/5 flex flex-col justify-center">
              <span className="text-[8px] text-zinc-500 font-mono uppercase tracking-wider block">Token Security</span>
              <span className="text-[9.5px] text-neon-cyan font-mono font-bold flex items-center gap-1">
                <span className="w-1.5 h-1.5 bg-neon-green rounded-full animate-ping"></span>
                BEARER JWT ACTIVE
              </span>
            </div>
            <button
              onClick={fetchComGalleryItems}
              disabled={isLoadingComGallery}
              className="px-4 py-2 bg-zinc-90 w bg-gradient-to-r from-emerald-900/40 to-black/30 border border-emerald-500/30 hover:border-[#39ff14]/60 text-zinc-200 hover:text-white rounded font-mono text-[10px] uppercase font-bold tracking-widest flex items-center justify-center gap-1.5 transition-all active:scale-[0.98] disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoadingComGallery ? 'animate-spin text-neon-green' : 'text-zinc-500'}`} />
              SINKRONISASI API
            </button>
          </div>
        </div>

        {isLoadingComGallery ? (
          <div className="py-24 text-center space-y-4">
            <div className="w-10 h-10 border-2 border-neon-cyan border-t-transparent rounded-full animate-spin mx-auto"></div>
            <div className="space-y-1">
              <h3 className="font-mono text-xs font-bold text-zinc-300 uppercase tracking-widest animate-pulse">SINKRONISASI DATA API...</h3>
              <p className="text-[11px] text-zinc-500 font-mono">Menghubungkan & mematangkan data dari galeri wabot.nufat.id</p>
            </div>
          </div>
        ) : comGalleryError ? (
          <div className="border border-red-500/10 bg-red-950/5 p-6 rounded-xl text-center space-y-4 max-w-lg mx-auto">
            <div className="text-red-400 font-mono text-xs font-bold uppercase tracking-wider">
              ⚠️ TERJADI KENDALA KONEKSI API
            </div>
            <p className="text-[11px] text-zinc-400 leading-relaxed font-sans">
              gagal mengunduh kreasi live dari server Nufat: <code className="text-red-300 font-mono">{comGalleryError}</code>. Kami menyisipkan visual sampel di bawah agar Anda tetap dapat berselancar dengan lancar!
            </p>
            <button
              onClick={fetchComGalleryItems}
              className="mx-auto px-4 py-1.5 bg-zinc-900 border border-red-500/30 hover:border-red-500 text-white rounded text-[10px] font-mono hover:bg-zinc-800 transition-all uppercase tracking-widest font-bold"
            >
              Mencoba Kembali Hubungkan API
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
                  <div className="absolute inset-0 z-10 pointer-events-none p-1 opacity-90">
                    {post.frameId === 'cyber-hud-1' ? (
                      <svg width="100%" height="100%" viewBox="0 0 1000 1000" fill="none" className="w-full h-full">
                        <circle cx="500" cy="500" r="450" stroke={post.neonColor} strokeWidth="8" strokeDasharray="250 80 400 100" />
                        <circle cx="500" cy="500" r="420" stroke={post.neonColor} strokeWidth="2" strokeDasharray="4 8" strokeOpacity="0.5" />
                        <text x="75" y="490" fill={post.neonColor} fontFamily="monospace" fontSize="16">SYS_MOCK</text>
                      </svg>
                    ) : post.frameId === 'tech-brackets-1' ? (
                      <svg width="100%" height="100%" viewBox="0 0 1000 1000" fill="none" className="w-full h-full">
                        <path d="M 120 120 L 60 120 L 60 250 M 880 120 L 940 120 L 940 250 M 120 880 L 60 880 L 60 750 M 880 880 L 940 880 L 940 750" stroke={post.neonColor} strokeWidth="12" />
                      </svg>
                    ) : post.frameId === 'vhs-retro-1' ? (
                      <svg width="100%" height="100%" viewBox="0 0 1000 1000" fill="none" className="w-full h-full">
                        <rect x="30" y="30" width="940" height="940" stroke={post.neonColor} strokeWidth="14" strokeDasharray="40 15" />
                        <text x="70" y="80" fill={post.neonColor} fontFamily="monospace" fontSize="24">🔴 REC PLAY</text>
                      </svg>
                    ) : (
                      <svg width="100%" height="100%" viewBox="0 0 1000 1000" fill="none" className="w-full h-full">
                        <rect x="40" y="40" width="920" height="920" stroke={post.neonColor} strokeWidth="8" />
                        <circle cx="500" cy="500" r="440" stroke={post.neonColor} strokeWidth="1" strokeDasharray="10 5" />
                      </svg>
                    )}
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

      {/* Floating Animated Toast Message alert */}
      <AnimatePresence>
        {showToast && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-6 right-6 z-50 py-2.5 px-4 bg-zinc-900 border-l-4 border-neon-cyan text-zinc-100 rounded-lg shadow-2xl font-mono text-[11px] shadow-neon-cyan/10 flex items-center gap-2"
          >
            <Sparkles className="w-3.5 h-3.5 text-neon-cyan animate-pulse" />
            <span>{toastText}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
