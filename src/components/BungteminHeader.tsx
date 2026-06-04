import React, { useState } from 'react';
import { Menu, X, ShieldAlert, Sparkles, Laptop, Disc, Cpu, Award, Sun, Moon } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface BungteminHeaderProps {
  currentPage: 'beranda' | 'bingkai' | 'galeri' | 'album';
  onNavigate: (page: 'beranda' | 'bingkai' | 'galeri' | 'album') => void;
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
}

export default function BungteminHeader({ currentPage, onNavigate, theme, onToggleTheme }: BungteminHeaderProps) {
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
                FOTO BINGKAI
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
              onClick={() => onNavigate('bingkai')}
              className={`${currentPage === 'bingkai' ? 'text-neon-cyan font-bold' : (theme === 'dark' ? 'text-zinc-400 hover:text-neon-cyan' : 'text-zinc-600 hover:text-neon-cyan')} transition-colors relative py-1 group`}
            >
              BINGKAI
              <span className={`absolute bottom-0 left-0 w-full h-0.5 bg-neon-cyan origin-left transition-transform duration-300 ${currentPage === 'bingkai' ? 'scale-x-100' : 'scale-x-0 group-hover:scale-x-100'}`} />
            </button>
            <button 
              onClick={() => onNavigate('galeri')}
              className={`${currentPage === 'galeri' ? 'text-neon-cyan font-bold' : (theme === 'dark' ? 'text-zinc-400 hover:text-neon-cyan' : 'text-zinc-600 hover:text-neon-cyan')} transition-colors relative py-1 group`}
            >
              GALERI FOTO
              <span className={`absolute bottom-0 left-0 w-full h-0.5 bg-neon-cyan origin-left transition-transform duration-300 ${currentPage === 'galeri' ? 'scale-x-100' : 'scale-x-0 group-hover:scale-x-100'}`} />
            </button>
            <button 
              onClick={() => onNavigate('album')}
              className={`${currentPage === 'album' ? 'text-neon-cyan font-bold' : (theme === 'dark' ? 'text-zinc-400 hover:text-neon-cyan' : 'text-zinc-600 hover:text-neon-cyan')} transition-colors relative py-1 group`}
            >
              ALBUM COBA
              <span className={`absolute bottom-0 left-0 w-full h-0.5 bg-neon-cyan origin-left transition-transform duration-300 ${currentPage === 'album' ? 'scale-x-100' : 'scale-x-0 group-hover:scale-x-100'}`} />
            </button>
          </nav>

          {/* Collapsible Info Button, Dark/Light Toggle & Mobile Hamburger */}
          <div className="flex items-center space-x-2">
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
                  onClick={() => { onNavigate('bingkai'); setIsOpen(false); }}
                  className={`p-3 rounded border text-center transition-all ${
                    currentPage === 'bingkai' 
                      ? 'border-neon-cyan bg-cyan-950/20' 
                      : theme === 'dark' 
                        ? 'bg-white/3 border-white/10 hover:border-neon-cyan' 
                        : 'bg-zinc-50 border-zinc-200 text-zinc-800 hover:border-neon-cyan hover:bg-zinc-100'
                  }`}
                >
                  <span className={`block text-[9px] ${theme === 'dark' ? 'text-zinc-500' : 'text-zinc-450'}`}>Daftar</span>
                  <span className={`text-xs font-semibold ${theme === 'dark' ? 'text-zinc-200' : 'text-zinc-800'}`}>BINGKAI</span>
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
                  <span className={`text-xs font-semibold ${theme === 'dark' ? 'text-zinc-200' : 'text-zinc-800'}`}>GALERI</span>
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
                  <span className={`text-xs font-semibold ${theme === 'dark' ? 'text-zinc-200' : 'text-zinc-800'}`}>ALBUM</span>
                </button>
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
