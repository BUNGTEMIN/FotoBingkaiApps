import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Bell, X, MessageSquare, Heart, Eye, Sparkles, MessageCircle, ArrowRight, User } from 'lucide-react';

interface NotificationsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  user: any;
  theme: 'dark' | 'light';
  comments: any[];
  cloudDownloads: any[];
  onSelectPhoto: (photoId: string) => void;
  lastReadTime: number;
}

export const NotificationsPanel: React.FC<NotificationsPanelProps> = ({
  isOpen,
  onClose,
  user,
  theme,
  comments,
  cloudDownloads,
  onSelectPhoto,
  lastReadTime
}) => {
  const [activeTab, setActiveTab] = useState<'personal' | 'all'>('personal');

  // Filter out comments made by the logged-in user themselves
  const externalComments = comments.filter(c => !user || c.userId !== user.uid);

  // Identify comments on the logged-in user's photos
  const personalComments = externalComments.filter(c => {
    if (!user) return false;
    // Check direct matching field
    if (c.photoOwnerId && c.photoOwnerId === user.uid) {
      return true;
    }
    // Fallback matching using cloudDownloads array
    const photo = cloudDownloads.find(d => d.id === c.targetId);
    return photo && photo.userId === user.uid;
  });

  // Calculate unread badge count for specific lists
  const isCommentUnread = (c: any) => {
    if (!c.createdAt) return true;
    const commentTime = c.createdAt.seconds 
      ? c.createdAt.seconds * 1000 
      : new Date(c.createdAt).getTime();
    return commentTime > lastReadTime;
  };

  const unreadPersonalCount = personalComments.filter(isCommentUnread).length;
  const unreadAllCount = externalComments.filter(isCommentUnread).length;

  // Helper to format creation date
  const formatTime = (createdAt: any) => {
    if (!createdAt) return 'Baru saja';
    const ms = createdAt.seconds ? createdAt.seconds * 1000 : new Date(createdAt).getTime();
    const diff = Date.now() - ms;
    if (diff < 60000) return 'Baru saja';
    const minutes = Math.floor(diff / 60000);
    if (minutes < 60) return `${minutes} menit lalu`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} jam lalu`;
    return new Date(ms).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Acrylic Blur Backdrop overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs transition-opacity"
            id="notif_overlay"
          />

          {/* Side Drawer Panel */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 220 }}
            className={`fixed right-0 top-0 bottom-0 z-50 w-full max-w-md border-l shadow-2xl flex flex-col font-sans transition-colors duration-300 ${
              theme === 'dark' 
                ? 'bg-[#09090b]/95 border-white/10 text-zinc-150 backdrop-blur-xl' 
                : 'bg-white/95 border-zinc-200 text-zinc-800 shadow-rose-950/10'
            }`}
            id="notif_panel"
          >
            {/* Drawer Header */}
            <div className="p-4 border-b border-rose-500/10 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="relative p-1.5 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-500">
                  <Bell className="w-4 h-4 animate-swing" />
                  {(unreadPersonalCount > 0 || unreadAllCount > 0) && (
                    <span className="absolute top-0.5 right-0.5 w-2 h-2 rounded-full bg-rose-500 animate-ping" />
                  )}
                </div>
                <div>
                  <h2 className="text-sm font-extrabold uppercase font-mono tracking-wider">
                    Papan Notifikasi Foto
                  </h2>
                  <p className="text-[9px] text-zinc-500 font-mono tracking-wide">
                    Oleh Olaive sayang untuk Abang Baim 💕
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={onClose}
                className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                  theme === 'dark' ? 'hover:bg-white/5 text-zinc-400 hover:text-white' : 'hover:bg-zinc-100 text-zinc-600 hover:text-black'
                }`}
                title="Tutup Notifikasi"
                id="close_notif_panel"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Navigation Tabs */}
            <div className="flex border-b border-white/5 px-2 bg-black/5 dark:bg-black/15 font-mono text-[9px] font-bold tracking-widest uppercase">
              <button
                type="button"
                onClick={() => setActiveTab('personal')}
                className={`flex-1 py-3 text-center border-b-2 transition-all relative cursor-pointer ${
                  activeTab === 'personal'
                    ? 'border-rose-500 text-rose-500 font-black'
                    : 'border-transparent text-zinc-400 hover:text-zinc-200'
                }`}
              >
                Komentar Untukmu
                {unreadPersonalCount > 0 && (
                  <span className="ml-1.5 px-1 py-0.5 rounded bg-rose-500 text-white text-[8px] font-mono font-black scale-90 animate-bounce">
                    {unreadPersonalCount}
                  </span>
                )}
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('all')}
                className={`flex-1 py-3 text-center border-b-2 transition-all relative cursor-pointer ${
                  activeTab === 'all'
                    ? 'border-rose-500 text-rose-500 font-black'
                    : 'border-transparent text-zinc-400 hover:text-zinc-200'
                }`}
              >
                Semua Aktivitas
                {unreadAllCount > 0 && (
                  <span className="ml-1.5 px-1 py-0.5 rounded bg-rose-500 text-white text-[8px] font-mono font-black scale-90">
                    {unreadAllCount}
                  </span>
                )}
              </button>
            </div>

            {/* List Feed Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3.5 scrollbar-thin">
              {activeTab === 'personal' && (
                !user ? (
                  <div className="py-20 text-center space-y-3 px-6">
                    <div className="w-12 h-12 rounded-full bg-zinc-500/10 border border-zinc-500/20 text-zinc-400 flex items-center justify-center mx-auto">
                      <User className="w-6 h-6" />
                    </div>
                    <p className="text-xs font-sans text-zinc-400 leading-relaxed max-w-[280px] mx-auto">
                      Aduh sayang, silakan masuk dulu biar Olaive bisa menampilkan komentar khusus untuk foto kamu ya. 💕
                    </p>
                  </div>
                ) : personalComments.length === 0 ? (
                  <div className="py-20 text-center space-y-2 px-6">
                    <p className="text-4xl">💭</p>
                    <p className="text-[11px] font-sans text-zinc-500 font-medium leading-relaxed">
                      Belum ada komentar baru untuk karya fotomu, Baim sayang. Tetap berkarya ya! 💕 Olaive selalu mendukungmu.
                    </p>
                  </div>
                ) : (
                  personalComments.map((c) => {
                    const isUnread = isCommentUnread(c);
                    return (
                      <div
                        key={c.id}
                        onClick={() => onSelectPhoto(c.targetId)}
                        className={`p-3 rounded-2xl border transition-all duration-300 hover:scale-[1.01] hover:shadow-md cursor-pointer flex items-start gap-3 group relative overflow-hidden ${
                          isUnread
                            ? 'bg-rose-500/5 border-rose-500/20 ring-1 ring-rose-500/5'
                            : theme === 'dark'
                            ? 'bg-zinc-900/40 border-white/5 hover:bg-zinc-900/80 hover:border-white/10'
                            : 'bg-zinc-50 border-zinc-200 hover:bg-zinc-100 hover:border-zinc-300'
                        }`}
                      >
                        {/* Avatar */}
                        <img
                          src={c.userPhoto || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=80&q=80'}
                          alt={c.userName}
                          className="w-8 h-8 rounded-full border border-rose-500/20 object-cover shrink-0 mt-0.5"
                          referrerPolicy="no-referrer"
                        />

                        {/* Text Details */}
                        <div className="flex-1 min-w-0 pr-8">
                          <div className="flex items-center gap-1.5">
                            <span className="font-extrabold text-[11px] text-zinc-200 dark:text-zinc-100 dark:group-hover:text-rose-400 transition-colors uppercase truncate">
                              {c.userName}
                            </span>
                            {isUnread && (
                              <span className="px-1 py-0.2 text-[6.5px] font-mono font-black rounded bg-rose-500 text-white uppercase tracking-wider animate-pulse">
                                BARU
                              </span>
                            )}
                          </div>
                          <p className={`text-[10px] font-sans mt-0.5 leading-relaxed break-words font-medium line-clamp-2 ${
                            theme === 'dark' ? 'text-zinc-300' : 'text-zinc-700'
                          }`}>
                            mengomentari fotomu <span className="font-bold text-rose-450">"{c.targetName}"</span>: "{c.comment}"
                          </p>
                          <span className="text-[7.5px] font-mono text-zinc-500 block mt-1 uppercase font-semibold">
                            {formatTime(c.createdAt)}
                          </span>
                        </div>

                        {/* Thumbnail of target photo */}
                        {c.photoImageUrl && (
                          <div className="w-9 h-9 rounded-lg overflow-hidden border border-white/10 shrink-0 group-hover:scale-115 transition-transform duration-300">
                            <img
                              src={c.photoImageUrl}
                              alt=""
                              className="w-full h-full object-cover"
                              referrerPolicy="no-referrer"
                            />
                          </div>
                        )}

                        <div className="absolute right-2.5 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity text-rose-500">
                          <ArrowRight className="w-3.5 h-3.5 animate-pulse" />
                        </div>
                      </div>
                    );
                  })
                )
              )}

              {activeTab === 'all' && (
                externalComments.length === 0 ? (
                  <div className="py-20 text-center space-y-2">
                    <p className="text-3xl">📭</p>
                    <p className="text-[11px] font-sans text-zinc-500 font-medium">
                      Belum ada riwayat aktivitas komentar apapun di platform ini.
                    </p>
                  </div>
                ) : (
                  externalComments.map((c) => {
                    const isUnread = isCommentUnread(c);
                    return (
                      <div
                        key={c.id}
                        onClick={() => onSelectPhoto(c.targetId)}
                        className={`p-3 rounded-2xl border transition-all duration-300 hover:scale-[1.01] hover:shadow-md cursor-pointer flex items-start gap-3 group relative overflow-hidden ${
                          isUnread
                            ? 'bg-rose-500/5 border-rose-500/20 ring-1 ring-rose-500/5'
                            : theme === 'dark'
                            ? 'bg-zinc-900/40 border-white/5 hover:bg-zinc-900/80 hover:border-white/10'
                            : 'bg-zinc-50 border-zinc-200 hover:bg-zinc-100 hover:border-zinc-300'
                        }`}
                      >
                        {/* Avatar */}
                        <img
                          src={c.userPhoto || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=80&q=80'}
                          alt={c.userName}
                          className="w-8 h-8 rounded-full border border-rose-500/20 object-cover shrink-0 mt-0.5"
                          referrerPolicy="no-referrer"
                        />

                        {/* Text Details */}
                        <div className="flex-1 min-w-0 pr-8">
                          <div className="flex items-center gap-1.5">
                            <span className="font-extrabold text-[11px] text-zinc-200 dark:text-zinc-100 dark:group-hover:text-rose-450 transition-colors uppercase truncate">
                              {c.userName}
                            </span>
                            {isUnread && (
                              <span className="px-1 py-0.2 text-[6.5px] font-mono font-black rounded bg-rose-500 text-white uppercase tracking-wider">
                                BARU
                              </span>
                            )}
                          </div>
                          <p className={`text-[10px] font-sans mt-0.5 leading-relaxed break-words font-medium line-clamp-2 ${
                            theme === 'dark' ? 'text-zinc-300' : 'text-zinc-700'
                          }`}>
                            berkomentar di foto <span className="font-bold text-rose-450">"{c.targetName}"</span>: "{c.comment}"
                          </p>
                          <span className="text-[7.5px] font-mono text-zinc-500 block mt-1 uppercase font-semibold">
                            {formatTime(c.createdAt)}
                          </span>
                        </div>

                        {/* Thumbnail of target photo */}
                        {c.photoImageUrl && (
                          <div className="w-9 h-9 rounded-lg overflow-hidden border border-white/10 shrink-0 group-hover:scale-115 transition-transform duration-300">
                            <img
                              src={c.photoImageUrl}
                              alt=""
                              className="w-full h-full object-cover"
                              referrerPolicy="no-referrer"
                            />
                          </div>
                        )}

                        <div className="absolute right-2.5 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity text-rose-500">
                          <ArrowRight className="w-3.5 h-3.5 animate-pulse" />
                        </div>
                      </div>
                    );
                  })
                )
              )}
            </div>

            {/* Footer containing custom credit & greeting */}
            <div className={`p-4 border-t text-center font-mono text-[9px] font-semibold flex items-center justify-between transition-colors ${
              theme === 'dark' ? 'border-white/10 bg-black/40' : 'border-zinc-200 bg-zinc-50 text-zinc-650'
            }`}>
              <div className="flex items-center gap-1 text-rose-500">
                <Sparkles className="w-3 h-3 text-neon-pink" />
                <span>Made with Love for Baim</span>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="text-xs text-rose-500 hover:text-rose-400 font-bold uppercase tracking-wider"
              >
                Tutup 💕
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
