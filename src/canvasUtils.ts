import { Frame, ImageSettings, PlacedSticker } from './types';

// Helper to compress image before loading to canvas
export const compressImage = async (file: File, maxSizeMB: number = 2, maxWidthOrHeight: number = 2048): Promise<string> => {
  return new Promise((resolve, reject) => {
    // If the file is already small enough, we can still process it to ensure it fits dimensions, 
    // but maybe the user just wants the data url. Let's do a reliable canvas-based compression.
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > maxWidthOrHeight || height > maxWidthOrHeight) {
          if (width > height) {
            height = Math.round((height * maxWidthOrHeight) / width);
            width = maxWidthOrHeight;
          } else {
            width = Math.round((width * maxWidthOrHeight) / height);
            height = maxWidthOrHeight;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(img.src);
          return;
        }
        
        ctx.drawImage(img, 0, 0, width, height);

        // Quality setting logic based on file size assumption
        // Actually we just output jpeg 0.8 which is generally good compression
        // We'll preserve PNG if file type is png and we want transparency, but JPEG is smaller.
        const outputType = file.type === 'image/png' ? 'image/png' : 'image/jpeg';
        const quality = outputType === 'image/jpeg' ? 0.8 : undefined;
        
        const dataUrl = canvas.toDataURL(outputType, quality);
        resolve(dataUrl);
      };
      img.onerror = (err) => reject(err);
      img.src = event.target?.result as string;
    };
    reader.onerror = (err) => reject(err);
  });
};
export const resolveApiUrl = (apiPath: string): string => {
  if (apiPath.startsWith('http://') || apiPath.startsWith('https://')) return apiPath;
  const host = window.location.hostname;
  
  // Jika sedang berjalan di localhost atau development AI Studio (yang tidak ada backend server)
  // semua request API langsung diarahkan ke production backend di twibbon.nufat.id
  if (host.includes('localhost') || host.includes('127.0.0.1') || host.includes('.run.app')) {
    return `https://twibbon.nufat.id${apiPath}`;
  }
  
  // Di production (misalnya di-deploy di twibbon.nufat.id atau hosting statis sendiri berpasangan dengan API), gunakan relative path
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
    const host = window.location.hostname;
    const isFirebaseHost = host.includes('qcc-online.web.app') || host.includes('web.app') || host.includes('firebaseapp.com') || host.includes('nufat.id');

    if (src.startsWith('http') && !src.includes(window.location.hostname)) {
      if (src.includes('nudb.bungtemin.net') || src.includes('apps.bungtemin.net') || src.includes('wabot.nufat.id') || src.includes('webspy.nufat.id') || src.includes('dev.bungtemin.net')) {
        // Direct loading for trusted domains to avoid proxy wrapper/CORS/ais-dev- error
        finalSrc = src;
        isUsingProxy = false;
      } else {
        // Pure frontend proxy bypass using the highly reliable images.weserv.nl proxy to bypass CORS
        finalSrc = `https://images.weserv.nl/?url=${encodeURIComponent(src)}`;
        isUsingProxy = true;
      }
    }

    const img = new Image();
    
    // Do NOT set crossOrigin="anonymous" for purely local relative paths to prevent strict CORS blocks on static hosts
    const isLocalRelative = src.startsWith('/') || src.startsWith('./') || src.startsWith('../');
    if ((isCrossOrigin || src.startsWith('http')) && !isLocalRelative && !finalSrc.startsWith('data:') && !finalSrc.startsWith('blob:')) {
      img.crossOrigin = 'anonymous';
    }

    img.onload = () => resolve(img);

    img.onerror = () => {
      // If it is a data: or blob: url, do not attempt to reload or append cache buster
      if (src.startsWith('data:') || src.startsWith('blob:') || isLocalRelative) {
        reject(new Error(`Gagal memuat gambar lokal: ${src}`));
        return;
      }

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

// Helper to ensure SVG contains outer svg root element with appropriate xmlns and viewBox
export const ensureFullSvg = (svgContent: string): string => {
  const content = svgContent.trim();
  if (content.toLowerCase().startsWith('<svg')) {
    return content;
  }
  return `<svg width="1000" height="1000" viewBox="0 0 1000 1000" fill="none" xmlns="http://www.w3.org/2000/svg" style="width:100%; height:100%;">${content}</svg>`;
};

// Convert SVG string to data URL using safe Base64 encoding
export const svgToDataUrl = (svgContent: string): string => {
  const fullSvg = ensureFullSvg(svgContent);
  try {
    const base64 = btoa(unescape(encodeURIComponent(fullSvg)));
    return `data:image/svg+xml;base64,${base64}`;
  } catch (e) {
    return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(fullSvg)}`;
  }
};

// ==========================================
// WEB WORKER FOR HIGH-PERFORMANCE FILTERS
// ==========================================
const workerCode = `
self.onmessage = function(e) {
  const { taskId, imageData, settings } = e.data;
  const { brightness = 100, contrast = 100, saturate = 100, hueRotate = 0, blur = 0 } = settings;
  const data = imageData.data;
  const len = data.length;

  const bFactor = brightness / 100;
  const cFactor = contrast / 100;
  const sFactor = saturate / 100;

  // 1. Hue Rotation Matrix Calculations
  const angle = (hueRotate || 0) * Math.PI / 180;
  const cosA = Math.cos(angle);
  const sinA = Math.sin(angle);

  const rX = 0.213 + cosA * 0.787 - sinA * 0.213;
  const rY = 0.715 - cosA * 0.715 - sinA * 0.715;
  const rZ = 0.072 - cosA * 0.072 + sinA * 0.928;

  const gX = 0.213 - cosA * 0.213 + sinA * 0.143;
  const gY = 0.715 + cosA * 0.285 + sinA * 0.140;
  const gZ = 0.072 - cosA * 0.072 - sinA * 0.283;

  const bX = 0.213 - cosA * 0.213 - sinA * 0.787;
  const bY = 0.715 - cosA * 0.715 + sinA * 0.715;
  const bZ = 0.072 + cosA * 0.928 + sinA * 0.072;

  // Apply Hue, Brightness, Contrast, Saturation inline
  for (let i = 0; i < len; i += 4) {
    let r = data[i];
    let g = data[i+1];
    let b = data[i+2];

    // Hue Rotate
    if (hueRotate !== 0) {
      const rx = r * rX + g * rY + b * rZ;
      const gx = r * gX + g * gY + b * gZ;
      const bx = r * bX + g * bY + b * bZ;
      r = rx;
      g = gx;
      b = bx;
    }

    // Brightness
    if (brightness !== 100) {
      r *= bFactor;
      g *= bFactor;
      b *= bFactor;
    }

    // Contrast
    if (contrast !== 100) {
      r = (r - 128) * cFactor + 128;
      g = (g - 128) * cFactor + 128;
      b = (b - 128) * cFactor + 128;
    }

    // Saturation (luma adjustment)
    if (saturate !== 100) {
      const luma = 0.299 * r + 0.587 * g + 0.114 * b;
      r = luma + (r - luma) * sFactor;
      g = luma + (g - luma) * sFactor;
      b = luma + (b - luma) * sFactor;
    }

    // Clamp
    data[i] = r < 0 ? 0 : r > 255 ? 255 : r;
    data[i+1] = g < 0 ? 0 : g > 255 ? 255 : g;
    data[i+2] = b < 0 ? 0 : b > 255 ? 255 : b;
  }

  // 2. Blur Filter Processing (2-pass 1D Box Blur Approximation)
  if (blur > 0) {
    const width = imageData.width;
    const height = imageData.height;
    const radius = Math.min(10, Math.max(1, Math.round(blur)));
    
    const buffer = new Uint8ClampedArray(data);
    const tempPixels = new Uint8ClampedArray(data); // for vertical pass
    
    // Horizontal blur pass
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        let rSum = 0, gSum = 0, bSum = 0, aSum = 0, count = 0;
        for (let dx = -radius; dx <= radius; dx++) {
          const nx = x + dx;
          if (nx >= 0 && nx < width) {
            const idx = (y * width + nx) * 4;
            rSum += buffer[idx];
            gSum += buffer[idx+1];
            bSum += buffer[idx+2];
            aSum += buffer[idx+3];
            count++;
          }
        }
        const destIdx = (y * width + x) * 4;
        tempPixels[destIdx] = rSum / count;
        tempPixels[destIdx+1] = gSum / count;
        tempPixels[destIdx+2] = bSum / count;
        tempPixels[destIdx+3] = aSum / count;
      }
    }

    // Vertical blur pass
    for (let x = 0; x < width; x++) {
      for (let y = 0; y < height; y++) {
        let rSum = 0, gSum = 0, bSum = 0, aSum = 0, count = 0;
        for (let dy = -radius; dy <= radius; dy++) {
          const ny = y + dy;
          if (ny >= 0 && ny < height) {
            const idx = (ny * width + x) * 4;
            rSum += tempPixels[idx];
            gSum += tempPixels[idx+1];
            bSum += tempPixels[idx+2];
            aSum += tempPixels[idx+3];
            count++;
          }
        }
        const destIdx = (y * width + x) * 4;
        data[destIdx] = rSum / count;
        data[destIdx+1] = gSum / count;
        data[destIdx+2] = bSum / count;
        data[destIdx+3] = aSum / count;
      }
    }
  }

  self.postMessage({ taskId, imageData }, [imageData.data.buffer]);
};
`;

let filterWorker: Worker | null = null;
let currentTaskId = 0;
const processedImageCache = new Map<string, HTMLCanvasElement>();
const pendingPromises = new Map<string, Promise<HTMLCanvasElement>>();
const activeCallbacks = new Map<number, (result: HTMLCanvasElement) => void>();
const activeRejections = new Map<number, (reason: any) => void>();

const initFilterWorker = (): Worker | null => {
  if (filterWorker) return filterWorker;
  try {
    const blob = new Blob([workerCode], { type: 'application/javascript' });
    const workerUrl = URL.createObjectURL(blob);
    filterWorker = new Worker(workerUrl);
    
    filterWorker.onmessage = (e) => {
      const { taskId, imageData } = e.data;
      const resolve = activeCallbacks.get(taskId);
      if (resolve) {
        const canvas = document.createElement('canvas');
        canvas.width = imageData.width;
        canvas.height = imageData.height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.putImageData(imageData, 0, 0);
        }
        resolve(canvas);
        
        activeCallbacks.delete(taskId);
        activeRejections.delete(taskId);
      }
    };

    filterWorker.onerror = (err) => {
      console.error("Web Worker error:", err);
      activeRejections.forEach((reject) => reject(err));
      activeCallbacks.clear();
      activeRejections.clear();
      filterWorker = null;
    };

    return filterWorker;
  } catch (err) {
    console.error("Failed to initialize Filter Web Worker:", err);
    return null;
  }
};

export const getFilteredImageWithWorker = (
  imageSrc: string,
  imgElement: HTMLImageElement,
  settings: ImageSettings
): Promise<HTMLCanvasElement> => {
  const cacheKey = `${imageSrc}_b-${settings.brightness}_c-${settings.contrast}_s-${settings.saturate}_hr-${settings.hueRotate}_bl-${settings.blur}`;
  
  if (processedImageCache.has(cacheKey)) {
    return Promise.resolve(processedImageCache.get(cacheKey)!);
  }

  if (pendingPromises.has(cacheKey)) {
    return pendingPromises.get(cacheKey)!;
  }

  const worker = initFilterWorker();
  if (!worker) {
    return Promise.reject(new Error("Worker not supported or failed to initialize"));
  }

  const promise = new Promise<HTMLCanvasElement>((resolve, reject) => {
    // Limit the image dimension sent to worker for maximum responsiveness
    const maxDimension = 1200;
    let w = imgElement.naturalWidth || imgElement.width || 800;
    let h = imgElement.naturalHeight || imgElement.height || 800;

    if (w > maxDimension || h > maxDimension) {
      if (w > h) {
        h = Math.round((h * maxDimension) / w);
        w = maxDimension;
      } else {
        w = Math.round((w * maxDimension) / h);
        h = maxDimension;
      }
    }

    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = w;
    tempCanvas.height = h;
    const tempCtx = tempCanvas.getContext('2d');
    if (!tempCtx) {
      reject(new Error("Failed to get 2d context for offline image"));
      return;
    }

    tempCtx.drawImage(imgElement, 0, 0, w, h);
    
    let imgData: ImageData;
    try {
      imgData = tempCtx.getImageData(0, 0, w, h);
    } catch (e) {
      reject(e);
      return;
    }

    currentTaskId++;
    const taskId = currentTaskId;

    activeCallbacks.set(taskId, (processedCanvas) => {
      pendingPromises.delete(cacheKey);
      processedImageCache.set(cacheKey, processedCanvas);
      if (processedImageCache.size > 50) {
        const firstKey = processedImageCache.keys().next().value;
        if (firstKey) processedImageCache.delete(firstKey);
      }
      resolve(processedCanvas);
    });

    activeRejections.set(taskId, (err) => {
      pendingPromises.delete(cacheKey);
      reject(err);
    });

    // Send using transferable ArrayBuffer for zero-copy performance!
    worker.postMessage({
      taskId,
      imageData: imgData,
      settings: {
        brightness: settings.brightness,
        contrast: settings.contrast,
        saturate: settings.saturate,
        hueRotate: settings.hueRotate,
        blur: settings.blur
      }
    }, [imgData.data.buffer]);
  });

  pendingPromises.set(cacheKey, promise);
  return promise;
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
  backgroundImageSrc?: string | null;
  frame: Frame | null;
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

  const size = params.size || 1080; // Custom resolution size or 1080px HD default (Canva standard)
  
  // PRELOAD ASSETS TO AVOID FLICKERING/BLACK SCREEN DURING DRAG
  let userImgElement: HTMLImageElement | null = null;
  let bgImgElement: HTMLImageElement | null = null;
  let frameImgElement: HTMLImageElement | null = null;
  let frameTempUrl: string | null = null;
  const stickerImages: Record<string, HTMLImageElement> = {};

  try {
    const promises: Promise<void>[] = [];

    // Preload user image
    if (params.userImageSrc) {
      promises.push(
        loadImage(params.userImageSrc, false)
          .then(img => { userImgElement = img; })
          .catch(err => console.error("Error loading user image:", err))
      );
    }

    // Preload background image if provided
    if (params.backgroundImageSrc) {
      promises.push(
        loadImage(params.backgroundImageSrc, true)
          .then(img => { bgImgElement = img; })
          .catch(err => console.error("Error loading custom background image:", err))
      );
    }

    // Preload frame
    if (params.frame && params.frame.id !== 'none') {
      if (params.frame.type === 'procedural') {
        let svgString = '';
        if (params.frame.renderSvg) {
          svgString = params.frame.renderSvg(params.neonColor);
        } else if (params.frame.svgElements) {
          const rendered = params.frame.svgElements
            .replace(/HIGHLIGHT_COLOR/g, params.neonColor)
            .replace(/currentColor/g, params.neonColor);
          svgString = `<svg width="1000" height="1000" viewBox="0 0 1000 1000" fill="none" xmlns="http://www.w3.org/2000/svg">\n            ${rendered}\n          </svg>`;
        }
        if (svgString) {
          frameTempUrl = svgToDataUrl(svgString);
          promises.push(
            loadImage(frameTempUrl, true)
              .then(img => { frameImgElement = img; })
              .catch(() => {})
          );
        }
      } else {
        promises.push(
          loadImage(resolveApiUrl(params.frame.src), true)
            .then(img => { frameImgElement = img; })
            .catch(() => {})
        );
      }
    }

    // Preload custom stickers and web fonts if downloading
    if (params.isDownloading) {
      for (const item of params.stickers) {
        if (item.type === 'sticker' && item.imageUrl) {
          promises.push(
            loadImage(item.imageUrl, true)
              .then(img => { stickerImages[item.id] = img; })
              .catch(() => {})
          );
        } else if (item.type === 'text') {
          const family = item.fontFamily || 'Orbitron';
          promises.push(
            (async () => {
              try {
                if ('fonts' in document) {
                  // Preload standard, bold and ultra-bold specs to guarantee canvas finds the loaded face
                  await Promise.all([
                    (document as any).fonts.load(`12px "${family}"`),
                    (document as any).fonts.load(`bold 12px "${family}"`),
                    (document as any).fonts.load(`900 12px "${family}"`)
                  ]);
                  await (document as any).fonts.ready;
                }
              } catch (e) {
                console.warn(`Font load failed for canvas text: ${family}`, e);
              }
            })()
          );
        }
      }
    }

    await Promise.all(promises);
  } catch (err) {
    console.warn("Soft error during preloading resources:", err);
  }

  // Set sizing only after everything is loaded so we don't clear the screen prematurely
  canvas.width = size;
  canvas.height = size;
  
  // Clear canvas
  ctx.clearRect(0, 0, size, size);
  
  // 1. Draw solid dark background in case user image is transparent or not uploaded
  if (bgImgElement) {
    ctx.drawImage(bgImgElement, 0, 0, size, size);
  } else {
    ctx.fillStyle = '#0a0a0f';
    ctx.fillRect(0, 0, size, size);
  }

  // 2. Draw user image if available
  if (userImgElement) {
    try {
      const img = userImgElement;
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

      // Use Web Worker with pixel-level processing if custom settings are changed
      let drawImg: CanvasImageSource = img;
      const hasFilters = 
        params.settings.brightness !== 100 ||
        params.settings.contrast !== 100 ||
        params.settings.saturate !== 100 ||
        (params.settings.hueRotate !== 0 && params.settings.hueRotate !== undefined) ||
        (params.settings.blur !== 0 && params.settings.blur !== undefined);

      if (hasFilters && params.userImageSrc) {
        try {
          const filteredCanvas = await getFilteredImageWithWorker(
            params.userImageSrc,
            img,
            params.settings
          );
          drawImg = filteredCanvas;
          ctx.filter = 'none'; // Disable slow native filter repaint
        } catch (workerErr) {
          console.warn("Web worker filtering failed, falling back to basic CSS canvas filters:", workerErr);
          ctx.filter = getCssFilterString(params.settings);
        }
      } else {
        ctx.filter = 'none';
      }

      // Draw image centered at the translated coordinate
      ctx.drawImage(drawImg, -drawW / 2, -drawH / 2, drawW, drawH);
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
  if (params.frame && params.frame.id !== 'none') {
    if (frameImgElement) {
      ctx.save();
      ctx.filter = 'none'; // Ensure the frame remains completely authentic without photo filters
      ctx.drawImage(frameImgElement, 0, 0, size, size);
      ctx.restore();
      
      if (frameTempUrl && frameTempUrl.startsWith('blob:')) {
        URL.revokeObjectURL(frameTempUrl);
      }
    } else {
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
  }

  // 4. Draw placed stickers and text (Only during final download to avoid double rendering with HTML interactive layers)
  if (params.isDownloading) {
    for (const item of params.stickers) {
      ctx.save();
      
      // Set composite operation for blending if a custom blend mode is specified (restricted to custom PNG image stickers)
      if (item.type === 'sticker' && item.imageUrl && item.blendMode && item.blendMode !== 'normal') {
        ctx.globalCompositeOperation = item.blendMode as GlobalCompositeOperation;
      } else {
        ctx.globalCompositeOperation = 'source-over';
      }

      const xPos = (item.x / 100) * size;
      const yPos = (item.y / 100) * size;
      ctx.translate(xPos, yPos);
      ctx.rotate((item.rotation * Math.PI) / 180);

      // Menghitung ukuran proporsional terhadap canvas size agar identik antara preview dan download
      const scaleFactor = size / 1080;
      const sSize = item.type === 'text' 
        ? (item.scale * 0.15 * size) 
        : (item.scale * 0.225 * size);

      if (item.type === 'sticker') {
        if (item.stickerId) {
          const path = params.presetStickerSvgPaths[item.stickerId];
          if (path) {
            // Render simple SVG Path beautifully scaled, counter-scaling strokes to maintain exact proportional thicknesses
            const p = new Path2D(path);
            ctx.save();
            const sScale = sSize / 100;
            ctx.scale(sScale, sScale);
            ctx.translate(-50, -50); // center path
            
            ctx.strokeStyle = item.color || params.neonColor;
            ctx.lineWidth = (4 * scaleFactor) / sScale;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            ctx.stroke(p);
            
            // Add double glowing stroke path with proportional shadow/glow
            ctx.shadowColor = item.color || params.neonColor;
            ctx.shadowBlur = (10 * scaleFactor) / sScale;
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = (1.5 * scaleFactor) / sScale;
            ctx.stroke(p);
            ctx.restore();
          }
        } else if (item.imageUrl) {
          try {
            // Use preloaded img if available and preserve its original aspect ratio (prevents squishing)
            const stickerImg = stickerImages[item.id];
            if (stickerImg) {
              const imgRatio = stickerImg.width / stickerImg.height;
              let sW = sSize;
              let sH = sSize;
              if (imgRatio > 1) { // Landscape
                sH = sSize / imgRatio;
              } else { // Portrait or Square
                sW = sSize * imgRatio;
              }
              ctx.drawImage(stickerImg, -sW / 2, -sH / 2, sW, sH);
            }
          } catch (err) {
            console.error('Gagal menggambar stiker gambar kustom pada canvas:', err);
          }
        }
      } else if (item.type === 'text' && item.text) {
        const textToDraw = item.text.toUpperCase();
        item.text = textToDraw; // Simplify by just modifying the item text directly!
        
        const fFamily = item.fontFamily || 'Orbitron';
        // Fallback to normal weight for fonts that only have a 400 weight to avoid bad canvas substitution/faux bolding
        const fWeight = (fFamily === 'Bebas Neue' || fFamily === 'Press Start 2P' || fFamily === 'Revalia' || fFamily === 'Share Tech Mono') ? 'normal' : 'bold';
        ctx.font = `${fWeight} ${Math.round(sSize)}px "${fFamily}", sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        // Exact pixel scaling factor from the nominal 400px screen preview container to high-res canvas
        const pxScale = 2.7 * scaleFactor;

        if ('letterSpacing' in ctx) {
          // Exactly map letterSpacing if customized by user, or respect 'normal' tracking (0px)
          const spacingPx = item.letterSpacing ? (item.letterSpacing * pxScale) : 0;
          (ctx as any).letterSpacing = spacingPx > 0 ? `${spacingPx}px` : 'normal';
        }
        
        const baseColor = item.color || params.neonColor;
        const style = item.textStyle || 'plain';

        if (style === 'neon') {
          ctx.save();
          ctx.fillStyle = '#ffffff';

          // Outer Glow 4 (Base color wide glow)
          ctx.shadowColor = baseColor;
          ctx.shadowBlur = 40 * pxScale;
          ctx.fillText(item.text, 0, 0);

          // Outer Glow 3 (Base color medium glow)
          ctx.shadowColor = baseColor;
          ctx.shadowBlur = 20 * pxScale;
          ctx.fillText(item.text, 0, 0);

          // Inner Glow 2 (White tight glow)
          ctx.shadowColor = '#ffffff';
          ctx.shadowBlur = 10 * pxScale;
          ctx.fillText(item.text, 0, 0);

          // Inner Glow 1 (White tightest glow)
          ctx.shadowColor = '#ffffff';
          ctx.shadowBlur = 5 * pxScale;
          ctx.fillText(item.text, 0, 0);

          ctx.restore();
        } else if (style === 'glitch') {
          ctx.save();
          ctx.shadowBlur = 0;
          
          // Cyan split offset exactly matching screen direction and size
          ctx.globalAlpha = 0.82;
          ctx.fillStyle = '#0ff'; // cyan
          ctx.fillText(item.text, 2 * pxScale, 0);
          
          // Magenta split offset exactly matching screen direction and size
          ctx.fillStyle = '#f0f'; // magenta
          ctx.fillText(item.text, -2 * pxScale, 0);
          
          // White foreground layer centered
          ctx.globalAlpha = 1.0;
          ctx.fillStyle = '#ffffff';
          ctx.fillText(item.text, 0, 0);
          
          ctx.restore();
        } else if (style === 'hologram') {
          ctx.save();
          
          // Soft cyan holographic environmental drop shadow
          ctx.shadowColor = '#0ff';
          ctx.shadowBlur = 5 * pxScale;
          ctx.shadowOffsetX = 0;
          ctx.shadowOffsetY = 0;
          
          const gradient = ctx.createLinearGradient(0, -sSize/2, 0, sSize/2);
          gradient.addColorStop(0, 'rgba(0, 255, 255, 0.9)');
          gradient.addColorStop(0.5, 'rgba(255, 0, 255, 0.8)');
          gradient.addColorStop(1, 'rgba(0, 255, 255, 0.9)');
          
          ctx.fillStyle = gradient;
          ctx.fillText(item.text, 0, 0);
          
          // Slight white stroke matching 1px container resolution
          ctx.shadowBlur = 0;
          ctx.lineWidth = 1 * pxScale;
          ctx.strokeStyle = 'rgba(255,255,255,0.82)';
          ctx.strokeText(item.text, 0, 0);
          ctx.restore();
        } else if (style === 'chrome') {
          ctx.save();
          
          // True mirror gradient matching screen spectrum
          const gradient = ctx.createLinearGradient(0, -sSize/2, 0, sSize/2);
          gradient.addColorStop(0, '#dbe2ea');
          gradient.addColorStop(0.5, '#879ab6');
          gradient.addColorStop(0.51, '#46566d');
          gradient.addColorStop(1, '#1f2735');
          
          // Solid drop shadow backing
          ctx.shadowColor = 'rgba(0,0,0,0.8)';
          ctx.shadowOffsetX = 0;
          ctx.shadowOffsetY = 2 * pxScale;
          ctx.shadowBlur = 2 * pxScale;
          
          ctx.fillStyle = gradient;
          ctx.fillText(item.text, 0, 0);
          
          // Crisp clean white chrome outline definition 
          ctx.shadowBlur = 0;
          ctx.shadowOffsetX = 0;
          ctx.shadowOffsetY = 0;
          ctx.lineWidth = 1 * pxScale;
          ctx.strokeStyle = '#ffffff';
          ctx.strokeText(item.text, 0, 0);
          
          ctx.restore();
        } else if (style === '3d') {
          ctx.save();
          ctx.shadowBlur = 0;
          
          // Solid black final shadow layer at 7.5px depth
          ctx.fillStyle = '#000000';
          ctx.fillText(item.text, 7.5 * pxScale, 7.5 * pxScale);

          // Render step values mirroring the CSS textShadow offset stack for identical isometric 3D look
          const offsetSteps = [6.0, 4.5, 3.0, 1.5];
          offsetSteps.forEach(offset => {
            ctx.fillStyle = baseColor;
            ctx.fillText(item.text, offset * pxScale, offset * offset * 0 === 0 ? offset * pxScale : offset);
          });

          // Draw the front pure white text
          ctx.fillStyle = '#ffffff';
          ctx.fillText(item.text, 0, 0);

          // Outline stroke the front text for perfect contrast separation
          ctx.strokeStyle = '#000000';
          ctx.lineWidth = 1 * pxScale;
          ctx.strokeText(item.text, 0, 0);
          
          ctx.restore();
        } else if (style === 'double-neon') {
          ctx.save();
          
          // Cyberspace blue left-top cyan glow
          ctx.shadowColor = '#00f2fe';
          ctx.shadowBlur = 15 * pxScale;
          ctx.shadowOffsetX = -3 * pxScale;
          ctx.shadowOffsetY = -3 * pxScale;
          ctx.fillStyle = '#ffffff';
          ctx.fillText(item.text, 0, 0);
          
          // Cyberpunk hot-pink right-bottom magenta glow
          ctx.shadowColor = '#f35588';
          ctx.shadowBlur = 15 * pxScale;
          ctx.shadowOffsetX = 3 * pxScale;
          ctx.shadowOffsetY = 3 * pxScale;
          ctx.fillText(item.text, 0, 0);

          // Ambient central colored backglow
          ctx.shadowColor = baseColor;
          ctx.shadowBlur = 5 * pxScale;
          ctx.shadowOffsetX = 0;
          ctx.shadowOffsetY = 0;
          ctx.fillText(item.text, 0, 0);

          // Neon stroke color matching
          ctx.shadowBlur = 0;
          ctx.lineWidth = 1 * pxScale;
          ctx.strokeStyle = baseColor;
          ctx.strokeText(item.text, 0, 0);
          
          ctx.restore();
        } else if (style === 'curved') {
          const textWidth = ctx.measureText(item.text).width;
          const radius = Math.max(textWidth * 0.8, Math.max(sSize, 50 * pxScale)); 
          const angleStart = -Math.PI / 2; // top 
          const totalAngle = textWidth / radius;
          const startAngle = angleStart - totalAngle / 2;
          
          ctx.save();
          ctx.translate(0, radius - sSize/2);
          for(let i=0; i<item.text.length; i++) {
            const char = item.text[i];
            const charWidth = ctx.measureText(char).width;
            const angleStep = charWidth / radius;
            
            ctx.save();
            let currentAngle = startAngle + (ctx.measureText(item.text.substring(0, i)).width / radius) + angleStep/2;
            ctx.rotate(currentAngle);
            ctx.translate(0, -radius);
            
            // Standard backglow
            ctx.shadowColor = baseColor;
            ctx.shadowBlur = 8 * pxScale;
            ctx.fillStyle = '#ffffff';
            ctx.fillText(char, 0, 0);
            
            // Text stroke outline
            ctx.shadowBlur = 0;
            ctx.strokeStyle = '#000000';
            ctx.lineWidth = 1 * pxScale;
            ctx.strokeText(char, 0, 0);
            ctx.restore();
          }
          ctx.restore();
        } else if (style === 'robotic') {
          ctx.save();
          const textWidth = ctx.measureText(item.text).width;
          const bgPaddingH = 10 * pxScale;
          const bgPaddingV = 6 * pxScale;
          const rectWidth = textWidth + bgPaddingH * 2;
          const rectHeight = sSize + bgPaddingV * 2;

          // Draw dark background rectangle
          ctx.fillStyle = 'rgba(0,0,0,0.85)';
          ctx.beginPath();
          if (typeof (ctx as any).roundRect === 'function') {
            (ctx as any).roundRect(-rectWidth/2, -rectHeight/2, rectWidth, rectHeight, 4 * pxScale);
          } else {
            ctx.rect(-rectWidth/2, -rectHeight/2, rectWidth, rectHeight);
          }
          ctx.fill();

          // Draw high-tech green border outline
          ctx.strokeStyle = '#39ff14';
          ctx.lineWidth = 1 * pxScale;
          ctx.stroke();

          // Draw high-tech text with shadow glow
          ctx.shadowColor = '#39ff14';
          ctx.shadowBlur = 8 * pxScale;
          ctx.fillStyle = '#39ff14';
          ctx.fillText(item.text, 0, 0);

          ctx.restore();
        } else if (style === 'retro') {
          ctx.save();
          ctx.shadowBlur = 0;

          // Cyan offset
          ctx.fillStyle = '#00f2fe';
          ctx.fillText(item.text, 2 * pxScale, 2 * pxScale);

          // Purple intermediate layer
          ctx.fillStyle = '#9d4edd';
          ctx.fillText(item.text, 4 * pxScale, 4 * pxScale);

          // Foreground pink text
          ctx.fillStyle = '#ff2a74';
          ctx.fillText(item.text, 0, 0);

          ctx.restore();
        } else if (style === 'comic') {
          ctx.save();
          ctx.shadowBlur = 0;

          // Black comic offset border for pop art effect
          ctx.strokeStyle = '#000000';
          ctx.lineWidth = 4 * pxScale;
          ctx.lineJoin = 'round';
          ctx.strokeText(item.text, 2 * pxScale, 2 * pxScale);
          ctx.strokeText(item.text, 0, 0);

          // Yellow comic foreground fill
          ctx.fillStyle = '#ffcc00';
          ctx.fillText(item.text, 0, 0);

          ctx.restore();
        } else if (style === 'cartoon') {
          ctx.save();
          ctx.shadowBlur = 0;

          // Block offset shadow
          ctx.fillStyle = '#ab005b';
          ctx.fillText(item.text, 0, 3 * pxScale);

          // Foreground pink
          ctx.fillStyle = '#ff66b2';
          ctx.fillText(item.text, 0, 0);

          ctx.restore();
        } else {
          // Default Plain text with exact backing shadow and thin colored underline
          ctx.save();
          ctx.shadowColor = baseColor;
          ctx.shadowBlur = 8 * pxScale;
          ctx.fillStyle = '#ffffff';
          ctx.fillText(item.text, 0, 0);
  
          ctx.shadowBlur = 0;
          ctx.strokeStyle = baseColor;
          ctx.lineWidth = 2 * pxScale;
          const textWidth = ctx.measureText(item.text).width;
          ctx.beginPath();
          ctx.moveTo(-textWidth/2 - 10 * pxScale, sSize/2 + 6 * pxScale);
          ctx.lineTo(textWidth/2 + 10 * pxScale, sSize/2 + 6 * pxScale);
          ctx.stroke();
          ctx.restore();
        }
      }
      
      ctx.restore();
    }
  }
};

// Helper to clean frame name by removing file extensions, Appwrite references, hyphens/underscores
export const cleanFrameName = (name: string): string => {
  if (!name) return 'Bingkai';
  
  // 1. Remove file extensions
  let cleaned = name.replace(/\.(png|jpe?g|svg|webp|gif)$/i, '');
  
  // 2. Remove references to "appwrite" 
  cleaned = cleaned.replace(/appwrite/gi, '');
  
  // 3. Replace underscores or hyphens with space
  cleaned = cleaned.replace(/[_-]+/g, ' ');
  
  // 4. Shrink multiple spaces
  cleaned = cleaned.replace(/\s+/g, ' ');
  
  cleaned = cleaned.trim();
  
  if (!cleaned) return 'Bingkai Kustom';
  
  return cleaned;
};

// Helper to clean frame category by removing Appwrite references
export const cleanFrameCategory = (category: string): string => {
  if (!category) return 'Kustom';
  
  let cleaned = category.replace(/appwrite/gi, '');
  cleaned = cleaned.replace(/[_-]+/g, ' ');
  cleaned = cleaned.trim();
  
  if (!cleaned || cleaned.toLowerCase() === 'custom') return 'Kustom';
  return cleaned;
};

