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
  },
  {
    id: 'retro-gold',
    name: 'Neon Gold Luxury',
    description: 'Tampilan tajam dengan rona emas berkelas & kontras mewah',
    settings: {
      brightness: 110,
      contrast: 135,
      saturate: 145,
      hueRotate: 40,
    },
    glowColor: '#ffd700'
  },
  {
    id: 'sapphire',
    name: 'Sapphire Electric',
    description: 'Warna biru kristal safir yang elektrik & fiksi ilmiah tajam',
    settings: {
      brightness: 105,
      contrast: 125,
      saturate: 150,
      hueRotate: 200,
    },
    glowColor: '#00d2ff'
  },
  {
    id: 'vaporwave',
    name: 'Vaporwave Dream',
    description: 'Rona fantasi pastel merah muda & ungu yang santai',
    settings: {
      brightness: 115,
      contrast: 105,
      saturate: 155,
      hueRotate: 300,
    },
    glowColor: '#ff71ce'
  },
  {
    id: 'emerald-glitch',
    name: 'Emerald Matrix',
    description: 'Rona hijau zamrud berkilau dengan efek matriks siber',
    settings: {
      brightness: 100,
      contrast: 130,
      saturate: 120,
      hueRotate: 120,
    },
    glowColor: '#00ff66'
  },
  {
    id: 'solar-flare',
    name: 'Solar Cyber Orange',
    description: 'Semburan jingga energi matahari yang membara & tangguh',
    settings: {
      brightness: 110,
      contrast: 140,
      saturate: 175,
      hueRotate: 20,
    },
    glowColor: '#ff6b00'
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
    name: 'QCC & SS 2026 - Cyber Neon',
    src: '',
    type: 'procedural',
    category: 'Ofisial',
    description: 'Neon HUD Cyber Championship 2026',
    renderSvg: (color: string) => `
      <g>
        <rect x="20" y="20" width="960" height="960" rx="24" fill="none" stroke="${color}" stroke-opacity="0.2" stroke-width="4" />
        <rect x="35" y="35" width="930" height="930" rx="16" fill="none" stroke="${color}" stroke-width="2" stroke-dasharray="100 15 30 15" />
        <rect x="50" y="50" width="900" height="900" rx="10" fill="none" stroke="${color}" stroke-opacity="0.6" stroke-width="1.5" />
        
        <path d="M 20,150 L 20,40 A 20,20 0 0,1 40,20 L 150,20" fill="none" stroke="${color}" stroke-width="8" stroke-linecap="round" />
        <path d="M 980,150 L 980,40 A 20,20 0 0,0 960,20 L 850,20" fill="none" stroke="${color}" stroke-width="8" stroke-linecap="round" />
        <path d="M 20,850 L 20,960 A 20,20 0 0,0 40,980 L 150,980" fill="none" stroke="${color}" stroke-width="8" stroke-linecap="round" />
        <path d="M 980,850 L 980,960 A 20,20 0 0,1 960,980 L 850,980" fill="none" stroke="${color}" stroke-width="8" stroke-linecap="round" />
        
        <path d="M 250,20 L 320,80 L 680,80 L 750,20 Z" fill="#080811" fill-opacity="0.9" stroke="${color}" stroke-width="3" />
        <text x="500" y="54" fill="#ffffff" font-family="'Space Grotesk', system-ui, sans-serif" font-weight="900" font-size="28" letter-spacing="8" text-anchor="middle">QCC &amp; SS CONVENTION</text>
        <text x="500" y="72" fill="${color}" font-family="'JetBrains Mono', monospace" font-weight="700" font-size="12" letter-spacing="4" text-anchor="middle">OFFICIAL INNOVATION SPACE</text>

        <path d="M 200,980 L 270,910 L 730,910 L 800,980 Z" fill="#0c0c16" fill-opacity="0.93" stroke="${color}" stroke-width="3" />
        <text x="500" y="946" fill="#ffffff" font-family="'Space Grotesk', system-ui, sans-serif" font-weight="900" font-size="26" letter-spacing="6" text-anchor="middle">CREATIVE REVOLUTION 2026</text>
        <text x="500" y="966" fill="${color}" font-family="'JetBrains Mono', monospace" font-weight="500" font-size="11" letter-spacing="3" text-anchor="middle">STATUS: ACTIVE // QUALITY CONTROL CIRCLE</text>

        <circle cx="80" cy="500" r="8" fill="${color}" />
        <line x1="80" y1="420" x2="80" y2="580" stroke="${color}" stroke-width="2" stroke-dasharray="8 4" />
        <circle cx="920" cy="500" r="8" fill="${color}" />
        <line x1="920" y1="420" x2="920" y2="580" stroke="${color}" stroke-width="2" stroke-dasharray="8 4" />
      </g>
    `
  },
  {
    id: 'static-qcc-2',
    name: 'QCC & SS 2026 - Gold Luxury',
    src: '',
    type: 'procedural',
    category: 'Ofisial',
    description: 'Gold Luxury Edition Frame 2026',
    renderSvg: (color: string) => `
      <g>
        <rect x="25" y="25" width="950" height="950" rx="36" fill="none" stroke="#ffd700" stroke-width="3" />
        <rect x="40" y="40" width="920" height="920" rx="24" fill="none" stroke="#ffd700" stroke-opacity="0.4" stroke-width="1" />
        <rect x="50" y="50" width="900" height="900" rx="16" fill="none" stroke="#ffd700" stroke-opacity="0.7" stroke-width="2" stroke-dasharray="20 10 5 10" />

        <path d="M 25,120 L 25,45 A 20,20 0 0,1 45,25 L 120,25" fill="none" stroke="#ffd700" stroke-width="6" />
        <path d="M 975,120 L 975,45 A 20,20 0 0,0 955,25 L 880,25" fill="none" stroke="#ffd700" stroke-width="6" />
        <path d="M 25,880 L 25,955 A 20,20 0 0,0 45,975 L 120,975" fill="none" stroke="#ffd700" stroke-width="6" />
        <path d="M 975,880 L 975,955 A 20,20 0 0,1 955,975 L 880,975" fill="none" stroke="#ffd700" stroke-width="6" />

        <path d="M 220,25 L 290,95 L 710,95 L 780,25 Z" fill="#141400" fill-opacity="0.95" stroke="#ffd700" stroke-width="2.5" />
        <text x="500" y="58" fill="#ffd700" font-family="'Space Grotesk', system-ui, sans-serif" font-weight="900" font-size="25" letter-spacing="6" text-anchor="middle">ANNUAL CONVENTION</text>
        <text x="500" y="80" fill="#ffffff" font-family="'JetBrains Mono', monospace" font-weight="700" font-size="14" letter-spacing="4" text-anchor="middle">QCC &amp; SS 2026</text>

        <path d="M 180,975 L 250,905 L 750,905 L 820,975 Z" fill="#141400" fill-opacity="0.95" stroke="#ffd700" stroke-width="2.5" />
        <text x="500" y="938" fill="#ffffff" font-family="'Space Grotesk', system-ui, sans-serif" font-weight="900" font-size="23" letter-spacing="5" text-anchor="middle">EXCELLENCE THROUGH INNOVATION</text>
        <text x="500" y="960" fill="#ffd700" font-family="'JetBrains Mono', monospace" font-weight="600" font-size="11" letter-spacing="2" text-anchor="middle">SHAPING THE FUTURE CONVENTION // 2026</text>
      </g>
    `
  },
  {
    id: 'static-qcc-3',
    name: 'QCC & SS 2026 - Matrix Grid',
    src: '',
    type: 'procedural',
    category: 'Ofisial',
    description: 'Sleek Matrix Cyber Grid Frame',
    renderSvg: (color: string) => `
      <g>
        <rect x="20" y="20" width="960" height="960" rx="16" fill="none" stroke="${color}" stroke-opacity="0.2" stroke-width="5" />
        <rect x="35" y="35" width="930" height="930" rx="10" fill="none" stroke="${color}" stroke-width="2" stroke-dasharray="15 30" />
        
        <path d="M 40,40 L 100,40 M 40,40 L 40,100" fill="none" stroke="${color}" stroke-width="5" />
        <path d="M 960,40 L 900,40 M 960,40 L 960,100" fill="none" stroke="${color}" stroke-width="5" />
        <path d="M 40,960 L 100,960 M 40,960 L 40,900" fill="none" stroke="${color}" stroke-width="5" />
        <path d="M 960,960 L 900,960 M 960,960 L 960,900" fill="none" stroke="${color}" stroke-width="5" />

        <rect x="320" y="20" width="360" height="50" fill="#000" rx="8" stroke="${color}" stroke-width="2" />
        <text x="500" y="52" fill="#fff" font-family="'Space Grotesk', system-ui, sans-serif" font-weight="800" font-size="20" letter-spacing="4" text-anchor="middle">SS &amp; QCC CONVENTION</text>

        <rect x="250" y="930" width="500" height="50" fill="#000" rx="8" stroke="${color}" stroke-width="2" />
        <text x="500" y="961" fill="${color}" font-family="'JetBrains Mono', monospace" font-weight="700" font-size="14" letter-spacing="3" text-anchor="middle">// YEAR: 2026 // WORKSPACE_ONLINE</text>
      </g>
    `
  }
];
