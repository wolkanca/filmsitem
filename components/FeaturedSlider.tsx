'use client';

import { useState, useEffect, useRef } from 'react';
import { Movie } from '@/types';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from "next/navigation";
import { Star, ArrowRight, ChevronLeft, ChevronRight, Play, Film } from 'lucide-react';
import TrailerModal from '@/components/TrailerModal';

interface FeaturedSliderProps {
  movies: Movie[];
}

export default function FeaturedSlider({ movies }: FeaturedSliderProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isTrailerModalOpen, setIsTrailerModalOpen] = useState(false);
  const router = useRouter();

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

  // Auto-play effect: slide every 10 seconds.
  // Triggers/resets when currentIndex changes (manual navigation resets the timer).
  useEffect(() => {
    const timer = setInterval(nextSlide, 10000);
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
        className="mt-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch relative min-h-[350px] transition-all duration-500 overflow-hidden select-none"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Left side: Poster + Movie Details */}
        <div className={`flex flex-col md:flex-row gap-6 items-center md:items-start ${currentMovie.trailerYoutubeId ? 'lg:col-span-7' : 'lg:col-span-12'}`}>
          <div className="relative aspect-[2/3] w-full md:w-[200px] md:h-[300px] flex-shrink-0 overflow-hidden rounded-xl bg-zinc-900 border border-zinc-800">
            {currentMovie.poster ? (
              <Link prefetch={false}
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
          <div className="flex-grow space-y-4 text-center md:text-left flex flex-col justify-between h-full max-h-[300px]">
            <div className="space-y-1">
              <span className="text-[10px] bg-brand-primary/10 text-brand-primary border border-brand-primary/20 px-2 py-0.5 rounded-md font-semibold">
                GÜNÜN ÖNERİSİ {currentIndex + 1}/{movies.length}
              </span>
              <h3 className="text-xl sm:text-2xl font-black text-white mt-1 py-2">
                <Link prefetch={false} href={`/movie/${currentMovie.imdbId}`}>
                  {currentMovie.title}{' '}
                  <span className="text-zinc-500 font-normal text-lg">({currentMovie.year})</span>
                </Link>
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
              <Link prefetch={false}
                href={`/movie/${currentMovie.imdbId}`}
                className="text-xs text-brand-primary font-bold hover:underline inline-flex items-center gap-1"
              >
                Detayları Gör <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          </div>
        </div>

        {/* Right side: Trailer Image & Play Button with Title Overlay */}
        {currentMovie.trailerYoutubeId && (
          <div className="lg:col-span-5 w-full flex flex-col pt-4 my-2">
            <div
              onClick={() => router.push(`/movie/${currentMovie.imdbId}`)}
              className="relative aspect-video w-full overflow-hidden rounded-2xl border border-white/10 shadow-xl bg-zinc-900 group cursor-pointer"
            >
              <Image
                src={`https://img.youtube.com/vi/${currentMovie.trailerYoutubeId}/hqdefault.jpg`}
                alt={`${currentMovie.title} Fragman`}
                fill
                sizes="(max-width: 1024px) 100vw, 400px"
                className="object-cover transition-transform duration-500 group-hover:scale-105"
              />

              {/* Gradient Overlay for readability */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-black/40 group-hover:from-black/95 transition-colors flex flex-col justify-between p-4">

                {/* Top Badge */}
                <div className="flex items-center gap-1.5 self-start px-2.5 py-1 rounded-md bg-black/60 backdrop-blur-md border border-white/10 text-[11px] font-extrabold text-white uppercase tracking-wider">
                  <Film className="w-3.5 h-3.5 text-brand-primary" /> Fragman
                </div>

                {/* Center Play Button */}
                <div onClick={(e) => { e.stopPropagation(); setIsTrailerModalOpen(true) }}
                  className="self-center flex items-center justify-center">
                  <div className="w-14 h-14 rounded-full bg-brand-primary/90 text-white flex items-center justify-center shadow-[0_0_25px_rgba(239,68,68,0.5)] group-hover:scale-110 group-hover:bg-brand-primary transition-all duration-300">
                    <Play className="w-7 h-7 fill-white ml-0.5" />
                  </div>
                </div>

                {/* Bottom Movie / Trailer Title */}
                <div className="space-y-0.5 text-left">
                  <p className="text-sm font-black text-white tracking-tight line-clamp-1 drop-shadow-md">
                    {currentMovie.title}
                  </p>
                  <p className="text-xs text-zinc-300 font-medium line-clamp-1">
                    Fragman ({currentMovie.year})
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Navigation Buttons — always visible on mobile, hover-only on desktop */}
      <button
        onClick={prevSlide}
        className="absolute left-2 top-36 -translate-y-1/2 bg-zinc-900/80 hover:bg-brand-primary text-white p-2 mt-5 rounded-full border border-white/10 hover:border-brand-primary transition-all duration-300 shadow-lg
          opacity-100 sm:opacity-0 sm:group-hover/slider:opacity-100 focus:opacity-100 z-20"
        aria-label="Previous recommendation"
      >
        <ChevronLeft className="w-5 h-5" />
      </button>
      <button
        onClick={nextSlide}
        className="absolute right-2 top-36 -translate-y-1/2 bg-zinc-900/80 hover:bg-brand-primary text-white p-2 mt-5 rounded-full border border-white/10 hover:border-brand-primary transition-all duration-300 shadow-lg
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
            className={`w-3 h-3 rounded-full transition-all duration-300 ${index === currentIndex ? 'bg-brand-primary w-8' : 'bg-zinc-700 hover:bg-zinc-500'
              }`}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>

      <TrailerModal
        isOpen={isTrailerModalOpen}
        onClose={() => setIsTrailerModalOpen(false)}
        trailerYoutubeId={currentMovie.trailerYoutubeId}
        title={currentMovie.title}
        year={currentMovie.year}
      />
    </div>
  );
}
