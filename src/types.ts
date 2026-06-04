export interface Frame {
  id: string;
  name: string;
  src: string;
  type: 'url' | 'procedural' | 'file';
  category: string;
  description?: string;
  renderSvg?: (colorTheme: string) => string; // Procedural SVG generator
}

export interface PlacedSticker {
  id: string;
  type: 'sticker' | 'text';
  text?: string;
  fontFamily?: string; // e.g. 'Orbitron', 'Space Grotesk'
  stickerId?: string; // id from preset stickers
  x: number; // percentage (0 - 100)
  y: number; // percentage (0 - 100)
  scale: number;
  rotation: number; // degrees (0 - 360)
  color?: string;
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
}

export interface FilterPreset {
  id: string;
  name: string;
  description: string;
  settings: Partial<ImageSettings>;
  glowColor?: string;
}
