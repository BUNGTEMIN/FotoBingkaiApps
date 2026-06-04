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
  modeOnly?: 'sticker' | 'text';
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
  const [selectedStyle, setSelectedStyle] = useState<'neon' | 'chrome' | 'glitch' | 'hologram' | 'plain'>('neon');

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

        {/* Custom Text Overlay Generation */}
        {(!modeOnly || modeOnly === 'text') && (
          <form onSubmit={handleAddCustomText} className="space-y-2">
            <span className="text-[9px] text-zinc-500 font-mono font-bold block uppercase tracking-wider">Teks Estetik Khusus</span>
            
            {/* Style Picker */}
            <div className="flex gap-1 overflow-x-auto pb-1 scrollbar-none">
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
