import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, Heart, MessageCircle, Trash2, LogIn, Send, Share2, Check } from 'lucide-react';
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
import { filterInappropriateText, hasInappropriateWords } from '../textFilter';

interface PhotoDetailPageProps {
  onBack: () => void;
  item: any;
  user: any;
  theme: 'dark' | 'light';
  handleGoogleLogin: () => void;
  triggerToast: (msg: string) => void;
  onLike: () => void;
  matchesUser: boolean;
  onDelete?: () => void;
}

export const PhotoDetailPage: React.FC<PhotoDetailPageProps> = ({
  onBack,
  item,
  user,
  theme,
  handleGoogleLogin,
  triggerToast,
  onLike,
  matchesUser,
  onDelete
}) => {
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hearts, setHearts] = useState<{ id: number }[]>([]);
  const [commentToDelete, setCommentToDelete] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleShareClick = () => {
    const shareUrl = `${window.location.origin}/?select_photo=${item.id}`;
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(shareUrl)
        .then(() => {
          setCopied(true);
          triggerToast("Tautan karya berhasil disalin ke clipboard! Bagikan kreasi indah ini ya sayang ✨💕");
          setTimeout(() => setCopied(false), 3000);
        })
        .catch((err) => {
          console.error("Gagal menyalin tautan:", err);
          triggerToast("Gagal menyalin tautan.");
        });
    } else {
      try {
        const tempInput = document.createElement("input");
        tempInput.value = shareUrl;
        document.body.appendChild(tempInput);
        tempInput.select();
        document.execCommand("copy");
        document.body.removeChild(tempInput);
        setCopied(true);
        triggerToast("Tautan karya berhasil disalin! ✨💕");
        setTimeout(() => setCopied(false), 3000);
      } catch (e) {
        triggerToast("Gagal menyalin tautan.");
      }
    }
  };

  // Real-time Firestore snapshot for this specific photo ID
  useEffect(() => {
    if (!item?.id) return;

    try {
      const q = query(
        collection(db, 'qcc_comments'),
        where('targetId', '==', item.id),
        where('targetType', '==', 'photo'),
        orderBy('createdAt', 'asc')
      );

      const unsubscribe = onSnapshot(q, (snapshot) => {
        const fetched: any[] = [];
        snapshot.forEach((docSnap) => {
          fetched.push({ id: docSnap.id, ...docSnap.data() });
        });
        setComments(fetched);
      }, (err) => {
        console.warn("Firestore comments snapshot error:", err);
      });

      return () => unsubscribe();
    } catch (e) {
      console.error("Gagal mendeteksi komentar:", e);
    }
  }, [item?.id]);

  if (!item) return null;

  const handleLikeClick = () => {
    onLike();
    const id = Date.now();
    setHearts(prev => [...prev, { id }]);
    setTimeout(() => {
      setHearts(prev => prev.filter(h => h.id !== id));
    }, 1000);
  };

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      triggerToast("Silakan masuk menggunakan akun Google Anda terlebih dahulu. 🔐");
      return;
    }
    const trimmedInput = newComment.trim();
    if (!trimmedInput) return;

    const containsBadWords = hasInappropriateWords(trimmedInput);
    const filteredComment = filterInappropriateText(trimmedInput);

    setIsSubmitting(true);
    try {
      await addDoc(collection(db, 'qcc_comments'), {
        targetId: item.id,
        targetType: 'photo',
        targetName: item.fileName || 'Karya Foto',
        userId: user.uid,
        userName: user.displayName || 'Pengguna QCC',
        userPhoto: user.photoURL || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=80&q=80',
        comment: filteredComment,
        photoOwnerId: item.userId || '',
        photoImageUrl: item.imageUrl || item.src || '',
        createdAt: serverTimestamp()
      });
      setNewComment('');
      
      if (containsBadWords) {
        triggerToast("Komentarmu telah disaring demi menjaga kesopanan komersial ya sayang! Terima kasih sudah bijak bersosial media ✨💕");
      }
    } catch (err) {
      console.error("Gagal mengirim komentar:", err);
      triggerToast("Gagal mengirimkan komentar. Silakan coba kembali.");
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
      triggerToast("Komentar terhapus dari cloud database! 🗑️");
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
          <ArrowLeft className="w-4 h-4 text-neon-cyan" />
          KEMBALI KE GALERI
        </button>
      </div>

      {/* Main Single Page Grid Layout - Inspired by Instagram Web Viewport */}
      <div className={`grid grid-cols-1 lg:grid-cols-12 gap-0 rounded-none sm:rounded-3xl border-x-0 sm:border overflow-hidden shadow-2xl transition-all duration-300 ${
        theme === 'dark' 
          ? 'bg-[#0a0a0c] border-white/10 text-zinc-100 shadow-black/80' 
          : 'bg-white border-zinc-200 text-zinc-800 shadow-zinc-300/40'
      }`}>
        
        {/* LEFT COLUMN: Premium High-Fidelity Photo Preview (Aspect Square or fit) */}
        <div className={`lg:col-span-7 flex flex-col justify-center items-center relative group min-h-[350px] sm:min-h-[500px] lg:min-h-[600px] ${
          theme === 'dark' ? 'bg-zinc-950' : 'bg-zinc-50'
        }`}>

          <div 
            onDoubleClick={handleLikeClick}
            className="w-full h-full flex items-center justify-center relative cursor-pointer overflow-hidden p-4 select-none"
            title="Ketuk dua kali untuk menyukai karya romantis ini! ❤"
          >
            <img
              src={item.imageUrl}
              alt={item.fileName || 'Karya Foto'}
              className="max-w-full max-h-[550px] object-contain rounded-xl shadow-lg transition-transform duration-500 hover:scale-[1.01]"
            />
            
            {/* Double click big heart splash overlay */}
            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-active:opacity-100 pointer-events-none transition-opacity duration-200">
              <span className="text-8xl text-rose-600/60 drop-shadow-lg scale-110">❤</span>
            </div>
          </div>

          {/* Format details bottom bar overlay */}
          <div className="absolute bottom-4 left-4 z-10 bg-black/70 backdrop-blur-md px-3 py-1 rounded-lg border border-white/10 font-mono text-[9px] text-zinc-300 tracking-wider">
            FORMAT: <span className="text-neon-cyan font-bold">{item.format ? item.format.toUpperCase() : 'JPG'}</span>
          </div>
        </div>

        {/* RIGHT COLUMN: Highly Curated Comments & Interactions Panel */}
        <div className={`lg:col-span-5 flex flex-col h-[600px] relative overflow-hidden ${
          theme === 'dark' ? 'bg-[#0f0f13]' : 'bg-zinc-50/50'
        } lg:border-l ${theme === 'dark' ? 'border-white/10' : 'border-zinc-200'}`}>
          
          {/* 1. Header of Detail Page (Minimal Profile Info like Instagram) */}
          <div className={`p-4 border-b flex items-center justify-between shrink-0 ${
            theme === 'dark' ? 'border-white/5 bg-black/45' : 'border-zinc-200 bg-white shadow-sm'
          }`}>
            <div className="flex items-center gap-3 min-w-0">
              <div className="relative">
                <img
                  referrerPolicy="no-referrer"
                  src={item.userAvatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=80&q=80'}
                  alt={item.userName || 'User'}
                  className="w-9 h-9 rounded-full border-2 border-rose-500/30 object-cover"
                />
                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-zinc-900 rounded-full" />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="font-sans font-bold text-[12.5px] leading-tight tracking-wide flex items-center gap-1">
                  {item.userName}
                </span>
                <span className="text-[9px] font-mono text-zinc-500 uppercase">
                  {item.downloadedAt || 'Baru Saja'}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={handleShareClick}
                className={`flex items-center gap-1.2 sm:gap-1.5 px-2.5 py-1.5 sm:px-3 sm:py-1.5 rounded-full border text-[10.5px] sm:text-[11px] font-bold active:scale-95 transition-all cursor-pointer shadow-md shrink-0 ${
                  copied 
                    ? 'border-green-500/30 bg-green-500/10 text-green-500 hover:bg-green-500/15'
                    : 'border-rose-500/25 bg-rose-500/5 text-rose-500 hover:bg-rose-500/10'
                }`}
                title="Salin Tautan Langsung Karya"
              >
                {copied ? <Check className="w-3.5 h-3.5 animate-pulse" /> : <Share2 className="w-3.5 h-3.5" />}
                <span className="font-mono">
                  {copied ? 'Tersalin' : 'Salin Tautan'}
                </span>
              </button>

              <button
                type="button"
                onClick={handleLikeClick}
                className="flex items-center gap-1.5 px-2.5 py-1.5 sm:px-3 sm:py-1.5 rounded-full border border-rose-500/25 bg-rose-500/5 text-rose-500 hover:bg-rose-500/10 font-bold active:scale-95 transition-all cursor-pointer shadow-md shadow-rose-950/10 shrink-0"
                title="Ketuk untuk menyukai! ❤"
              >
                <Heart className="w-3.5 h-3.5 fill-rose-500 text-rose-500 animate-pulse" />
                <span className={`font-mono text-[10.5px] sm:text-[11px] ${theme === 'dark' ? 'text-zinc-300' : 'text-zinc-700'}`}>
                  {item.likes || 0} Suka
                </span>
              </button>
            </div>
          </div>



          {/* 3. Realtime Comment Stream (Instagram Grid Flow Layout) */}
          <div className={`flex-1 p-4 overflow-y-auto space-y-4 scrollbar-thin comments-container ${
            theme === 'dark' ? 'bg-[#0b0b0e]' : 'bg-white'
          }`}>
            {comments.length === 0 ? (
              <div className="h-full flex items-center justify-center text-center p-6 text-zinc-500 font-sans text-[11px] select-text">
                Belum ada komentar.
              </div>
            ) : (
              comments.map((c) => (
                <div key={c.id} className="flex items-start gap-2.5 group/comment p-2 rounded-xl hover:bg-white/5 transition-all duration-200">
                  <img
                    src={c.userPhoto || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=40&q=40'}
                    alt={c.userName}
                    className="w-7 h-7 rounded-full border border-rose-500/20 object-cover shrink-0 mt-0.5"
                    referrerPolicy="no-referrer"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline flex-wrap gap-x-1.5">
                      <span className="font-extrabold text-[11.5px] text-zinc-250 hover:text-rose-450 transition-colors">
                        {c.userName}
                      </span>
                      <span className="text-[8px] font-mono text-zinc-500 uppercase">
                        {c.createdAt?.seconds 
                          ? new Date(c.createdAt.seconds * 1000).toLocaleDateString('id-ID', {day: 'numeric', month: 'short'})
                          : 'baru'}
                      </span>
                    </div>
                    <p className={`text-[11.5px] font-sans mt-0.5 break-words select-text font-medium leading-relaxed ${
                      theme === 'dark' ? 'text-zinc-300' : 'text-zinc-700'
                    }`}>
                      {c.comment}
                    </p>
                  </div>

                  {((user && (user.uid === c.userId || matchesUser || c.photoOwnerId === user.uid || user.email === 'bungtemin@gmail.com')) || (auth.currentUser && (auth.currentUser.uid === c.userId || matchesUser || c.photoOwnerId === auth.currentUser.uid || auth.currentUser.email === 'bungtemin@gmail.com'))) && (
                    <button
                      type="button"
                      onClick={() => handleDeleteComment(c.id)}
                      className="text-red-500 hover:text-red-400 p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 transition-all shrink-0 cursor-pointer"
                      title="Hapus Komentar"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))
            )}
          </div>

          {/* 4. Action Bar & Comment Form Area */}
          <div className="comments-container border-t border-white/5 shrink-0 flex flex-col gap-3 p-4 bg-black/10">
            {matchesUser && onDelete && (
              <div className="flex items-center justify-end">
                <button
                  type="button"
                  onClick={() => {
                    if (confirm("Hapus kreasi foto ini dari galeri awan kita? 🥺")) {
                      onDelete();
                      onBack();
                    }
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-red-500/25 text-red-500 hover:bg-red-500/10 font-mono text-[9px] font-bold uppercase transition-all cursor-pointer bg-red-500/5 mt-1"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Hapus Foto
                </button>
              </div>
            )}

            {/* 5. Clean Custom Comment Input Form at the Footer */}
            <div className="w-full">
              {user ? (
                <form onSubmit={handleSubmitComment} className="flex flex-col gap-2 relative">
                  <div className="relative flex items-center">
                    <textarea
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      placeholder="Tuliskan komentar di sini..."
                      maxLength={250}
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
                  <div className="flex justify-between items-center px-1">
                    <span className="text-[8px] text-zinc-500 font-mono tracking-wider uppercase font-medium">
                      SEBAGAI: <span className="text-rose-450 font-bold">{user.displayName}</span>
                    </span>
                    <span className="text-[8px] font-mono text-zinc-500 font-medium">
                      {newComment.length} / 250
                    </span>
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
