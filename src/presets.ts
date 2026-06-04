import { Frame, FilterPreset, PresetSticker } from './types';

export const FILTER_PRESETS: FilterPreset[] = [
  {
    id: 'none',
    name: 'Asli',
    description: 'Tanpa filter tambahan',
    settings: {
      brightness: 100,
      contrast: 100,
      saturate: 100,
      hueRotate: 0,
      blur: 0,
    }
  },
  {
    id: 'cyberpunk',
    name: 'Cyberpunk Neon',
    description: 'Neon pink & cyan, kontras tinggi & futuristik',
    settings: {
      brightness: 110,
      contrast: 130,
      saturate: 160,
      hueRotate: 340,
    },
    glowColor: '#ff2a74'
  },
  {
    id: 'synthwave',
    name: 'Synthwave Sunset',
    description: 'Nuansa hangat retro 80-an dengan rona ungu',
    settings: {
      brightness: 105,
      contrast: 115,
      saturate: 140,
      hueRotate: 280,
    },
    glowColor: '#9d4edd'
  },
  {
    id: 'vhs',
    name: 'Retro VHS Glitch',
    description: 'Kombinasi retro analog TV dan warna terdistorsi',
    settings: {
      brightness: 95,
      contrast: 120,
      saturate: 80,
      blur: 0.5,
    },
    glowColor: '#00f2fe'
  },
  {
    id: 'hologram',
    name: 'Hologram-Tek',
    description: 'Monokromatik cyan bertema fiksi ilmiah',
    settings: {
      brightness: 120,
      contrast: 110,
      saturate: 40,
      hueRotate: 160,
    },
    glowColor: '#00f2fe'
  },
  {
    id: 'matrix',
    name: 'Matrix Grid',
    description: 'Warna hijau sandi komputer retro',
    settings: {
      brightness: 90,
      contrast: 140,
      saturate: 120,
      hueRotate: 90,
    },
    glowColor: '#39ff14'
  },
  {
    id: 'mono',
    name: 'Terminal Mono',
    description: 'Hitam-putih beresolusi tinggi yang tajam',
    settings: {
      brightness: 100,
      contrast: 150,
      saturate: 0,
    }
  },
  {
    id: 'dreamy',
    name: 'Aesthetic Warm',
    description: 'Sangat estetik, rona hangat yang lembut',
    settings: {
      brightness: 115,
      contrast: 95,
      saturate: 125,
      hueRotate: 15,
    }
  }
];

export const PRESET_STICKERS: PresetSticker[] = [
  // Hapus semua stiker HUD karena sudah diminta dihapus
];

export const FRAMES: Frame[] = [
  {
    id: 'static-qcc-1',
    name: 'QCC & SS 2026 - Frame 1',
    src: '/frames/qcc1.png',
    type: 'static',
    category: 'Sponsor',
    description: 'Bingkai QCC & SS Convention 2026'
  },
  {
    id: 'static-qcc-2',
    name: 'QCC & SS 2026 - Frame 2',
    src: '/frames/qcc2.png',
    type: 'static',
    category: 'Sponsor',
    description: 'Bingkai QCC & SS Convention 2026'
  },
  {
    id: 'static-qcc-3',
    name: 'QCC & SS 2026 - Frame 3',
    src: '/frames/qcc3.png',
    type: 'static',
    category: 'Sponsor',
    description: 'Bingkai QCC & SS Convention 2026'
  },
  {
    id: 'static-qcc-4',
    name: 'QCC & SS 2026 - Frame 4',
    src: '/frames/qcc4.png',
    type: 'static',
    category: 'Sponsor',
    description: 'Bingkai QCC & SS Convention 2026'
  },
  {
    id: 'static-qcc-5',
    name: 'QCC & SS 2026 - Frame 5',
    src: '/frames/qcc5.png',
    type: 'static',
    category: 'Sponsor',
    description: 'Bingkai QCC & SS Convention 2026'
  },
  {
    id: 'static-qcc-6',
    name: 'QCC & SS 2026 - Frame 6',
    src: '/frames/qcc6.png',
    type: 'static',
    category: 'Sponsor',
    description: 'Bingkai QCC & SS Convention 2026'
  },
  {
    id: 'static-qcc-7',
    name: 'QCC & SS 2026 - Frame 7',
    src: '/frames/qcc7.png',
    type: 'static',
    category: 'Sponsor',
    description: 'Bingkai QCC & SS Convention 2026'
  },
  {
    id: 'static-qcc-8',
    name: 'QCC & SS 2026 - Frame 8',
    src: '/frames/qcc8.png',
    type: 'static',
    category: 'Sponsor',
    description: 'Bingkai QCC & SS Convention 2026'
  }
];
