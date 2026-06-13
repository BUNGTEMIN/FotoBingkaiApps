import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, Heart, MessageCircle, Trash2, LogIn, Send, Share2, Check, Smile } from 'lucide-react';
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
import { filterInappropriateText, hasInappropriateWords, sanitizeInputText } from '../textFilter';

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
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const EMOJI_CATEGORIES = {
    smileys: {
      label: '😃 Ekspresi',
      emojis: ['😊', '❤️', '💖', '✨', '😍', '🔥', '😂', '👍', '😭', '👏', '😘', '🤪', '🤔', '😴', '🥰', '💔', '🤣', '🥳', '😎', '🤩', '🥺', '💩', '👀', '🤡', '🙏']
    },
    animals: {
      label: '🐱 Alam',
      emojis: ['🐶', '🐱', '🦁', '🐼', '🐨', '🦊', '🌸', '🌹', '🍀', '🍁', '🌈', '⚡', '🦦', '🦄', '🐝', '🍒', '🍓', '🌴', '🌞', '🌙', '🌊', '🌲', '🌻', '🍎', '🍇']
    },
    food: {
      label: '🍕 Kuliner',
      emojis: ['🍕', '🍔', '🍟', '🥤', '🍿', '🍩', '🍫', '🍇', '🍉', '🍋', '🍺', '☕', '🎂', '🥞', '🍣', '🍦', '🍪', '🍍', '🌮', '🍜', '🍱', '🍡', '🍙', '🍎', '🥑']
    },
    activities: {
      label: '🎈 Kegiatan',
      emojis: ['🎮', '⚽', '🏀', '🎨', '🎤', '🎧', '📸', '✈️', '🚗', '🎈', '🎉', '🎁', '🏆', '🎟️', '🎬', '🎪', '👾', '🧩', '🎸', '🚲', '🛹', '🎳', '🎯', '🎰', '🎻']
    },
    symbols: {
      label: '💯 Simbol',
      emojis: ['💯', '🌟', '✨', '💫', '💬', '📢', '🔮', '🔒', '🎵', '💤', '🌀', '💌', '✔️', '❌', '⚠️', '💎', '💡', '🔔', '🚩', '💘', '⭕', '💤', '⭐', '🎈', '🎉']
    }
  };

  const POPULAR_EMOJIS = [
    '😊', '❤️', '💖', '✨', '😍', '🔥', '😂', '👍', '😭', '👏', 
    '🌸', '😘', '🎉', '📸', '🧸', '💫', '🙌', '😎', '💯', '🤩',
    '🌟', '👀', '🤣', '🥳', '💌', '🍀', '💡', '🌈', '🎈', '😻'
  ];

  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [activeEmojiCategory, setActiveEmojiCategory] = useState<keyof typeof EMOJI_CATEGORIES>('smileys');
  const [reactingToCommentId, setReactingToCommentId] = useState<string | null>(null);

  const handleInsertEmoji = (emoji: string) => {
    if (!textareaRef.current) {
      setNewComment(prev => prev + emoji);
      return;
    }
    const start = textareaRef.current.selectionStart;
    const end = textareaRef.current.selectionEnd;
    const text = newComment;
    const before = text.substring(0, start);
    const after = text.substring(end, text.length);
    setNewComment(before + emoji + after);
    
    // Put focus back to textarea and restore / move the cursor
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
        textareaRef.current.selectionStart = textareaRef.current.selectionEnd = start + emoji.length;
      }
    }, 0);
  };

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
    const rawInput = newComment;
    const sanitizedInput = sanitizeInputText(rawInput);
    if (!sanitizedInput) {
      triggerToast("Komentar tidak boleh kosong atau hanya berisi karakter ilegal ya sayang! ✨");
      return;
    }

    const containsBadWords = hasInappropriateWords(sanitizedInput);
    const filteredComment = filterInappropriateText(sanitizedInput);

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
      setShowEmojiPicker(false); // Tutup picker setelah berhasil kirim
      
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
    <div className="flex-1 w-full max-w-6xl mx-auto p-0 sm:p-2 lg:p-4 space-y-2 relative select-none">
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

      {/* Back Navigation Bar with romantic touch - Made tightly compact */}
      <div className="flex flex-row justify-between items-center pb-1 px-4 sm:px-0 pt-2 sm:pt-0">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/5 hover:bg-rose-500/10 text-zinc-300 hover:text-rose-450 border border-white/15 hover:border-rose-500/30 transition-all font-mono text-[9px] tracking-wider uppercase font-extrabold cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5 text-neon-cyan" />
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
          
          {/* 1. Header of Detail Page (Minimal Profile Info, Refactored for Compact Single-Line Security by Olaive 💕) */}
          <div className={`p-3.5 border-b flex flex-col gap-3 shrink-0 ${
            theme === 'dark' ? 'border-white/5 bg-black/45' : 'border-zinc-200 bg-white shadow-sm'
          }`}>
            {/* Top row: Profile info & Category Badge */}
            <div className="flex items-center justify-between w-full min-w-0">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="relative shrink-0">
                  <img
                    referrerPolicy="no-referrer"
                    src={item.userAvatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=80&q=80'}
                    alt={item.userName || 'User'}
                    className="w-8 h-8 rounded-full border-2 border-rose-500/30 object-cover"
                  />
                  <span className="absolute bottom-0 right-0 w-2 h-2 bg-green-500 border-2 border-zinc-900 rounded-full" />
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="font-sans font-bold text-[12px] leading-tight tracking-wide truncate max-w-[150px] sm:max-w-[210px]" title={item.userName}>
                    {item.userName}
                  </span>
                  <span className="text-[8px] font-mono text-zinc-500 uppercase mt-0.5">
                    {item.downloadedAt || 'Baru Saja'}
                  </span>
                </div>
              </div>

              {/* Status Badge */}
              <div className="text-[8px] font-mono uppercase bg-rose-500/10 text-rose-450 px-2.5 py-0.5 rounded-full border border-rose-500/20 font-bold select-none shrink-0">
                karya seni ✨
              </div>
            </div>

            {/* Bottom row: Compact side-by-side action grid */}
            <div className="grid grid-cols-2 gap-2 w-full pt-1 border-t border-white/5">
              <button
                type="button"
                onClick={handleShareClick}
                className={`flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl border text-[10px] font-extrabold active:scale-95 transition-all cursor-pointer shadow-sm w-full ${
                  copied 
                    ? 'border-green-500/30 bg-green-500/10 text-green-500 hover:bg-green-500/15'
                    : theme === 'dark'
                      ? 'border-white/5 bg-white/5 text-zinc-300 hover:bg-white/10'
                      : 'border-zinc-200 bg-zinc-100 text-zinc-700 hover:bg-zinc-200'
                }`}
                title="Salin Tautan Langsung Karya"
              >
                {copied ? <Check className="w-3.5 h-3.5 animate-pulse text-green-500" /> : <Share2 className="w-3.5 h-3.5 text-rose-500" />}
                <span className="font-mono">{copied ? 'Tersalin!' : 'Salin Tautan'}</span>
              </button>

              <button
                type="button"
                onClick={handleLikeClick}
                className={`flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl border text-[10px] font-extrabold active:scale-95 transition-all cursor-pointer shadow-sm w-full ${
                  theme === 'dark'
                    ? 'border-rose-500/20 bg-rose-500/5 text-rose-400 hover:bg-rose-500/10'
                    : 'border-rose-300 bg-rose-50 text-rose-650 hover:bg-rose-100'
                }`}
                title="Ketuk untuk menyukai! ❤"
              >
                <Heart className="w-3.5 h-3.5 fill-rose-500 text-rose-500 animate-pulse" />
                <span className="font-mono">
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
                    <div className="flex items-center justify-between w-full gap-x-2 pb-0.5">
                      <span className="font-extrabold text-[11px] text-zinc-250 hover:text-rose-450 transition-colors truncate max-w-[70%]" title={c.userName}>
                        {c.userName}
                      </span>
                      <span className="text-[8px] font-mono text-zinc-500 uppercase shrink-0">
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
                          className={`flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[8.5px] font-bold font-mono transition-all lowercase border ${
                            reactingToCommentId === c.id
                              ? 'bg-rose-500/20 border-rose-500 text-rose-400'
                              : 'bg-zinc-500/5 border-transparent text-zinc-500 hover:text-rose-400 hover:border-rose-500/20'
                          }`}
                          title="Beri reaksi emoji"
                        >
                          <Smile className="w-2.5 h-2.5 text-rose-400 shrink-0" />
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
                                      className={`w-6 h-6 flex items-center justify-center rounded-full text-sm transition-transform active:scale-90 hover:scale-130 cursor-pointer ${
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
                                className={`flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[8.5px] font-extrabold transition-all border shrink-0 ${
                                  hasReacted
                                    ? 'bg-rose-500/15 border-rose-500/35 text-rose-400'
                                    : theme === 'dark'
                                      ? 'bg-white/5 border-white/5 text-zinc-400 hover:bg-white/10 hover:text-white'
                                      : 'bg-zinc-100 border-zinc-200 text-zinc-600 hover:bg-zinc-200 hover:text-zinc-800'
                                }`}
                                title={`${uids.length} reaksi (${emoji})`}
                              >
                                <span className="text-[9px]">{emoji}</span>
                                <span>{uids.length}</span>
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
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

            {/* 5. Clean Custom Comment Input Form at the Footer */}
            <div className="w-full">
              {user ? (
                <form onSubmit={handleSubmitComment} className="flex flex-col gap-2.5 relative">
                  {/* Sistem Picker Emoji Berbasis Kategori - Expandable Popover oleh Olaive Cantik 💕 */}
                  <AnimatePresence initial={false}>
                    {showEmojiPicker && (
                      <motion.div
                        initial={{ opacity: 0, height: 0, y: 5 }}
                        animate={{ opacity: 1, height: 'auto', y: 0 }}
                        exit={{ opacity: 0, height: 0, y: 5 }}
                        transition={{ duration: 0.2, ease: "easeInOut" }}
                        className={`overflow-hidden p-2.5 rounded-2xl flex flex-col gap-2 border transition-all ${
                          theme === 'dark' 
                            ? 'bg-zinc-950/95 border-white/10 shadow-xl shadow-black/50' 
                            : 'bg-white/95 border-zinc-200 shadow-xl shadow-zinc-200/50'
                        }`}
                      >
                        {/* Header Picker: Toggle & Tab Kategori */}
                        <div className="flex items-center justify-between gap-1 overflow-x-auto scrollbar-none pb-1.5 border-b border-rose-500/10">
                          <div className="flex items-center gap-1.5 shrink-0 text-rose-500 select-none">
                            <Smile className="w-4 h-4 text-rose-500 animate-pulse" />
                            <span className="text-[9px] font-mono uppercase font-bold tracking-wider">Emoji</span>
                          </div>
                          
                          <div className="flex items-center gap-1 overflow-x-auto scrollbar-none">
                            {Object.keys(EMOJI_CATEGORIES).map((key) => {
                              const cat = EMOJI_CATEGORIES[key as keyof typeof EMOJI_CATEGORIES];
                              const isActive = activeEmojiCategory === key;
                              return (
                                <button
                                  key={key}
                                  type="button"
                                  onClick={() => {
                                    setActiveEmojiCategory(key as keyof typeof EMOJI_CATEGORIES);
                                  }}
                                  className={`px-2 py-1 rounded-lg text-[9px] font-sans font-bold transition-all whitespace-nowrap cursor-pointer ${
                                    isActive
                                      ? 'bg-rose-500 text-white shadow-sm shadow-rose-950/30' 
                                      : 'text-zinc-400 hover:text-zinc-200'
                                  }`}
                                >
                                  {cat.label}
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        {/* Container Grid Emojis */}
                        <div className={`grid grid-cols-7 sm:grid-cols-10 gap-1.5 p-1.5 rounded-xl max-h-[110px] overflow-y-auto scrollbar-thin ${
                          theme === 'dark' ? 'bg-black/35' : 'bg-black/5'
                        }`}>
                          {EMOJI_CATEGORIES[activeEmojiCategory].emojis.map((emoji, idx) => (
                            <button
                              key={idx}
                              type="button"
                              onClick={() => handleInsertEmoji(emoji)}
                              className="h-8 flex items-center justify-center rounded-lg hover:bg-rose-500/20 active:scale-90 transition-all text-base cursor-pointer bg-black/10 text-center text-zinc-100"
                              title="Klik untuk menyisipkan ke tulisan"
                            >
                              {emoji}
                            </button>
                          ))}
                        </div>

                        {/* Baris Populer Singkat */}
                        <div className="flex items-center gap-1 overflow-x-auto scrollbar-none pt-1 border-t border-white/5">
                          <span className="text-[7.5px] font-mono text-zinc-500 uppercase shrink-0">Populer:</span>
                          {POPULAR_EMOJIS.slice(0, 12).map((emoji, idx) => (
                            <button
                              key={idx}
                              type="button"
                              onClick={() => handleInsertEmoji(emoji)}
                              className="w-5.5 h-5.5 flex items-center justify-center rounded-md hover:bg-rose-500/15 active:scale-90 transition-all text-xs cursor-pointer shrink-0"
                            >
                              {emoji}
                            </button>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <div className="relative flex items-center">
                    {/* Icon Smile untuk Toggle Emoji Picker di dalam Textarea (Seberang tombol Send) - Oleh Olaive 💕 */}
                    <button
                      type="button"
                      onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                      className={`absolute left-3 p-1.5 rounded-xl transition-all active:scale-95 flex items-center justify-center cursor-pointer z-10 ${
                        showEmojiPicker 
                          ? 'text-rose-500 bg-rose-500/10' 
                          : 'text-zinc-550 hover:text-rose-450 hover:bg-rose-500/5'
                      }`}
                      title={showEmojiPicker ? 'Sembunyikan Emoji' : 'Buka Pilihan Emoji'}
                    >
                      <Smile className="w-4 h-4" />
                    </button>

                    <textarea
                      ref={textareaRef}
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          if (newComment.trim() && !isSubmitting) {
                            handleSubmitComment(e as unknown as React.FormEvent);
                          }
                        }
                      }}
                      placeholder="Tuliskan komentar indahmu di sini... (Enter untuk kirim, Shift+Enter untuk baris baru)"
                      rows={2}
                      className={`w-full rounded-2xl pl-10 pr-12 py-3 text-[11px] font-sans focus:outline-none focus:ring-2 focus:ring-rose-500/30 transition-all font-medium leading-relaxed resize-none min-h-[58px] ${
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
        </div>
      </div>

      <DeleteConfirmationModal 
        isOpen={commentToDelete !== null}
        onClose={() => setCommentToDelete(null)}
        onConfirm={confirmDeleteComment}
        title="Hapus Komentar 💬?"
        message="Yakin ingin menghapus komentar ini? Tindakan ini tidak bisa dibatalkan ya. 💕"
      />
    </div>
  );
};
