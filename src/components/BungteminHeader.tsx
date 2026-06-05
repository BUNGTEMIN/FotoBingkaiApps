import React, { useState } from 'react';
import { Menu, X, ShieldAlert, Sparkles, Laptop, Disc, Cpu, Award, Sun, Moon, LogOut, LogIn, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface BungteminHeaderProps {
  currentPage: 'beranda' | 'bingkai' | 'galeri' | 'album';
  onNavigate: (page: 'beranda' | 'bingkai' | 'galeri' | 'album') => void;
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
  user: any;
  isAuthLoading: boolean;
  onGoogleLogin: () => void;
  onLogout: () => void;
  completedQuests?: number;
  totalQuests?: number;
}

export default function BungteminHeader({ 
  currentPage, 
  onNavigate, 
  theme, 
  onToggleTheme,
  user,
  isAuthLoading,
  onGoogleLogin,
  onLogout,
  completedQuests = 0,
  totalQuests = 6
}: BungteminHeaderProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <header className={`sticky top-0 z-40 w-full backdrop-blur-md transition-all duration-300 shadow-lg ${
      theme === 'dark' ? 'bg-[#050505]/85 border-b border-white/10' : 'bg-white/85 border-b border-zinc-200'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-12">
          {/* Logo Brand / Avatar Header */}
          <div className="flex items-center space-x-2 cursor-pointer" onClick={() => onNavigate('beranda')}>
            <motion.div 
              className="relative w-6 h-6 bg-neon-cyan rounded-sm flex items-center justify-center text-[#050505] font-black shadow-[0_0_10px_rgba(0,240,255,0.3)]"
              animate={{ rotate: [0, 5, -5, 0] }}
              transition={{ repeat: Infinity, duration: 8, ease: "easeInOut" }}
            >
              <Cpu className="w-3.5 h-3.5 text-[#050505]" />
              <span className="absolute top-0 right-0 w-1 h-1 rounded-full bg-neon-green animate-ping" />
            </motion.div>
            <div>
              <span className={`font-mono text-[10px] font-extrabold tracking-widest uppercase transition-colors duration-300 ${
                theme === 'dark' ? 'text-[#E0E0E0]' : 'text-zinc-800'
              }`}>
                QCCfoto
              </span>
            </div>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex space-x-6 font-mono text-[10px] tracking-wider">
            <button 
              onClick={() => onNavigate('beranda')}
              className={`${currentPage === 'beranda' ? 'text-neon-cyan font-bold' : (theme === 'dark' ? 'text-zinc-400 hover:text-neon-cyan' : 'text-zinc-600 hover:text-neon-cyan')} transition-colors relative py-1 group`}
            >
              BERANDA
              <span className={`absolute bottom-0 left-0 w-full h-0.5 bg-neon-cyan origin-left transition-transform duration-300 ${currentPage === 'beranda' ? 'scale-x-100' : 'scale-x-0 group-hover:scale-x-100'}`} />
            </button>
            <button 
              onClick={() => onNavigate('galeri')}
              className={`${currentPage === 'galeri' ? 'text-neon-cyan font-bold' : (theme === 'dark' ? 'text-zinc-400 hover:text-neon-cyan' : 'text-zinc-600 hover:text-neon-cyan')} transition-colors relative py-1 group`}
            >
              GAMBAR SEMUA FOTO
              <span className={`absolute bottom-0 left-0 w-full h-0.5 bg-neon-cyan origin-left transition-transform duration-300 ${currentPage === 'galeri' ? 'scale-x-100' : 'scale-x-0 group-hover:scale-x-100'}`} />
            </button>
            <button 
              onClick={() => onNavigate('album')}
              className={`${currentPage === 'album' ? 'text-neon-cyan font-bold' : (theme === 'dark' ? 'text-zinc-400 hover:text-neon-cyan' : 'text-zinc-600 hover:text-neon-cyan')} transition-colors relative py-1 group`}
            >
              GALERI SAYA
              <span className={`absolute bottom-0 left-0 w-full h-0.5 bg-neon-cyan origin-left transition-transform duration-300 ${currentPage === 'album' ? 'scale-x-100' : 'scale-x-0 group-hover:scale-x-100'}`} />
            </button>
            <button 
              onClick={() => onNavigate('bingkai')}
              className={`${currentPage === 'bingkai' ? 'text-neon-cyan font-bold' : (theme === 'dark' ? 'text-zinc-400 hover:text-neon-cyan' : 'text-zinc-600 hover:text-neon-cyan')} transition-colors relative py-1 group`}
            >
              BINGKAI
              <span className={`absolute bottom-0 left-0 w-full h-0.5 bg-neon-cyan origin-left transition-transform duration-300 ${currentPage === 'bingkai' ? 'scale-x-100' : 'scale-x-0 group-hover:scale-x-100'}`} />
            </button>

          </nav>

          {/* Collapsible Info Button, Dark/Light Toggle & Mobile Hamburger */}
          <div className="flex items-center space-x-2">
            {isAuthLoading ? (
              <div className="p-1 px-2 flex items-center justify-center">
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-neon-cyan" />
              </div>
            ) : user ? (
              <div className="flex items-center space-x-1.5 bg-black/10 dark:bg-white/5 p-1 rounded border border-black/10 dark:border-white/10 text-[9px] font-mono leading-none md:flex">
                <img 
                  referrerPolicy="no-referrer" 
                  src={user.photoURL || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=80&q=80'} 
                  className="w-4 h-4 rounded-full border border-neon-cyan/50" 
                  alt="Avatar"
                />
                <span className="font-bold max-w-[80px] truncate uppercase text-zinc-700 dark:text-zinc-200 hidden sm:inline">
                  {user.displayName?.split(' ')[0] || 'USER'}
                </span>
                <button 
                  onClick={onLogout}
                  className="p-0.5 text-zinc-500 hover:text-rose-500 transition-colors focus:outline-none"
                  title="Keluar / Logout"
                >
                  <LogOut className="w-3 h-3" />
                </button>
              </div>
            ) : (
              <button
                onClick={onGoogleLogin}
                className="p-1.5 px-2.5 transition-all border rounded font-mono text-[9px] flex items-center gap-1.5 focus:outline-none bg-[#4285F4] text-white border-transparent hover:bg-[#357ae8] shadow-sm font-bold"
                title="Masuk dengan Google"
              >
                <LogIn className="w-3 h-3" />
                <span className="hidden sm:inline">MASUK</span>
              </button>
            )}

            <button
              onClick={onToggleTheme}
              className={`p-1.5 transition-colors duration-200 focus:outline-none rounded border ${
                theme === 'dark' 
                  ? 'bg-zinc-900 border-zinc-800 text-yellow-400 hover:text-yellow-350 hover:bg-zinc-850' 
                  : 'bg-zinc-100 border-zinc-200 text-slate-700 hover:text-yellow-600 hover:bg-zinc-200 shadow-sm'
              }`}
              title={theme === 'dark' ? "Ganti ke Tema Terang" : "Ganti ke Tema Gelap"}
            >
              {theme === 'dark' ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
            </button>
            <button
              onClick={() => setIsOpen(!isOpen)}
              className={`p-1 px-2.5 hover:text-neon-cyan focus:outline-none transition-all border rounded font-mono text-[9px] flex items-center gap-1 ${
                theme === 'dark'
                  ? 'bg-white/5 text-zinc-300 border-white/10 hover:bg-white/10'
                  : 'bg-zinc-100 text-zinc-850 border-zinc-200 hover:bg-zinc-200'
              }`}
              aria-label="Toggle Menu"
            >
              MENU {isOpen ? <X className="w-3 h-3" /> : <Menu className="w-3 h-3" />}
            </button>
          </div>
        </div>
      </div>

      {/* Expandable Sidebar Panel / Dropdown (Futuristic layout) */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25 }}
            className={`md:hidden border-t overflow-hidden transition-colors duration-300 ${
              theme === 'dark' ? 'border-white/10 bg-[#050505]/95' : 'border-zinc-200 bg-white/95 shadow-xl'
            }`}
          >
            <div className="px-4 pt-3 pb-6 space-y-4 font-mono text-xs max-w-lg mx-auto">
              <div className="grid grid-cols-2 gap-2 pb-2">
                <button 
                  onClick={() => { onNavigate('beranda'); setIsOpen(false); }}
                  className={`p-3 rounded border text-center transition-all ${
                    currentPage === 'beranda' 
                      ? 'border-neon-cyan bg-cyan-950/20' 
                      : theme === 'dark' 
                        ? 'bg-white/3 border-white/10 hover:border-neon-cyan' 
                        : 'bg-zinc-50 border-zinc-200 text-zinc-800 hover:border-neon-cyan hover:bg-zinc-100'
                  }`}
                >
                  <span className={`block text-[9px] ${theme === 'dark' ? 'text-zinc-500' : 'text-zinc-450'}`}>Beranda</span>
                  <span className={`text-xs font-semibold ${theme === 'dark' ? 'text-zinc-200' : 'text-zinc-800'}`}>HOME</span>
                </button>
                <button 
                  onClick={() => { onNavigate('galeri'); setIsOpen(false); }}
                  className={`p-3 rounded border text-center transition-all ${
                    currentPage === 'galeri' 
                      ? 'border-neon-cyan bg-cyan-950/20' 
                      : theme === 'dark' 
                        ? 'bg-white/3 border-white/10 hover:border-neon-cyan' 
                        : 'bg-zinc-50 border-zinc-200 text-zinc-800 hover:border-neon-cyan hover:bg-zinc-100'
                  }`}
                >
                  <span className={`block text-[9px] ${theme === 'dark' ? 'text-zinc-500' : 'text-zinc-450'}`}>Karya</span>
                  <span className={`text-xs font-semibold ${theme === 'dark' ? 'text-zinc-200' : 'text-zinc-800'}`}>SEMUA FOTO</span>
                </button>
                <button 
                  onClick={() => { onNavigate('album'); setIsOpen(false); }}
                  className={`p-3 rounded border text-center transition-all ${
                    currentPage === 'album' 
                      ? 'border-neon-cyan bg-cyan-950/20' 
                      : theme === 'dark' 
                        ? 'bg-white/3 border-white/10 hover:border-neon-cyan' 
                        : 'bg-zinc-50 border-zinc-200 text-zinc-800 hover:border-neon-cyan hover:bg-zinc-100'
                  }`}
                >
                  <span className={`block text-[9px] ${theme === 'dark' ? 'text-zinc-500' : 'text-zinc-450'}`}>Koleksi</span>
                  <span className={`text-xs font-semibold ${theme === 'dark' ? 'text-zinc-200' : 'text-zinc-800'}`}>GALERI SAYA</span>
                </button>
                <button 
                  onClick={() => { onNavigate('bingkai'); setIsOpen(false); }}
                  className={`p-3 rounded border text-center transition-all ${
                    currentPage === 'bingkai' 
                      ? 'border-neon-cyan bg-cyan-950/20' 
                      : theme === 'dark' 
                        ? 'bg-white/3 border-white/10 hover:border-neon-cyan' 
                        : 'bg-zinc-50 border-zinc-200 text-zinc-800 hover:border-neon-cyan hover:bg-zinc-100'
                  }`}
                >
                  <span className={`block text-[9px] ${theme === 'dark' ? 'text-zinc-500' : 'text-zinc-450'}`}>Overlay</span>
                  <span className={`text-xs font-semibold ${theme === 'dark' ? 'text-zinc-200' : 'text-zinc-800'}`}>BINGKAI</span>
                </button>
              </div>

              {/* Mobile Auth Status Block */}
              <div className={`p-3 rounded border text-center transition-all ${
                theme === 'dark' ? 'bg-[#0f0f11] border-white/5' : 'bg-zinc-50 border-zinc-200'
              }`}>
                {isAuthLoading ? (
                  <div className="flex items-center justify-center space-x-2 py-1">
                    <RefreshCw className="w-4 h-4 animate-spin text-neon-cyan" />
                    <span className="text-[10px] text-zinc-500">MENGHENTIKAN AKSES...</span>
                  </div>
                ) : user ? (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2 text-left">
                      <img 
                        referrerPolicy="no-referrer" 
                        src={user.photoURL || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=80&q=80'} 
                        srcSet={user.photoURL}
                        style={{ contentVisibility: 'auto' }}
                        className="w-8 h-8 rounded-full border border-neon-cyan" 
                        alt="Profile"
                      />
                      <div className="min-w-0">
                        <span className={`block text-[10px] font-bold ${theme === 'dark' ? 'text-zinc-200' : 'text-zinc-800'} uppercase truncate max-w-[150px]`}>
                          {user.displayName || 'USER GOOGLE'}
                        </span>
                        <span className="block text-[8px] text-zinc-500 truncate max-w-[150px]">
                          {user.email}
                        </span>
                      </div>
                    </div>
                    <button 
                      onClick={() => { onLogout(); setIsOpen(false); }}
                      className="px-2.5 py-1 text-[8.5px] font-mono border border-rose-500/30 text-rose-500 bg-rose-500/5 hover:bg-rose-500/10 rounded transition-all font-bold flex items-center gap-1 uppercase"
                    >
                      <LogOut className="w-3 h-3" /> KELUAR
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col items-center space-y-2">
                    <span className="text-[8.5px] text-zinc-500 uppercase tracking-wider">Mendukung cadangan cloud otomatis</span>
                    <button
                      onClick={() => { onGoogleLogin(); setIsOpen(false); }}
                      className="w-full justify-center p-2 transition-all border rounded font-mono text-[10px] flex items-center gap-2 focus:outline-none bg-[#4285F4] text-white border-transparent hover:bg-[#357ae8] shadow font-bold"
                    >
                      <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                      </svg>
                      MASUK DENGAN GOOGLE
                    </button>
                  </div>
                )}
              </div>

              {/* 
              <div className="pt-2 border-t border-white/5 text-center">
                <a href="https://bungtemin.net" target="_blank" rel="noopener noreferrer" className="inline-block px-4 py-2 bg-white/3 rounded border border-neon-pink/20 hover:border-neon-pink transition-all text-xs font-semibold text-neon-pink">
                  KUNJUNGI BUNGTEMIN.NET
                </a>
              </div>
              */}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
