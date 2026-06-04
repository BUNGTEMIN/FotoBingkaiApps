import React from 'react';
import { Frame } from '../types';
import { FRAMES } from '../presets';
import { LazyImage } from './LazyImage';

interface FrameSelectorProps {
  selectedFrame: Frame;
  onSelectFrame: (frame: Frame) => void;
  // Kept for signature compatibility
  neonColor: string;
  onSelectNeonColor: (color: string) => void;
  customFrames: Frame[];
  onAddCustomFrame: (frame: Frame) => void;
  onDeleteCustomFrame: (id: string) => void;
}

export default function FrameSelector({
  selectedFrame,
  onSelectFrame
}: FrameSelectorProps) {
  return (
    <div className="space-y-4">
      <div className="bg-cyan-950/20 border border-neon-cyan/20 p-2.5 rounded text-xs leading-relaxed text-zinc-300 font-sans">
        🌟 <strong className="text-neon-cyan font-mono">Pilihan Bingkai:</strong> Silakan pilih bingkai QCC &amp; SS Convention 2026.
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 max-h-[300px] overflow-y-auto pr-1">
        {FRAMES.map((frame, idx) => {
          const isSelected = selectedFrame.id === frame.id;
          return (
            <button
              key={frame.id}
              onClick={() => onSelectFrame(frame)}
              className={`relative p-2 rounded group transition-all duration-200 flex flex-col items-center text-center font-mono border ${
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
              <span className="text-[10px] font-bold mt-2 text-zinc-300 group-hover:text-neon-cyan transition-colors truncate w-full">
                {frame.name}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
