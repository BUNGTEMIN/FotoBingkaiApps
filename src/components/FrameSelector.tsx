import React, { useRef } from 'react';
import { Frame } from '../types';
import { FRAMES } from '../presets';
import { Sparkles, Image, ShieldCheck, Upload, Trash2, Palette } from 'lucide-react';
import { LazyImage } from './LazyImage';

interface FrameSelectorProps {
  selectedFrame: Frame;
  onSelectFrame: (frame: Frame) => void;
  neonColor: string;
  onSelectNeonColor: (color: string) => void;
  customFrames: Frame[];
  onAddCustomFrame: (frame: Frame) => void;
  onDeleteCustomFrame: (id: string) => void;
}

const NEON_COLORS = [
  { name: 'Cyan Tech', color: '#00f2fe' },
  { name: 'Laser Pink', color: '#f35588' },
  { name: 'Matrix Green', color: '#39ff14' },
  { name: 'Hyper Voila', color: '#9d4edd' },
  { name: 'Solar Amber', color: '#f59e0b' },
  { name: 'Ice White', color: '#ffffff' },
];

export default function FrameSelector({
  selectedFrame,
  onSelectFrame,
  neonColor,
  onSelectNeonColor,
  customFrames,
  onAddCustomFrame,
  onDeleteCustomFrame
}: FrameSelectorProps) {
  const [activeTab, setActiveTab] = React.useState<'futuristic' | 'rakernit' | 'nufat' | 'custom'>('futuristic');
  const [nufatFrames, setNufatFrames] = React.useState<Frame[]>([]);
  const [isLoadingNufat, setIsLoadingNufat] = React.useState<boolean>(false);
  const [nufatError, setNufatError] = React.useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const futuristicFrames = FRAMES.filter(f => f.category === 'Futuristik' || f.category === 'Minimalis');
  const rakernitFrames = FRAMES.filter(f => f.category === 'Bungtemin');

  const fetchNufatFrames = async () => {
    setIsLoadingNufat(true);
    setNufatError(null);
    try {
      const res = await fetch('/api/external-images');
      if (!res.ok) throw new Error('Gagal mengambil daftar bingkai Nufat');
      const data = await res.json();
      setNufatFrames(data);
    } catch (err: any) {
      console.error("Error fetching Nufat Frames:", err);
      setNufatError(err?.message || 'Gagal berkomunikasi dengan API Nufat');
    } finally {
      setIsLoadingNufat(false);
    }
  };

  React.useEffect(() => {
    fetchNufatFrames();
  }, []);

  const handleCustomFrameUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      if (typeof event.target?.result === 'string') {
        const newFrame: Frame = {
          id: `custom-frame-${Date.now()}`,
          name: file.name.split('.')[0] || 'Frame Unggahan',
          src: event.target.result,
          type: 'file',
          category: 'Pelanggan',
          description: 'Bingkai kustom transparan diunggah pengguna'
        };
        onAddCustomFrame(newFrame);
        onSelectFrame(newFrame);
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="space-y-5">
      {/* Tab Navigation */}
      <div className="grid grid-cols-4 border-b border-white/10 p-1 bg-black rounded gap-1">
        <button
          onClick={() => setActiveTab('futuristic')}
          className={`py-2 px-1 rounded font-mono text-[9px] font-bold tracking-wider transition-all duration-200 flex items-center justify-center gap-1 ${
            activeTab === 'futuristic'
              ? 'bg-white/10 text-neon-cyan border-b-2 border-neon-cyan shadow-[0_0_12px_rgba(0,240,255,0.15)]'
              : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/3'
          }`}
        >
          <Sparkles className="w-3 h-3" />
          FUTURISTIK
        </button>
        <button
          onClick={() => setActiveTab('rakernit')}
          className={`py-2 px-1 rounded font-mono text-[9px] font-bold tracking-wider transition-all duration-200 flex items-center justify-center gap-1 ${
            activeTab === 'rakernit'
              ? 'bg-white/10 text-neon-cyan border-b-2 border-neon-cyan shadow-[0_0_12px_rgba(0,240,255,0.15)]'
              : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/3'
          }`}
        >
          <ShieldCheck className="w-3 h-3" />
          RAKERNIT
        </button>
        <button
          onClick={() => setActiveTab('nufat')}
          className={`py-2 px-1 rounded font-mono text-[9px] font-bold tracking-wider transition-all duration-200 flex items-center justify-center gap-1 ${
            activeTab === 'nufat'
              ? 'bg-white/10 text-neon-green border-b-2 border-neon-green shadow-[0_0_12px_rgba(57,255,20,0.15)] font-black'
              : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/3'
          }`}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-[#39ff14] animate-pulse"></span>
          API NUFAT
        </button>
        <button
          onClick={() => setActiveTab('custom')}
          className={`py-2 px-1 rounded font-mono text-[9px] font-bold tracking-wider transition-all duration-200 flex items-center justify-center gap-1 ${
            activeTab === 'custom'
              ? 'bg-white/10 text-neon-pink border-b-2 border-neon-pink shadow-[0_0_12px_rgba(243,85,136,0.15)]'
              : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/3'
          }`}
        >
          <Image className="w-3 h-3" />
          PRIBADI
        </button>
      </div>

      {/* Frame Selection Content */}
      <div className="min-h-[160px] max-h-[300px] overflow-y-auto pr-1">
        {activeTab === 'futuristic' && (
          <div className="grid grid-cols-2 gap-2">
            {futuristicFrames.map((frame) => {
              const isSelected = selectedFrame.id === frame.id;
              return (
                <button
                  key={frame.id}
                  onClick={() => onSelectFrame(frame)}
                  className={`relative p-2 rounded group transition-all duration-200 flex flex-col text-left font-mono border ${
                    isSelected
                      ? 'bg-cyan-950/25 border-neon-cyan/80 glow-cyan'
                      : 'bg-[#121214] border-white/10 hover:border-white/15'
                  }`}
                >
                  <div className="w-full aspect-square relative rounded bg-black overflow-hidden border border-white/5 group-hover:scale-105 transition-transform duration-300">
                    {frame.renderSvg && (
                      <div 
                        className="w-full h-full p-2 scale-90"
                        dangerouslySetInnerHTML={{ __html: frame.renderSvg(neonColor) }}
                      />
                    )}
                  </div>
                  <span className="text-[11px] font-bold mt-2 text-zinc-200 tracking-wider font-sans group-hover:text-neon-cyan transition-colors">
                    {frame.name}
                  </span>
                  <span className="text-[9px] text-zinc-500 mt-0.5 line-clamp-1 leading-tight">
                    {frame.description || 'Vektor modern'}
                  </span>
                </button>
              );
            })}
          </div>
        )}

        {activeTab === 'rakernit' && (
          <div className="space-y-4">
            <div className="bg-cyan-950/20 border border-neon-cyan/20 p-2.5 rounded text-xs leading-relaxed text-zinc-300 font-sans">
              🌟 <strong className="text-neon-cyan font-mono">36 Pilihan Frame RAKERNIT:</strong> Bingkai resmi dari server Bungtemin.net. Sempurna untuk menyemarakkan acara RAKERNIT 2025.
            </div>
            <div className="grid grid-cols-3 gap-2">
              {rakernitFrames.map((frame, idx) => {
                const isSelected = selectedFrame.id === frame.id;
                return (
                  <button
                    key={frame.id}
                    onClick={() => onSelectFrame(frame)}
                    className={`relative p-1.5 rounded group transition-all duration-200 flex flex-col items-center text-center font-mono border ${
                      isSelected
                        ? 'bg-cyan-950/25 border-neon-cyan glow-cyan'
                        : 'bg-[#121214] border-white/10 hover:border-white/15'
                    }`}
                  >
                    <div className="relative w-full aspect-square bg-black rounded overflow-hidden border border-white/5 group-hover:scale-105 transition-transform duration-300 flex items-center justify-center p-0">
                      {frame.src ? (
                        <LazyImage 
                          src={frame.src}
                          alt={frame.name}
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover bg-transparent"
                        />
                      ) : (
                        <span className="text-[12px] font-black text-transparent bg-clip-text bg-gradient-to-r from-neon-cyan to-neon-pink">
                          #{idx + 1}
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] font-bold mt-1 text-zinc-300 group-hover:text-neon-cyan transition-colors truncate w-full">
                      Frame #{idx + 1}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {activeTab === 'nufat' && (
          <div className="space-y-4">
            <div className="bg-emerald-950/20 border border-emerald-500/20 p-2.5 rounded text-[11px] leading-relaxed text-zinc-300 font-sans flex flex-col gap-1">
              <div>
                📡 <strong className="text-emerald-400 font-mono">Koleksi Twibbon Nufat:</strong> Mengambil katalog bingkai masa kini langsung dari sistem <code className="text-white">wabot.nufat.id</code> dengan otorisasi JWT Bearer aman server-side.
              </div>
              <div className="text-[9px] text-zinc-500 font-mono flex items-center gap-1.5 mt-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                <span>STATUS: TERKONEKSI (AUTHORIZATION SUCCESSFUL)</span>
              </div>
            </div>

            {isLoadingNufat ? (
              <div className="flex flex-col items-center justify-center py-12 space-y-2">
                <div className="w-6 h-6 border-2 border-[#39ff14] border-t-transparent rounded-full animate-spin"></div>
                <span className="text-[10px] text-zinc-500 font-mono animate-pulse uppercase tracking-widest">
                  Mengunduh galeri Nufat...
                </span>
              </div>
            ) : nufatError ? (
              <div className="border border-red-500/20 bg-red-950/10 p-3 rounded text-center space-y-2">
                <p className="text-[10px] font-mono text-red-400">{nufatError}</p>
                <button
                  onClick={fetchNufatFrames}
                  className="px-3 py-1 bg-zinc-900 border border-red-500/30 text-white rounded text-[9px] font-mono hover:bg-zinc-800"
                >
                  ULANGI MUAT DATA
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                {nufatFrames.map((frame) => {
                  const isSelected = selectedFrame.id === frame.id;
                  return (
                    <button
                      key={frame.id}
                      onClick={() => onSelectFrame(frame)}
                      className={`relative p-2 rounded group transition-all duration-200 flex flex-col text-left font-mono border ${
                        isSelected
                          ? 'bg-[#39ff14]/5 border-[#39ff14]/60 shadow-[0_0_12px_rgba(57,255,20,0.15)]'
                          : 'bg-[#121214] border-white/10 hover:border-white/15'
                      }`}
                    >
                      <div className="w-full aspect-square relative rounded bg-black overflow-hidden border border-white/5 group-hover:scale-105 transition-transform duration-300 flex items-center justify-center p-0">
                        {frame.src ? (
                          <LazyImage 
                            src={frame.src}
                            alt={frame.name}
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-cover bg-transparent"
                          />
                        ) : null}
                      </div>
                      <span className="text-[10px] font-bold mt-2 text-zinc-200 tracking-wider font-sans group-hover:text-emerald-400 transition-colors line-clamp-1">
                        {frame.name}
                      </span>
                      <span className="text-[8px] text-zinc-500 mt-0.5 line-clamp-1 leading-tight">
                        {frame.description || 'Integrasi Web Nufat'}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {activeTab === 'custom' && (
          <div className="space-y-4">
            <div className="flex flex-col items-center justify-center border border-dashed border-white/10 hover:border-neon-pink bg-white/3 p-6 rounded transition-all">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleCustomFrameUpload}
                accept="image/*.png"
                className="hidden"
              />
              <Upload className="w-8 h-8 text-zinc-500 mb-2 group-hover:text-neon-pink" />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="px-4 py-1.5 bg-black hover:bg-white/5 text-neon-pink text-xs font-mono font-bold rounded border border-white/10 hover:border-neon-pink transition-all"
              >
                UNGGAH FRAME (PNG TRANSPARAN)
              </button>
              <span className="text-[10px] text-zinc-500 mt-2 text-center font-sans">
                Pastikan gambar berukuran persegi (1:1) dan memiliki background transparan (.PNG) agar foto Anda terlihat.
              </span>
            </div>

            {customFrames.length > 0 && (
              <div className="space-y-2">
                <span className="text-xs text-zinc-400 font-mono block">Daftar Bingkai Pribadi Anda:</span>
                <div className="grid grid-cols-2 gap-2">
                  {customFrames.map((frame) => {
                    const isSelected = selectedFrame.id === frame.id;
                    return (
                      <div
                        key={frame.id}
                        className={`relative p-2 rounded flex items-center justify-between border ${
                          isSelected ? 'bg-black border-neon-pink glow-pink' : 'bg-white/3 border-white/10'
                        }`}
                      >
                        <button
                          onClick={() => onSelectFrame(frame)}
                          className="flex items-center space-x-2 text-left flex-1 min-w-0"
                        >
                          {frame.src ? (
                            <img src={frame.src} className="w-8 h-8 object-contain bg-black rounded border border-white/5" />
                          ) : null}
                          <span className="text-[11px] font-mono text-zinc-300 truncate font-semibold">
                            {frame.name}
                          </span>
                        </button>
                        <button
                          onClick={() => onDeleteCustomFrame(frame.id)}
                          className="p-1 text-zinc-500 hover:text-rose-500"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Frame Vector Color Themes (Unlocks on Procedural Vector Frames) */}
      {selectedFrame.type === 'procedural' && (
        <div className="bg-[#0e0e11] p-4 rounded border border-white/10 space-y-3">
          <div className="flex items-center space-x-2">
            <Palette className="w-4 h-4 text-neon-cyan" />
            <span className="text-xs font-mono font-bold tracking-widest text-zinc-300">TEMA WARNA NEON GLOW</span>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {NEON_COLORS.map((item) => {
              const isSelected = neonColor === item.color;
              return (
                <button
                  key={item.color}
                  onClick={() => onSelectNeonColor(item.color)}
                  className={`flex items-center space-x-2 p-1.5 rounded border text-left font-mono text-[10px] transition-all ${
                    isSelected ? 'border-neon-cyan bg-white/10' : 'border-white/5 bg-[#050505]'
                  }`}
                >
                  <span
                    className="w-3 h-3 rounded-full shrink-0"
                    style={{
                      backgroundColor: item.color,
                      boxShadow: `0 0 8px ${item.color}cc`,
                    }}
                  />
                  <span className="text-zinc-350 truncate">{item.name}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
