import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { PlacedSticker, PresetSticker } from '../types';
import { PRESET_STICKERS } from '../presets';
import { Plus, Trash, Type, Sliders, Settings, Upload, Link, Image as ImageIcon, Globe, Sparkles } from 'lucide-react';
import { resolveApiUrl } from '../canvasUtils';

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

export default function StickerSelector({
  stickers,
  onAddSticker,
  onUpdateSticker,
  onDeleteSticker,
  neonColor,
  selectedStickerId,
  onSelectSticker,
  theme = 'dark',
  modeOnly
}: StickerSelectorProps) {
  const [inputText, setInputText] = useState('');
  const [textColor, setTextColor] = useState('#00f2fe');
  const [selectedFont, setSelectedFont] = useState('Orbitron');
  const [selectedStyle, setSelectedStyle] = useState<'neon' | 'chrome' | 'glitch' | 'hologram' | 'plain' | '3d' | 'double-neon' | 'curved' | 'glassmorphism' | 'futuristic' | 'claymorphism' | 'funny' | 'brutalist' | 'sunset' | 'cosmic' | 'neo-mint' | 'terracotta' | 'nordic'>('neon');
  const [selectedBlendMode, setSelectedBlendMode] = useState<'normal' | 'multiply' | 'screen' | 'overlay' | 'darken' | 'lighten' | 'color-dodge' | 'color-burn' | 'hard-light' | 'soft-light' | 'difference' | 'exclusion' | 'hue' | 'saturation' | 'color' | 'luminosity'>('normal');
  const [letterSpacing, setLetterSpacing] = useState(0);

  const [extPngUrl, setExtPngUrl] = useState('');
  const [isUploadingPng, setIsUploadingPng] = useState(false);
  const [pngSelectorTab, setPngSelectorTab] = useState<'presets' | 'upload' | 'url'>('presets');
  const [presetPngStickers, setPresetPngStickers] = useState<any[]>([]);

  useEffect(() => {
    // Try fetching directly from the user's API first
    axios.get('https://dev.bungtemin.net/api/drive/list')
      .then(res => {
        const data = res.data;
        const list = Array.isArray(data) ? data : (data && Array.isArray(data.data) ? data.data : []);
        if (list.length > 0) {
          setPresetPngStickers(list.map((item: any, idx: number) => ({
            id: item.id || `remote-${idx}`,
            name: item.name || `Sticker ${idx}`,
            url: item.src || item.url || item.link,
            desc: item.description || item.desc || "External PNG sticker"
          })));
          console.log("Successfully fetched PNG stickers directly from API!");
        } else {
          throw new Error("Empty list or invalid format");
        }
      })
      .catch(err => {
        console.warn("Direct CORS/fetch failed, trying backup direct API format...", err.message);
        // Backup direct url
        axios.get('https://apps.bungtemin.net/api/drive/list')
          .then(res => {
            const data = res.data;
            const list = Array.isArray(data) ? data : (data && Array.isArray(data.data) ? data.data : []);
            if (list.length > 0) {
              setPresetPngStickers(list.map((item: any, idx: number) => ({
                id: item.id || `remote-${idx}`,
                name: item.name || `Sticker ${idx}`,
                url: item.src || item.url || item.link,
                desc: item.description || item.desc || "External PNG sticker"
              })));
            }
          })
          .catch(backupErr => console.error("Both primary and backup PNG sticker endpoints failed:", backupErr));
      });
  }, []);

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
  };

  const handleLocalPngUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingPng(true);
    const reader = new FileReader();
    reader.onload = (event) => {
      const base64Data = event.target?.result as string;
      handleAddPngSticker(base64Data);
      setIsUploadingPng(false);
    };
    reader.onerror = () => {
      setIsUploadingPng(false);
      alert('Gagal membaca file gambar Anda. Silakan coba file lain.');
    };
    reader.readAsDataURL(file);
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
                INTERN & EXTERN
              </span>
            </div>

            {/* Sub Tabs */}
            <div className="flex gap-1 bg-zinc-950/60 p-0.5 rounded-lg border border-white/5">
              {[
                { id: 'presets', label: 'PRESET PNG', icon: Sparkles },
                { id: 'upload', label: 'UNGGAH LOKAL', icon: Upload },
                { id: 'url', label: 'ALAMAT URL', icon: Link }
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
              <div className="grid grid-cols-4 gap-1.5">
                {presetPngStickers.map((p) => (
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
                    <img
                      src={p.url}
                      alt={p.name}
                      referrerPolicy="no-referrer"
                      className="w-10 h-10 object-contain drop-shadow-[0_0_4px_rgba(0,240,255,0.3)] group-hover:scale-110 transition-transform pointer-events-none"
                    />
                    <div className="text-[6.5px] font-mono tracking-tighter truncate w-full text-center mt-1 text-zinc-400 group-hover:text-cyan-300">
                      {p.name}
                    </div>
                  </button>
                ))}
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
                    {isUploadingPng ? 'MENGKOMPRESI STIKER...' : 'PILIH BERKAS PNG TRASPARAN'}
                  </span>
                  <span className="text-[7.5px] text-zinc-500 mt-1 font-sans">
                    Format PNG transparan dianjurkan
                  </span>
                </label>
              </div>
            )}

            {/* Tab content 3: Direct URL grabber */}
            {pngSelectorTab === 'url' && (
              <div className="space-y-1.5">
                <span className="text-[8px] text-zinc-500 font-mono block uppercase">Masukkan Tautan Gambar Kreatif Anda (PNG):</span>
                <div className="flex gap-1.5">
                  <input
                    type="url"
                    placeholder="Contoh: https://example.com/stiker-saya.png"
                    value={extPngUrl}
                    onChange={(e) => setExtPngUrl(e.target.value)}
                    className={`flex-1 py-1 px-2.5 rounded text-[10px] font-mono focus:outline-none focus:border-[#00F0FF] ${
                      theme === 'dark'
                        ? 'bg-black border border-white/5 text-zinc-250 placeholder-zinc-700'
                        : 'bg-white border border-black/10 text-zinc-900 placeholder-zinc-400 font-medium'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (extPngUrl.trim()) {
                        handleAddPngSticker(extPngUrl);
                        setExtPngUrl('');
                      }
                    }}
                    disabled={!extPngUrl.trim()}
                    className="bg-cyan-500 text-black font-mono font-bold text-[9px] py-1 px-2.5 rounded hover:bg-white hover:text-black transition-all disabled:opacity-30 shrink-0"
                  >
                    PASANG
                  </button>
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
