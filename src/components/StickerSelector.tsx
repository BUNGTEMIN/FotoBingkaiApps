import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { PlacedSticker, PresetSticker } from '../types';
import { PRESET_STICKERS } from '../presets';
import { Plus, Trash, Type, Sliders, Settings, Upload, Link, Image as ImageIcon, Globe, Sparkles } from 'lucide-react';
import { resolveApiUrl } from '../canvasUtils';
import { LazyImage } from './LazyImage';

interface StickerSelectorProps {
  stickers: PlacedSticker[];
  onAddSticker: (sticker: PlacedSticker) => void;
  onUpdateSticker: (id: string, updated: Partial<PlacedSticker>) => void;
  onDeleteSticker: (id: string) => void;
  neonColor: string;
  selectedStickerId: string | null;
  onSelectSticker: (id: string | null) => void;
  theme?: 'dark' | 'light';
  modeOnly?: 'sticker' | 'text' | 'text_preset' | 'text_custom' | 'sticker_vector' | 'png_sticker';
  onClose?: () => void;
  driveFolderId?: string;
  driveUsername?: string;
}

export const STICKER_COLORS = [
  '#00f2fe', // cyan
  '#f35588', // pink
  '#39ff14', // green
  '#9d4edd', // purple
  '#ffffff', // white
  '#f59e0b', // orange
];

export const FUTURISTIC_FONTS = [
  { id: 'Orbitron', name: 'Orbitron Tech' },
  { id: 'Syncopate', name: 'Syncopate wide' },
  { id: 'Rajdhani', name: 'Rajdhani Cyber' },
  { id: 'Share Tech Mono', name: 'Tech Monospace' },
  { id: 'Press Start 2P', name: 'Arcade Pixel' },
  { id: 'Bebas Neue', name: 'Bebas Condensed' },
  { id: 'Revalia', name: 'Revalia Sci-Fi' },
  { id: 'Space Grotesk', name: 'Space Minimal' },
];

export const TEXT_PRESETS = [
  { id: 'double-neon', name: 'Double Neon', text: 'CYBERPUNK', style: 'double-neon', fontFamily: 'Orbitron', color: '#00f2fe' },
  { id: 'neon-glow', name: 'Neon Glow', text: 'CORE-NET', style: 'neon', fontFamily: 'Orbitron', color: '#39ff14' },
  { id: 'retro-3d', name: 'Classic 3D', text: 'OUTRUN', style: '3d', fontFamily: 'Press Start 2P', color: '#f35588' },
  { id: 'chrome-luxe', name: 'Chrome Luxe', text: 'E L I T E', style: 'chrome', fontFamily: 'Syncopate', color: '#ffffff' },
  { id: 'hologram', name: 'Hologram-X', text: 'PHANTOM', style: 'hologram', fontFamily: 'Revalia', color: '#00f2fe' },
  { id: 'curved', name: 'Arc Bend', text: 'CHAMPIONS', style: 'curved', fontFamily: 'Rajdhani', color: '#f59e0b' },
  { id: 'glitch-hack', name: 'Glitch Hack', text: 'SYS_ERROR', style: 'glitch', fontFamily: 'Share Tech Mono', color: '#f35588' },
  { id: 'vapor-waves', name: 'Pastel Dream', text: 'NEOSTALGIA', style: 'hologram', fontFamily: 'Syncopate', color: '#ff71ce' },
  { id: 'matrix-digital', name: 'Digital Matrix', text: 'OVERRIDE', style: 'neon', fontFamily: 'Share Tech Mono', color: '#00ff66' },
  { id: 'golden-elite', name: 'Imperial Gold', text: 'PRESTIGE', style: '3d', fontFamily: 'Bebas Neue', color: '#ffd700' },
  { id: 'solar-flare-text', name: 'Solar Flame', text: 'IGNITION', style: 'double-neon', fontFamily: 'Rajdhani', color: '#ff6200' },
  { id: 'glassmorphism', name: 'Glassmorphism', text: 'FROSTED', style: 'glassmorphism', fontFamily: 'Inter', color: '#ffffff' },
  { id: 'futuristic', name: 'Futuristic', text: 'FUTURE', style: 'futuristic', fontFamily: 'Orbitron', color: '#00f2fe' },
  { id: 'claymorphism', name: 'Claymorphism', text: 'SOFT', style: 'claymorphism', fontFamily: 'Outfit', color: '#ff6b6b' },
  { id: 'funny', name: 'Funny', text: 'LOL', style: 'funny', fontFamily: 'Comic Neue', color: '#f59e0b' },
  { id: 'neo-mint', name: 'Neo-Mint', text: 'FRESH', style: 'neo-mint', fontFamily: 'Montserrat', color: '#7fffd4' },
  { id: 'terracotta', name: 'Terracotta', text: 'EARTH', style: 'terracotta', fontFamily: 'Playfair Display', color: '#cc4e3c' },
  { id: 'brutalist', name: 'Brutalist', text: 'BOLD', style: 'brutalist', fontFamily: 'Helvetica', color: '#000000' },
  { id: 'sunset', name: 'Sunset Dream', text: 'LATE', style: 'sunset', fontFamily: 'Playfair Display', color: '#ffa500' },
  { id: 'nordic', name: 'Nordic Luxury', text: 'QUIET', style: 'nordic', fontFamily: 'Raleway', color: '#888888' },
  { id: 'cosmic', name: 'Cosmic Eclipse', text: 'ECLIPSE', style: 'cosmic', fontFamily: 'Inter', color: '#000000' },
] as const;

// Removed INITIAL_PRESET_PNG_STICKERS

