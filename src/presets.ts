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
  {
    id: 'badge-verified',
    name: 'Verified',
    svgPath: 'M50 10 L60 25 L78 25 L83 41 L98 50 L83 59 L78 75 L60 75 L50 90 L40 75 L22 75 L17 59 L2 50 L17 41 L22 25 L40 25 Z M42 62 L75 28 L68 21 L42 48 L28 34 L21 41 Z',
  },
  {
    id: 'badge-star',
    name: 'Star Glow',
    svgPath: 'M50 5 L63 35 L95 40 L70 60 L78 95 L50 78 L22 95 L30 60 L5 40 L37 35 Z',
  },
  {
    id: 'badge-shield',
    name: 'Shield',
    svgPath: 'M50 5 L85 20 L85 50 C85 75 50 95 50 95 C50 95 15 75 15 50 L15 20 Z',
  },
  {
    id: 'badge-hexagon',
    name: 'Hexagon',
    svgPath: 'M50 5 L90 25 L90 75 L50 95 L10 75 L10 25 Z',
  },
  {
    id: 'badge-heart',
    name: 'Love',
    svgPath: 'M50 85 C50 85 10 55 10 30 C10 15 25 5 40 15 C50 25 50 25 50 25 C50 25 50 25 60 15 C75 5 90 15 90 30 C90 55 50 85 50 85 Z',
  },
  {
    id: 'badge-circle',
    name: 'Circle Ring',
    svgPath: 'M50 10 A40 40 0 1 1 49.9 10 M50 25 A25 25 0 1 0 50.1 25',
  },
  {
    id: 'badge-bolt',
    name: 'Lightning',
    svgPath: 'M55 5 L20 50 L45 50 L35 95 L80 40 L55 40 Z',
  },
  {
    id: 'badge-crown',
    name: 'Crown',
    svgPath: 'M10 80 L90 80 L90 90 L10 90 Z M10 70 L20 20 L40 50 L50 10 L60 50 L80 20 L90 70 Z',
  },
  {
    id: 'badge-burst',
    name: 'Burst Sale',
    svgPath: 'M50 5 L60 20 L80 15 L78 35 L95 45 L80 60 L85 80 L65 78 L55 95 L40 82 L20 90 L25 70 L5 60 L20 45 L10 25 L30 30 L40 10 Z',
  },
  {
    id: 'badge-play',
    name: 'Play Icon',
    svgPath: 'M30 20 L30 80 L80 50 Z M50 5 A45 45 0 1 1 49.9 5 M50 12 A38 38 0 1 0 50.1 12',
  }
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
