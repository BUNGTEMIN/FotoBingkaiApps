import { Frame, ImageSettings, PlacedSticker } from './types';

// Helper to resolve relative API routes to direct full-stack backend URL if hosted on a static domain
export const resolveApiUrl = (apiPath: string): string => {
  if (apiPath.startsWith('http://') || apiPath.startsWith('https://')) return apiPath;
  const host = window.location.hostname;
  // Use absolute backend URL ONLY if hosted on an external static domain (like Firebase/web.app)
  // If we are already on localhost or the native Cloud Run url (*.run.app), we can safely use relative paths.
  if (!host.includes('localhost') && !host.includes('127.0.0.1') && !host.includes('.run.app')) {
    const cloudRunBaseUrl = 'https://ais-pre-h437zomktk5zw36hxyzbwi-844303505958.asia-southeast1.run.app';
    return `${cloudRunBaseUrl}${apiPath}`;
  }
  return apiPath;
};

// Load an image safely with optimal CORS support and smart fallback options
export const loadImage = (src: string, isCrossOrigin = true): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    // 1. Convert external URLs to proxy-image endpoint to resolve relative paths and bypass CORS
    let finalSrc = src;
    let isUsingProxy = false;
    
    // Only proxy actual http/https external URLs that point to different origins
    // Wait, if it's already an absolute URL to our own backend, we don't need to proxy it twice.
    if (src.startsWith('http') && !src.includes(window.location.hostname)) {
      finalSrc = resolveApiUrl(`/api/proxy-image?url=${encodeURIComponent(src)}`);
      isUsingProxy = true;
    }

    const img = new Image();
    
    // Do NOT set crossOrigin="anonymous" for purely local relative paths to prevent strict CORS blocks on static hosts
    const isLocalRelative = src.startsWith('/') || src.startsWith('./') || src.startsWith('../');
    if ((isCrossOrigin || src.startsWith('http')) && !isLocalRelative && !finalSrc.startsWith('data:')) {
      img.crossOrigin = 'anonymous';
    }

    img.onload = () => resolve(img);

    img.onerror = () => {
      // Avoid browser cache from the previously failed request
      const cacheBustedSrc = src + (src.includes('?') ? '&' : '?') + 'fallback=' + Date.now();
      
      // Fallback 1: If using the proxy failed (e.g. network/dns or proxy down), retry direct original source with CORS
      if (isUsingProxy) {
        console.warn(`[CORS Helper] Proxy failed to load for: ${src}. Retrying with direct URL with CORS...`);
        const fallbackImg = new Image();
        fallbackImg.crossOrigin = 'anonymous';
        fallbackImg.onload = () => resolve(fallbackImg);
        fallbackImg.onerror = () => {
          // Fallback 2: Direct load with CORS failed, try loading raw direct URL as last resort (will display but might taint canvas)
          console.warn(`[CORS Helper] Direct CORS failed for: ${src}. Attempting raw loading as last resort...`);
          const rawImg = new Image();
          rawImg.onload = () => resolve(rawImg);
          rawImg.onerror = (err) => reject(new Error(`Gagal memuat gambar: ${src}`));
          rawImg.src = cacheBustedSrc;
        };
        fallbackImg.src = src;
      } else {
        // Simple direct load failed, try direct raw loading
        const rawImg = new Image();
        rawImg.onload = () => resolve(rawImg);
        rawImg.onerror = (err) => reject(new Error(`Gagal memuat gambar: ${src}`));
        rawImg.src = cacheBustedSrc;
      }
    };

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
      
      // Apply absolute centered crop path first based on maskShape
      if (params.settings.maskShape && params.settings.maskShape !== 'square') {
        ctx.beginPath();
        const centerX = size / 2;
        const centerY = size / 2;
        const radius = size * 0.44; // standard fit-size crop radius

        if (params.settings.maskShape === 'circle') {
          ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
        } else if (params.settings.maskShape === 'hexagon') {
          for (let i = 0; i < 6; i++) {
            const angle = (i * Math.PI) / 3 - Math.PI / 2; // top-centered
            const x = centerX + radius * Math.cos(angle);
            const y = centerY + radius * Math.sin(angle);
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
          }
          ctx.closePath();
        } else if (params.settings.maskShape === 'octagon') {
          for (let i = 0; i < 8; i++) {
            const angle = (i * Math.PI) / 4 - Math.PI / 8;
            const x = centerX + radius * Math.cos(angle);
            const y = centerY + radius * Math.sin(angle);
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
          }
          ctx.closePath();
        }
        ctx.clip();
      }

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

  // Draw cyber digital scanlines and vignette overlay if enabled
  if (params.settings.scanlines) {
    ctx.save();
    ctx.fillStyle = 'rgba(0, 240, 255, 0.04)'; // cyber neon cyan soft scanlines
    for (let y = 0; y < size; y += 8) {
      ctx.fillRect(0, y, size, 3);
    }
    // Add electronic CRT screen vignette gradient
    const vignette = ctx.createRadialGradient(size/2, size/2, size*0.4, size/2, size/2, size*0.75);
    vignette.addColorStop(0, 'rgba(0, 0, 0, 0)');
    vignette.addColorStop(1, 'rgba(0, 0, 0, 0.5)');
    ctx.fillStyle = vignette;
    ctx.fillRect(0, 0, size, size);
    ctx.restore();
  }

  // 3. Draw frame layer on top of user image
  try {
    let frameImg: HTMLImageElement;
    let tempUrl: string | null = null;

    if (params.frame.type === 'procedural') {
      let svgString = '';
      if (params.frame.renderSvg) {
        svgString = params.frame.renderSvg(params.neonColor);
      } else if (params.frame.svgElements) {
        // Fallback for custom frames retrieved from JSON/localStorage where renderSvg function is lost
        const rendered = params.frame.svgElements
          .replace(/HIGHLIGHT_COLOR/g, params.neonColor)
          .replace(/currentColor/g, params.neonColor);
        
        svgString = `<svg width="1000" height="1000" viewBox="0 0 1000 1000" fill="none" xmlns="http://www.w3.org/2000/svg">
          ${rendered}
        </svg>`;
      }
      
      if (svgString) {
        tempUrl = svgToDataUrl(svgString);
        frameImg = await loadImage(tempUrl, true);
      } else {
         // Should not happen, but safe fallback
         frameImg = new Image();
         frameImg.src = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjwvc3ZnPg=='; // empty svg
         await new Promise((res) => { frameImg.onload = res; frameImg.onerror = res; });
      }
    } else {
      frameImg = await loadImage(resolveApiUrl(params.frame.src), true);
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

  // 4. Draw placed stickers and text (Only during final download to avoid double rendering with HTML interactive layers)
  if (params.isDownloading) {
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
        const fFamily = item.fontFamily || 'Orbitron';
        ctx.font = `bold ${Math.round(sSize)}px "${fFamily}", sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        const baseColor = item.color || params.neonColor;
        const style = item.textStyle || 'plain';

        if (style === 'neon') {
          // Neon glow effect
          ctx.shadowColor = baseColor;
          ctx.shadowBlur = 15;
          ctx.fillStyle = '#ffffff';
          ctx.fillText(item.text, 0, 0);
          
          ctx.shadowBlur = 30;
          ctx.fillText(item.text, 0, 0);

          ctx.shadowBlur = 5;
          ctx.lineWidth = 2;
          ctx.strokeStyle = baseColor;
          ctx.strokeText(item.text, 0, 0);
        } else if (style === 'glitch') {
          // Glitch split effect
          ctx.shadowBlur = 0;
          
          ctx.globalAlpha = 0.8;
          ctx.fillStyle = '#0ff'; // cyan
          ctx.fillText(item.text, -3, 0);
          
          ctx.fillStyle = '#f0f'; // magenta
          ctx.fillText(item.text, 3, 0);
          
          ctx.globalAlpha = 1;
          ctx.fillStyle = '#ffffff';
          ctx.fillText(item.text, 0, 0);
        } else if (style === 'hologram') {
          // Holographic semitransparent effect
          ctx.shadowColor = '#0ff';
          ctx.shadowBlur = 10;
          
          const gradient = ctx.createLinearGradient(0, -sSize/2, 0, sSize/2);
          gradient.addColorStop(0, 'rgba(0, 255, 255, 0.9)');
          gradient.addColorStop(0.5, 'rgba(255, 0, 255, 0.8)');
          gradient.addColorStop(1, 'rgba(0, 255, 255, 0.9)');
          
          ctx.fillStyle = gradient;
          ctx.fillText(item.text, 0, 0);
          
          // Slight white stroke
          ctx.lineWidth = 1;
          ctx.strokeStyle = 'rgba(255,255,255,0.8)';
          ctx.strokeText(item.text, 0, 0);
        } else if (style === 'chrome') {
          // Metallic chrome effect
          const gradient = ctx.createLinearGradient(0, -sSize/2, 0, sSize/2);
          gradient.addColorStop(0, '#ffffff');
          gradient.addColorStop(0.48, '#aaaaaa');
          gradient.addColorStop(0.5, '#222222');
          gradient.addColorStop(0.52, '#000000');
          gradient.addColorStop(1, '#666666');
          
          ctx.shadowColor = '#000000';
          ctx.shadowBlur = 10;
          ctx.fillStyle = gradient;
          ctx.fillText(item.text, 0, 0);
          
          ctx.shadowBlur = 0;
          ctx.lineWidth = 1;
          ctx.strokeStyle = '#ffffff';
          ctx.strokeText(item.text, 0, 0);
        } else {
          // Default Plain text with slight shadow and underline
          ctx.shadowColor = baseColor;
          ctx.shadowBlur = 8;
          ctx.fillStyle = '#ffffff';
          ctx.fillText(item.text, 0, 0);
  
          ctx.shadowBlur = 0;
          ctx.strokeStyle = baseColor;
          ctx.lineWidth = 2;
          const textWidth = ctx.measureText(item.text).width;
          ctx.beginPath();
          ctx.moveTo(-textWidth/2 - 10, sSize/2 + 6);
          ctx.lineTo(textWidth/2 + 10, sSize/2 + 6);
          ctx.stroke();
        }
      }
      
      ctx.restore();
    }
  }
};