export const FALLBACK_PNG_STICKERS = [
  {
    id: 'fb-sparkle-1',
    name: 'Sparkle Neon',
    url: 'https://cdn.jsdelivr.net/gh/microsoft/fluentui-emoji@main/assets/Sparkles/3D/sparkles_3d.png',
    desc: 'Bintang berkilau siber neon premium'
  },
  {
    id: 'fb-sparkle-2',
    name: 'Gold Star Glow',
    url: 'https://cdn.jsdelivr.net/gh/microsoft/fluentui-emoji@main/assets/Star/3D/star_3d.png',
    desc: 'Bintang emas bersinar 3D'
  },
  {
    id: 'fb-neon-heart',
    name: 'Love Heart',
    url: 'https://cdn.jsdelivr.net/gh/microsoft/fluentui-emoji@main/assets/Red%20heart/3D/red_heart_3d.png',
    desc: 'Hati romantis 3D glossy'
  },
  {
    id: 'fb-crown',
    name: 'Crown Gold',
    url: 'https://cdn.jsdelivr.net/gh/microsoft/fluentui-emoji@main/assets/Crown/3D/crown_3d.png',
    desc: 'Mahkota emas megah 3D'
  },
  {
    id: 'fb-glasses',
    name: 'Cyber Glass',
    url: 'https://cdn.jsdelivr.net/gh/microsoft/fluentui-emoji@main/assets/Sunglasses/3D/sunglasses_3d.png',
    desc: 'Kacamata siber keren siber'
  },
  {
    id: 'fb-badge',
    name: 'Verified',
    url: 'https://cdn.jsdelivr.net/gh/microsoft/fluentui-emoji@main/assets/Check%20mark%20button/3D/check_mark_button_3d.png',
    desc: 'Badge centang biru terverifikasi 3D'
  },
  {
    id: 'fb-wings',
    name: 'Angel Wings',
    url: 'https://cdn.jsdelivr.net/gh/microsoft/fluentui-emoji@main/assets/Wing/3D/wing_3d.png',
    desc: 'Sayap malaikat siber 3D mewah'
  },
  {
    id: 'fb-fire',
    name: 'Neon Fire',
    url: 'https://cdn.jsdelivr.net/gh/microsoft/fluentui-emoji@main/assets/Fire/3D/fire_3d.png',
    desc: 'Api membara semangat 3D'
  },
  {
    id: 'fb-cyber-skull',
    name: 'Cyber Skull',
    url: 'https://cdn.jsdelivr.net/gh/microsoft/fluentui-emoji@main/assets/Skull/3D/skull_3d.png',
    desc: 'Tengkorak siber siber 3D'
  },
  {
    id: 'fb-cat',
    name: 'Cute Neko',
    url: 'https://cdn.jsdelivr.net/gh/microsoft/fluentui-emoji@main/assets/Cat%20face/3D/cat_face_3d.png',
    desc: 'Kucing lucu siber 3D'
  }
];

