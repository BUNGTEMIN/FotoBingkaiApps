import React, { useState, useEffect, useRef } from "react";

interface LazyImageProps {
  src: string;
  alt: string;
  className?: string;
  style?: React.CSSProperties;
  referrerPolicy?: React.HTMLAttributeReferrerPolicy;
  onError?: (e: React.SyntheticEvent<HTMLImageElement, Event>) => void;
  fallbackSrc?: string;
}

export const LazyImage: React.FC<LazyImageProps> = ({
  src,
  alt,
  className = "",
  style,
  referrerPolicy = "no-referrer",
  onError,
  fallbackSrc = "https://apps.bungtemin.net/images/RAKERNIT2025/11.png"
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const [hasError, setHasError] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setIsLoaded(false);
    setHasError(false);
    setIsInView(false); 

    // Check support for IntersectionObserver
    if (typeof window === "undefined" || !("IntersectionObserver" in window)) {
      setIsInView(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect(); // Load once and stay loaded
        }
      },
      {
        rootMargin: "100px", // Preload slightly before visible
        threshold: 0.01
      }
    );

    const currentElem = containerRef.current;
    if (currentElem) {
      observer.observe(currentElem);
    }

    return () => {
      observer.disconnect();
    };
  }, [src]);

  const handleImageLoad = () => {
    setIsLoaded(true);
  };

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    setHasError(true);
    setIsLoaded(true); // stop showing spinner
    if (onError) {
      onError(e);
    }
  };

  // Separate classes for wrapper and image element for exact aspect 1:1 centering
  const isTransparent = className.includes("bg-transparent");
  const objectFitClass = className.includes("object-contain") 
    ? "object-contain" 
    : "object-cover";

  const processedSrc = (src && !src.startsWith('http') && !src.startsWith('data:')) 
    ? `data:image/png;base64,${src}` 
    : src;

  const wrapperClasses = `relative overflow-hidden w-full h-full aspect-square flex items-center justify-center ${
    isTransparent ? "bg-transparent" : "bg-neutral-950/20"
  } ${className.replace(/object-(contain|cover|fill|none|scale-down)/g, "").replace(/bg-transparent/g, "")}`;

  return (
    <div
      ref={containerRef}
      className={wrapperClasses}
    >
      {/* 1. Neon Cyber Shimmer/Skeleton placeholder shown before image intersects or while loading/rendered */}
      {(!isLoaded || !isInView) && !hasError && (
        <div className="absolute inset-0 bg-neutral-900/60 flex flex-col items-center justify-center p-2 select-none pointer-events-none">
          <div className="w-5 h-5 rounded-full border border-dashed border-neon-cyan/40 animate-spin flex items-center justify-center">
            <span className="w-1.5 h-1.5 rounded-full bg-neon-cyan animate-pulse"></span>
          </div>
        </div>
      )}

      {/* 2. Interactive Lazy Loaded Image or Error Placeholder */}
      {isInView && (
        hasError ? (
          <div className="flex items-center justify-center w-full h-full bg-neutral-900 text-neon-cyan font-mono font-bold text-xl">
            QCC
          </div>
        ) : (
          <img
            src={processedSrc}
            alt={alt}
            referrerPolicy={referrerPolicy}
            onLoad={handleImageLoad}
            onError={handleImageError}
            className={`w-full h-full ${objectFitClass} transition-all duration-500 ease-out ${
              isLoaded ? "opacity-100 scale-100 blur-0" : "opacity-0 scale-95 blur-sm"
            }`}
            style={style}
          />
        )
      )}

      {/* Glowing Border Accents for extra cyber flair on active load */}
      {!isLoaded && !hasError && (
        <div className="absolute inset-0 border border-neon-cyan/5 pointer-events-none" />
      )}
    </div>
  );
};
