import React from 'react';
import { ImageSettings } from '../types';
import { FILTER_PRESETS } from '../presets';
import { 
  RotateCw, ZoomIn, Sun, MoveHorizontal, MoveVertical, FlipHorizontal, FlipVertical
} from 'lucide-react';

interface ImageAdjusterProps {
  settings: ImageSettings;
  onChangeSettings: (settings: ImageSettings) => void;
  activeFilterPresetId: string;
  onSelectFilterPreset: (id: string, presetSettings: Partial<ImageSettings>) => void;
  onResetSettings: () => void;
  activeSection?: 'posisi' | 'filter' | 'warna';
  enableParallax?: boolean;
  onToggleParallax?: (enabled: boolean) => void;
}

export default function ImageAdjuster({
  settings,
  onChangeSettings,
  activeFilterPresetId,
  onSelectFilterPreset,
  onResetSettings,
  activeSection,
  enableParallax = true,
  onToggleParallax
}: ImageAdjusterProps) {
  const [internalSubTab, setInternalSubTab] = React.useState<'posisi' | 'filter' | 'warna'>('posisi');
  
  // Use parent-controlled activeSection if provided, otherwise fallback to internal state
  const activeSubTab = activeSection || internalSubTab;

  const updateSetting = <K extends keyof ImageSettings>(key: K, value: ImageSettings[K]) => {
    onChangeSettings({
      ...settings,
      [key]: value
    });
  };

  return (
    <div className="space-y-3.5">
      {/* Sub Tabs - Only render if not actively controlled by parent */}
      {!activeSection && (
        <div className="flex bg-black p-0.5 rounded border border-white/5">
          <button
            onClick={() => setInternalSubTab('posisi')}
            className={`flex-1 py-1 rounded text-[10px] font-mono font-bold tracking-widest transition-all ${
              activeSubTab === 'posisi'
                ? 'bg-white/15 text-neon-cyan'
                : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            PENGATURAN
          </button>
          <button
            onClick={() => setInternalSubTab('filter')}
            className={`flex-1 py-1 rounded text-[10px] font-mono font-bold tracking-widest transition-all ${
              activeSubTab === 'filter'
                ? 'bg-white/15 text-neon-cyan'
                : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            FILTER FUTURISTIK
          </button>
          <button
            onClick={() => setInternalSubTab('warna')}
            className={`flex-1 py-1 rounded text-[10px] font-mono font-bold tracking-widest transition-all ${
              activeSubTab === 'warna'
                ? 'bg-white/15 text-neon-cyan'
                : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            KOREKSI WARNA
          </button>
        </div>
      )}

      {activeSubTab === 'posisi' && (
        <div className="space-y-2.5">
          {/* Zoom Control */}
          <div className="space-y-0.5">
            <div className="flex justify-between items-center text-[10px] text-zinc-400 font-mono">
              <span className="flex items-center gap-1">
                <ZoomIn className="w-3.5 h-3.5 text-neon-cyan" />
                Skala Foto (Zoom)
              </span>
              <span className="text-zinc-300 font-bold text-[9.5px]">{Math.round(settings.scale * 100)}%</span>
            </div>
            <input
              type="range"
              min="0.1"
              max="3"
              step="0.05"
              value={settings.scale}
              onChange={(e) => updateSetting('scale', parseFloat(e.target.value))}
              className="w-full h-1 bg-zinc-900 rounded appearance-none cursor-pointer accent-neon-cyan"
            />
          </div>

          {/* Rotate Control */}
          <div className="space-y-0.5">
            <div className="flex justify-between items-center text-[10px] text-zinc-400 font-mono">
              <span className="flex items-center gap-1">
                <RotateCw className="w-3.5 h-3.5 text-neon-cyan" />
                Putar Foto (Derajat)
              </span>
              <span className="text-zinc-300 font-bold text-[9.5px]">{settings.rotation}°</span>
            </div>
            <input
              type="range"
              min="-180"
              max="180"
              step="1"
              value={settings.rotation}
              onChange={(e) => updateSetting('rotation', parseInt(e.target.value))}
              className="w-full h-1 bg-zinc-900 rounded appearance-none cursor-pointer accent-neon-cyan"
            />
          </div>

          {/* Offset X Slider */}
          <div className="space-y-0.5">
            <div className="flex justify-between items-center text-[10px] text-zinc-400 font-mono">
              <span className="flex items-center gap-1">
                <MoveHorizontal className="w-3.5 h-3.5 text-neon-cyan" />
                Geser Horizontal (X)
              </span>
              <span className="text-zinc-300 font-bold text-[9.5px]">{settings.x}%</span>
            </div>
            <input
              type="range"
              min="-100"
              max="100"
              step="1"
              value={settings.x}
              onChange={(e) => updateSetting('x', parseInt(e.target.value))}
              className="w-full h-1 bg-zinc-900 rounded appearance-none cursor-pointer accent-neon-cyan"
            />
          </div>

          {/* Offset Y Slider */}
          <div className="space-y-0.5">
            <div className="flex justify-between items-center text-[10px] text-zinc-400 font-mono">
              <span className="flex items-center gap-1">
                <MoveVertical className="w-3.5 h-3.5 text-neon-cyan" />
                Geser Vertikal (Y)
              </span>
              <span className="text-zinc-300 font-bold text-[9.5px]">{settings.y}%</span>
            </div>
            <input
              type="range"
              min="-100"
              max="100"
              step="1"
              value={settings.y}
              onChange={(e) => updateSetting('y', parseInt(e.target.value))}
              className="w-full h-1 bg-zinc-900 rounded appearance-none cursor-pointer accent-neon-cyan"
            />
          </div>

          {/* Quick Flips & Helper Controls */}
          <div className="grid grid-cols-3 gap-1.5 pt-1">
            <button
              onClick={() => updateSetting('flipH', !settings.flipH)}
              className={`flex items-center justify-center gap-1 p-1.5 rounded text-[9px] font-mono border transition-all ${
                settings.flipH
                  ? 'bg-[#00F0FF]/10 border-neon-cyan text-neon-cyan shadow-[0_0_8px_rgba(0,240,255,0.15)]'
                  : 'bg-white/3 border-white/5 text-zinc-400 hover:border-white/10 hover:text-white'
              }`}
            >
              <FlipHorizontal className="w-3 h-3" />
              FLIP H
            </button>
            <button
              onClick={() => updateSetting('flipV', !settings.flipV)}
              className={`flex items-center justify-center gap-1 p-1.5 rounded text-[9px] font-mono border transition-all ${
                settings.flipV
                  ? 'bg-[#00F0FF]/10 border-neon-cyan text-neon-cyan shadow-[0_0_8px_rgba(0,240,255,0.15)]'
                  : 'bg-white/3 border-white/5 text-zinc-400 hover:border-white/10 hover:text-white'
              }`}
            >
              <FlipVertical className="w-3 h-3" />
              FLIP V
            </button>
            <button
              onClick={onResetSettings}
              className="flex items-center justify-center p-1.5 rounded text-[9px] font-mono border bg-white/3 border-white/5 text-rose-400 hover:bg-rose-950/20 hover:border-rose-900/40 hover:text-rose-200 transition-all"
            >
              RESET POSISI
            </button>
          </div>

          {/* 3D Parallax Tilt Toggle Control */}
          {onToggleParallax !== undefined && (
            <div className="mt-3.5 p-2 rounded border border-[#00F0FF]/15 bg-cyan-950/10 flex items-center justify-between">
              <div className="flex flex-col select-none pr-3">
                <span className="text-[9.5px] font-mono text-neon-cyan font-black uppercase tracking-widest flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-neon-cyan animate-pulse"></span>
                  EFEK PARALLAX 3D
                </span>
                <span className="text-[8px] font-sans text-zinc-500 leading-normal mt-0.5">
                  Ikuti gerakan kursor & pergerakan halaman untuk kedalaman digital.
                </span>
              </div>
              <button
                type="button"
                onClick={() => onToggleParallax(!enableParallax)}
                className={`flex-none w-8 h-4.5 rounded-full p-0.5 transition-colors duration-200 focus:outline-none relative ${
                  enableParallax ? 'bg-neon-cyan' : 'bg-zinc-800'
                }`}
              >
                <div className={`bg-neutral-950 w-3.5 h-3.5 rounded-full shadow-md transform duration-200 ${
                  enableParallax ? 'translate-x-3.5 bg-neutral-950' : 'translate-x-0 bg-white/80'
                }`} />
              </button>
            </div>
          )}
        </div>
      )}

      {activeSubTab === 'filter' && (
        <div className="space-y-2">
          <div className="grid grid-cols-2 gap-1.5 max-h-[160px] overflow-y-auto pr-0.5 scrollbar-thin scrollbar-thumb-white/10">
            {FILTER_PRESETS.map((filter) => {
              const isSelected = activeFilterPresetId === filter.id;
              return (
                <button
                  key={filter.id}
                  onClick={() => onSelectFilterPreset(filter.id, filter.settings)}
                  className={`p-1.5 rounded border text-left font-mono transition-all group flex flex-col justify-between h-[52px] relative overflow-hidden ${
                    isSelected
                      ? 'bg-cyan-950/25 border-neon-cyan'
                      : 'bg-white/3 border-white/5 hover:bg-[#121214] hover:border-white/10'
                  }`}
                >
                  <div className="z-10 flex flex-col min-w-0 w-full">
                    <span className={`text-[9.5px] font-bold tracking-wider truncate ${isSelected ? 'text-neon-cyan' : 'text-zinc-200 group-hover:text-neon-cyan'}`}>
                      {filter.name}
                    </span>
                    <span className="text-[8px] text-zinc-500 truncate mt-0.5 leading-snug group-hover:text-zinc-400">
                      {filter.description}
                    </span>
                  </div>
                  {filter.glowColor && (
                    <span 
                      className="absolute right-0 bottom-0 w-6 h-6 rounded-full blur-md opacity-25"
                      style={{ backgroundColor: filter.glowColor }}
                    />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {activeSubTab === 'warna' && (
        <div className="space-y-2">
          {/* Brightness Adjustment */}
          <div className="space-y-0.5">
            <div className="flex justify-between items-center text-[10px] text-zinc-400 font-mono">
              <span>Kecerahan (Brightness)</span>
              <span className="text-zinc-300 font-bold text-[9.5px]">{settings.brightness}%</span>
            </div>
            <input
              type="range"
              min="50"
              max="150"
              value={settings.brightness}
              onChange={(e) => updateSetting('brightness', parseInt(e.target.value))}
              className="w-full h-1 bg-zinc-900 rounded appearance-none cursor-pointer accent-neon-pink"
            />
          </div>

          {/* Contrast Adjustment */}
          <div className="space-y-0.5">
            <div className="flex justify-between items-center text-[10px] text-zinc-400 font-mono">
              <span>Kontras (Contrast)</span>
              <span className="text-zinc-300 font-bold text-[9.5px]">{settings.contrast}%</span>
            </div>
            <input
              type="range"
              min="50"
              max="150"
              value={settings.contrast}
              onChange={(e) => updateSetting('contrast', parseInt(e.target.value))}
              className="w-full h-1 bg-zinc-900 rounded appearance-none cursor-pointer accent-neon-pink"
            />
          </div>

          {/* Saturation Adjustment */}
          <div className="space-y-0.5">
            <div className="flex justify-between items-center text-[10px] text-zinc-400 font-mono">
              <span>Saturasi (Saturation)</span>
              <span className="text-zinc-300 font-bold text-[9.5px]">{settings.saturate}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="200"
              value={settings.saturate}
              onChange={(e) => updateSetting('saturate', parseInt(e.target.value))}
              className="w-full h-1 bg-zinc-900 rounded appearance-none cursor-pointer accent-neon-pink"
            />
          </div>

          {/* Hue Rotation */}
          <div className="space-y-0.5">
            <div className="flex justify-between items-center text-[10px] text-zinc-400 font-mono">
              <span>Shift Rona Warna</span>
              <span className="text-zinc-300 font-bold text-[9.5px]">{settings.hueRotate}°</span>
            </div>
            <input
              type="range"
              min="0"
              max="360"
              value={settings.hueRotate}
              onChange={(e) => updateSetting('hueRotate', parseInt(e.target.value))}
              className="w-full h-1 bg-zinc-900 rounded appearance-none cursor-pointer accent-neon-pink"
            />
          </div>

          {/* Blur & Digital Grain Effects */}
          <div className="grid grid-cols-2 gap-2 pt-1">
            <div className="p-1 px-2 rounded border border-zinc-900 bg-zinc-950/20 flex items-center justify-between">
              <span className="text-[9px] font-mono text-zinc-400">GRAIN (NOISE)</span>
              <button
                onClick={() => updateSetting('noise', !settings.noise)}
                className={`w-8 h-4 rounded-full p-0.5 transition-colors duration-200 focus:outline-none ${
                  settings.noise ? 'bg-neon-pink' : 'bg-zinc-800'
                }`}
              >
                <div className={`bg-white w-3 h-3 rounded-full shadow transform duration-200 ${
                  settings.noise ? 'translate-x-4' : 'translate-x-0'
                }`} />
              </button>
            </div>
            <div className="p-1 px-2 rounded border border-zinc-900 bg-zinc-950/20 flex flex-col justify-between">
              <div className="flex justify-between items-center text-[9px] font-mono text-zinc-400">
                <span>BLUR</span>
                <span>{settings.blur}px</span>
              </div>
              <input
                type="range"
                min="0"
                max="8"
                step="0.5"
                value={settings.blur}
                onChange={(e) => updateSetting('blur', parseFloat(e.target.value))}
                className="w-full h-1 bg-zinc-900 rounded appearance-none cursor-pointer accent-neon-pink"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
