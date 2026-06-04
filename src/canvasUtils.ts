import { Frame, ImageSettings, PlacedSticker } from './types';

// Load an image safely with optional CORS support
export const loadImage = (src: string, isCrossOrigin = true): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    
    // Convert external URLs to proxy-image endpoint to avoid any CORS / canvas taint issues
    let finalSrc = src;
    if (src.startsWith('http')) {
      finalSrc = `/api/proxy-image?url=${encodeURIComponent(src)}`;
    }

    if ((isCrossOrigin || src.startsWith('http')) && !finalSrc.startsWith('data:')) {
      img.crossOrigin = 'anonymous';
    }
    img.onload = () => resolve(img);
    img.onerror = (e) => reject(new Error(`Gagal memuat gambar: ${src}`));
    img.src = finalSrc;
  });
};

// Convert SVG string to data URL
export const svgToDataUrl = (svgContent: string): string => {
  const blob = new Blob([svgContent], { type: 'image/svg+xml;charset=utf-8' });
  return URL.createObjectURL(blob);
};

// Formulate CSS filter string for canvas context or styling
export const getCssFilterString = (settings: ImageSettings): string => {
  return [
    `brightness(${settings.brightness}%)`,
    `contrast(${settings.contrast}%)`,
    `saturate(${settings.saturate}%)`,
    `hue-rotate(${settings.hueRotate}deg)`,
    `blur(${settings.blur}px)`,
  ].join(' ');
};

interface RenderParams {
  userImageSrc: string | null;
  frame: Frame;
  neonColor: string;
  settings: ImageSettings;
  stickers: PlacedSticker[];
  presetStickerSvgPaths: Record<string, string>;
  isDownloading?: boolean; // Can render higher resolution for download
  size?: number;
}

export const renderToCanvas = async (
  canvas: HTMLCanvasElement,
  params: RenderParams
): Promise<void> => {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const size = params.size || 1000; // Custom resolution size or 1000px HD default
  canvas.width = size;
  canvas.height = size;
  
  // Clear canvas
  ctx.clearRect(0, 0, size, size);
  
  // 1. Draw solid dark background in case user image is transparent or not uploaded
  ctx.fillStyle = '#0a0a0f';
  ctx.fillRect(0, 0, size, size);

  // 2. Draw user image if available
  if (params.userImageSrc) {
    try {
      const img = await loadImage(params.userImageSrc, false); // Local upload doesn't need CORS
      ctx.save();
      
      // Center of canvas for easy panning/rotation
      ctx.translate(size / 2, size / 2);
      
      // Apply offset adjustments (mapped to canvas resolution scale)
      const posX = (params.settings.x / 100) * size;
      const posY = (params.settings.y / 100) * size;
      ctx.translate(posX, posY);
      
      // Apply rotation
      ctx.rotate((params.settings.rotation * Math.PI) / 180);
      
      // Apply flips
      const scaleH = params.settings.flipH ? -1 : 1;
      const scaleV = params.settings.flipV ? -1 : 1;
      ctx.scale(scaleH, scaleV);

      // Determine size to cover or contain
      let drawW = size * params.settings.scale;
      let drawH = size * params.settings.scale;
      
      // Maintain aspect ratio
      const imgRatio = img.width / img.height;
      if (imgRatio > 1) {
        drawW = drawH * imgRatio;
      } else {
        drawH = drawW / imgRatio;
      }

      // Draw user image with active filter properties
      ctx.filter = getCssFilterString(params.settings);
      
      // Draw image centered at the translated coordinate
      ctx.drawImage(img, -drawW / 2, -drawH / 2, drawW, drawH);
      ctx.restore();
    } catch (err) {
      console.error("Error drawing user image on canvas:", err);
    }
  } else {
    // Elegant space placeholder
    ctx.font = '30px "JetBrains Mono", monospace';
    ctx.fillStyle = params.neonColor;
    ctx.textAlign = 'center';
    ctx.fillText('[ SILAHKAN UNGGAH FOTO ANDA ]', size / 2, size / 2);
  }

  // Draw cyber digital noise if enabled
  if (params.settings.noise) {
    ctx.save();
    ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
    for (let i = 0; i < size; i += 4) {
      for (let j = 0; j < size; j += 4) {
        if (Math.random() > 0.5) {
          ctx.fillRect(i, j, 2, 2);
        }
      }
    }
    ctx.restore();
  }

  // 3. Draw frame layer on top of user image
  try {
    let frameImg: HTMLImageElement;
    let tempUrl: string | null = null;

    if (params.frame.type === 'procedural' && params.frame.renderSvg) {
      const svgString = params.frame.renderSvg(params.neonColor);
      tempUrl = svgToDataUrl(svgString);
      frameImg = await loadImage(tempUrl, true);
    } else {
      frameImg = await loadImage(params.frame.src, true);
    }

    ctx.save();
    ctx.filter = 'none'; // Ensure the frame remains completely authentic without photo filters
    ctx.drawImage(frameImg, 0, 0, size, size);
    ctx.restore();

    if (tempUrl) {
      URL.revokeObjectURL(tempUrl);
    }
  } catch (err) {
    console.error("CORS / Gagal memuat bingkai pada canvas:", err);
    
    // Aesthetic error border drawn directly on canvas for diagnostics
    ctx.save();
    ctx.strokeStyle = params.neonColor;
    ctx.lineWidth = 10;
    ctx.strokeRect(20, 20, size-40, size-40);
    ctx.font = '24px "Space Grotesk", sans-serif';
    ctx.fillStyle = '#ff2a74';
    ctx.fillText('!] Error memuat frame eksternal (CORS) [!', size / 2, 80);
    ctx.restore();
  }

  // 4. Draw placed stickers and text
  for (const item of params.stickers) {
    ctx.save();
    const xPos = (item.x / 100) * size;
    const yPos = (item.y / 100) * size;
    ctx.translate(xPos, yPos);
    ctx.rotate((item.rotation * Math.PI) / 180);

    const sSize = params.settings.scale * item.scale * 150; // Reference sticker size

    if (item.type === 'sticker' && item.stickerId) {
      const path = params.presetStickerSvgPaths[item.stickerId];
      if (path) {
        ctx.strokeStyle = item.color || params.neonColor;
        ctx.lineWidth = 4;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        
        // Render simple SVG Path beautifully scaled
        const p = new Path2D(path);
        ctx.save();
        ctx.scale(sSize/100, sSize/100);
        ctx.translate(-50, -50); // center path
        ctx.stroke(p);
        
        // Add double glowing stroke path
        ctx.shadowColor = item.color || params.neonColor;
        ctx.shadowBlur = 10;
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1.5;
        ctx.stroke(p);
        ctx.restore();
      }
    } else if (item.type === 'text' && item.text) {
      // Draw high tech indicator texts with neon shadows
      ctx.shadowColor = item.color || params.neonColor;
      ctx.shadowBlur = 8;
      const fFamily = item.fontFamily || 'Orbitron';
      ctx.font = `bold ${Math.round(sSize)}px "${fFamily}", sans-serif`;
      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(item.text, 0, 0);

      // Code line indicator under text
      ctx.shadowBlur = 0;
      ctx.strokeStyle = item.color || params.neonColor;
      ctx.lineWidth = 2;
      const textWidth = ctx.measureText(item.text).width;
      ctx.beginPath();
      ctx.moveTo(-textWidth/2 - 10, sSize/2 + 6);
      ctx.lineTo(textWidth/2 + 10, sSize/2 + 6);
      ctx.stroke();
    }
    
    ctx.restore();
  }
};
