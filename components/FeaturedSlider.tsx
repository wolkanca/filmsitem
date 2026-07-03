'use client';

import { useState, useEffect, useRef } from 'react';
import { Movie } from '@/types';
import Image from 'next/image';
import Link from 'next/link';
import { Star, ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';

interface FeaturedSliderProps {
  movies: Movie[];
}

export default function FeaturedSlider({ movies }: FeaturedSliderProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  // Touch swipe state
  const touchStartX = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);
  const SWIPE_THRESHOLD = 50; // px

  if (!movies || movies.length === 0) return null;

  const nextSlide = () => {
    setCurrentIndex((prevIndex) => (prevIndex + 1) % movies.length);
  };

  const prevSlide = () => {
    setCurrentIndex((prevIndex) => (prevIndex - 1 + movies.length) % movies.length);
  };

  // Auto-play effect: slide every 30 seconds.
  // Triggers/resets when currentIndex changes (manual navigation resets the timer).
  useEffect(() => {
    const timer = setInterval(nextSlide, 30000);
    return () => clearInterval(timer);
  }, [currentIndex]);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.changedTouches[0].clientX;
    touchEndX.current = null;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.changedTouches[0].clientX;
  };

  const handleTouchEnd = () => {
    if (touchStartX.current === null || touchEndX.current === null) return;
    const diff = touchStartX.current - touchEndX.current;
    if (Math.abs(diff) >= SWIPE_THRESHOLD) {
      if (diff > 0) nextSlide();
      else prevSlide();
    }
    touchStartX.current = null;
    touchEndX.current = null;
  };

  const currentMovie = movies[currentIndex];

  return (
    <div className="relative group/slider">
      {/* Recommended Movie Preview */}
      <div
        className="mt-6 grid grid-cols-1 lg:grid-cols-12 gap-6 bg-zinc-950/40 border border-white/5 rounded-2xl p-4 sm:p-6 items-stretch relative min-h-[350px] transition-all duration-500 overflow-hidden select-none"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Left side: Poster + Movie Details */}
        <div className={`flex flex-col md:flex-row gap-6 items-center md:items-start ${currentMovie.trailerYoutubeId ? 'lg:col-span-7' : 'lg:col-span-12'}`}>
          <div className="relative aspect-[2/3] w-full md:w-[200px] md:h-[300px] flex-shrink-0 overflow-hidden rounded-xl bg-zinc-900 border border-zinc-800">
            {currentMovie.poster ? (
              <Link
                href={`/movie/${currentMovie.imdbId}`}
                className="absolute inset-0 block"
              >
                <Image
                  src={currentMovie.poster}
                  alt={currentMovie.title}
                  fill
                  sizes="(max-width: 640px) 150px, 200px"
                  className="object-cover transition-transform duration-500 hover:scale-105"
                  priority={currentIndex === 0}
                />
              </Link>
            ) : (
              <div className="flex h-full w-full items-center justify-center">🎬</div>
            )}
          </div>
          <div className="flex-grow space-y-4 text-center md:text-left flex flex-col justify-between h-full">
            <div className="space-y-1">
              <span className="text-[10px] bg-brand-primary/10 text-brand-primary border border-brand-primary/20 px-2 py-0.5 rounded-md font-semibold">
                GÜNÜN ÖNERİSİ {currentIndex + 1}/{movies.length}
              </span>
              <h3 className="text-xl sm:text-2xl font-black text-white mt-1 py-2">
                {currentMovie.title}{' '}
                <span className="text-zinc-500 font-normal text-lg">({currentMovie.year})</span>
              </h3>
              <p className="text-xs text-zinc-400 mt-1">
                Yönetmen: {currentMovie.director} • Tür: {currentMovie.genres.join(', ')}
              </p>
            </div>
            <p className="text-sm text-zinc-400 line-clamp-3 leading-relaxed max-w-3xl">
              {currentMovie.overview}
            </p>
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 pt-2">
              <div className="flex items-center gap-1">
                <span className="text-xs text-zinc-500">Benim Puanım:</span>
                <Star className="w-4 h-4 text-brand-accent fill-brand-accent" />
                <span className="text-sm font-bold text-white">{currentMovie.myRating}/10</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-xs text-zinc-500">IMDb Puanı:</span>
                <span className="text-sm font-bold text-zinc-300">{currentMovie.imdbRating}</span>
              </div>
              <Link
                href={`/movie/${currentMovie.imdbId}`}
                className="text-xs text-brand-primary font-bold hover:underline inline-flex items-center gap-1"
              >
                Detayları Gör <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          </div>
        </div>

        {/* Right side: Trailer Player */}
        {currentMovie.trailerYoutubeId && (
          <div className="lg:col-span-5 w-full flex flex-col justify-center">
            <div className="relative aspect-video w-full overflow-hidden rounded-xl border border-white/5 shadow-lg bg-black">
              <iframe
                src={`https://www.youtube.com/embed/${currentMovie.trailerYoutubeId}?autoplay=0&rel=0`}
                title={`${currentMovie.title} Fragman`}
                className="absolute inset-0 h-full w-full border-0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              ></iframe>
            </div>
          </div>
        )}
      </div>

      {/* Navigation Buttons — always visible on mobile, hover-only on desktop */}
      <button
        onClick={prevSlide}
        className="absolute left-2 top-1/2 -translate-y-1/2 bg-zinc-900/80 hover:bg-brand-primary text-white p-2 rounded-full border border-white/10 hover:border-brand-primary transition-all duration-300 shadow-lg
          opacity-100 sm:opacity-0 sm:group-hover/slider:opacity-100 focus:opacity-100 z-20"
        aria-label="Previous recommendation"
      >
        <ChevronLeft className="w-5 h-5" />
      </button>
      <button
        onClick={nextSlide}
        className="absolute right-2 top-1/2 -translate-y-1/2 bg-zinc-900/80 hover:bg-brand-primary text-white p-2 rounded-full border border-white/10 hover:border-brand-primary transition-all duration-300 shadow-lg
          opacity-100 sm:opacity-0 sm:group-hover/slider:opacity-100 focus:opacity-100 z-20"
        aria-label="Next recommendation"
      >
        <ChevronRight className="w-5 h-5" />
      </button>

      {/* Bullet Indicators */}
      <div className="flex justify-center gap-2 mt-4">
        {movies.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentIndex(index)}
            className={`w-2 h-2 rounded-full transition-all duration-300 ${index === currentIndex ? 'bg-brand-primary w-6' : 'bg-zinc-700 hover:bg-zinc-500'
              }`}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
}
