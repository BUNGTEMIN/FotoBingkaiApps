import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, Heart, MessageCircle, Trash2, LogIn, Send, Sliders, Layers, Eye, EyeOff, Image as ImageIcon } from 'lucide-react';
import { 
  db,
  auth,
  collection, 
  addDoc, 
  onSnapshot, 
  query, 
  where, 
  orderBy, 
  deleteDoc, 
  doc, 
  serverTimestamp 
} from '../firebase';
import { DeleteConfirmationModal } from './DeleteConfirmationModal';
import { ensureFullSvg, resolveApiUrl, cleanFrameName, cleanFrameCategory } from '../canvasUtils';
import { LazyImage } from './LazyImage';

interface FrameDetailPageProps {
  onBack: () => void;
  frame: any;
  user: any;
  theme: 'dark' | 'light';
  handleGoogleLogin: () => void;
  triggerToast: (msg: string) => void;
  isLiked: boolean;
  likesCount: number;
  usagesCount: number;
  handleToggleLike: (frameId: string) => void;
  onUseFrame: () => void;
  isCustom: boolean;
  onDeleteCustomFrame?: () => void;
  neonColor?: string;
}

export const FrameDetailPage: React.FC<FrameDetailPageProps> = ({
  onBack,
  frame,
  user,
  theme,
  handleGoogleLogin,
  triggerToast,
  isLiked,
  likesCount,
  usagesCount,
  handleToggleLike,
  onUseFrame,
  isCustom,
  onDeleteCustomFrame,
  neonColor = '#00F0FF'
}) => {
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hearts, setHearts] = useState<{ id: number }[]>([]);
  const [commentToDelete, setCommentToDelete] = useState<string | null>(null);

  // Deretan foto aesthetic/romantis untuk preview bingkai
  const previewBgs = [
    'https://images.unsplash.com/photo-1518199266791-5375a83190b7?auto=format&fit=crop&w=600&q=80', // Pasangan pegangan tangan
    'https://images.unsplash.com/photo-1515934751635-c81c6bc9a2d8?auto=format&fit=crop&w=600&q=80', // Pernikahan romantis
    'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&w=600&q=80', // Party / neon lights
    'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&w=600&q=80', // Portrait aesthetic
  ];
  const [activePreviewBgIndex, setActivePreviewBgIndex] = useState(0);
  const [isPreviewBgActive, setIsPreviewBgActive] = useState(true);

  // Real-time Firestore snapshot for this specific frame ID
  useEffect(() => {
    if (!frame?.id) return;

    try {
      const q = query(
        collection(db, 'qcc_comments'),
        where('targetId', '==', frame.id),
        where('targetType', '==', 'frame'),
        orderBy('createdAt', 'asc')
      );

      const unsubscribe = onSnapshot(q, (snapshot) => {
        const fetched: any[] = [];
        snapshot.forEach((docSnap) => {
          fetched.push({ id: docSnap.id, ...docSnap.data() });
        });
        setComments(fetched);
      }, (err) => {
        console.warn("Firestore frame comments snapshot error:", err);
      });

      return () => unsubscribe();
    } catch (e) {
      console.error("Gagal mendeteksi komentar bingkai:", e);
    }
  }, [frame?.id]);

  if (!frame) return null;

  const handleLikeClick = () => {
    handleToggleLike(frame.id);
    const id = Date.now();
    setHearts(prev => [...prev, { id }]);
    setTimeout(() => {
      setHearts(prev => prev.filter(h => h.id !== id));
    }, 1000);
  };

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      triggerToast("Silakan masuk menggunakan akun Google Anda terlebih dahulu ya sayang. 🔐");
      return;
    }
    if (!newComment.trim()) return;

    setIsSubmitting(true);
    try {
      await addDoc(collection(db, 'qcc_comments'), {
        targetId: frame.id,
        targetType: 'frame',
        targetName: cleanFrameName(frame.name),
        comment: newComment.trim(),
        userId: user.uid,
        userName: user.displayName || 'Baim Gg',
        userPhoto: user.photoURL || '',
        createdAt: serverTimestamp()
      });
      setNewComment('');
      triggerToast("Komentar manismu berhasil dikirim ke awan! 💬💕");
    } catch (err) {
      console.error("Gagal mengirim komentar:", err);
      triggerToast("Duh sayang, gagal mengirim komentar. Coba lagi ya.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteComment = (commentId: string) => {
    if (!user) return;
    setCommentToDelete(commentId);
  };

  const confirmDeleteComment = async () => {
    if (!commentToDelete) return;
    try {
      await deleteDoc(doc(db, 'qcc_comments', commentToDelete));
      triggerToast("Komentar terhapus dengan sukses! 🗑️");
    } catch (err) {
      console.error("Gagal menghapus komentar:", err);
      triggerToast("Gagal menghapus komentar.");
    } finally {
      setCommentToDelete(null);
    }
  };

  return (
    <div className="flex-1 w-full max-w-6xl mx-auto p-0 sm:p-6 lg:p-8 space-y-4 sm:space-y-6 relative select-none">
      {/* Dynamic Floating Hearts */}
      <AnimatePresence>
        {hearts.map(h => (
          <motion.div
            key={h.id}
            initial={{ opacity: 1, y: 0, x: '50%', scale: 0.5 }}
            animate={{ 
              opacity: [0, 1, 0], 
              y: -250, 
              x: `${50 + (Math.random() - 0.5) * 80}%`, 
              scale: [0.5, 1.8, 2.2] 
            }}
            transition={{ duration: 1.2, ease: "easeOut" }}
            exit={{ opacity: 0 }}
            className="fixed bottom-20 left-1/2 text-4xl pointer-events-none z-[60] text-rose-500 font-bold"
          >
            ❤
          </motion.div>
        ))}
      </AnimatePresence>

      {/* Back Navigation Bar with romantic touch */}
      <div className="flex flex-row justify-between items-center pb-4 border-b border-rose-500/10 px-4 sm:px-0 pt-4 sm:pt-0">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-2 px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl bg-white/5 hover:bg-rose-500/10 text-zinc-300 hover:text-rose-450 border border-white/10 hover:border-rose-500/30 transition-all font-mono text-[10px] tracking-widest uppercase font-extrabold cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4 text-[#00F0FF]" />
          KEMBALI KE DAFTAR BINGKAI
        </button>
      </div>

      {/* Main Single Page Grid Layout - Inspired by Instagram Web Viewport */}
      <div className={`grid grid-cols-1 lg:grid-cols-12 gap-0 rounded-none sm:rounded-3xl border-x-0 sm:border overflow-hidden shadow-2xl transition-all duration-300 ${
        theme === 'dark' 
          ? 'bg-[#0a0a0c] border-white/10 text-zinc-100 shadow-black/80' 
          : 'bg-white border-zinc-200 text-zinc-800 shadow-zinc-300/40'
      }`}>
        
        {/* LEFT COLUMN: Premium High-Fidelity Frame Preview (Aspect Square) */}
        <div className={`lg:col-span-7 flex flex-col justify-center items-center relative group min-h-[350px] sm:min-h-[500px] lg:min-h-[600px] ${
          theme === 'dark' ? 'bg-zinc-950' : 'bg-zinc-50'
        }`}>

          <div 
            onDoubleClick={handleLikeClick}
            className="w-full flex-1 flex flex-col items-center justify-center relative cursor-pointer overflow-hidden p-4 sm:p-6 select-none"
            title="Ketuk dua kali untuk menyukai bingkai romantis ini! ❤"
          >
            {/* Visual Frame Render Area */}
            <div className="aspect-square w-full max-w-[420px] rounded-2xl bg-zinc-950 overflow-hidden border border-white/10 relative shadow-2xl flex items-center justify-center">
              <div className="scanlines absolute inset-0 opacity-10 pointer-events-none z-20" />
              
              {/* Wallpaper / Foto Latar Belakang Objek (Full Bleed) */}
              {isPreviewBgActive ? (
                <div className="absolute inset-0 w-full h-full overflow-hidden transition-all duration-300">
                  <img
                    src={previewBgs[activePreviewBgIndex]}
                    alt="Pratinjau Foto Latar Belakang"
                    className="w-full h-full object-cover opacity-85 transition-all duration-300"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-black/25 pointer-events-none" />
                </div>
              ) : (
                <div className="absolute inset-0 bg-[#070709] transition-all duration-300" />
              )}

              {/* Bingkai Utama yang Bertumpuk Presisi di Atas Foto */}
              <div className="absolute inset-0 p-6 pointer-events-none z-10 flex items-center justify-center">
                {frame.renderSvg ? (
                  <div
                    className="w-full h-full scale-100 flex items-center justify-center"
                    dangerouslySetInnerHTML={{ __html: ensureFullSvg(frame.renderSvg(neonColor)) }}
                  />
                ) : frame.src ? (
                  <LazyImage
                    src={resolveApiUrl(frame.src)}
                    alt={cleanFrameName(frame.name)}
                    className="w-full h-full object-contain filter brightness-95 bg-transparent"
                  />
                ) : null}
              </div>
              
              {/* Double click big heart splash overlay */}
              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-active:opacity-100 pointer-events-none transition-opacity duration-200 z-30">
                <span className="text-8xl text-rose-600/60 drop-shadow-lg scale-110">❤</span>
              </div>
            </div>
            
            {/* Interactive Preview Controller Bar */}
            <div className={`mt-3 flex items-center gap-2 p-1.5 rounded-xl border ${
              theme === 'dark' ? 'bg-black/40 border-white/5' : 'bg-white border-zinc-200 shadow-sm'
            }`}>
              {/* Toggle On Off Background */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsPreviewBgActive(!isPreviewBgActive);
                }}
                className={`p-1.5 rounded-lg transition-all flex items-center gap-1.5 font-mono text-[9px] font-bold tracking-wider uppercase cursor-pointer ${
                  isPreviewBgActive 
                    ? 'bg-rose-500/10 text-rose-450 hover:bg-rose-500/20' 
                    : 'bg-zinc-800 text-zinc-500 hover:text-white'
                }`}
                title={isPreviewBgActive ? "Sembunyikan foto contoh" : "Tampilkan foto contoh"}
              >
                {isPreviewBgActive ? (
                  <>
                    <EyeOff className="w-3 h-3 text-rose-500" />
                    <span>FOTO ON</span>
                  </>
                ) : (
                  <>
                    <Eye className="w-3 h-3 text-zinc-400" />
                    <span>FOTO OFF</span>
                  </>
                )}
              </button>

              <div className={`h-4 w-[1px] ${theme === 'dark' ? 'bg-white/10' : 'bg-zinc-200'}`} />

              {/* Quick Preset Selector */}
              <div className="flex items-center gap-1">
                {previewBgs.map((bgUrl, idx) => (
                  <button
                    key={idx}
                    type="button"
                    disabled={!isPreviewBgActive}
                    onClick={(e) => {
                      e.stopPropagation();
                      setActivePreviewBgIndex(idx);
                    }}
                    className={`h-5 w-5 rounded-full overflow-hidden border transition-all cursor-pointer disabled:opacity-20 disabled:pointer-events-none ${
                      activePreviewBgIndex === idx && isPreviewBgActive
                        ? 'border-rose-500 scale-110 ring-2 ring-rose-500/20' 
                        : 'border-white/10 opacity-60 hover:opacity-100'
                    }`}
                    title={`Pilih foto contoh latar belakang ${idx + 1}`}
                  >
                    <img src={bgUrl} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Render Details bottom bar overlay */}
          <div className="absolute bottom-4 left-4 z-10 bg-black/70 backdrop-blur-md px-3 py-1 rounded-lg border border-white/10 font-mono text-[9px] text-zinc-300 tracking-wider">
            TIPE: <span className="text-[#00F0FF] font-bold">{frame.renderSvg ? 'SVG kustom' : 'PNG IMAGE'}</span>
          </div>
        </div>

        {/* RIGHT COLUMN: Highly Curated Comments & Interactions Panel */}
        <div className={`lg:col-span-5 flex flex-col h-[600px] relative overflow-hidden ${
          theme === 'dark' ? 'bg-[#0f0f13]' : 'bg-zinc-50/50'
        } lg:border-l ${theme === 'dark' ? 'border-white/10' : 'border-zinc-200'}`}>
          
          {/* 1. Header of Detail Page (Minimal Info like Instagram) */}
          <div className={`p-4 border-b flex items-center justify-between shrink-0 ${
            theme === 'dark' ? 'border-white/5 bg-black/45' : 'border-zinc-200 bg-white shadow-sm'
          }`}>
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-rose-500 to-pink-500 flex items-center justify-center shadow-lg text-white">
                <Layers className="w-5 h-5 text-zinc-100" />
              </div>
              <div className="min-w-0">
                <h3 className="font-extrabold text-[12.5px] tracking-tight uppercase truncate">
                  {cleanFrameName(frame.name)}
                </h3>
                <p className="text-[9px] font-mono text-zinc-500 uppercase tracking-widest">
                  KATEGORI: {cleanFrameCategory(frame.category)}
                </p>
              </div>
            </div>

            {/* Custom Frame Delete Option if matches criteria */}
            {isCustom && onDeleteCustomFrame && (
              <button
                type="button"
                onClick={onDeleteCustomFrame}
                className="p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-500 transition-colors cursor-pointer"
                title="Hapus Bingkai"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* 1b. Stat Panel Info with likes & usage counter */}
          <div className={`px-4 py-2.5 border-b flex items-center gap-3 shrink-0 ${
            theme === 'dark' ? 'border-white/5 bg-black/20' : 'border-zinc-200 bg-zinc-50'
          }`}>
            <button
              onClick={handleLikeClick}
              className={`px-3 py-1.5 rounded-xl font-mono text-[10px] font-bold flex items-center gap-1.5 transition-all border cursor-pointer ${
                isLiked
                  ? 'bg-rose-500/20 text-rose-400 border-rose-500/30 hover:bg-rose-500/30'
                  : 'bg-zinc-950/80 text-zinc-400 border-zinc-800 hover:text-white hover:border-zinc-700'
              }`}
            >
              <Heart className={`w-3.5 h-3.5 ${isLiked ? 'fill-rose-450 text-rose-450' : ''}`} />
              <span>{likesCount} Menyukai</span>
            </button>

            <div className="px-3 py-1.5 rounded-xl bg-zinc-950/40 text-zinc-400 border border-zinc-900 font-mono text-[10px] flex items-center gap-1.5 cursor-default select-none">
              <Sliders className="w-3.5 h-3.5 text-[#00F0FF]" />
              <span>{usagesCount} Digunakan</span>
            </div>
          </div>

          {/* 2. Scrollable Real-Time Comments Stream */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin select-text">
            {comments.length === 0 ? (
              <div className="h-full flex flex-col justify-center items-center text-center p-6 text-zinc-500">
                <MessageCircle className="w-8 h-8 text-zinc-600 mb-2 opacity-50" />
                <p className="text-[12px] font-medium leading-relaxed">
                  Belum ada ulasan untuk bingkai ini.<br />Jadilah yang pertama menulis komentar manis! 💕
                </p>
              </div>
            ) : (
              comments.map((c) => {
                const isCommentAuthor = (user && (user.uid === c.userId || user.email === 'bungtemin@gmail.com')) || (auth.currentUser && (auth.currentUser.uid === c.userId || auth.currentUser.email === 'bungtemin@gmail.com'));
                return (
                  <div key={c.id} className="flex items-start gap-3 group/comment py-1.5 rounded-xl hover:bg-white/5 transition-all duration-200 px-1">
                    <img
                      referrerPolicy="no-referrer"
                      src={c.userPhoto || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=80&q=80'}
                      alt={c.userName}
                      className="w-8 h-8 rounded-full border border-rose-500/20 object-cover shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline justify-between gap-2">
                        <span className="font-extrabold text-[12px] text-zinc-200 hover:text-rose-400 transition-colors">
                          {c.userName}
                        </span>
                        <span className="text-[8.5px] font-mono text-zinc-550 uppercase">
                          {c.createdAt?.seconds 
                            ? new Date(c.createdAt.seconds * 1000).toLocaleDateString('id-ID', {day: 'numeric', month: 'short', year: 'numeric'})
                            : 'Baru'}
                        </span>
                      </div>
                      <p className={`text-[12px] font-sans mt-0.5 break-words font-medium leading-relaxed ${
                        theme === 'dark' ? 'text-zinc-300' : 'text-zinc-700'
                      }`}>
                        {c.comment}
                      </p>
                    </div>

                    {isCommentAuthor && (
                      <button
                        type="button"
                        onClick={() => handleDeleteComment(c.id)}
                        className="text-red-500 hover:text-red-400 p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 opacity-0 group-hover/comment:opacity-100 transition-all shrink-0 cursor-pointer"
                        title="Hapus Komentar"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* 3. Bottom interaction bar with Write Form OR Google Login block */}
          <div className={`p-4 border-t shrink-0 ${
            theme === 'dark' ? 'border-white/5 bg-black/45' : 'border-zinc-200 bg-white shadow-sm'
          }`}>
            {user ? (
              <form onSubmit={handleSubmitComment} className="space-y-2">
                <div className="relative flex items-center">
                  <textarea
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Tulis pendapat manis Anda untuk bingkai ini..."
                    maxLength={250}
                    rows={2}
                    className={`w-full rounded-2xl pl-4 pr-12 py-3 text-[12px] font-sans focus:outline-none focus:ring-2 focus:ring-rose-500/30 transition-all font-medium leading-relaxed resize-none min-h-[58px] ${
                      theme === 'dark' 
                        ? 'bg-zinc-950 border border-white/10 text-zinc-100 placeholder-zinc-500 focus:border-rose-500 focus:bg-black' 
                        : 'bg-white border border-zinc-300 text-zinc-900 placeholder-zinc-400 focus:border-rose-500'
                    }`}
                  />
                  <button
                    type="submit"
                    disabled={isSubmitting || !newComment.trim()}
                    className="absolute right-2 px-3.5 py-2 rounded-xl bg-gradient-to-r from-rose-500 to-pink-600 hover:to-pink-500 text-white transition-all active:scale-95 disabled:opacity-20 disabled:pointer-events-none cursor-pointer flex items-center justify-center shadow-lg shadow-rose-950/30"
                    title="Kirim Komentar"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
                <div className="flex justify-between items-center px-1">
                  <span className="text-[8.5px] text-zinc-500 font-mono tracking-wider uppercase font-medium">
                    SEBAGAI: <span className="text-rose-400 font-bold">{user.displayName}</span>
                  </span>
                  <span className="text-[8.5px] font-mono text-zinc-500 font-mediumSB">
                    {newComment.length} / 250 karakter
                  </span>
                </div>
              </form>
            ) : (
              <div className="py-3 text-center flex flex-col items-center justify-center gap-3">
                <p className="text-[11px] text-zinc-400 font-sans leading-relaxed">
                  Silakan masuk menggunakan akun Google terlebih dahulu untuk mengirim komentar ya. 💕
                </p>
                <button
                  type="button"
                  onClick={handleGoogleLogin}
                  className="px-5 py-2.5 rounded-xl bg-[#4285F4] hover:bg-[#357ae8] text-white font-extrabold font-mono text-[10px] tracking-widest uppercase transition-all flex items-center gap-2 shadow-lg shadow-blue-950/40 cursor-pointer"
                >
                  <LogIn className="w-4 h-4" /> LOGIN GOOGLE
                </button>
              </div>
            )}
          </div>

          {/* Persistent Action Bar at the very bottom: USE FRAME (GUNAKAN) */}
          <div className={`px-4 py-3 border-t flex justify-end shrink-0 ${
            theme === 'dark' ? 'border-white/5 bg-black/60' : 'border-zinc-200 bg-zinc-50 shadow-inner'
          }`}>
            <button
              type="button"
              onClick={onUseFrame}
              className="w-full py-2.5 rounded-2xl bg-gradient-to-r from-[#00F0FF] to-sky-600 hover:brightness-110 active:scale-[0.98] text-black font-extrabold font-mono text-[11px] tracking-widest transition-all uppercase shadow-lg shadow-cyan-950/20"
            >
              GUNAKAN BINGKAI INI DI CANVAS
            </button>
          </div>
        </div>
      </div>

      <DeleteConfirmationModal 
        isOpen={commentToDelete !== null}
        onClose={() => setCommentToDelete(null)}
        onConfirm={confirmDeleteComment}
        title="Hapus Komentar 💬?"
        message="Sayang, yakin ingin menghapus komentar ini? Tindakan ini tidak bisa dibatalkan ya. 💕"
      />
    </div>
  );
};
