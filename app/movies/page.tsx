'use client';

import { useState, useMemo, useEffect } from 'react';
import { Movie } from '@/types';
import MovieCard from '@/components/MovieCard';
import MovieListRow from '@/components/MovieListRow';
import Link from 'next/link';
import { Search, SlidersHorizontal, LayoutGrid, List, RotateCcw, Sparkles, Play, Film, Tv, Library } from 'lucide-react';

type TabType = 'all' | 'movie' | 'tv';

const TABS: { key: TabType; label: string; icon: React.ReactNode }[] = [
  { key: 'all',   label: 'Tümü',   icon: <Library className="w-4 h-4" /> },
  { key: 'movie', label: 'Filmler', icon: <Film className="w-4 h-4" /> },
  { key: 'tv',    label: 'Diziler', icon: <Tv className="w-4 h-4" /> },
];

// A movie is considered TV if its type starts with "TV" or equals known TV types
function isTV(movie: Movie): boolean {
  if (!movie.type) return false;
  const t = movie.type.trim();
  return (
    t === 'TV Series' ||
    t === 'TV Mini Series' ||
    t === 'TV Movie' ||
    t === 'TV Special' ||
    t === 'TV Episode' ||
    t === 'tvSeries' ||
    t === 'tvMiniSeries' ||
    t.startsWith('TV ')
  );
}

