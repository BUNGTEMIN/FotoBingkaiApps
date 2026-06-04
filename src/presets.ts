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
  { id: 'hud-target', name: 'Scope Target', svgPath: 'M 10 10 L 30 10 M 10 10 L 10 30 M 90 10 L 70 10 M 90 10 L 90 30 M 10 90 L 30 90 M 10 90 L 10 70 M 90 90 L 70 90 M 90 90 L 90 70 M 50 10 L 50 20 M 50 90 L 50 80 M 10 50 L 20 50 M 90 50 L 80 50', color: '#00f2fe' },
  { id: 'tech-cross', name: 'Grid Cursor', svgPath: 'M 50 10 L 50 40 M 50 60 L 50 90 M 10 50 L 40 50 M 60 50 L 90 50 M 35 35 L 40 35 M 35 35 L 35 40 M 65 35 L 60 35 M 65 35 L 65 40 M 35 65 L 40 65 M 35 65 L 35 60 M 65 65 L 60 65 M 65 65 L 65 60', color: '#39ff14' },
  { id: 'cyber-badge', name: 'AI Core Auth', svgPath: 'M 30 10 L 70 10 L 90 30 L 90 70 L 70 90 L 30 90 L 10 70 L 10 30 Z M 35 25 L 65 25 L 75 35 L 75 65 L 65 75 L 35 75 L 25 65 L 25 35 Z', color: '#f35588' },
  { id: 'warning-sign', name: 'Warning HUD', svgPath: 'M 50 10 L 90 80 L 10 80 Z M 50 35 L 50 60 M 50 68 L 50 72', color: '#e0a96d' },
  { id: 'audio-wave', name: 'Grid Equalizer', svgPath: 'M 10 50 L 10 60 L 25 30 L 25 70 L 40 10 L 40 90 L 55 20 L 55 80 L 70 40 L 70 60 L 85 50 L 85 50', color: '#9d4edd' },
];

