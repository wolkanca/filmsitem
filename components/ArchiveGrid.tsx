'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Film, Tv, ArrowUpDown, Star, Calendar, Eye, ChevronDown, Loader2 } from 'lucide-react';
import { Movie } from '@/types';
import MovieCard from '@/components/MovieCard';
import { Clock } from 'lucide-react';

const PAGE_SIZE = 15;

type SortOption = 'imdb-desc' | 'imdb-asc' | 'myrating-desc' | 'myrating-asc' | 'year-desc' | 'year-asc' | 'watchdate-desc' | 'watchdate-asc';

const SORT_OPTIONS: { value: SortOption; label: string; icon: typeof Star }[] = [
  { value: 'imdb-desc', label: 'IMDb Puanı (Yüksek → Düşük)', icon: Star },
  { value: 'imdb-asc', label: 'IMDb Puanı (Düşük → Yüksek)', icon: Star },
  { value: 'myrating-desc', label: 'Benim Puanım (Yüksek → Düşük)', icon: Star },
  { value: 'myrating-asc', label: 'Benim Puanım (Düşük → Yüksek)', icon: Star },
  { value: 'year-desc', label: 'Yapım Yılı (Yeni → Eski)', icon: Calendar },
  { value: 'year-asc', label: 'Yapım Yılı (Eski → Yeni)', icon: Calendar },
  { value: 'watchdate-desc', label: 'İzlenme Tarihi (Yeni → Eski)', icon: Eye },
  { value: 'watchdate-asc', label: 'İzlenme Tarihi (Eski → Yeni)', icon: Eye },
];

function sortMovies(movies: Movie[], sort: SortOption): Movie[] {
  const sorted = [...movies];
  switch (sort) {
    case 'imdb-desc':
      return sorted.sort((a, b) => b.imdbRating - a.imdbRating || b.myRating - a.myRating);
    case 'imdb-asc':
      return sorted.sort((a, b) => a.imdbRating - b.imdbRating || a.myRating - b.myRating);
    case 'myrating-desc':
      return sorted.sort((a, b) => b.myRating - a.myRating || b.imdbRating - a.imdbRating);
    case 'myrating-asc':
      return sorted.sort((a, b) => a.myRating - b.myRating || a.imdbRating - b.imdbRating);
    case 'year-desc':
      return sorted.sort((a, b) => b.year - a.year || b.imdbRating - a.imdbRating);
    case 'year-asc':
      return sorted.sort((a, b) => a.year - b.year || a.imdbRating - b.imdbRating);
    case 'watchdate-desc':
      return sorted.sort((a, b) => {
        const dateA = a.watchDate ? new Date(a.watchDate).getTime() : 0;
        const dateB = b.watchDate ? new Date(b.watchDate).getTime() : 0;
        return dateB - dateA || b.imdbRating - a.imdbRating;
      });
    case 'watchdate-asc':
      return sorted.sort((a, b) => {
        const dateA = a.watchDate ? new Date(a.watchDate).getTime() : 0;
        const dateB = b.watchDate ? new Date(b.watchDate).getTime() : 0;
        return dateA - dateB || a.imdbRating - b.imdbRating;
      });
    default:
      return sorted;
  }
}

