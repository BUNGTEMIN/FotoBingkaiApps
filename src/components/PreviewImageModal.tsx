import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ZoomIn, ZoomOut, RotateCcw, X, Maximize2, Minimize2, Move } from 'lucide-react';

interface PreviewImageModalProps {
  isOpen: boolean;
  src: string;
  name?: string;
  onClose: () => void;
}

export default function PreviewImageModal({ isOpen, src, name = 'Pratinjau Foto', onClose }: PreviewImageModalProps) {
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const dragStart = useRef({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  // Reset state when modal is opened/closed
  useEffect(() => {
    if (isOpen) {
      setScale(1);
      setPosition({ x: 0, y: 0 });
    } else {
      // Auto exit fullscreen on close if active
      if (document.fullscreenElement) {
        document.exitFullscreen().catch(() => {});
      }
      setIsFullscreen(false);
    }
  }, [isOpen, src]);

  // Handle Fullscreen state synchronization (e.g. if exited using Esc key)
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('mozfullscreenchange', handleFullscreenChange);
    document.addEventListener('MSFullscreenChange', handleFullscreenChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('mozfullscreenchange', handleFullscreenChange);
      document.removeEventListener('MSFullscreenChange', handleFullscreenChange);
    };
  }, []);

  const toggleFullscreen = async () => {
    const overlay = document.getElementById('image-preview-modal-overlay');
    if (!overlay) return;

    try {
      if (!document.fullscreenElement) {
        if (overlay.requestFullscreen) {
          await overlay.requestFullscreen();
        } else if ((overlay as any).webkitRequestFullscreen) { /* Safari */
          await (overlay as any).webkitRequestFullscreen();
        } else if ((overlay as any).msRequestFullscreen) { /* IE11 */
          await (overlay as any).msRequestFullscreen();
        }
      } else {
        if (document.exitFullscreen) {
          await document.exitFullscreen();
        } else if ((document as any).webkitExitFullscreen) { /* Safari */
          await (document as any).webkitExitFullscreen();
        } else if ((document as any).msExitFullscreen) { /* IE11 */
          await (document as any).msExitFullscreen();
        }
      }
    } catch (err) {
      console.warn('Fullscreen API blocked or unsupported, using CSS simulated state:', err);
      setIsFullscreen(prev => !prev);
    }
  };

  const handleZoomIn = () => {
    setScale(prev => Math.min(prev + 0.25, 5));
  };

  const handleZoomOut = () => {
    setScale(prev => {
      const next = Math.max(prev - 0.25, 0.5);
      if (next === 1) setPosition({ x: 0, y: 0 });
      return next;
    });
  };

  const handleReset = () => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (scale <= 1) return;
    setIsDragging(true);
    dragStart.current = { x: e.clientX - position.x, y: e.clientY - position.y };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || scale <= 1) return;
    setPosition({
      x: e.clientX - dragStart.current.x,
      y: e.clientY - dragStart.current.y
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Close on ESC keypress
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div id="image-preview-modal-overlay" className="fixed inset-0 z-[9999] flex flex-col items-center justify-center p-4 bg-black/95 backdrop-blur-md select-none">
          {/* Top Panel Actions */}
          <div className={`w-full flex items-center justify-between mb-4 z-10 px-4 transition-all duration-300 ${
            isFullscreen ? 'max-w-none' : 'max-w-4xl'
          }`}>
            <div className="flex flex-col">
              <span className="text-[10px] font-mono text-neon-cyan/80 tracking-widest uppercase">PRATINJAU FOTO ESTETIK</span>
              <h3 className="text-sm font-mono font-bold text-white truncate max-w-[200px] sm:max-w-md">
                {name}
              </h3>
            </div>

            {/* Controls Bar */}
            <div className="flex items-center gap-2 bg-zinc-900/90 border border-white/5 px-3 py-1.5 rounded-xl shadow-lg">
              <button
                onClick={handleZoomOut}
                title="Zoom Out"
                disabled={scale <= 0.5}
                className="p-1.5 text-zinc-400 hover:text-white hover:bg-white/5 rounded-lg transition-all disabled:opacity-30"
              >
                <ZoomOut className="w-4 h-4" />
              </button>

              <span className="text-xs font-mono text-zinc-300 min-w-[44px] text-center font-bold">
                {Math.round(scale * 100)}%
              </span>

              <button
                onClick={handleZoomIn}
                title="Zoom In"
                disabled={scale >= 5}
                className="p-1.5 text-zinc-400 hover:text-white hover:bg-white/5 rounded-lg transition-all disabled:opacity-30"
              >
                <ZoomIn className="w-4 h-4" />
              </button>

              <div className="h-4 w-[1px] bg-white/10 mx-1" />

              <button
                onClick={handleReset}
                title="Reset Zoom"
                className="p-1.5 text-zinc-400 hover:text-neon-cyan hover:bg-white/5 rounded-lg transition-all"
              >
                <RotateCcw className="w-4 h-4" />
              </button>

              <div className="h-4 w-[1px] bg-white/10 mx-1" />

              {/* Dedicated True Fullscreen Toggle Button */}
              <button
                onClick={toggleFullscreen}
                title={isFullscreen ? "Keluar Layar Penuh" : "Layar Penuh"}
                className={`p-1.5 rounded-lg transition-all ${
                  isFullscreen 
                    ? 'text-neon-cyan bg-neon-cyan/15 border border-[#00F0FF]/30 shadow-[0_0_8px_rgba(0,240,255,0.25)]' 
                    : 'text-zinc-400 hover:text-white hover:bg-white/5'
                }`}
              >
                {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              </button>

              <div className="h-4 w-[1px] bg-white/10 mx-1" />

              <button
                onClick={onClose}
                title="Tutup (Esc)"
                className="p-1.5 text-zinc-400 hover:text-rose-400 hover:bg-white/5 rounded-lg transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Helper Drag Indicator */}
          {scale > 1 && (
            <div className="absolute top-16 bg-[#00F0FF]/15 border border-[#00F0FF]/30 text-neon-cyan text-[9px] font-mono font-bold px-3 py-1 rounded-full flex items-center gap-1.5 shadow-[0_0_10px_rgba(0,240,255,0.1)] z-10 animate-bounce">
              <Move className="w-3 h-3 text-neon-cyan" /> TAHAN DAN SERET UNTUK MENGGESER GAMBAR
            </div>
          )}

          {/* Interactive Image Container */}
          <div 
            ref={containerRef}
            className={`relative flex-1 w-full transition-all duration-300 flex items-center justify-center overflow-hidden p-4 ${
              isFullscreen 
                ? 'max-w-full max-h-[90vh] bg-black/98 border-none' 
                : 'max-w-4xl max-h-[80vh] rounded-2xl bg-zinc-950/80 border border-white/5'
            }`}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
          >
            <motion.img
              layoutId={`preview-img-${src}`}
              src={src}
              alt={name}
              draggable={false}
              style={{
                transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
                cursor: scale > 1 ? (isDragging ? 'grabbing' : 'grab') : 'default'
              }}
              className="max-w-[100%] max-h-[100%] object-contain select-none transition-transform duration-100 ease-out shadow-2xl rounded-lg"
            />
          </div>

          {/* Bottom helper info */}
          <div className="w-full text-center mt-4">
            <span className="text-[9px] font-sans text-zinc-500 uppercase tracking-widest leading-none">
              Gunakan roda gulir mouse untuk zoom, atau kontrol bar di atas. Klik di luar atau ESC untuk menutup.
            </span>
          </div>

          {/* Click outside backdrop to close (works when clicking exact margins outside the content box) */}
          <div 
            className="absolute inset-0 -z-10" 
            onClick={onClose} 
          />
        </div>
      )}
    </AnimatePresence>
  );
}
