import React, { useState, useEffect } from 'react';
import { LazyImage } from './LazyImage';
import { AnimatePresence, motion } from "motion/react";
import { Trash2, Eye, MessageCircle } from 'lucide-react';
import { DeleteConfirmationModal } from './DeleteConfirmationModal';
import { db, collection, query, where, onSnapshot } from '../firebase';

interface CloudItemProps {
  item: any;
  matchesUser: boolean;
  onEdit?: () => void;
  onDownload?: () => void;
  onDelete?: () => void;
  onLike: () => void;
  onOpenDetail: () => void;
  user: any;
  theme: 'dark' | 'light';
  handleGoogleLogin: () => void;
  triggerToast: (msg: string) => void;
}

export const CloudItem: React.FC<CloudItemProps> = ({ 
  item, 
  matchesUser, 
  onDelete, 
  onLike, 
  onOpenDetail,
  user,
  theme,
  handleGoogleLogin,
  triggerToast
}) => {
  const [hearts, setHearts] = useState<{ id: number }[]>([]);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [commentCount, setCommentCount] = useState(0);

  // Monitor real-time comment count for this photo
  useEffect(() => {
    if (!item?.id) return;
    try {
      const q = query(
        collection(db, 'qcc_comments'),
        where('targetId', '==', item.id),
        where('targetType', '==', 'photo')
      );
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const count = snapshot && typeof snapshot.size === 'number' ? snapshot.size : (snapshot?.docs?.length || 0);
        setCommentCount(count);
      }, (err) => {
        console.warn("Error fetching comment count: ", err);
      });
      return () => unsubscribe();
    } catch (e) {
      console.error("Gagal mendeteksi jumlah komentar:", e);
    }
  }, [item?.id]);

  const handleLikeClick = () => {
    onLike();
    const id = Date.now();
    setHearts(prev => [...prev, { id }]);
    setTimeout(() => {
      setHearts(prev => prev.filter(h => h.id !== id));
    }, 1000);
  };

  return (
    <div className="relative rounded-xl bg-[#0b0b0b] border border-white/10 overflow-hidden flex flex-col group hover:border-[#00F0FF]/30 transition-all duration-300 shadow-xl w-full sm:w-auto">
      <DeleteConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={onDelete || (() => {})}
      />
 
      {/* Floating Hearts Animation */}
      <AnimatePresence>
        {hearts.map(h => (
          <motion.div
            key={h.id}
            initial={{ opacity: 1, y: 0, x: '50%', scale: 0.5 }}
            animate={{ 
              opacity: [0, 1, 0], 
              y: -200, 
              x: `${50 + (Math.random() - 0.5) * 105}%`, 
              scale: [0.5, 1.5, 2] 
            }}
            transition={{ duration: 1.5, ease: "easeOut" }}
            exit={{ opacity: 0 }}
            className="absolute bottom-16 right-6 text-2xl pointer-events-none z-50 animate-pulse text-red-500"
          >
            ❤
          </motion.div>
        ))}
      </AnimatePresence>
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
      <div 
        onClick={onOpenDetail}
        className="relative aspect-square bg-zinc-950 flex items-center justify-center p-0 overflow-hidden border-b border-white/5 cursor-pointer group/thumb"
        title="Klik untuk melihat Detail & Komentar 🔍"
      >
        <LazyImage
          src={item.imageUrl}
          alt="Image"
          className="w-full h-full object-cover transition-transform duration-500 group-hover/thumb:scale-105 pointer-events-none select-none"
        />
        {/* Hover overlay indicator */}
        <div className="absolute inset-0 bg-black/45 opacity-0 group-hover/thumb:opacity-100 flex items-center justify-center transition-all duration-300">
          <div className="bg-zinc-900/95 border border-[#00F0FF]/30 text-neon-cyan px-2.5 py-1.5 rounded-lg text-[9px] font-mono font-bold tracking-wider flex items-center gap-1.5 shadow-[0_0_12px_rgba(0,240,255,0.25)] scale-90 group-hover/thumb:scale-100 transition-transform duration-300">
            <Eye className="w-3.5 h-3.5 animate-pulse text-[#00F0FF]" />
            BUKA DETAIL & KOMENTAR
          </div>
        </div>
        <div className="absolute bottom-2 left-2 bg-black/85 px-1.5 py-0.5 rounded border border-white/10 font-mono text-[8px] text-neon-cyan tracking-wider z-10">
          FORMAT: {item.format ? item.format.toUpperCase() : 'JPG'}
        </div>
      </div>

      {/* Details & Actions */}
      <div className="p-4 flex-1 flex flex-col justify-between space-y-3.5">
        <div className="flex items-center justify-between">
          <p className="text-[9px] text-zinc-500 font-mono leading-none">
            Dimuat: {item.downloadedAt}
          </p>
          <motion.button 
            onClick={handleLikeClick}
            whileTap={{ scale: 1.5, rotate: -10, transition: { duration: 0.1 } }}
            className="flex items-center gap-1.5 text-2xl text-red-500 hover:text-red-400 p-2"
          >
            ❤ <span className="text-[14px] font-mono text-zinc-200">{item.likes || 0}</span>
          </motion.button>
        </div>

        {matchesUser && onDelete && (
          <button
            type="button"
            onClick={() => setIsDeleteModalOpen(true)}
            className="w-full flex items-center justify-center gap-1.5 py-1 text-[10px] border border-red-500/20 text-red-500 hover:bg-red-500/10 font-mono uppercase font-bold rounded transition-all active:scale-[0.98] mb-1"
          >
            <Trash2 size={11} /> HAPUS FOTO
          </button>
        )}

        {/* Compact Elegant Single Page / Modal Detail Trigger Button */}
        <button
          type="button"
          onClick={onOpenDetail}
          className="w-full flex items-center justify-center gap-2 py-1.5 border border-white/5 bg-zinc-950/80 hover:bg-white/5 text-zinc-300 hover:text-white rounded-lg text-[10px] font-bold tracking-wider font-mono transition-all uppercase shadow"
        >
          <MessageCircle className="w-3.5 h-3.5 text-neon-cyan" />
          <span>{commentCount === 0 ? 'Tulis Ulasan' : `${commentCount} KOMENTAR`}</span>
        </button>
      </div>
    </div>
  );
};