function SortDropdown({ value, onChange }: { value: SortOption; onChange: (v: SortOption) => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const currentLabel = SORT_OPTIONS.find(o => o.value === value)?.label || '';

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-4 py-2.5 rounded-xl border bg-zinc-950/60 border-white/10 text-sm font-semibold text-zinc-300 hover:text-white hover:border-white/20 transition-all duration-200"
      >
        <ArrowUpDown className="w-4 h-4 text-brand-accent shrink-0" />
        <span className="hidden sm:inline truncate max-w-[200px]">{currentLabel}</span>
        <span className="sm:hidden">Sırala</span>
        <ChevronDown className={`w-3.5 h-3.5 text-zinc-500 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-72 bg-zinc-900/95 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl shadow-black/50 z-50 overflow-hidden animate-fade-in">
          <div className="p-1.5">
            {SORT_OPTIONS.map((opt) => {
              const isActive = value === opt.value;
              const Icon = opt.icon;
              return (
                <button
                  key={opt.value}
                  onClick={() => { onChange(opt.value); setOpen(false); }}
                  className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-left text-sm transition-all duration-150 ${
                    isActive
                      ? 'bg-brand-primary/15 text-white font-semibold'
                      : 'text-zinc-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-brand-accent' : 'text-zinc-600'}`} />
                  <span>{opt.label}</span>
                  {isActive && <span className="ml-auto text-brand-accent text-xs">✓</span>}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function StatsBar({ movies }: { movies: Movie[] }) {
  const ratedMovies = movies.filter((m) => m.myRating > 0);
  const avgRating =
    ratedMovies.length > 0
      ? (
          ratedMovies.reduce((acc, m) => acc + m.myRating, 0) / ratedMovies.length
        ).toFixed(1)
      : 'N/A';
  const totalRuntimeHours = Math.round(
    movies.reduce((acc, m) => acc + (m.runtime || 0), 0) / 60
  );

  return (
    <div className="flex items-center gap-4 text-xs text-zinc-400">
      <span className="font-bold text-white">{movies.length} Yapım</span>
      <span className="flex items-center gap-1">
        <Star className="w-3.5 h-3.5 text-brand-accent fill-brand-accent" />
        Ort. {avgRating}
      </span>
      <span className="flex items-center gap-1">
        <Clock className="w-3.5 h-3.5 text-zinc-500" />
        {totalRuntimeHours} sa
      </span>
    </div>
  );
}

interface ArchiveGridProps {
  movies: Movie[];
  /** If true, skip the Cinema/TV tabs and show a flat grid (used by favorites, list pages) */
  flat?: boolean;
  /** Default sort option */
  defaultSort?: SortOption;
}

function InfiniteMovieGrid({ movies, sort }: { movies: Movie[]; sort: SortOption }) {
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Reset visible count when movies or sort changes
  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [movies, sort]);

  const sortedMovies = useMemo(() => sortMovies(movies, sort), [movies, sort]);
  const visibleMovies = sortedMovies.slice(0, visibleCount);
  const hasMore = visibleCount < sortedMovies.length;

  const loadMore = useCallback(() => {
    if (!hasMore || isLoading) return;
    setIsLoading(true);
    // Tiny delay for smooth animation feel
    setTimeout(() => {
      setVisibleCount(prev => Math.min(prev + PAGE_SIZE, sortedMovies.length));
      setIsLoading(false);
    }, 300);
  }, [hasMore, isLoading, sortedMovies.length]);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          loadMore();
        }
      },
      { rootMargin: '200px' }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [loadMore]);

  return (
    <div>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
        {visibleMovies.map((movie, index) => (
          <div
            key={movie.imdbId}
            className="animate-fade-in"
            style={{ animationDelay: `${Math.max(0, index - (visibleCount - PAGE_SIZE)) * 40}ms` }}
          >
            <MovieCard movie={movie} />
          </div>
        ))}
      </div>

      {/* Load more sentinel / indicator */}
      {hasMore && (
        <div ref={sentinelRef} className="flex items-center justify-center py-10">
          <div className="flex items-center gap-3 text-zinc-500 text-sm">
            <Loader2 className="w-5 h-5 animate-spin text-brand-primary" />
            <span>Daha fazla yükleniyor… ({visibleCount} / {sortedMovies.length})</span>
          </div>
        </div>
      )}

      {/* Bottom indicator when all loaded */}
      {!hasMore && sortedMovies.length > PAGE_SIZE && (
        <div className="flex items-center justify-center py-8">
          <div className="text-xs text-zinc-600 font-medium bg-zinc-900/50 border border-white/5 px-4 py-2 rounded-full">
            Toplam {sortedMovies.length} yapımın tamamı gösterildi
          </div>
        </div>
      )}
    </div>
  );
}

