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
}

const STICKER_COLORS = [
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
  onSelectSticker
}: StickerSelectorProps) {
  const [activeTab, setActiveTab] = useState<'add' | 'manage'>('add');
  const [inputText, setInputText] = useState('');
  const [textColor, setTextColor] = useState('#00f2fe');
  const [selectedFont, setSelectedFont] = useState('Orbitron');

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
    setActiveTab('manage');
  };

  const handleAddCustomText = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    const newText: PlacedSticker = {
      id: `placed-text-${Date.now()}`,
      type: 'text',
      text: inputText.trim().toUpperCase(),
      fontFamily: selectedFont,
      x: 50,
      y: 80,
      scale: 1,
      rotation: 0,
      color: textColor
    };
    onAddSticker(newText);
    onSelectSticker(newText.id);
    setInputText('');
    setActiveTab('manage');
  };

  const activeConfiguredSticker = stickers.find(s => s.id === selectedStickerId);

  return (
    <div className="space-y-3">
      {/* Selector Navigation */}
      <div className="flex bg-black p-0.5 rounded border border-white/5">
        <button
          onClick={() => setActiveTab('add')}
          className={`flex-1 py-1.5 rounded text-[10px] font-mono font-bold tracking-widest transition-all flex items-center justify-center gap-1.5 ${
            activeTab === 'add'
              ? 'bg-white/15 text-neon-cyan'
              : 'text-zinc-500 hover:text-zinc-350'
          }`}
        >
          <Plus className="w-3 h-3" />
          OVERLAY
        </button>
        <button
          onClick={() => setActiveTab('manage')}
          className={`flex-1 py-1.5 rounded text-[10px] font-mono font-bold tracking-widest transition-all flex items-center justify-center gap-1.5 ${
            activeTab === 'manage'
              ? 'bg-white/15 text-neon-cyan'
              : 'text-zinc-500 hover:text-zinc-350'
          }`}
        >
          <Sliders className="w-3 h-3" />
          LAYER ({stickers.length})
        </button>
      </div>

      {activeTab === 'add' && (
        <div className="space-y-3">
          {/* Preset HUD Stickers */}
          <div className="space-y-1">
            <span className="text-[9px] text-zinc-500 font-mono font-bold block uppercase tracking-wider">HUD Vector Presets</span>
            <div className="grid grid-cols-5 gap-1">
              {PRESET_STICKERS.map((sticker) => (
                <button
                  key={sticker.id}
                  onClick={() => handleAddPresetSticker(sticker)}
                  className="p-1 bg-white/3 border border-white/5 hover:border-white/10 hover:bg-zinc-900 rounded flex flex-col items-center justify-center transition-all group aspect-square"
                  title={sticker.name}
                >
                  <svg width="18" height="18" viewBox="0 0 100 100" fill="none" className="mb-0.5 group-hover:stroke-neon-cyan transition-colors" stroke={sticker.color || neonColor} strokeWidth="6">
                    <path d={sticker.svgPath} />
                  </svg>
                  <span className="text-[6.5px] font-mono text-zinc-500 truncate w-full text-center">
                    {sticker.name.split(' ')[0]}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <hr className="border-white/5" />

          {/* Custom Text Overlay Generation */}
          <form onSubmit={handleAddCustomText} className="space-y-2">
            <span className="text-[9px] text-zinc-500 font-mono font-bold block uppercase tracking-wider">Teks Estetik Khusus</span>
            <div className="flex gap-1.55">
              <input
                type="text"
                placeholder="CONTOH: @SQUAD_CYBER"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                className="flex-1 bg-black border border-white/5 hover:border-white/10 py-1 px-2.5 rounded text-xs font-mono text-zinc-250 placeholder-zinc-700 focus:outline-none focus:border-[#00F0FF]"
              />
              <button
                type="submit"
                disabled={!inputText.trim()}
                className="bg-neon-cyan text-black font-mono font-bold text-[10px] py-1 px-3 rounded hover:bg-white hover:text-black transition-all disabled:opacity-30 flex items-center gap-1 shrink-0"
              >
                <Type className="w-3 h-3" /> PASANG
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
                        ? 'border-neon-cyan bg-cyan-950/20 text-white'
                        : 'border-white/5 bg-zinc-950 text-zinc-400 hover:text-zinc-255 hover:border-white/10'
                    }`}
                  >
                    <span style={{ fontFamily: font.id }} className="truncate">{font.name}</span>
                    {selectedFont === font.id && <span className="text-neon-cyan text-[7px] font-black">●</span>}
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Color picking for text */}
            <div className="flex items-center space-x-1.5 pt-1.5 border-t border-white/5">
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
        </div>
      )}

      {activeTab === 'manage' && (
        <div className="space-y-2.5">
          {stickers.length === 0 ? (
            <div className="text-center py-4 border border-dashed border-zinc-900 rounded-lg text-[10px] text-zinc-500 font-mono">
              BELUM ADA OVERLAY / TEKS AKTIF.<br />
              <button onClick={() => setActiveTab('add')} className="text-neon-cyan mt-1 underline">
                + Tambah Pertama Anda
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="space-y-1">
                <span className="text-[9px] text-zinc-500 font-mono block uppercase tracking-wider">Layers:</span>
                <div className="grid grid-cols-2 gap-1 max-h-[80px] overflow-y-auto pr-1">
                  {stickers.map((item, index) => {
                    const isSelected = item.id === selectedStickerId;
                    return (
                      <div
                        key={item.id}
                        className={`p-1.5 rounded border flex items-center justify-between font-mono text-[9px] transition-all truncate cursor-pointer ${
                          isSelected
                            ? 'bg-[#00F0FF]/10 border-neon-cyan text-white'
                            : 'bg-white/3 border-white/5 text-zinc-500 hover:bg-white/5'
                        }`}
                        onClick={() => onSelectSticker(item.id)}
                      >
                        <div className="flex items-center gap-1 flex-1 min-w-0 text-left truncate">
                          <span className="text-zinc-650 font-bold">#{index+1}</span>
                          <span className="truncate text-zinc-300">
                            {item.type === 'text' ? `"${item.text}"` : `Stiker: ${item.stickerId?.split('-')[1].toUpperCase()}`}
                          </span>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onDeleteSticker(item.id);
                            if (selectedStickerId === item.id) onSelectSticker(null);
                          }}
                          className="p-0.5 hover:text-rose-500 text-zinc-600 transition-colors shrink-0"
                          title="Hapus layer"
                        >
                          <Trash className="w-3 h-3" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Configure Selected Sticker Sliders */}
              {activeConfiguredSticker ? (
                <div className="p-2 bg-[#09090b] rounded border border-white/5 space-y-2.5 animate-fadeIn">
                  <div className="flex justify-between items-center bg-white/3 p-1 px-1.5 rounded border border-white/5">
                    <span className="text-[8px] font-mono text-neon-cyan font-bold tracking-wider uppercase flex items-center gap-1">
                      <Settings className="w-2.5 h-2.5 text-[#00F0FF]" /> SUNTING LAYER
                    </span>
                    <button
                      onClick={() => {
                        onDeleteSticker(activeConfiguredSticker.id);
                        onSelectSticker(null);
                      }}
                      className="text-[8px] font-mono text-rose-500 hover:underline flex items-center gap-0.5 font-bold"
                    >
                      HAPUS
                    </button>
                  </div>

                  {activeConfiguredSticker.type === 'text' && (
                    <div className="space-y-1">
                      <span className="text-[8px] font-mono text-zinc-500 uppercase">Ubah Isi Teks / Pesan:</span>
                      <input
                        type="text"
                        value={activeConfiguredSticker.text || ''}
                        onChange={(e) => onUpdateSticker(activeConfiguredSticker.id, { text: e.target.value.toUpperCase() })}
                        className="w-full bg-black border border-white/10 py-1 px-2 rounded font-mono text-xs text-white uppercase focus:outline-none focus:border-neon-cyan"
                      />
                    </div>
                  )}

                  {activeConfiguredSticker.type === 'text' && (
                    <div className="space-y-1">
                      <span className="text-[8px] font-mono text-zinc-500 uppercase block">Ganti Font Futuristik:</span>
                      <div className="grid grid-cols-2 gap-1 select-none">
                        {FUTURISTIC_FONTS.map((font) => (
                          <button
                            key={font.id}
                            type="button"
                            onClick={() => onUpdateSticker(activeConfiguredSticker.id, { fontFamily: font.id })}
                            className={`py-0.5 px-1.5 rounded text-left border text-[8.5px] transition-all truncate ${
                              activeConfiguredSticker.fontFamily === font.id
                                ? 'border-neon-cyan bg-cyan-950/20 text-white'
                                : 'border-white/5 bg-zinc-950 text-zinc-400 hover:text-zinc-200'
                            }`}
                          >
                            <span style={{ fontFamily: font.id }}>{font.name}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Horizontal Position Slider */}
                  <div className="space-y-0.5">
                    <div className="flex justify-between text-[8px] font-mono text-zinc-500 uppercase tracking-wide">
                      <span>X Posisi</span>
                      <span className="text-[#00F0FF] font-bold">{activeConfiguredSticker.x}%</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={activeConfiguredSticker.x}
                      onChange={(e) => onUpdateSticker(activeConfiguredSticker.id, { x: parseInt(e.target.value) })}
                      className="w-full h-1 bg-black rounded appearance-none cursor-pointer accent-neon-cyan"
                    />
                  </div>

                  {/* Vertical Position Slider */}
                  <div className="space-y-0.5">
                    <div className="flex justify-between text-[8px] font-mono text-zinc-500 uppercase tracking-wide">
                      <span>Y Posisi</span>
                      <span className="text-[#00F0FF] font-bold">{activeConfiguredSticker.y}%</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={activeConfiguredSticker.y}
                      onChange={(e) => onUpdateSticker(activeConfiguredSticker.id, { y: parseInt(e.target.value) })}
                      className="w-full h-1 bg-black rounded appearance-none cursor-pointer accent-neon-cyan"
                    />
                  </div>

                  {/* Scale Slider */}
                  <div className="space-y-0.5">
                    <div className="flex justify-between text-[8px] font-mono text-zinc-500 uppercase tracking-wide">
                      <span>Ukuran</span>
                      <span className="text-[#00F0FF] font-bold">{Math.round(activeConfiguredSticker.scale * 100)}%</span>
                    </div>
                    <input
                      type="range"
                      min="0.2"
                      max="3"
                      step="0.05"
                      value={activeConfiguredSticker.scale}
                      onChange={(e) => onUpdateSticker(activeConfiguredSticker.id, { scale: parseFloat(e.target.value) })}
                      className="w-full h-1 bg-black rounded appearance-none cursor-pointer accent-neon-cyan"
                    />
                  </div>

                  {/* Rotation Slider */}
                  <div className="space-y-0.5">
                    <div className="flex justify-between text-[8px] font-mono text-zinc-500 uppercase tracking-wide">
                      <span>Rotasi</span>
                      <span className="text-neon-pink font-bold">{activeConfiguredSticker.rotation}°</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="360"
                      step="5"
                      value={activeConfiguredSticker.rotation}
                      onChange={(e) => onUpdateSticker(activeConfiguredSticker.id, { rotation: parseInt(e.target.value) })}
                      className="w-full h-1 bg-black rounded appearance-none cursor-pointer accent-neon-cyan"
                    />
                  </div>

                  {/* Color selector for sticker */}
                  <div className="space-y-1 pt-1.5 border-t border-white/5">
                    <span className="text-[8px] text-zinc-550 font-mono uppercase tracking-wider block">Warna:</span>
                    <div className="flex space-x-1">
                      {STICKER_COLORS.map((color) => (
                        <button
                          key={color}
                          onClick={() => onUpdateSticker(activeConfiguredSticker.id, { color })}
                          className={`w-3.5 h-3.5 rounded-full border transition-all ${
                            activeConfiguredSticker.color === color ? 'border-neon-cyan scale-110' : 'border-white/5 hover:scale-105'
                          }`}
                          style={{ backgroundColor: color }}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center p-2 border border-white/5 rounded text-[8px] text-zinc-600 font-mono bg-[#09090b]">
                  KLIK SALAH SATU LAYER UNTUK MENYESUAIKAN.
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
