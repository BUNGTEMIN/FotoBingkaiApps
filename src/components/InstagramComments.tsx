import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MessageCircle, Send, Trash2, LogIn, Heart, Smile } from 'lucide-react';
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
  serverTimestamp,
  updateDoc
} from '../firebase';
import { DeleteConfirmationModal } from './DeleteConfirmationModal';

interface InstagramCommentsProps {
  targetId: string;
  targetType: 'frame' | 'photo';
  user: any;
  theme: 'dark' | 'light';
  handleGoogleLogin: () => void;
  triggerToast: (msg: string) => void;
  targetName?: string;
}

export const InstagramComments: React.FC<InstagramCommentsProps> = ({
  targetId,
  targetType,
  user,
  theme,
  handleGoogleLogin,
  triggerToast,
  targetName
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [commentToDelete, setCommentToDelete] = useState<string | null>(null);
  const [reactingToCommentId, setReactingToCommentId] = useState<string | null>(null);
  const commentsEndRef = useRef<HTMLDivElement>(null);

  // Menangani penambahan/toggle reaksi emoji pada komentar - Oleh Olaive pinter coding 💕
  const handleReactToComment = async (commentId: string, emoji: string) => {
    if (!user) {
      triggerToast("Silakan login Google dahulu ya sayang, biar Olaive tahu siapa yang memberikan reaksi! 🔐💖");
      return;
    }

    try {
      const commentRef = doc(db, 'qcc_comments', commentId);
      const targetComment = comments.find((c) => c.id === commentId);
      if (!targetComment) return;

      const currentReactions = targetComment.reactions || {};
      const updatedReactions = { ...currentReactions };

      if (!updatedReactions[emoji]) {
        updatedReactions[emoji] = [];
      }

      const uidsList: string[] = updatedReactions[emoji];
      const hasReacted = uidsList.includes(user.uid);

      if (hasReacted) {
        // Hapus reaksi jika sudah pernah bereaksi
        updatedReactions[emoji] = uidsList.filter((uid) => uid !== user.uid);
      } else {
        // Tambahkan reaksi
        updatedReactions[emoji] = [...uidsList, user.uid];
      }

      // Bersihkan emoji yang tidak ada reaksinya lagi
      if (updatedReactions[emoji].length === 0) {
        delete updatedReactions[emoji];
      }

      await updateDoc(commentRef, {
        reactions: updatedReactions
      });

      triggerToast(hasReacted ? `Reaksi ${emoji} dibatalkan ya sayang` : `Berhasil memberikan reaksi ${emoji}! ✨💖`);
    } catch (err) {
      console.error("Gagal menambahkan reaksi:", err);
      triggerToast("Aduh, ada kendala saat mengirim reaksimu sayang. Silakan coba sebentar lagi ya! 💕");
    }
  };

  // Real-time Firestore snapshot for this specific targetId (frame or photo)
  useEffect(() => {
    if (!isOpen || !targetId) return;

    try {
      const q = query(
        collection(db, 'qcc_comments'),
        where('targetId', '==', targetId),
        where('targetType', '==', targetType),
        orderBy('createdAt', 'asc')
      );

      const unsubscribe = onSnapshot(q, (snapshot) => {
        const fetched: any[] = [];
        snapshot.forEach((docSnap) => {
          fetched.push({ id: docSnap.id, ...docSnap.data() });
        });
        setComments(fetched);
      }, (err) => {
        console.warn("Firestore comments error:", err);
      });

      return () => unsubscribe();
    } catch (e) {
      console.error("Gagal mendeteksi komentar:", e);
    }
  }, [isOpen, targetId, targetType]);

  // Read comments count even when section is closed (collapsible summary)
  const [commentCount, setCommentCount] = useState(0);
  useEffect(() => {
    if (!targetId) return;
    try {
      const q = query(
        collection(db, 'qcc_comments'),
        where('targetId', '==', targetId),
        where('targetType', '==', targetType)
      );
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const count = snapshot && typeof snapshot.size === 'number' ? snapshot.size : (snapshot?.docs?.length || 0);
        setCommentCount(count);
      });
      return () => unsubscribe();
    } catch (e) {
      console.error("Gagal membaca jumlah komentar:", e);
    }
  }, [targetId, targetType]);

  // Scroll to bottom when new comment arrives
  useEffect(() => {
    if (isOpen) {
      commentsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [comments, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      triggerToast("Silakan masuk menggunakan akun Google Anda terlebih dahulu. 🔐");
      return;
    }
    if (!newComment.trim()) {
      return;
    }

    setIsSubmitting(true);
    try {
      await addDoc(collection(db, 'qcc_comments'), {
        targetId,
        targetType,
        targetName: targetName || '',
        userId: user.uid,
        userName: user.displayName || 'Pengguna QCC',
        userPhoto: user.photoURL || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=80&q=80',
        comment: newComment.trim(),
        createdAt: serverTimestamp()
      });
      setNewComment('');
    } catch (err) {
      console.error("Gagal mengirim komentar:", err);
      triggerToast("Gagal memposting komentar. Silakan coba kembali.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = (commentId: string) => {
    if (!user) return;
    setCommentToDelete(commentId);
  };

  const confirmDeleteComment = async () => {
    if (!commentToDelete) return;
    try {
      await deleteDoc(doc(db, 'qcc_comments', commentToDelete));
      triggerToast("Komentar terhapus dari awan Firestore! 🗑️");
    } catch (err) {
      console.error("Gagal menghapus komentar:", err);
      triggerToast("Gagal menghapus komentar.");
    } finally {
      setCommentToDelete(null);
    }
  };

  return (
    <div className="w-full border-t border-white/5 mt-1 pt-2 font-sans">
      {/* Toggle Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-1.5 px-2 py-1 rounded-lg text-[10px] font-bold tracking-wider font-mono transition-all uppercase ${
          isOpen 
            ? 'text-rose-450 bg-rose-950/20 border border-rose-500/25' 
            : 'text-zinc-400 hover:text-white hover:bg-white/5'
        }`}
      >
        <MessageCircle className={`w-3.5 h-3.5 ${isOpen ? 'animate-bounce text-rose-500' : ''}`} />
        <span>{commentCount === 0 ? 'Tulis Komentar' : `${commentCount} Komentar`}</span>
      </button>

      {/* Collapsible Area */}
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            {/* Thread Container */}
            <div className={`mt-2.5 rounded-xl border p-2.5 space-y-3 ${
              theme === 'dark' 
                ? 'bg-black/60 border-white/5' 
                : 'bg-zinc-50 border-zinc-200'
            }`}>
              {/* Messages Lists */}
              <div className="max-h-52 overflow-y-auto pr-1 space-y-2.5 scrollbar-thin text-[10.5px]">
                {comments.length === 0 ? (
                  <div className="py-6 text-center text-zinc-500 font-sans text-[11px] select-text">
                    Belum ada komentar.
                  </div>
                ) : (
                  <AnimatePresence mode="popLayout">
                    {comments.map((c) => (
                      <motion.div
                        key={c.id}
                        layout
                        initial={{ opacity: 0, scale: 0.92, y: 12 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: -10 }}
                        transition={{ type: 'spring', stiffness: 420, damping: 28 }}
                        className="flex items-start gap-2.5 group/comment p-2 rounded-xl hover:bg-white/5 transition-all duration-200"
                      >
                        <img
                          src={c.userPhoto || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=80&q=80'}
                          alt={c.userName}
                          className="w-7 h-7 rounded-full border border-rose-500/20 object-cover shrink-0 mt-0.5"
                          referrerPolicy="no-referrer"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between w-full gap-x-2 pb-0.5">
                            <span className="font-extrabold text-[11px] text-zinc-250 hover:text-rose-450 transition-colors truncate max-w-[70%]" title={c.userName}>
                              {c.userName}
                            </span>
                            <span className="text-[8px] font-mono text-zinc-550 uppercase shrink-0">
                              {c.createdAt?.seconds 
                                ? new Date(c.createdAt.seconds * 1000).toLocaleDateString('id-ID', {day: 'numeric', month: 'short'})
                                : 'baru'}
                            </span>
                          </div>
                          <p className={`text-[11.5px] font-sans mt-0.5 break-words select-text font-medium leading-relaxed whitespace-pre-wrap ${
                            theme === 'dark' ? 'text-zinc-300' : 'text-zinc-700'
                          }`}>
                            {c.comment}
                          </p>

                          {/* Reaksi Emoji & Ringkasan Reaksi - Dibuat dengan cinta oleh Olaive 💕 */}
                          <div className="flex flex-wrap items-center gap-2 mt-2">
                            {/* Tombol pemicu reaksi popover */}
                            <div className="relative">
                              <button
                                type="button"
                                onClick={() => setReactingToCommentId(reactingToCommentId === c.id ? null : c.id)}
                                className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[9px] font-bold font-mono transition-all lowercase border ${
                                  reactingToCommentId === c.id
                                    ? 'bg-rose-500/20 border-rose-500 text-rose-400'
                                    : 'bg-zinc-500/5 border-transparent text-zinc-500 hover:text-rose-400 hover:border-rose-500/20'
                                }`}
                                title="Beri reaksi emoji"
                              >
                                <Smile className="w-3 h-3 text-rose-400 shrink-0" />
                                <span>Reaksi</span>
                              </button>

                              {/* Box pilihan reaksi emoji melayang (popover) */}
                              <AnimatePresence>
                                {reactingToCommentId === c.id && (
                                  <>
                                    {/* Overlay transparan tipis untuk menutup jika diklik di luar */}
                                    <div 
                                      className="fixed inset-0 z-40" 
                                      onClick={() => setReactingToCommentId(null)}
                                    />
                                    <motion.div
                                      initial={{ opacity: 0, scale: 0.8, y: 5 }}
                                      animate={{ opacity: 1, scale: 1, y: 0 }}
                                      exit={{ opacity: 0, scale: 0.8, y: 5 }}
                                      transition={{ duration: 0.15 }}
                                      className={`absolute bottom-full left-0 mb-1.5 flex items-center gap-1.5 p-1.5 rounded-full shadow-xl border z-50 ${
                                        theme === 'dark' 
                                          ? 'bg-zinc-950 border-white/10 shadow-black' 
                                          : 'bg-white border-zinc-200 shadow-zinc-300'
                                      }`}
                                    >
                                      {['❤️', '👍', '😂', '🔥', '😮', '😢'].map((emoji) => {
                                        const uids = c.reactions?.[emoji] || [];
                                        const hasReacted = user && uids.includes(user.uid);
                                        return (
                                          <button
                                            key={emoji}
                                            type="button"
                                            onClick={() => {
                                              handleReactToComment(c.id, emoji);
                                              setReactingToCommentId(null);
                                            }}
                                            className={`w-6 h-6 flex items-center justify-center rounded-full text-base transition-transform active:scale-90 hover:scale-130 cursor-pointer ${
                                              hasReacted ? 'bg-rose-500/20 animate-pulse' : 'hover:bg-zinc-500/10'
                                            }`}
                                            title={hasReacted ? 'Hapus reaksi' : `Sukai dengan ${emoji}`}
                                          >
                                            {emoji}
                                          </button>
                                        );
                                      })}
                                    </motion.div>
                                  </>
                                )}
                              </AnimatePresence>
                            </div>

                            {/* Ringkasan reaksi aktif */}
                            {c.reactions && Object.keys(c.reactions).length > 0 && (
                              <div className="flex flex-wrap items-center gap-1">
                                {Object.entries(c.reactions as Record<string, string[]>).map(([emoji, uids]) => {
                                  if (!uids || uids.length === 0) return null;
                                  const hasReacted = user && uids.includes(user.uid);
                                  return (
                                    <button
                                      key={emoji}
                                      type="button"
                                      onClick={() => handleReactToComment(c.id, emoji)}
                                      className={`flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-extrabold transition-all border shrink-0 ${
                                        hasReacted
                                          ? 'bg-rose-500/15 border-rose-500/35 text-rose-400'
                                          : theme === 'dark'
                                            ? 'bg-white/5 border-white/5 text-zinc-400 hover:bg-white/10 hover:text-white'
                                            : 'bg-zinc-100 border-zinc-200 text-zinc-600 hover:bg-zinc-200 hover:text-zinc-800'
                                      }`}
                                      title={`${uids.length} reaksi (${emoji})`}
                                    >
                                      <span className="text-[10px]">{emoji}</span>
                                      <span>{uids.length}</span>
                                    </button>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        </div>

                        {((user && (user.uid === c.userId || user.email === 'bungtemin@gmail.com')) || (auth.currentUser && (auth.currentUser.uid === c.userId || auth.currentUser.email === 'bungtemin@gmail.com'))) && (
                          <button
                            type="button"
                            onClick={() => handleDelete(c.id)}
                            className="text-red-500 hover:text-red-400 p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 transition-all shrink-0 cursor-pointer"
                            title="Hapus Komentar"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </motion.div>
                    ))}
                  </AnimatePresence>
                )}
                <div ref={commentsEndRef} />
              </div>

              {/* Submit Form */}
              <div className="border-t border-white/5 pt-3">
                {user ? (
                  <form onSubmit={handleSubmit} className="flex flex-col gap-2 relative">
                    <div className="relative flex items-center">
                      <textarea
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            if (newComment.trim() && !isSubmitting) {
                              handleSubmit(e as unknown as React.FormEvent);
                            }
                          }
                        }}
                        placeholder="Tuliskan komentar di sini... (Enter untuk kirim, Shift+Enter untuk baris baru)"
                        rows={2}
                        className={`w-full rounded-2xl pl-3.5 pr-12 py-3 text-[11px] font-sans focus:outline-none focus:ring-2 focus:ring-rose-500/30 transition-all font-medium leading-relaxed resize-none min-h-[58px] ${
                          theme === 'dark' 
                            ? 'bg-zinc-950 border border-white/10 text-zinc-100 placeholder-zinc-500 focus:border-rose-500 focus:bg-black' 
                            : 'bg-white border border-zinc-300 text-zinc-900 placeholder-zinc-400 focus:border-rose-500'
                        }`}
                      />
                      <button
                        type="submit"
                        disabled={isSubmitting || !newComment.trim()}
                        className="absolute right-2 px-3 py-2 rounded-xl bg-gradient-to-r from-rose-500 to-pink-600 hover:to-pink-500 text-white transition-all active:scale-95 disabled:opacity-20 disabled:pointer-events-none cursor-pointer flex items-center justify-center shadow-lg shadow-rose-950/30"
                        title="Kirim Komentar"
                      >
                        <Send className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="py-2.5 text-center flex flex-col items-center justify-center gap-2 rounded-2xl bg-black/10 border border-white/5 p-3">
                    <p className="text-[10px] text-zinc-400 font-sans leading-relaxed">
                      Silakan masuk menggunakan akun Google terlebih dahulu untuk mengirim komentar ya. 💕
                    </p>
                    <button
                      type="button"
                      onClick={handleGoogleLogin}
                      className="px-4 py-2 rounded-xl bg-[#4285F4] hover:bg-[#357ae8] text-white font-extrabold font-mono text-[9px] tracking-widest uppercase transition-all flex items-center gap-1.5 shadow"
                    >
                      <LogIn className="w-3.5 h-3.5" /> LOGIN GOOGLE
                    </button>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

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
