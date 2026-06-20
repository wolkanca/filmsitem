'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { Play } from 'lucide-react';

// Known placeholder image patterns — when the poster matches these, we treat it as "no poster"
const PLACEHOLDER_PATTERNS = [
  'images.unsplash.com',
  'unsplash.com/photo',
  'via.placeholder.com',
  'placehold.co',
  'placeholder.com',
  'dummyimage.com',
];

function isPlaceholderUrl(url?: string | null): boolean {
  if (!url) return true;
  return PLACEHOLDER_PATTERNS.some((p) => url.includes(p));
}

interface PosterImageProps {
  src?: string | null;
  alt: string;
  fill?: boolean;
  sizes?: string;
  className?: string;
  priority?: boolean;
  fallbackTitle?: string;
  trailerYoutubeId?: string | null;
  /** Called when image is in YouTube-thumbnail fallback state and user clicks it */
  onYoutubeClick?: () => void;
  /** If true, show the YouTube thumbnail as fallback but do NOT add the click-to-YouTube overlay.
   *  Use this inside Link cards so the parent navigation works normally. */
  disableYoutubeClick?: boolean;
}

export default function PosterImage({
  src,
  alt,
  fill,
  sizes,
  className,
  priority,
  fallbackTitle,
  trailerYoutubeId,
  onYoutubeClick,
  disableYoutubeClick = false,
}: PosterImageProps) {
  // If the src is a placeholder AND we have a trailer, skip straight to YouTube thumbnail
  const shouldUseYoutubeDirect =
    trailerYoutubeId && isPlaceholderUrl(src);

  const initialSrc = shouldUseYoutubeDirect
    ? `https://img.youtube.com/vi/${trailerYoutubeId}/hqdefault.jpg`
    : src;

  const [imgSrc, setImgSrc] = useState<string | null | undefined>(initialSrc);
  const [triedYoutube, setTriedYoutube] = useState(!!shouldUseYoutubeDirect);
  const [hasFailed, setHasFailed] = useState(false);
  // True when the image showing is the YouTube thumbnail fallback
  const [isYoutubeFallback, setIsYoutubeFallback] = useState(!!shouldUseYoutubeDirect);

  // Sync state if src or trailerYoutubeId changes
  useEffect(() => {
    const useDirect = trailerYoutubeId && isPlaceholderUrl(src);
    if (useDirect) {
      setImgSrc(`https://img.youtube.com/vi/${trailerYoutubeId}/hqdefault.jpg`);
      setTriedYoutube(true);
      setIsYoutubeFallback(true);
    } else {
      setImgSrc(src);
      setTriedYoutube(false);
      setIsYoutubeFallback(false);
    }
    setHasFailed(false);
  }, [src, trailerYoutubeId]);

  const handleError = () => {
    if (!triedYoutube && trailerYoutubeId) {
      setTriedYoutube(true);
      setIsYoutubeFallback(true);
      setImgSrc(`https://img.youtube.com/vi/${trailerYoutubeId}/hqdefault.jpg`);
    } else {
      setHasFailed(true);
    }
  };

  if (!imgSrc || hasFailed) {
    return (
      <div className="flex h-full w-full flex-col items-center justify-center bg-gradient-to-br from-zinc-800 to-zinc-950 p-3 text-center select-none">
        <span className="text-3xl mb-2">🎬</span>
        {fallbackTitle && (
          <span className="text-xs font-semibold text-zinc-400 line-clamp-3 leading-snug">
            {fallbackTitle}
          </span>
        )}
      </div>
    );
  }

  // When showing YouTube thumbnail, wrap in a clickable overlay that opens YouTube
  // Skip the overlay entirely if disableYoutubeClick is set (e.g. inside a Link card)
  if (isYoutubeFallback && trailerYoutubeId && !disableYoutubeClick) {
    const handleClick = (e: React.MouseEvent) => {
      e.stopPropagation(); // prevent parent poster-modal from opening
      if (onYoutubeClick) {
        onYoutubeClick();
      } else {
        window.open(
          `https://www.youtube.com/watch?v=${trailerYoutubeId}`,
          '_blank',
          'noopener,noreferrer'
        );
      }
    };

    return (
      <div
        className="relative w-full h-full cursor-pointer group"
        onClick={handleClick}
        title="YouTube'da izle"
      >
        <Image
          src={imgSrc}
          alt={alt}
          fill={fill}
          sizes={sizes}
          className={className}
          priority={priority}
          onError={handleError}
        />
        {/* Play overlay */}
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center z-10">
          <div className="bg-red-600 rounded-full p-3 shadow-[0_0_20px_rgba(220,38,38,0.6)] scale-90 group-hover:scale-100 transition-transform duration-200">
            <Play className="w-6 h-6 text-white fill-white" />
          </div>
        </div>
        {/* YouTube badge */}
        <div className="absolute bottom-2 left-2 flex items-center gap-1 bg-black/70 text-white text-[10px] font-bold px-2 py-1 rounded-md z-10 opacity-0 group-hover:opacity-100 transition-opacity">
          <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor">
            <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
          </svg>
          YouTube&apos;da İzle
        </div>
      </div>
    );
  }

  return (
    <Image
      src={imgSrc}
      alt={alt}
      fill={fill}
      sizes={sizes}
      className={className}
      priority={priority}
      onError={handleError}
    />
  );
}