export const FRAMES: Frame[] = [
  // Beautiful interactive procedural Frames first
  {
    id: 'cyber-hud-1',
    name: 'Cybernetic HUD Pro',
    src: '',
    type: 'procedural',
    category: 'Futuristik',
    description: 'Bingkai lingkaran HUD dengan data telemetri sci-fi neon',
    renderSvg: (color) => `
      <svg width="1000" height="1000" viewBox="0 0 1000 1000" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <radialGradient id="neonGlow" cx="50%" cy="50%" r="50%">
            <stop offset="70%" stop-color="#000000" stop-opacity="0" />
            <stop offset="95%" stop-color="${color}" stop-opacity="0.3" />
            <stop offset="100%" stop-color="${color}" stop-opacity="0.7" />
          </radialGradient>
        </defs>
        
        <!-- Vignette Glow Edge -->
        <rect width="1000" height="1000" fill="url(#neonGlow)" />
        
        <!-- Outer Glowing HUD Circle -->
        <circle cx="500" cy="500" r="460" stroke="${color}" stroke-width="2" stroke-opacity="0.4" />
        <circle cx="500" cy="500" r="450" stroke="${color}" stroke-width="8" stroke-dasharray="250 80 400 100 80 45" />
        
        <!-- Tech corners -->
        <path d="M 50 100 L 50 50 L 100 50" stroke="${color}" stroke-width="6" stroke-linecap="square" />
        <path d="M 950 100 L 950 50 L 900 50" stroke="${color}" stroke-width="6" stroke-linecap="square" />
        <path d="M 50 900 L 50 950 L 100 950" stroke="${color}" stroke-width="6" stroke-linecap="square" />
        <path d="M 950 900 L 950 950 L 900 950" stroke="${color}" stroke-width="6" stroke-linecap="square" />
        
        <!-- Outer Sci-Fi Grid lines -->
        <line x1="50" y1="500" x2="120" y2="500" stroke="${color}" stroke-width="3" />
        <line x1="880" y1="500" x2="950" y2="500" stroke="${color}" stroke-width="3" />
        <line x1="500" y1="50" x2="500" y2="120" stroke="${color}" stroke-width="3" />
        <line x1="500" y1="880" x2="500" y2="950" stroke="${color}" stroke-width="3" />
        
        <!-- Circular HUD ticks -->
        <circle cx="500" cy="500" r="420" stroke="${color}" stroke-width="2" stroke-dasharray="4 8" stroke-opacity="0.5" />
        <circle cx="500" cy="500" r="390" stroke="${color}" stroke-width="1" stroke-dasharray="10 30 40 20" stroke-opacity="0.3" />
        
        <!-- Telemetry Text elements -->
        <text x="75" y="490" fill="${color}" font-family="monospace" font-size="14" letter-spacing="2">SYS_ACTIVE</text>
        <text x="830" y="490" fill="${color}" font-family="monospace" font-size="14" letter-spacing="2">LAT_0.04ms</text>
        <text x="440" y="940" fill="${color}" font-family="monospace" font-size="18" font-weight="bold" letter-spacing="4">BUNGTEMIN_NET</text>
        <text x="390" y="80" fill="${color}" font-family="monospace" font-size="18" font-weight="bold" letter-spacing="6">HUMAN_UPGRADE v2.0</text>
        
        <!-- Aesthetic Code Blocks / Coordinate ticks -->
        <rect x="75" y="120" width="12" height="4" fill="${color}" />
        <rect x="95" y="120" width="60" height="4" fill="${color}" fill-opacity="0.4" />
        <rect x="950" y="120" width="4" height="4" fill="${color}" />
        
        <circle cx="500" cy="500" r="6" fill="${color}" />
        <path d="M 490 500 L 510 500 M 500 490 L 500 510" stroke="${color}" stroke-width="1.5" />
      </svg>
    `
  },
  {
    id: 'cyber-grid-2',
    name: 'Future Glitch Grid',
    src: '',
    type: 'procedural',
    category: 'Futuristik',
    description: 'Sistem bingkai sci-fi holografis berbasis sasis mekanis',
    renderSvg: (color) => `
      <svg width="1000" height="1000" viewBox="0 0 1000 1000" fill="none" xmlns="http://www.w3.org/2000/svg">
        <!-- Semi transparent dark borders -->
        <path d="M0 0 H1000 V1000 H0 Z" fill="none" stroke="${color}" stroke-width="16" stroke-opacity="0.3" />
        
        <!-- Polygon Cut corners -->
        <path d="M 0 150 L 150 0 M 850 0 L 1000 150 M 1000 850 L 850 1000 M 150 1000 L 0 850" stroke="${color}" stroke-width="10" />
        <path d="M 0 170 L 170 0 M 830 0 L 1000 170 M 1000 830 L 830 1000 M 170 1000 L 0 830" stroke="${color}" stroke-width="3" stroke-dasharray="10 20" />
        
        <!-- Cyber grid markers -->
        <rect x="35" y="35" width="20" height="20" stroke="${color}" stroke-width="3" fill="none" />
        <rect x="945" y="35" width="20" height="20" stroke="${color}" stroke-width="3" fill="none" />
        <rect x="35" y="945" width="20" height="20" stroke="${color}" stroke-width="3" fill="none" />
        <rect x="945" y="945" width="20" height="20" stroke="${color}" stroke-width="3" fill="none" />
        
        <!-- Modern minimalist frame labels -->
        <text x="210" y="70" fill="${color}" font-family="'Orbitron', sans-serif" font-size="28" font-weight="900" letter-spacing="4">AUTHORIZED AGENT</text>
        <text x="210" y="955" fill="${color}" font-family="'JetBrains Mono', monospace" font-size="14" letter-spacing="2">HASH: NULL_NODE_66 // EXP: 2026.06.03</text>
        <text x="750" y="955" fill="${color}" font-family="'JetBrains Mono', monospace" font-size="14" font-weight="bold">BT_NUCLEUS</text>
        
        <!-- Vertical futuristic progress bar -->
        <line x1="80" y1="200" x2="80" y2="800" stroke="${color}" stroke-width="2" stroke-opacity="0.3" />
        <line x1="80" y1="250" x2="80" y2="400" stroke="${color}" stroke-width="6" />
        <line x1="80" y1="600" x2="80" y2="750" stroke="${color}" stroke-width="6" />
        
        <line x1="920" y1="200" x2="920" y2="800" stroke="${color}" stroke-width="2" stroke-opacity="0.3" />
        <line x1="920" y1="300" x2="920" y2="550" stroke="${color}" stroke-width="6" />
      </svg>
    `
  },
  {
    id: 'minimal-glowing-ring',
    name: 'Aesthetic Neon Ring',
    src: '',
    type: 'procedural',
    category: 'Minimalis',
    description: 'Cincin cahaya bersinar lembut dengan tipografi estetik modern',
    renderSvg: (color) => `
      <svg width="1000" height="1000" viewBox="0 0 1000 1000" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="15" result="blur" />
            <feMerge>
              <feMergeNode in="blur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>
        
        <!-- Soft Circular Glow Interface -->
        <circle cx="500" cy="500" r="430" stroke="${color}" stroke-width="5" filter="url(#glow)" />
        <circle cx="500" cy="500" r="436" stroke="${color}" stroke-width="1" stroke-opacity="0.5" />
        <circle cx="500" cy="500" r="420" stroke="#000000" stroke-width="2" stroke-opacity="0.8" />
        <circle cx="500" cy="500" r="424" stroke="${color}" stroke-width="1.5" stroke-dasharray="6 30" />
        
        <!-- Modern clean lettering curving on top/bottom -->
        <text x="500" y="110" fill="${color}" font-family="'Space Grotesk', sans-serif" font-size="24" font-weight="700" text-anchor="middle" letter-spacing="12">CREATOR INITIATIVE</text>
        <text x="500" y="915" fill="${color}" font-family="'Space Grotesk', sans-serif" font-size="20" font-weight="500" text-anchor="middle" letter-spacing="6">BUNGTEMIN_NET // FUTURE_VIBES</text>

        <!-- Dynamic aesthetic elements -->
        <path d="M 220 500 L 250 500" stroke="${color}" stroke-width="2" />
        <path d="M 750 500 L 780 500" stroke="${color}" stroke-width="2" />
      </svg>
    `
  },
  {
    id: 'cyber-retro-sunset',
    name: 'Synthwave Sunset Grid',
    src: '',
    type: 'procedural',
    category: 'Futuristik',
    description: 'Estetika retro 80-an yang futuristik dengan matahari terbenam fiksi',
    renderSvg: (color) => `
      <svg width="1000" height="1000" viewBox="0 0 1000 1000" fill="none" xmlns="http://www.w3.org/2000/svg">
        <!-- Grid horizontal lines starting from 650 down to 1000 -->
        <g stroke="${color}" stroke-width="1.5" stroke-opacity="0.4">
          <line x1="0" y1="700" x2="1000" y2="700" />
          <line x1="0" y1="740" x2="1000" y2="740" />
          <line x1="0" y1="790" x2="1000" y2="790" />
          <line x1="0" y1="850" x2="1000" y2="850" />
          <line x1="0" y1="920" x2="1000" y2="920" />
          <line x1="0" y1="990" x2="1000" y2="990" />
        </g>
        
        <!-- Grid perspective vertical lines -->
        <g stroke="${color}" stroke-width="2" stroke-opacity="0.4">
          <line x1="500" y1="660" x2="500" y2="1000" />
          
          <line x1="500" y1="660" x2="300" y2="1000" />
          <line x1="500" y1="660" x2="700" y2="1000" />
          
          <line x1="500" y1="660" x2="100" y2="1000" />
          <line x1="500" y1="660" x2="900" y2="1000" />
          
          <line x1="500" y1="660" x2="-100" y2="1000" />
          <line x1="500" y1="660" x2="1100" y2="1000" />
        </g>
        
        <!-- Synthetic digital horizon neon line -->
        <line x1="0" y1="665" x2="1000" y2="665" stroke="${color}" stroke-width="6" />
        
        <!-- Cyber mountains / retro silhouettes in the bottom -->
        <path d="M 0 665 L 120 590 L 250 665 L 380 570 L 600 665 L 750 540 L 900 665 L 1000 610 L 1000 665 Z" fill="#0c0a12" stroke="${color}" stroke-width="2" />
        
        <!-- Sun half circle with horizontal gradient bars -->
        <g opacity="0.85">
          <path d="M 350 665 A 150 150 0 0 1 650 665 Z" fill="${color}" />
          <!-- Slices -->
          <rect x="330" y="650" width="340" height="6" fill="#000" />
          <rect x="330" y="625" width="340" height="8" fill="#000" />
          <rect x="330" y="595" width="340" height="12" fill="#000" />
          <rect x="330" y="555" width="340" height="16" fill="#000" />
        </g>
        
        <!-- Glowing title cards -->
        <rect x="40" y="40" width="220" height="50" fill="rgba(12,10,18,0.8)" stroke="${color}" stroke-width="2" />
        <text x="55" y="72" fill="${color}" font-family="'Orbitron', sans-serif" font-weight="bold" font-size="18" letter-spacing="3">RETRO_CORE</text>
        
        <rect x="740" y="40" width="220" height="50" fill="rgba(12,10,18,0.8)" stroke="${color}" stroke-width="2" />
        <text x="755" y="72" fill="${color}" font-family="'Orbitron', sans-serif" font-weight="bold" font-size="18" letter-spacing="3">BUNGTEMIN</text>
        
        <!-- Corner techno designs -->
        <path d="M 10 300 L 10 990 L 990 990" stroke="${color}" stroke-width="2" stroke-opacity="0.3" />
      </svg>
    `
  },
  
  // Real original Twibbon Frame references from User Request
  // These are from apps.bungtemin.net
  ...Array.from({ length: 36 }, (_, i) => {
    const id = i + 1;
    return {
      id: `rakernit-2025-${id}`,
      name: `Sponsor Frame RAKERNIT #${id}`,
      src: `https://apps.bungtemin.net/images/RAKERNIT2025/${id}.png`,
      type: 'url' as const,
      category: 'Bungtemin' as const,
      description: `Bingkai Resmi Bungtemin.net edisi RAKERNIT 2025 No. ${id}`
    };
  })
];