export default function MoviesPage() {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  // Active tab — default 'movie', persisted in localStorage
  const [activeTab, setActiveTab] = useState<TabType>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('movies-active-tab') as TabType | null;
      if (saved === 'all' || saved === 'movie' || saved === 'tv') return saved;
    }
    return 'movie';
  });

  // Load movies from local API
  useEffect(() => {
    async function load() {
      try {
        const response = await fetch('/api/movies');
        const data = await response.json();
        setMovies(data);
      } catch (err) {
        console.error('Failed to load movies:', err);
      } finally {
        setLoading(false);
      }
    }
    load();

    // Check admin session cookie
    const cookies = document.cookie.split(';');
    const isAlreadyAdmin = cookies.some((c) => c.trim().startsWith('is_admin=true'));
    setIsAdmin(isAlreadyAdmin);
  }, []);

  // Filter & Search states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGenre, setSelectedGenre] = useState('');
  const [selectedYear, setSelectedYear] = useState('');
  const [minMyRating, setMinMyRating] = useState('');
  const [minImdbRating, setMinImdbRating] = useState('');
  const [sortBy, setSortBy] = useState('watchDate-desc');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showFilters, setShowFilters] = useState(false);

  // Tab counts
  const tabCounts = useMemo(() => ({
    all: movies.length,
    movie: movies.filter((m) => !isTV(m)).length,
    tv: movies.filter((m) => isTV(m)).length,
  }), [movies]);

  // Calculate unique filters from data (scoped to active tab)
  const tabFilteredMovies = useMemo(() => {
    if (activeTab === 'movie') return movies.filter((m) => !isTV(m));
    if (activeTab === 'tv') return movies.filter((m) => isTV(m));
    return movies;
  }, [movies, activeTab]);

  const genres = useMemo(() => {
    const all = tabFilteredMovies.flatMap((m) => m.genres || []);
    return Array.from(new Set(all)).sort();
  }, [tabFilteredMovies]);

  const years = useMemo(() => {
    const all = tabFilteredMovies.map((m) => m.year).filter((y) => y > 0);
    return Array.from(new Set(all)).sort((a, b) => b - a);
  }, [tabFilteredMovies]);

  // Persist tab selection + reset filters on tab change
  useEffect(() => {
    localStorage.setItem('movies-active-tab', activeTab);
    setSearchQuery('');
    setSelectedGenre('');
    setSelectedYear('');
    setMinMyRating('');
    setMinImdbRating('');
    setSortBy('watchDate-desc');
  }, [activeTab]);

  // Reset all filters
  const resetFilters = () => {
    setSearchQuery('');
    setSelectedGenre('');
    setSelectedYear('');
    setMinMyRating('');
    setMinImdbRating('');
    setSortBy('watchDate-desc');
  };

  // Perform filtering & sorting
  const filteredAndSortedMovies = useMemo(() => {
    let result = [...tabFilteredMovies];

    // Search query (title, original title, director, cast)
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (m) =>
          m.title.toLowerCase().includes(query) ||
          m.originalTitle.toLowerCase().includes(query) ||
          (m.director && m.director.toLowerCase().includes(query)) ||
          m.cast.some((c) => c.toLowerCase().includes(query))
      );
    }

    // Genre filter
    if (selectedGenre) {
      result = result.filter((m) => m.genres.includes(selectedGenre));
    }

    // Year filter
    if (selectedYear) {
      result = result.filter((m) => m.year === parseInt(selectedYear, 10));
    }

    // My rating filter
    if (minMyRating) {
      result = result.filter((m) => m.myRating >= parseInt(minMyRating, 10));
    }

    // IMDb rating filter
    if (minImdbRating) {
      result = result.filter((m) => m.imdbRating >= parseFloat(minImdbRating));
    }

    // Sorting
    result.sort((a, b) => {
      if (sortBy === 'title-asc') return a.title.localeCompare(b.title, 'tr');
      if (sortBy === 'title-desc') return b.title.localeCompare(a.title, 'tr');
      if (sortBy === 'year-asc') return a.year - b.year;
      if (sortBy === 'year-desc') return b.year - a.year;
      if (sortBy === 'myRating-desc') return b.myRating - a.myRating || b.imdbRating - a.imdbRating;
      if (sortBy === 'myRating-asc') return a.myRating - b.myRating;
      if (sortBy === 'imdbRating-desc') return b.imdbRating - a.imdbRating;
      if (sortBy === 'watchDate-desc') {
        return new Date(b.watchDate).getTime() - new Date(a.watchDate).getTime();
      }
      if (sortBy === 'watchDate-asc') {
        return new Date(a.watchDate).getTime() - new Date(b.watchDate).getTime();
      }
      return 0;
    });

    return result;
  }, [tabFilteredMovies, searchQuery, selectedGenre, selectedYear, minMyRating, minImdbRating, sortBy]);

  // Infinite scroll/lazy load state
  const [visibleCount, setVisibleCount] = useState(15);

  // Reset pagination when filters, search, sort or tab change
  useEffect(() => {
    setVisibleCount(15);
  }, [searchQuery, selectedGenre, selectedYear, minMyRating, minImdbRating, sortBy, activeTab]);

  // Load more items on scroll
  useEffect(() => {
    const handleScroll = () => {
      if (visibleCount >= filteredAndSortedMovies.length) return;
      const scrollHeight = document.documentElement.scrollHeight;
      const scrollTop = window.scrollY || document.documentElement.scrollTop;
      const clientHeight = window.innerHeight;
      if (scrollHeight - scrollTop - clientHeight < 300) {
        setVisibleCount((prev) => Math.min(prev + 15, filteredAndSortedMovies.length));
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [visibleCount, filteredAndSortedMovies.length]);

  // Safety trigger for screens without scrollbar initially
  useEffect(() => {
    if (visibleCount < filteredAndSortedMovies.length) {
      const hasScrollbar = document.documentElement.scrollHeight > window.innerHeight;
      if (!hasScrollbar) {
        const timer = setTimeout(() => {
          setVisibleCount((prev) => Math.min(prev + 15, filteredAndSortedMovies.length));
        }, 150);
        return () => clearTimeout(timer);
      }
    }
  }, [visibleCount, filteredAndSortedMovies.length]);

  // Paginated/limited slice for rendering
  const displayedMovies = useMemo(() => {
    return filteredAndSortedMovies.slice(0, visibleCount);
  }, [filteredAndSortedMovies, visibleCount]);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-800 pb-5">
        <div>
          <h1 className="text-3xl font-black text-white">🎬 Sinema Kitaplığım</h1>
          <p className="text-zinc-500 text-sm mt-1">
            Toplam {filteredAndSortedMovies.length} yapım gösteriliyor
          </p>
        </div>

        {/* Admin wizards + layout togglers */}
        <div className="flex items-center gap-3">
          {isAdmin && (
            <>
              <Link
                href="/enrich"
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-brand-primary/20 bg-brand-primary/5 hover:bg-brand-primary/10 text-brand-primary text-sm font-semibold transition-all duration-300 shadow-[0_0_15px_rgba(239,68,68,0.1)] hover:shadow-[0_0_20px_rgba(239,68,68,0.2)]"
              >
                <Sparkles className="w-4 h-4 animate-pulse-subtle" />
                Poster Sihirbazı
              </Link>

              <Link
                href="/enrich-trailers"
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-red-500/20 bg-red-500/5 hover:bg-red-500/10 text-red-500 text-sm font-semibold transition-all duration-300 shadow-[0_0_15px_rgba(239,68,68,0.1)] hover:shadow-[0_0_20px_rgba(239,68,68,0.2)]"
              >
                <Play className="w-4 h-4 animate-pulse-subtle" />
                Fragman Sihirbazı
              </Link>
            </>
          )}

          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl border text-sm font-semibold transition-all duration-300 ${
              showFilters || selectedGenre || selectedYear || minMyRating || minImdbRating
                ? 'bg-brand-primary/10 border-brand-primary/30 text-brand-primary'
                : 'bg-zinc-900 border-white/5 text-zinc-400 hover:text-white'
            }`}
          >
            <SlidersHorizontal className="w-4 h-4" />
            Filtreler
          </button>

          <div className="bg-zinc-950/60 p-1 rounded-xl border border-white/5 flex items-center gap-1">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-lg transition-all ${
                viewMode === 'grid' ? 'bg-zinc-800 text-brand-primary shadow' : 'text-zinc-500 hover:text-zinc-300'
              }`}
              aria-label="Grid view"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-lg transition-all ${
                viewMode === 'list' ? 'bg-zinc-800 text-brand-primary shadow' : 'text-zinc-500 hover:text-zinc-300'
              }`}
              aria-label="List view"
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* ── Tabs ── */}
      <div className="flex items-center gap-1 p-1 bg-zinc-900/60 border border-white/5 rounded-2xl w-fit">
        {TABS.map((tab) => {
          const active = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`relative flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 ${
                active
                  ? 'bg-brand-primary text-white shadow-[0_4px_15px_rgba(239,68,68,0.35)]'
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-800/60'
              }`}
            >
              {tab.icon}
              {tab.label}
              {/* Count badge */}
              <span
                className={`text-[10px] font-black px-1.5 py-0.5 rounded-md leading-none ${
                  active
                    ? 'bg-white/20 text-white'
                    : 'bg-zinc-800 text-zinc-400'
                }`}
              >
                {tabCounts[tab.key]}
              </span>
            </button>
          );
        })}
      </div>

      {/* Filters Box */}
      {(showFilters || selectedGenre || selectedYear || minMyRating || minImdbRating) && (
        <div className="glass p-6 rounded-2xl border border-white/5 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4 animate-fade-in">
          {/* Genre Filter */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Tür</label>
            <select
              value={selectedGenre}
              onChange={(e) => setSelectedGenre(e.target.value)}
              className="w-full bg-zinc-900 border border-white/5 rounded-xl px-3 py-2 text-sm text-zinc-300 focus:border-brand-primary/50 focus:outline-none"
            >
              <option value="">Tümü</option>
              {genres.map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </select>
          </div>

          {/* Year Filter */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Yapım Yılı</label>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="w-full bg-zinc-900 border border-white/5 rounded-xl px-3 py-2 text-sm text-zinc-300 focus:border-brand-primary/50 focus:outline-none"
            >
              <option value="">Tümü</option>
              {years.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </div>

          {/* My Rating Filter */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Benim Puanım (Min)</label>
            <select
              value={minMyRating}
              onChange={(e) => setMinMyRating(e.target.value)}
              className="w-full bg-zinc-900 border border-white/5 rounded-xl px-3 py-2 text-sm text-zinc-300 focus:border-brand-primary/50 focus:outline-none"
            >
              <option value="">Tümü</option>
              {[10, 9, 8, 7, 6, 5, 4, 3, 2, 1].map((r) => (
                <option key={r} value={r}>
                  {r}+ Puan
                </option>
              ))}
            </select>
          </div>

          {/* IMDb Rating Filter */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">IMDb Puanı (Min)</label>
            <select
              value={minImdbRating}
              onChange={(e) => setMinImdbRating(e.target.value)}
              className="w-full bg-zinc-900 border border-white/5 rounded-xl px-3 py-2 text-sm text-zinc-300 focus:border-brand-primary/50 focus:outline-none"
            >
              <option value="">Tümü</option>
              {[9.0, 8.5, 8.0, 7.5, 7.0, 6.5, 6.0, 5.0].map((r) => (
                <option key={r} value={r}>
                  {r.toFixed(1)}+ Puan
                </option>
              ))}
            </select>
          </div>

          {/* Sorting */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Sıralama</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full bg-zinc-900 border border-white/5 rounded-xl px-3 py-2 text-sm text-zinc-300 focus:border-brand-primary/50 focus:outline-none"
            >
              <option value="watchDate-desc">Son İzlenenler</option>
              <option value="watchDate-asc">İlk İzlenenler</option>
              <option value="myRating-desc">Benim Puanım (Yüksek)</option>
              <option value="myRating-asc">Benim Puanım (Düşük)</option>
              <option value="imdbRating-desc">IMDb Puanı (Yüksek)</option>
              <option value="year-desc">Yapım Yılı (Yeni)</option>
              <option value="year-asc">Yapım Yılı (Eski)</option>
              <option value="title-asc">İsim (A-Z)</option>
              <option value="title-desc">İsim (Z-A)</option>
            </select>
          </div>

          {/* Reset Filters Option */}
          <div className="col-span-1 sm:col-span-2 md:col-span-5 flex justify-end pt-2 border-t border-zinc-800/60">
            <button
              onClick={resetFilters}
              className="inline-flex items-center gap-1.5 text-xs text-zinc-400 hover:text-white transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Filtreleri Sıfırla
            </button>
          </div>
        </div>
      )}

      {/* Main Search Input */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
        <input
          type="text"
          placeholder={
            activeTab === 'tv'
              ? 'Dizi adı, yönetmen veya oyuncu ara...'
              : activeTab === 'movie'
              ? 'Film adı, yönetmen veya oyuncu ara...'
              : 'Film adı, yönetmen veya oyuncu ara...'
          }
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-zinc-950/60 border border-white/5 rounded-2xl py-4 pl-12 pr-6 text-sm text-white placeholder-zinc-500 focus:border-brand-primary/50 focus:outline-none transition-all duration-300"
        />
      </div>

      {/* Loading State */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <div className="w-10 h-10 border-4 border-brand-primary border-t-transparent rounded-full animate-spin"></div>
          <span className="text-sm text-zinc-500">Kitaplık yükleniyor...</span>
        </div>
      ) : filteredAndSortedMovies.length === 0 ? (
        <div className="text-center py-20 border border-dashed border-zinc-800 rounded-2xl bg-zinc-950/20">
          <span className="text-4xl">🔍</span>
          <h3 className="text-lg font-bold text-zinc-300 mt-4">Hiçbir Sonuç Bulunamadı</h3>
          <p className="text-sm text-zinc-500 mt-1">
            Farklı anahtar kelimeler aramayı veya filtreleri sıfırlamayı deneyebilirsiniz.
          </p>
          <button
            onClick={resetFilters}
            className="mt-4 bg-brand-primary/10 hover:bg-brand-primary/20 border border-brand-primary/20 text-brand-primary px-4 py-2 rounded-xl text-xs font-bold transition-all"
          >
            Aramayı Temizle
          </button>
        </div>
      ) : viewMode === 'grid' ? (
        /* Poster Grid View */
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
          {displayedMovies.map((movie) => (
            <MovieCard key={movie.imdbId} movie={movie} />
          ))}
        </div>
      ) : (
        /* List Row View */
        <div className="flex flex-col gap-4">
          {displayedMovies.map((movie) => (
            <MovieListRow key={movie.imdbId} movie={movie} />
          ))}
        </div>
      )}

      {/* Scroll loading spinner */}
      {visibleCount < filteredAndSortedMovies.length && (
        <div className="flex justify-center py-8">
          <div className="w-8 h-8 border-4 border-brand-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
      )}
    </div>
  );
}
