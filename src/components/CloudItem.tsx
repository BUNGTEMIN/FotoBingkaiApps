import React, { useState } from 'react';
import { LazyImage } from './LazyImage';

interface CloudItemProps {
  item: any;
  matchesUser: boolean;
  onEdit: () => void;
  onDownload: () => void;
  onDelete?: () => void;
  onLike: () => void;
}

export const CloudItem: React.FC<CloudItemProps> = ({ item, matchesUser, onEdit, onDownload, onDelete, onLike }) => {
  return (
    <div className="rounded-xl bg-[#0b0b0b] border border-white/10 overflow-hidden flex flex-col group hover:border-[#00F0FF]/30 transition-all duration-300 shadow-xl w-full sm:w-auto">
      {/* User Header */}
      <div className="p-3 bg-black/40 border-b border-white/5 flex items-center justify-between">
        <div className="flex items-center space-x-2 min-w-0">
          <img
            referrerPolicy="no-referrer"
            src={item.userAvatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=80&q=80'}
            className="w-5 h-5 rounded-full border border-neon-cyan/40"
            alt="U"
          />
          <span className="font-mono text-[10px] text-zinc-300 font-bold truncate max-w-[110px]" title={item.userEmail}>
            {item.userName}
          </span>
        </div>
        {matchesUser ? (
          <span className="font-mono text-[8px] bg-[#00F0FF]/10 text-neon-cyan px-1.5 py-0.5 rounded border border-[#00F0FF]/20 font-bold uppercase tracking-wide">
            SAYA 👤
          </span>
        ) : (
          <span className="font-mono text-[8px] bg-purple-500/15 text-purple-400 px-1.5 py-0.5 rounded border border-purple-500/20 font-bold uppercase tracking-wide">
            KELUARGA 🌐
          </span>
        )}
      </div>

      {/* Image Thumbnail */}
      <div className="relative aspect-square bg-zinc-950 flex items-center justify-center p-0 overflow-hidden border-b border-white/5">
        <LazyImage
          src={item.imageUrl}
          alt={item.fileName}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105 pointer-events-none select-none"
        />
        <div className="absolute bottom-2 left-2 bg-black/85 px-1.5 py-0.5 rounded border border-white/10 font-mono text-[8px] text-neon-cyan tracking-wider">
          FORMAT: {item.format ? item.format.toUpperCase() : 'JPG'}
        </div>
      </div>

      {/* Details & Actions */}
      <div className="p-4 flex-1 flex flex-col justify-between space-y-3.5">
        <div className="flex items-center justify-between">
          <h4 className="font-mono text-[10.5px] font-bold text-zinc-200 truncate" title={item.fileName}>
            {item.fileName}
          </h4>
          <button 
            onClick={onLike}
            className="flex items-center gap-1 text-[10px] text-neon-cyan hover:text-white"
          >
            ❤ {item.likes || 0}
          </button>
        </div>
        <p className="text-[9px] text-zinc-500 font-mono leading-none">
          Dimuat: {item.downloadedAt}
        </p>

        <div className="space-y-2 pt-1 border-t border-white/5">
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={onEdit}
              className="py-1.5 border border-white/10 hover:border-neon-cyan/50 bg-zinc-900/60 hover:bg-zinc-900 text-zinc-300 hover:text-white rounded font-mono text-[9px] uppercase font-bold transition-all"
              title="Gunakan foto ini kembali di Canvas Editor"
            >
              EDIT ULANG 🔄
            </button>
            <button
              type="button"
              onClick={onDownload}
              className="py-1.5 border border-white/10 hover:border-neon-green/50 bg-zinc-900/60 hover:bg-zinc-900 text-zinc-350 hover:text-white rounded font-mono text-[9px] uppercase font-bold transition-all"
            >
              UNDUH 📥
            </button>
          </div>

          {matchesUser && onDelete && (
            <button
              type="button"
              onClick={onDelete}
              className="w-full py-1 text-[8.5px] border border-red-500/20 text-red-400 hover:bg-red-500/10 font-mono uppercase font-bold rounded transition-all active:scale-[0.98]"
            >
              HAPUS
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