export default function StickerSelector({
  stickers,
  onAddSticker,
  onUpdateSticker,
  onDeleteSticker,
  neonColor,
  selectedStickerId,
  onSelectSticker,
  theme = 'dark',
  modeOnly,
  onClose,
  driveFolderId,
  driveUsername
}: StickerSelectorProps) {
  const [inputText, setInputText] = useState('');
  const [textColor, setTextColor] = useState('#00f2fe');
  const [selectedFont, setSelectedFont] = useState('Orbitron');
  const [selectedStyle, setSelectedStyle] = useState<'neon' | 'chrome' | 'glitch' | 'hologram' | 'plain' | '3d' | 'double-neon' | 'curved' | 'glassmorphism' | 'futuristic' | 'claymorphism' | 'funny' | 'brutalist' | 'sunset' | 'cosmic' | 'neo-mint' | 'terracotta' | 'nordic'>('neon');
  const [selectedBlendMode, setSelectedBlendMode] = useState<'normal' | 'multiply' | 'screen' | 'overlay' | 'darken' | 'lighten' | 'color-dodge' | 'color-burn' | 'hard-light' | 'soft-light' | 'difference' | 'exclusion' | 'hue' | 'saturation' | 'color' | 'luminosity'>('normal');
  const [letterSpacing, setLetterSpacing] = useState(0);

  const [isUploadingPng, setIsUploadingPng] = useState(false);
  const [uploadStatusMsg, setUploadStatusMsg] = useState('');
  const [isFetchingApi, setIsFetchingApi] = useState(true);
  const [isFetchingCloud, setIsFetchingCloud] = useState(false);
  const [pngSelectorTab, setPngSelectorTab] = useState<'presets' | 'upload' | 'cloud'>('presets');
  const [generalStickers, setGeneralStickers] = useState<any[]>([]);
  const [userCloudStickers, setUserCloudStickers] = useState<any[]>([]);

  const [manualUsernameInput, setManualUsernameInput] = useState(driveUsername || localStorage.getItem('drive_username') || '');
  const [manualFolderIdInput, setManualFolderIdInput] = useState(driveFolderId || localStorage.getItem('drive_folder_id') || '');

  // Keep state updated in case parent props change
  useEffect(() => {
    if (driveUsername) {
      setManualUsernameInput(driveUsername);
    }
  }, [driveUsername]);

  useEffect(() => {
    if (driveFolderId) {
      setManualFolderIdInput(driveFolderId);
    }
  }, [driveFolderId]);

  const handleManualSave = () => {
    if (manualUsernameInput.trim()) {
      const username = manualUsernameInput.trim();
      localStorage.setItem('drive_username', username);
      
      axios.get(`https://dev.bungtemin.net/api/drive/newfolder?name=${encodeURIComponent(username)}`)
        .then(res => {
          const folderId = res.data?.folderId || res.data?.id || (res.data?.data?.folderId || res.data?.data?.id);
          if (folderId) {
            localStorage.setItem('drive_folder_id', folderId);
            setManualFolderIdInput(folderId);
          }
          fetchUserCloudStickers();
        })
        .catch(err => {
          console.warn("Gagal auto-fetch folderId, mencoba langsung memuat cloud:", err);
          fetchUserCloudStickers();
        });
    } else {
      localStorage.removeItem('drive_username');
      localStorage.removeItem('drive_folder_id');
      setManualUsernameInput('');
      setManualFolderIdInput('');
      setUserCloudStickers([]);
    }
  };

  const fetchGeneralStickers = () => {
    setIsFetchingApi(true);
    axios.get('https://dev.bungtemin.net/api/drive/list')
      .then(res => {
        const data = res.data;
        const list = Array.isArray(data) 
          ? data 
          : (data && Array.isArray(data.files) 
              ? data.files 
              : (data && Array.isArray(data.data) 
                  ? data.data 
                  : []));
        const loaded = list.map((item: any, idx: number) => {
          const rawId = item.id || item.fileId || `remote-${idx}`;
          // Always use proxy URL format explicitly to bypass CORS completely
          const proxyUrl = `https://dev.bungtemin.net/api/drive/${rawId}`;
          return {
            id: rawId,
            name: item.name || item.fileName || `Sticker ${idx}`,
            url: proxyUrl,
            desc: item.description || item.desc || "General PNG sticker"
          };
        });
        const merged = [...loaded, ...FALLBACK_PNG_STICKERS].filter((v, i, a) => a.findIndex(t => t.id === v.id) === i);
        setGeneralStickers(merged);
        setIsFetchingApi(false);
      })
      .catch(err => {
        console.warn('Gagal memuat stiker umum, menggunakan fallback:', err);
        setGeneralStickers(FALLBACK_PNG_STICKERS);
        setIsFetchingApi(false);
      });
  };

  const fetchUserCloudStickers = () => {
    const cachedFolderId = driveFolderId || localStorage.getItem('drive_folder_id');
    const cachedUsername = driveUsername || localStorage.getItem('drive_username');
    if (!cachedFolderId && !cachedUsername) {
      setUserCloudStickers([]);
      return;
    }

    setIsFetchingCloud(true);
    let targetUrl = '';
    if (cachedFolderId) {
      targetUrl = `https://dev.bungtemin.net/api/drive/view-folder?folderId=${encodeURIComponent(cachedFolderId)}`;
    } else if (cachedUsername) {
      targetUrl = `https://dev.bungtemin.net/api/drive/view-folder?name=${encodeURIComponent(cachedUsername)}`;
    }

    axios.get(targetUrl)
      .then(res => {
        const data = res.data;
        const list = Array.isArray(data) 
          ? data 
          : (data && Array.isArray(data.files) 
              ? data.files 
              : (data && Array.isArray(data.data) 
                  ? data.data 
                  : []));
        setUserCloudStickers(list.map((item: any, idx: number) => {
          const rawId = item.id || item.fileId || `remote-${idx}`;
          // Use direct proxy URL format from documentation to bypass CORS natively
          const proxyUrl = `https://dev.bungtemin.net/api/drive/${rawId}`;
          return {
            id: rawId,
            name: item.name || item.fileName || `Sticker ${idx}`,
            url: proxyUrl,
            desc: item.description || item.desc || "Google Drive PNG sticker"
          };
        }));
        setIsFetchingCloud(false);
      })
      .catch(err => {
        console.warn('Gagal memuat koleksi cloud:', err);
        setIsFetchingCloud(false);
      });
  };

  useEffect(() => {
    fetchGeneralStickers();
    fetchUserCloudStickers();
  }, []);

  // Fetch when folder ID or username props change
  useEffect(() => {
    fetchUserCloudStickers();
  }, [driveFolderId, driveUsername]);

  // Sync state whenever switching to cloud tab
  useEffect(() => {
    if (pngSelectorTab === 'cloud') {
      const liveUser = driveUsername || localStorage.getItem('drive_username') || '';
      const liveFolder = driveFolderId || localStorage.getItem('drive_folder_id') || '';
      setManualUsernameInput(liveUser);
      setManualFolderIdInput(liveFolder);
      fetchUserCloudStickers();
    }
  }, [pngSelectorTab]);

  const handleAddPngSticker = (url: string) => {
    if (!url.trim()) return;
    const newSticker: PlacedSticker = {
      id: `placed-png-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      type: 'sticker',
      imageUrl: url.trim(),
      x: 50,
      y: 50,
      scale: 1,
      rotation: 0,
      blendMode: selectedBlendMode
    };
    onAddSticker(newSticker);
    onSelectSticker(newSticker.id);
    if (onClose) {
      onClose();
    }
  };

  const handleLocalPngUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // LANGSUNG BACA FILE UNTUK DITAMPILKAN DI KANVAS SEGERA
    const stickerId = `placed-png-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const reader = new FileReader();

    reader.onload = (event) => {
      const base64Data = event.target?.result as string;
      const newSticker: PlacedSticker = {
        id: stickerId,
        type: 'sticker',
        imageUrl: base64Data,
        x: 50,
        y: 50,
        scale: 1,
        rotation: 0,
        blendMode: selectedBlendMode
      };
      onAddSticker(newSticker);
      onSelectSticker(newSticker.id);
      
      if (onClose) {
        onClose();
      } else {
        setPngSelectorTab('presets'); // Auto pindah tab jika onClose tidak ada
      }
    };
    reader.onerror = () => {
      console.error('Gagal membaca file lokal');
    };
    reader.readAsDataURL(file);

    // BACKGROUND UPLOAD KE SERVER UNTUK PENYIMPANAN CLOUD & MENGGANTI URL (MENGHEMAT LOCALSTORAGE)
    try {
      const cachedFolderId = localStorage.getItem('drive_folder_id');
      const cachedUsername = localStorage.getItem('drive_username') || 'Anonymous_User';
      
      const formData = new FormData();
      formData.append('file', file);
      formData.append('user', cachedUsername);
      
      let uploadUrl = '';
      
      if (cachedFolderId) {
        formData.append('folderId', cachedFolderId);
        try {
          const res = await axios.post('https://dev.bungtemin.net/api/drive/upload-to-folder', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
          });
          uploadUrl = res.data?.url || res.data?.src || res.data?.fileUrl || (res.data?.id ? `https://dev.bungtemin.net/api/drive/${res.data.id}` : '');
        } catch (err) {
          console.warn('Gagal upload ke folder spesifik, mencoba fallback upload...', err);
          const res2 = await axios.post('https://dev.bungtemin.net/api/drive/upload', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
          });
          uploadUrl = res2.data?.url || res2.data?.src || res2.data?.fileUrl || (res2.data?.id ? `https://dev.bungtemin.net/api/drive/${res2.data.id}` : '');
        }
      } else {
        try {
          const res = await axios.post('https://dev.bungtemin.net/api/drive/upload', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
          });
          uploadUrl = res.data?.url || res.data?.src || res.data?.fileUrl || (res.data?.id ? `https://dev.bungtemin.net/api/drive/${res.data.id}` : '');
        } catch (err) {
          console.warn('Gagal upload ke dev server, mencoba server apps...', err);
          const res2 = await axios.post('https://apps.bungtemin.net/api/drive/upload', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
          });
          uploadUrl = res2.data?.url || res2.data?.src || res2.data?.fileUrl || (res2.data?.id ? `https://dev.bungtemin.net/api/drive/${res2.data.id}` : '');
        }
      }

      if (uploadUrl) {
         // Silently refresh drive list di background
         fetchUserCloudStickers();
         // Mengganti Base64 dari kanvas menjadi URL agar local storage tidak error QuotaExceeded
         onUpdateSticker(stickerId, { imageUrl: uploadUrl });
      }

    } catch (err) {
      console.warn("Upload background ke Drive gagal, memakai Base64 lokal.", err);
    }
  };

  const handleAddPresetSticker = (sticker: PresetSticker) => {
    const newSticker: PlacedSticker = {
      id: `placed-sticker-${Date.now()}`,
      type: 'sticker',
      stickerId: sticker.id,
      x: 50,
      y: 50,
      scale: 1,
      rotation: 0,
      color: sticker.color || neonColor,
      blendMode: selectedBlendMode
    };
    onAddSticker(newSticker);
    onSelectSticker(newSticker.id);
  };

  const handleAddCustomText = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    const newText: PlacedSticker = {
      id: `placed-text-${Date.now()}`,
      type: 'text',
      text: inputText.trim().toUpperCase(),
      fontFamily: selectedFont,
      textStyle: selectedStyle,
      letterSpacing: letterSpacing,
      x: 50,
      y: 80,
      scale: 1,
      rotation: 0,
      color: textColor,
      blendMode: selectedBlendMode
    };
    onAddSticker(newText);
    onSelectSticker(newText.id);
    setInputText('');
    setLetterSpacing(0); // Reset after adding
  };

  const handleAddPresetText = (preset: typeof TEXT_PRESETS[number]) => {
    const newText: PlacedSticker = {
      id: `placed-text-preset-${Date.now()}`,
      type: 'text',
      text: preset.text,
      fontFamily: preset.fontFamily,
      textStyle: preset.style,
      x: 50,
      y: 65,
      scale: 1.25,
      rotation: 0,
      color: preset.color,
      blendMode: selectedBlendMode
    };
    onAddSticker(newText);
    onSelectSticker(newText.id);
  };

  const getPreviewStyleForPreset = (preset: typeof TEXT_PRESETS[number]) => {
    const color = preset.color;
    switch (preset.style) {
      case 'double-neon':
        return {
          fontFamily: preset.fontFamily,
          color: '#ffffff',
          textShadow: `-1px -1px 4px #00f2fe, 1px 1px 4px #f35588, 0 0 2px ${color}`,
        };
      case 'neon':
        return {
          fontFamily: preset.fontFamily,
          color: '#ffffff',
          textShadow: `0 0 5px ${color}, 0 0 10px ${color}`,
        };
      case '3d':
        return {
          fontFamily: preset.fontFamily,
          color: '#ffffff',
          textShadow: `1px 1px 0 ${color}, 2px 2px 0 ${color}, 2.5px 2.5px 0 #000`,
        };
      case 'chrome':
        return {
          fontFamily: preset.fontFamily,
          color: '#e5e7eb',
          textShadow: '0.5px 0.5px 2px #000000',
        };
      case 'hologram':
        return {
          fontFamily: preset.fontFamily,
          color: '#00f2fe',
          textShadow: '0 0 4px #f35588',
        };
      case 'curved':
        return {
          fontFamily: preset.fontFamily,
          color: '#ffffff',
          textShadow: `0 0 3px ${color}`,
          borderBottom: `1px dashed ${color}`,
        };
      case 'glitch':
        return {
          fontFamily: preset.fontFamily,
          color: '#ffffff',
          textShadow: '-1px 0 0 #0ff, 1px 0 0 #f0f',
        };
      case 'glassmorphism':
        return {
          fontFamily: preset.fontFamily,
          color: 'rgba(255, 255, 255, 0.8)',
          background: 'rgba(255, 255, 255, 0.1)',
          backdropFilter: 'blur(10px)',
          padding: '4px 8px',
          borderRadius: '8px',
        };
      case 'futuristic':
        return {
          fontFamily: preset.fontFamily,
          color: '#00f2fe',
          textShadow: '0 0 10px #00f2fe, 0 0 20px #00f2fe',
          letterSpacing: '0.2em',
          textTransform: 'uppercase',
        };
      case 'claymorphism':
        return {
          fontFamily: preset.fontFamily,
          color: '#ffffff',
          backgroundColor: color,
          padding: '4px 12px',
          borderRadius: '16px',
          boxShadow: 'inset -2px -2px 6px rgba(0,0,0,0.1), inset 2px 2px 6px rgba(255,255,255,0.4)',
        };
      case 'funny':
        return {
          fontFamily: preset.fontFamily,
          color: color,
          transform: 'rotate(-5deg)',
          fontWeight: 'bold',
          textShadow: '2px 2px 0 #fff',
        };
      case 'brutalist':
        return {
          fontFamily: preset.fontFamily,
          color: '#ffffff',
          backgroundColor: '#000000',
          padding: '4px 8px',
          border: '2px solid #000000',
        };
      case 'sunset':
        return {
          fontFamily: preset.fontFamily,
          color: '#fff',
          background: 'linear-gradient(to bottom, #ff7e5f, #feb47b)',
          padding: '4px 8px',
          borderRadius: '4px',
        };
      case 'cosmic':
        return {
          fontFamily: preset.fontFamily,
          color: '#ffffff',
          textShadow: '0 0 5px #fff, 0 0 10px #00f2fe',
        };
      case 'neo-mint':
        return {
          fontFamily: preset.fontFamily,
          color: color,
          letterSpacing: '0.1em',
        };
      case 'terracotta':
        return {
          fontFamily: preset.fontFamily,
          color: color,
          textShadow: '1px 1px 2px rgba(0,0,0,0.2)',
        };
      case 'nordic':
        return {
          fontFamily: preset.fontFamily,
          color: color,
          textShadow: '0 1px 0 rgba(0,0,0,0.1)',
        };
      default:
        return {
          fontFamily: (preset as any).fontFamily,
          color: '#ffffff',
          textShadow: `0 0 2px ${color}`,
        };
    }
  };

  return (
    <div className="space-y-3">
      <div className="space-y-3">
        {/* Preset HUD Stickers */}
        {(!modeOnly || modeOnly === 'sticker' || modeOnly === 'sticker_vector') && PRESET_STICKERS.length > 0 && (
          <div className="space-y-1">
            <span className="text-[9px] text-zinc-500 font-mono font-bold block uppercase tracking-wider">Vector Presets</span>
            <div className="grid grid-cols-5 gap-1">
              {PRESET_STICKERS.map((sticker) => (
                <button
                  key={sticker.id}
                  onClick={() => handleAddPresetSticker(sticker)}
                  className={`p-1 border rounded flex flex-col items-center justify-center transition-all group aspect-square ${
                    theme === 'dark'
                      ? 'bg-white/3 border-white/5 hover:border-white/10 hover:bg-zinc-900'
                      : 'bg-black/5 border-black/5 hover:border-black/10 hover:bg-black/10'
                  }`}
                  title={sticker.name}
                >
                  <svg width="18" height="18" viewBox="0 0 100 100" fill="none" className="mb-0.5 group-hover:stroke-neon-cyan transition-colors" stroke={sticker.color || neonColor} strokeWidth="6">
                    <path d={sticker.svgPath} />
                  </svg>
                  <span className={`text-[6.5px] font-mono truncate w-full text-center ${
                    theme === 'dark' ? 'text-zinc-500' : 'text-zinc-500 font-bold'
                  }`}>
                    {sticker.name.split(' ')[0]}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {(!modeOnly || modeOnly === 'sticker' || modeOnly === 'png_sticker') && (
          <div className="p-2.5 rounded-xl border border-dashed border-cyan-500/25 bg-black/40 space-y-2 shadow-[0_0_15px_rgba(0,240,255,0.02)]">
            <div className="flex items-center justify-between">
              <span className="text-[9px] text-[#00f2fe] font-mono font-bold block uppercase tracking-wider flex items-center gap-1">
                <ImageIcon className="w-3 h-3 text-[#00f2fe]" /> PNG STICKER GRABBER
              </span>
              <span className="text-[7.5px] font-mono text-zinc-500 bg-zinc-950 px-1.5 border border-zinc-800 rounded uppercase">
                INTERN & CLOUD
              </span>
            </div>

            {/* Sub Tabs */}
            <div className="flex gap-1 bg-zinc-950/60 p-0.5 rounded-lg border border-white/5">
              {[
                { id: 'presets', label: 'PRESET PNG', icon: Sparkles },
                { id: 'upload', label: 'UNGGAH LOKAL', icon: Upload },
                { id: 'cloud', label: 'KOLEKSI SAYA', icon: ImageIcon }
              ].map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => { setPngSelectorTab(tab.id as any); }}
                    className={`flex-1 py-1 rounded text-[8px] font-mono font-bold tracking-wider uppercase transition-all flex items-center justify-center gap-1 ${
                      pngSelectorTab === tab.id
                        ? 'bg-cyan-500/10 border border-cyan-500/35 text-cyan-300 font-extrabold shadow-[0_0_8px_rgba(6,182,212,0.1)]'
                        : theme === 'dark'
                          ? 'border border-transparent text-zinc-500 hover:text-zinc-300'
                          : 'border border-transparent text-zinc-650 hover:text-black font-semibold'
                    }`}
                  >
                    <Icon className="w-2.5 h-2.5" />
                    {tab.label}
                  </button>
                );
              })}
            </div>

            {/* Tab content 1: Presets transparent PNG stickers */}
            {pngSelectorTab === 'presets' && (
              <div className="grid grid-cols-4 gap-1.5 min-h-[80px]">
                {isFetchingApi ? (
                  Array.from({ length: 8 }).map((_, i) => (
                    <div key={`skeleton-${i}`} className={`p-1.5 border rounded-lg flex flex-col items-center justify-center aspect-square ${
                      theme === 'dark' ? 'bg-zinc-950/50 border-white/5 animate-pulse' : 'bg-black/5 border-black/5 animate-pulse'
                    }`}>
                      <div className={`w-6 h-6 rounded-md mb-1.5 ${theme === 'dark' ? 'bg-zinc-800' : 'bg-zinc-200'}`} />
                      <div className={`w-8 h-1.5 rounded-full ${theme === 'dark' ? 'bg-zinc-800' : 'bg-zinc-200'}`} />
                    </div>
                  ))
                ) : generalStickers.length > 0 ? (
                  generalStickers.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => handleAddPngSticker(p.url)}
                      className={`p-1.5 border rounded-lg flex flex-col items-center justify-center transition-all group relative aspect-square select-none ${
                        theme === 'dark'
                          ? 'bg-zinc-950 border-white/5 hover:border-cyan-500/40 hover:bg-zinc-900 shadow-sm'
                          : 'bg-white border-black/5 hover:border-cyan-500/40 hover:bg-zinc-50 shadow-sm'
                      }`}
                      title={p.desc}
                    >
                      <LazyImage
                        src={p.url}
                        alt={p.name}
                        className="w-10 h-10 object-contain drop-shadow-[0_0_4px_rgba(0,240,255,0.3)] group-hover:scale-110 transition-transform pointer-events-none"
                      />
                      <div className="text-[6.5px] font-mono tracking-tighter truncate w-full text-center mt-1 text-zinc-400 group-hover:text-cyan-300">
                        {p.name}
                      </div>
                    </button>
                  ))
                ) : (
                  <div className="col-span-4 py-6 text-center flex flex-col items-center justify-center text-zinc-500">
                    <Sparkles className="w-5 h-5 mb-1.5 opacity-50" />
                    <span className="text-[8px] font-mono uppercase tracking-widest">Tidak ada preset stiker</span>
                  </div>
                )}
              </div>
            )}

            {/* Tab content 2: Local PNG Upload */}
            {pngSelectorTab === 'upload' && (
              <div className="space-y-1.5">
                <input
                  type="file"
                  id="png_sticker_file_input"
                  accept="image/png"
                  onChange={handleLocalPngUpload}
                  className="hidden"
                  disabled={isUploadingPng}
                />
                <label
                  htmlFor="png_sticker_file_input"
                  className={`border border-dashed p-3 rounded-lg flex flex-col items-center justify-center cursor-pointer transition-all aspect-[4/1.2] ${
                    isUploadingPng 
                      ? 'border-cyan-500/50 bg-cyan-950/20 animate-pulse'
                      : theme === 'dark'
                        ? 'border-white/10 hover:border-cyan-500/40 hover:bg-white/3 text-zinc-400 hover:text-zinc-200'
                        : 'border-black/10 hover:border-cyan-500/40 hover:bg-black/2 text-zinc-600 hover:text-black'
                  }`}
                >
                  <Upload className={`w-4 h-4 mb-1 text-cyan-400 ${isUploadingPng ? 'animate-bounce' : ''}`} />
                  <span className="text-[9.5px] font-mono leading-none tracking-wide text-center">
                    {isUploadingPng ? (uploadStatusMsg || 'MENGUNGGAH...') : 'PILIH BERKAS PNG TRASPARAN'}
                  </span>
                  <span className="text-[7.5px] text-zinc-500 mt-1 font-sans">
                    Format PNG transparan dianjurkan
                  </span>
                </label>
              </div>
            )}

            {/* Tab content 3: Cloud Folder personal stickers */}
            {pngSelectorTab === 'cloud' && (
              <div className="space-y-2">
                <div className="flex items-center justify-between px-1">
                  <span className="text-[8px] text-zinc-500 font-mono block uppercase">
                    Koleksi di Folder Google Drive-mu:
                  </span>
                  <button 
                    type="button"
                    onClick={fetchUserCloudStickers}
                    className="text-[8px] text-cyan-400 font-mono underline hover:text-cyan-300 transition-colors"
                  >
                    Refresh
                  </button>
                </div>
                
                <div className="grid grid-cols-4 gap-1.5 min-h-[85px] max-h-[185px] overflow-y-auto pr-1 scrollbar-thin">
                  {isFetchingCloud ? (
                    Array.from({ length: 4 }).map((_, i) => (
                      <div key={`cloud-skeleton-${i}`} className={`p-1.5 border rounded-lg flex flex-col items-center justify-center aspect-square ${
                        theme === 'dark' ? 'bg-zinc-950/50 border-white/5 animate-pulse' : 'bg-black/5 border-black/5 animate-pulse'
                      }`}>
                        <div className={`w-6 h-6 rounded-md mb-1.5 ${theme === 'dark' ? 'bg-zinc-800' : 'bg-zinc-200'}`} />
                        <div className={`w-8 h-1.5 rounded-full ${theme === 'dark' ? 'bg-zinc-800' : 'bg-zinc-200'}`} />
                      </div>
                    ))
                  ) : userCloudStickers.length > 0 ? (
                    userCloudStickers.map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => handleAddPngSticker(p.url)}
                        className={`p-1.5 border rounded-lg flex flex-col items-center justify-center transition-all group relative aspect-square select-none ${
                          theme === 'dark'
                            ? 'bg-zinc-950 border-white/5 hover:border-cyan-500/40 hover:bg-zinc-900 shadow-sm'
                            : 'bg-white border-black/5 hover:border-cyan-500/40 hover:bg-zinc-50 shadow-sm'
                        }`}
                        title={p.desc}
                      >
                        <LazyImage
                          src={p.url}
                          alt={p.name}
                          className="w-10 h-10 object-contain drop-shadow-[0_0_4px_rgba(0,240,255,0.3)] group-hover:scale-110 transition-transform pointer-events-none"
                        />
                        <div className="text-[6.5px] font-mono tracking-tighter truncate w-full text-center mt-1 text-zinc-400 group-hover:text-cyan-300">
                          {p.name}
                        </div>
                      </button>
                    ))
                  ) : (
                    <div className="col-span-4 p-3 border border-dashed border-cyan-500/20 rounded-lg bg-zinc-950/60 text-center space-y-3.5">
                      <div className="space-y-1">
                        <ImageIcon className="w-5 h-5 mx-auto opacity-50 text-cyan-400 animate-pulse" />
                        <span className="text-[9px] font-mono uppercase tracking-widest text-zinc-300 block font-bold">
                          Koleksi Cloud Masih Kosong
                        </span>
                        <span className="text-[7.5px] text-zinc-500 font-sans leading-relaxed block">
                          Ingin mengambil stiker khusus dari Google Drive Anda? Silakan masukkan username di bawah ini.
                        </span>
                      </div>
                      
                      {/* Manual Credentials Setup Form */}
                      <div className="space-y-2 text-left p-2.5 rounded-lg bg-black/50 border border-white/5 shadow-inner">
                        <span className="text-[8px] font-mono text-zinc-400 block uppercase font-black tracking-wider">
                          🔗 Sambungkan Google Drive
                        </span>
                        <div className="flex gap-1">
                          <input 
                            type="text" 
                            placeholder="Username Anda (misal: bungtemin)..."
                            value={manualUsernameInput}
                            onChange={(e) => setManualUsernameInput(e.target.value)}
                            className="bg-zinc-900 border border-white/10 rounded px-2 py-1 text-[9px] font-mono text-white flex-1 focus:outline-none focus:border-cyan-400 placeholder-zinc-600"
                          />
                          <button 
                            type="button"
                            onClick={handleManualSave}
                            className="bg-[#00f2fe]/20 border border-[#00f2fe]/30 text-[#00f2fe] hover:bg-[#00f2fe] hover:text-black font-mono text-[8px] px-2.5 py-1 rounded font-black uppercase transition-all duration-300"
                          >
                            Setel
                          </button>
                        </div>
                        {manualFolderIdInput && (
                          <div className="text-[7px] font-mono text-zinc-500 leading-none truncate bg-black/30 p-1 rounded border border-white/3">
                            ID Folder: {manualFolderIdInput}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}


          </div>
        )}

        {(!modeOnly) && <hr className={theme === 'dark' ? 'border-white/5' : 'border-black/5'} />}

        {/* Preset Typography & 3D Text Section */}
        {(!modeOnly || modeOnly === 'text' || modeOnly === 'text_preset') && (
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[9px] text-zinc-500 font-mono font-bold block uppercase tracking-wider">Koleksi Tipografi & Teks 3D</span>
              <span className="text-[7.5px] font-mono text-neon-cyan bg-neon-cyan/10 px-1 border border-neon-cyan/20 rounded uppercase animate-pulse">Ready To Click</span>
            </div>
            
            <div className="grid grid-cols-2 gap-1.5 select-none max-h-[175px] overflow-y-auto pr-1 scrollbar-thin">
              {TEXT_PRESETS.map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => handleAddPresetText(preset)}
                  className={`p-2 border rounded-lg text-left transition-all active:scale-[0.97] flex flex-col justify-between group overflow-hidden relative ${
                    theme === 'dark'
                      ? 'bg-zinc-950 border-white/5 hover:border-neon-cyan/40 hover:bg-zinc-900'
                      : 'bg-zinc-50 border-black/5 hover:border-neon-cyan/40 hover:bg-white/70'
                  }`}
                >
                  {/* Background laser neon lines */}
                  <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-neon-cyan/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
                  
                  <div className="text-[7.5px] font-mono font-extrabold text-zinc-500 group-hover:text-neon-cyan transition-colors z-10">
                    {preset.name}
                  </div>
                  
                  <div className="mt-1 pb-1 flex items-center justify-center min-h-[22px] w-full overflow-hidden text-center z-10">
                    <span 
                      style={getPreviewStyleForPreset(preset)}
                      className="text-[9px] font-extrabold tracking-wider select-none leading-none inline-block break-all"
                    >
                      {preset.text}
                    </span>
                  </div>
                </button>
              ))}
            </div>

            <div className={`my-2 border-t ${theme === 'dark' ? 'border-white/5' : 'border-black/5'}`} />
          </div>
        )}

        {/* Custom Text Overlay Generation */}
        {(!modeOnly || modeOnly === 'text' || modeOnly === 'text_custom') && (
          <form onSubmit={handleAddCustomText} className="space-y-2">
            <span className="text-[9px] text-zinc-500 font-mono font-bold block uppercase tracking-wider">Atau Tulis Teks Kustom Anda</span>
            
            {/* Style Picker */}
            <div className="flex gap-1 overflow-x-auto pb-1 scrollbar-none">
              {[
                { id: 'plain', label: 'Polos' },
                { id: 'neon', label: 'Neon' },
                { id: 'glitch', label: 'Glitch' },
                { id: 'chrome', label: 'Chrome' },
                { id: 'hologram', label: 'Holo' },
                { id: '3d', label: '3D' },
                { id: 'double-neon', label: 'D-Neon' },
                { id: 'curved', label: 'Kurva' },
                { id: 'glassmorphism', label: 'Glass' },
                { id: 'futuristic', label: 'Futu' },
                { id: 'claymorphism', label: 'Clay' },
                { id: 'funny', label: 'Funny' },
                { id: 'brutalist', label: 'Brutalist' },
                { id: 'sunset', label: 'Sunset' },
                { id: 'cosmic', label: 'Cosmic' },
                { id: 'neo-mint', label: 'Mint' },
                { id: 'terracotta', label: 'Terra' },
                { id: 'nordic', label: 'Nordic' }
              ].map((style) => (
                <button
                  key={style.id}
                  type="button"
                  onClick={() => setSelectedStyle(style.id as any)}
                  className={`py-1 px-2.5 rounded shrink-0 whitespace-nowrap text-[9px] uppercase tracking-widest font-black transition-all ${
                    selectedStyle === style.id
                      ? 'bg-neon-cyan text-black shadow-[0_0_10px_rgba(0,240,255,0.4)]'
                      : theme === 'dark'
                        ? 'border border-white/10 text-zinc-400 hover:text-white hover:bg-white/5'
                        : 'border border-black/10 text-zinc-600 hover:text-black hover:bg-black/5'
                  }`}
                >
                  {style.label}
                </button>
              ))}
            </div>

            <div className="flex gap-1.5">
              <input
                type="text"
                placeholder="CONTOH: @SQUAD_CYBER"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                className={`flex-1 py-1 px-2.5 rounded text-xs font-mono focus:outline-none focus:border-[#00F0FF] ${
                  theme === 'dark'
                    ? 'bg-black border border-white/5 hover:border-white/10 text-zinc-250 placeholder-zinc-700'
                    : 'bg-white border border-black/10 hover:border-black/20 text-zinc-900 placeholder-zinc-400 font-medium'
                }`}
              />
              <button
                type="submit"
                disabled={!inputText.trim()}
                className="bg-neon-cyan text-black font-mono font-bold text-[10px] py-1 px-3 rounded hover:bg-white hover:text-black transition-all disabled:opacity-30 flex items-center gap-1 shrink-0"
              >
                <Plus className="w-3 h-3" /> PASANG
              </button>
            </div>

            {/* Futuristic font family chooser */}
            <div className="space-y-1">
              <span className="text-[8px] text-zinc-500 font-mono uppercase tracking-wider block">Pilih Font Futuristik:</span>
              <div className="grid grid-cols-2 gap-1 max-h-[85px] overflow-y-auto pr-1">
                {FUTURISTIC_FONTS.map((font) => (
                  <button
                    key={font.id}
                    type="button"
                    onClick={() => setSelectedFont(font.id)}
                    className={`py-1 px-1.5 rounded text-left border text-[9.5px] transition-all flex items-center justify-between ${
                      selectedFont === font.id
                        ? 'border-neon-cyan bg-cyan-950/20 text-white font-bold'
                        : theme === 'dark'
                          ? 'border-white/5 bg-zinc-950 text-zinc-400 hover:text-zinc-200 hover:border-white/10'
                          : 'border-black/5 bg-black/5 text-zinc-800 hover:text-zinc-950 hover:border-black/10'
                    }`}
                  >
                    <span style={{ fontFamily: font.id }} className="truncate">{font.name}</span>
                    {selectedFont === font.id && <span className="text-neon-cyan text-[7px] font-black">●</span>}
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Color picking for text */}
            <div className={`pt-1.5 border-t ${theme === 'dark' ? 'border-white/5' : 'border-black/5'}`}>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[8px] text-zinc-500 font-mono uppercase tracking-wider">Jarak Huruf (Spacing):</span>
                <span className="text-[8px] text-neon-cyan font-mono">{letterSpacing}px</span>
              </div>
              <input
                type="range"
                min="0"
                max="50"
                step="1"
                value={letterSpacing}
                onChange={(e) => setLetterSpacing(Number(e.target.value))}
                className="w-full h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-neon-cyan"
              />
            </div>
            
            <div className={`flex items-center space-x-1.5 pt-1.5 border-t ${theme === 'dark' ? 'border-white/5' : 'border-black/5'}`}>
              <span className="text-[8px] text-zinc-500 font-mono uppercase tracking-wider">Warna:</span>
              <div className="flex space-x-1">
                {STICKER_COLORS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setTextColor(color)}
                    className={`w-3.5 h-3.5 rounded-full border transition-all ${
                      textColor === color ? 'border-neon-cyan scale-110' : 'border-white/5 hover:scale-105'
                    }`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>

            <div className={`pt-1.5 border-t ${theme === 'dark' ? 'border-white/5' : 'border-black/5'}`}>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[8px] text-zinc-500 font-mono uppercase tracking-wider">Blend Mode:</span>
              </div>
              <select
                value={selectedBlendMode}
                onChange={(e) => setSelectedBlendMode(e.target.value as any)}
                className={`w-full py-1 px-2 rounded text-[10px] font-mono focus:outline-none focus:border-[#00F0FF] ${
                  theme === 'dark'
                    ? 'bg-black border border-white/5 text-zinc-250'
                    : 'bg-white border border-black/10 text-zinc-900'
                }`}
              >
                {['normal', 'multiply', 'screen', 'overlay', 'darken', 'lighten', 'color-dodge', 'color-burn', 'hard-light', 'soft-light', 'difference', 'exclusion', 'hue', 'saturation', 'color', 'luminosity'].map(mode => (
                  <option key={mode} value={mode}>{mode.toUpperCase()}</option>
                ))}
              </select>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
