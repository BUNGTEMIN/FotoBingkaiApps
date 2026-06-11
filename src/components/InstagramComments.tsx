import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MessageCircle, Send, Trash2, LogIn, Heart } from 'lucide-react';
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
  const commentsEndRef = useRef<HTMLDivElement>(null);

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

  const handleDelete = async (commentId: string) => {
    if (!user) return;
    if (confirm("Hapus komentar Anda ini? 🥺")) {
      try {
        await deleteDoc(doc(db, 'qcc_comments', commentId));
        triggerToast("Komentar terhapus dari awan Firestore! 🗑️");
      } catch (err) {
        console.error("Gagal menghapus komentar:", err);
        triggerToast("Gagal menghapus komentar.");
      }
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
            ? 'text-neon-cyan bg-cyan-950/20' 
            : 'text-zinc-400 hover:text-white hover:bg-white/5'
        }`}
      >
        <MessageCircle className={`w-3.5 h-3.5 ${isOpen ? 'animate-bounce text-neon-cyan' : ''}`} />
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
              <div className="max-h-40 overflow-y-auto pr-1 space-y-2.5 scrollbar-thin text-[10.5px]">
                {comments.length === 0 ? (
                  <div className="py-4 text-center text-zinc-550 font-mono text-[9px] uppercase tracking-wider">
                    Belum ada ulasan komentar. ✍️
                  </div>
                ) : (
                  comments.map((c) => (
                    <div key={c.id} className="flex items-start gap-2 group/comitem">
                      <img
                        src={c.userPhoto || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=40&q=40'}
                        alt={c.userName}
                        className="w-5 h-5 rounded-full border border-white/10 shrink-0 object-cover"
                        referrerPolicy="no-referrer"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-baseline flex-wrap gap-x-1.5">
                          <span className="font-extrabold text-zinc-200 text-[10px]">
                            {c.userName}
                          </span>
                          <span className="text-[7.5px] font-mono text-zinc-550 uppercase">
                            {c.createdAt?.seconds 
                              ? new Date(c.createdAt.seconds * 1000).toLocaleDateString('id-ID', {day: 'numeric', month: 'short'})
                              : 'baru'}
                          </span>
                        </div>
                        <p className="text-zinc-400 font-sans mt-0.5 break-words select-text">
                          {c.comment}
                        </p>
                      </div>

                      {((user && (user.uid === c.userId || user.email === 'bungtemin@gmail.com')) || (auth.currentUser && (auth.currentUser.uid === c.userId || auth.currentUser.email === 'bungtemin@gmail.com'))) && (
                        <button
                          type="button"
                          onClick={() => handleDelete(c.id)}
                          className="text-red-500 hover:text-red-400 p-1 rounded-lg bg-red-500/10 hover:bg-red-500/20 transition-all shrink-0 cursor-pointer"
                          title="Hapus Komentar"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  ))
                )}
                <div ref={commentsEndRef} />
              </div>

              {/* Submit Form */}
              <div className="border-t border-white/5 pt-2">
                {user ? (
                  <form onSubmit={handleSubmit} className="flex gap-2">
                    <textarea
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      placeholder="Bagikan komentar Anda di sini..."
                      maxLength={250}
                      rows={2}
                      className="flex-1 bg-zinc-950/80 border border-white/10 rounded-lg px-2.5 py-1.5 text-[10.5px] text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-neon-cyan focus:ring-1 focus:ring-neon-cyan/20 transition-all font-sans resize-none min-h-[50px] leading-relaxed"
                    />
                    <button
                      type="submit"
                      disabled={isSubmitting || !newComment.trim()}
                      className="p-2 rounded-lg bg-neon-cyan hover:bg-neon-cyan/80 text-black transition-all active:scale-95 disabled:opacity-30 disabled:pointer-events-none cursor-pointer shrink-0 self-end flex items-center justify-center"
                    >
                      <Send className="w-3.5 h-3.5" />
                    </button>
                  </form>
                ) : (
                  <div className="py-1.5 text-center flex flex-col items-center justify-center gap-1.5">
                    <p className="text-[9.5px] text-zinc-500 font-sans">
                      Masuk menggunakan akun Google diperbolehkan untuk meninggalkan komentar. 🔐
                    </p>
                    <button
                      type="button"
                      onClick={handleGoogleLogin}
                      className="px-3 py-1 rounded bg-[#4285F4] hover:bg-[#357ae8] text-white font-black font-mono text-[8px] tracking-widest uppercase transition-all flex items-center gap-1"
                    >
                      <LogIn className="w-2.5 h-2.5" /> LOGIN GOOGLE
                    </button>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
