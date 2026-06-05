import React, { useState } from 'react';
import { PlacedSticker, PresetSticker } from '../types';
import { PRESET_STICKERS } from '../presets';
import { Plus, Trash, Type, Sliders, Settings } from 'lucide-react';

interface StickerSelectorProps {
  stickers: PlacedSticker[];
  onAddSticker: (sticker: PlacedSticker) => void;
  onUpdateSticker: (id: string, updated: Partial<PlacedSticker>) => void;
  onDeleteSticker: (id: string) => void;
  neonColor: string;
  selectedStickerId: string | null;
  onSelectSticker: (id: string | null) => void;
  theme?: 'dark' | 'light';
  modeOnly?: 'sticker' | 'text' | 'text_preset' | 'text_custom';
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
] as const;

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
  const [selectedStyle, setSelectedStyle] = useState<'neon' | 'chrome' | 'glitch' | 'hologram' | 'plain' | '3d' | 'double-neon' | 'curved'>('neon');

  const handleAddPresetSticker = (sticker: PresetSticker) => {
    const newSticker: PlacedSticker = {
      id: `placed-sticker-${Date.now()}`,
      type: 'sticker',
      stickerId: sticker.id,
      x: 50,
      y: 50,
      scale: 1,
      rotation: 0,
      color: sticker.color || neonColor
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
      x: 50,
      y: 80,
      scale: 1,
      rotation: 0,
      color: textColor
    };
    onAddSticker(newText);
    onSelectSticker(newText.id);
    setInputText('');
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
      color: preset.color
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
        {(!modeOnly || modeOnly === 'sticker') && PRESET_STICKERS.length > 0 && (
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
                { id: 'curved', label: 'Kurva' }
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
          </form>
        )}
      </div>
    </div>
  );
}
