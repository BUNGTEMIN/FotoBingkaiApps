export interface Frame {
  id: string;
  name: string;
  src: string;
  type: 'url' | 'procedural' | 'file' | 'static';
  category: string;
  description?: string;
  renderSvg?: (colorTheme: string) => string; // Procedural SVG generator
  svgElements?: string; // Serialized SVG elements for AI frames
}

export interface PlacedSticker {
  id: string;
  type: 'sticker' | 'text';
  text?: string;
  fontFamily?: string; // e.g. 'Orbitron', 'Space Grotesk'
  textStyle?: 'neon' | 'chrome' | 'glitch' | 'hologram' | 'plain' | '3d' | 'double-neon' | 'curved' | 'glassmorphism' | 'futuristic' | 'claymorphism' | 'funny' | 'brutalist' | 'sunset' | 'cosmic' | 'neo-mint' | 'terracotta' | 'nordic' | 'robotic' | 'retro' | 'comic' | 'cartoon';
  letterSpacing?: number; // Added letter spacing property
  stickerId?: string; // id from preset stickers
  imageUrl?: string; // custom upload or external URL for image-based PNG stickers
  x: number; // percentage (0 - 100)
  y: number; // percentage (0 - 100)
  scale: number;
  rotation: number; // degrees (0 - 360)
  color?: string;
  isLocked?: boolean;
  blendMode?: 'normal' | 'multiply' | 'screen' | 'overlay' | 'darken' | 'lighten' | 'color-dodge' | 'color-burn' | 'hard-light' | 'soft-light' | 'difference' | 'exclusion' | 'hue' | 'saturation' | 'color' | 'luminosity';
  opacity?: number; // range 0 to 1
  flipH?: boolean;
  flipV?: boolean;
}

export interface PresetSticker {
  id: string;
  name: string;
  emoji?: string;
  svgPath?: string;
  color?: string;
}

export interface ImageSettings {
  scale: number; // 0.1 to 3
  rotation: number; // -180 to 180
  x: number; // -100 to 100 percentage or pixel offset
  y: number; // -100 to 100 percentage or pixel offset
  flipH: boolean;
  flipV: boolean;
  brightness: number; // 50 to 150
  contrast: number; // 50 to 150
  saturate: number; // 0 to 200
  hueRotate: number; // 0 to 360
  blur: number; // 0 to 10
  noise: boolean;
  maskShape?: 'square' | 'circle' | 'hexagon' | 'octagon';
  scanlines?: boolean;
}

export interface FilterPreset {
  id: string;
  name: string;
  description: string;
  settings: Partial<ImageSettings>;
  glowColor?: string;
}