export default function ArchiveGrid({ movies, flat = false, defaultSort = 'myrating-desc' }: ArchiveGridProps) {
  const [sortOption, setSortOption] = useState<SortOption>(defaultSort);

  const cinemaMovies = movies.filter((m) => m.type === 'Movie');
  const tvContent = movies.filter(
    (m) =>
      m.type === 'TV Series' ||
      m.type === 'TV Episode' ||
      m.type === 'TV Special' ||
      m.type === 'TV Mini Series'
  );
  const otherContent = movies.filter(
    (m) =>
      m.type !== 'Movie' &&
      m.type !== 'TV Series' &&
      m.type !== 'TV Episode' &&
      m.type !== 'TV Special' &&
      m.type !== 'TV Mini Series'
  );

  // Determine default tab
  const defaultTab =
    cinemaMovies.length >= tvContent.length ? 'cinema' : 'tv';

  const [activeTab, setActiveTab] = useState<'cinema' | 'tv' | 'other'>(
    defaultTab
  );

  // Flat mode: show all movies in one grid
  if (flat) {
    return (
      <div className="space-y-5">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <StatsBar movies={movies} />
          <SortDropdown value={sortOption} onChange={setSortOption} />
        </div>

        {movies.length > 0 ? (
          <InfiniteMovieGrid movies={movies} sort={sortOption} />
        ) : (
          <div className="glass p-12 rounded-2xl text-center border border-white/5">
            <Film className="w-12 h-12 text-zinc-600 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-zinc-300">Yapım bulunamadı</h3>
            <p className="text-zinc-500 text-sm mt-1">
              Seçilen filtreye ait herhangi bir kayıt bulunmuyor.
            </p>
          </div>
        )}
      </div>
    );
  }

  const tabs = [
    {
      id: 'cinema' as const,
      label: 'Sinema Filmleri',
      icon: Film,
      count: cinemaMovies.length,
      items: cinemaMovies,
      color: 'text-brand-primary',
      activeBg:
        'bg-gradient-to-r from-red-950/40 to-rose-950/40 border-brand-primary/30 text-white',
    },
    {
      id: 'tv' as const,
      label: 'Dizi & Bölümler',
      icon: Tv,
      count: tvContent.length,
      items: tvContent,
      color: 'text-brand-secondary',
      activeBg:
        'bg-gradient-to-r from-rose-950/40 to-red-950/40 border-brand-secondary/30 text-white',
    },
    ...(otherContent.length > 0
      ? [
          {
            id: 'other' as const,
            label: 'Diğer',
            icon: Film,
            count: otherContent.length,
            items: otherContent,
            color: 'text-zinc-400',
            activeBg: 'bg-zinc-800/60 border-zinc-700 text-white',
          },
        ]
      : []),
  ];

  const activeItems =
    activeTab === 'cinema'
      ? cinemaMovies
      : activeTab === 'tv'
      ? tvContent
      : otherContent;

  return (
    <div className="space-y-6">
      {/* Tab Bar + Sort */}
      <div className="flex items-center gap-2 flex-wrap">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl border text-sm font-bold transition-all duration-300 ${
                isActive
                  ? `${tab.activeBg} shadow-[0_0_20px_rgba(239,68,68,0.15)]`
                  : 'bg-zinc-950/60 border-white/5 text-zinc-400 hover:text-white hover:border-white/10'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-current' : tab.color}`} />
              {tab.label}
              <span
                className={`text-xs px-2 py-0.5 rounded-full font-black ${
                  isActive
                    ? 'bg-white/10 text-white'
                    : 'bg-zinc-800 text-zinc-400'
                }`}
              >
                {tab.count}
              </span>
            </button>
          );
        })}

        {/* Sort dropdown + Stats */}
        <div className="ml-auto flex items-center gap-4">
          {activeItems.length > 0 && (
            <div className="hidden lg:block">
              <StatsBar movies={activeItems} />
            </div>
          )}
          <SortDropdown value={sortOption} onChange={setSortOption} />
        </div>
      </div>

      {/* Grid */}
      {activeItems.length > 0 ? (
        <InfiniteMovieGrid movies={activeItems} sort={sortOption} />
      ) : (
        <div className="glass p-12 rounded-2xl text-center border border-white/5">
          <Film className="w-12 h-12 text-zinc-600 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-zinc-300">Bu kategoride yapım yok</h3>
          <p className="text-zinc-500 text-sm mt-1">
            Seçilen filtreye ait bu türde herhangi bir kayıt bulunmuyor.
          </p>
        </div>
      )}
    </div>
  );
}
