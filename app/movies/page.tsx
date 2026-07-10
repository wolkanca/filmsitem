'use client';

import { useState, useMemo, useEffect } from 'react';
import type { ReactNode } from 'react';
import { Movie } from '@/types';
import MovieCard from '@/components/MovieCard';
import MovieListRow from '@/components/MovieListRow';
import {
  Search,
  SlidersHorizontal,
  LayoutGrid,
  List,
  RotateCcw,
  Film,
  Tv,
  Library,
} from 'lucide-react';

const PAGE_SIZE = 25;

type TabType = 'all' | 'movie' | 'tv' | 'other';

type SortType =
  | 'title-asc'
  | 'title-desc'
  | 'year-asc'
  | 'year-desc'
  | 'myRating-desc'
  | 'myRating-asc'
  | 'imdbRating-desc'
  | 'watchDate-desc'
  | 'watchDate-asc';

const DEFAULT_SORT: SortType = 'year-desc';

const VALID_SORTS: SortType[] = [
  'title-asc',
  'title-desc',
  'year-asc',
  'year-desc',
  'myRating-desc',
  'myRating-asc',
  'imdbRating-desc',
  'watchDate-desc',
  'watchDate-asc',
];

const TABS: {
  key: TabType;
  label: string;
  icon: ReactNode;
}[] = [
    {
      key: 'all',
      label: 'Tümü',
      icon: <Library className="w-4 h-4" />,
    },
    {
      key: 'movie',
      label: 'Filmler',
      icon: <Film className="w-4 h-4" />,
    },
    {
      key: 'tv',
      label: 'Diziler',
      icon: <Tv className="w-4 h-4" />,
    },
    {
      key: 'other',
      label: 'Diğer',
      icon: <LayoutGrid className="w-4 h-4" />,
    },
  ];

function isValidSort(value: string | null): value is SortType {
  if (!value) return false;

  return VALID_SORTS.includes(value as SortType);
}

// Yapımın dizi olup olmadığını kontrol eder.
function isTV(movie: Movie): boolean {
  if (!movie.type) return false;

  const type = movie.type.trim();

  return (
    type === 'TV Series' ||
    type === 'TV Mini Series' ||
    type === 'TV Movie' ||
    type === 'TV Special' ||
    type === 'TV Episode' ||
    type === 'tvSeries' ||
    type === 'tvMiniSeries' ||
    type.startsWith('TV ')
  );
}

// Geçersiz veya boş tarihleri sıralamanın sonuna göndermek için kullanılır.
function getWatchDateTimestamp(watchDate: string | undefined | null): number {
  if (!watchDate) return 0;

  const timestamp = new Date(watchDate).getTime();

  return Number.isNaN(timestamp) ? 0 : timestamp;
}

export default function MoviesPage() {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  const [activeTab, setActiveTab] = useState<TabType>('all');
  const [isMounted, setIsMounted] = useState(false);

  // Filtre ve arama durumları
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGenre, setSelectedGenre] = useState('');
  const [selectedYear, setSelectedYear] = useState('');
  const [minMyRating, setMinMyRating] = useState('');
  const [minImdbRating, setMinImdbRating] = useState('');
  const [sortBy, setSortByState] = useState<SortType>(DEFAULT_SORT);
  const [viewMode, setViewModeState] = useState<'grid' | 'list'>('grid');
  const [showFilters, setShowFilters] = useState(false);

  // localStorage ve URL parametrelerini yükler.
  useEffect(() => {
    const savedTab = localStorage.getItem(
      'movies-active-tab'
    ) as TabType | null;

    if (
      savedTab === 'all' ||
      savedTab === 'movie' ||
      savedTab === 'tv' ||
      savedTab === 'other'
    ) {
      setActiveTab(savedTab);
    }

    /*
     * URL sıralaması localStorage değerinden önceliklidir.
     *
     * /movies?sort=watchDate
     * /movies?sort=watchDate-desc
     * /movies?sort=watchDate-asc
     * /movies?sort=year-desc
     */
    const searchParams = new URLSearchParams(window.location.search);
    const sortParam = searchParams.get('sort');

    if (sortParam === 'watchDate') {
      setSortByState('watchDate-desc');
    } else if (isValidSort(sortParam)) {
      setSortByState(sortParam);
    } else {
      const savedSort = localStorage.getItem('movies-sort-by');

      if (isValidSort(savedSort)) {
        setSortByState(savedSort);
      }
    }

    const savedView = localStorage.getItem('movies-view-mode');

    if (savedView === 'grid' || savedView === 'list') {
      setViewModeState(savedView);
    }

    const savedGenre = localStorage.getItem('movies-genre');

    if (savedGenre) {
      setSelectedGenre(savedGenre);
    }

    const savedYear = localStorage.getItem('movies-year');

    if (savedYear) {
      setSelectedYear(savedYear);
    }

    const savedMinMyRating = localStorage.getItem(
      'movies-min-my-rating'
    );

    if (savedMinMyRating) {
      setMinMyRating(savedMinMyRating);
    }

    const savedMinImdb = localStorage.getItem(
      'movies-min-imdb-rating'
    );

    if (savedMinImdb) {
      setMinImdbRating(savedMinImdb);
    }

    setIsMounted(true);
  }, []);

  // Filmleri yerel API üzerinden yükler.
  useEffect(() => {
    async function load() {
      try {
        const response = await fetch('/api/movies');

        if (!response.ok) {
          throw new Error(`Movies API error: ${response.status}`);
        }

        const data = await response.json();

        setMovies(data);
      } catch (error) {
        console.error('Failed to load movies:', error);
      } finally {
        setLoading(false);
      }
    }

    load();

    // Admin oturum çerezini kontrol eder.
    const cookies = document.cookie.split(';');
    const isAlreadyAdmin = cookies.some((cookie) =>
      cookie.trim().startsWith('is_admin=true')
    );

    setIsAdmin(isAlreadyAdmin);
  }, []);

  // Sıralamayı kaydeder.
  const setSortBy = (value: SortType) => {
    setSortByState(value);
    localStorage.setItem('movies-sort-by', value);
  };

  // Görünüm tercihini kaydeder.
  const setViewMode = (value: 'grid' | 'list') => {
    setViewModeState(value);
    localStorage.setItem('movies-view-mode', value);
  };

  // Film veya dizi olmayan yapımları kontrol eder.
  function isOther(movie: Movie): boolean {
    return !isTV(movie) && movie.type !== 'Movie';
  }

  // Sekme sayaçları
  const tabCounts = useMemo(
    () => ({
      all: movies.length,
      movie: movies.filter((movie) => movie.type === 'Movie').length,
      tv: movies.filter((movie) => isTV(movie)).length,
      other: movies.filter((movie) => isOther(movie)).length,
    }),
    [movies]
  );

  // Aktif sekmeye göre yapımları filtreler.
  const tabFilteredMovies = useMemo(() => {
    if (activeTab === 'movie') {
      return movies
        .filter((movie) => movie.type === 'Movie')
        .reverse();
    }

    if (activeTab === 'tv') {
      return movies
        .filter((movie) => isTV(movie))
        .reverse();
    }

    if (activeTab === 'other') {
      return movies
        .filter((movie) => isOther(movie))
        .reverse();
    }

    return [...movies].reverse();
  }, [movies, activeTab]);

  // Aktif sekmedeki benzersiz türler
  const genres = useMemo(() => {
    const allGenres = tabFilteredMovies.flatMap(
      (movie) => movie.genres || []
    );

    return Array.from(new Set(allGenres)).sort((a, b) =>
      a.localeCompare(b, 'tr')
    );
  }, [tabFilteredMovies]);

  // Aktif sekmedeki benzersiz yıllar
  const years = useMemo(() => {
    const allYears = tabFilteredMovies
      .map((movie) => movie.year)
      .filter((year) => year > 0);

    return Array.from(new Set(allYears)).sort((a, b) => b - a);
  }, [tabFilteredMovies]);

  // Sekme seçimini kaydeder ve içerik filtrelerini sıfırlar.
  useEffect(() => {
    if (!isMounted) return;

    localStorage.setItem('movies-active-tab', activeTab);

    setSearchQuery('');
    setSelectedGenre('');
    setSelectedYear('');
    setMinMyRating('');
    setMinImdbRating('');

    localStorage.removeItem('movies-genre');
    localStorage.removeItem('movies-year');
    localStorage.removeItem('movies-min-my-rating');
    localStorage.removeItem('movies-min-imdb-rating');

    // Sıralama ve görünüm tercihi sekmeler arasında korunur.
  }, [activeTab, isMounted]);

  // Bütün filtreleri sıfırlar.
  const resetFilters = () => {
    setSearchQuery('');
    setSelectedGenre('');
    setSelectedYear('');
    setMinMyRating('');
    setMinImdbRating('');
    setSortBy(DEFAULT_SORT);

    localStorage.removeItem('movies-genre');
    localStorage.removeItem('movies-year');
    localStorage.removeItem('movies-min-my-rating');
    localStorage.removeItem('movies-min-imdb-rating');
    localStorage.setItem('movies-sort-by', DEFAULT_SORT);
  };

  // Arama, filtreleme ve sıralama
  const filteredAndSortedMovies = useMemo(() => {
    let result = [...tabFilteredMovies];

    // Başlık, özgün başlık, yönetmen, oyuncu, senarist, tür ve liste araması
    if (searchQuery.trim()) {
      const query = searchQuery.trim().toLocaleLowerCase('tr');

      result = result.filter((movie) => {
        const title = movie.title?.toLocaleLowerCase('tr') || '';
        const originalTitle =
          movie.originalTitle?.toLocaleLowerCase('tr') || '';
        const director =
          movie.director?.toLocaleLowerCase('tr') || '';

        const castMatches =
          movie.cast?.some((person) =>
            person.toLocaleLowerCase('tr').includes(query)
          ) ?? false;

        const writersMatch =
          movie.writers?.some((writer) =>
            writer.toLocaleLowerCase('tr').includes(query)
          ) ?? false;

        const genresMatch =
          movie.genres?.some((genre) =>
            genre.toLocaleLowerCase('tr').includes(query)
          ) ?? false;

        const listsMatch =
          movie.listName?.some((listName) =>
            listName.toLocaleLowerCase('tr').includes(query)
          ) ?? false;

        return (
          title.includes(query) ||
          originalTitle.includes(query) ||
          director.includes(query) ||
          castMatches ||
          writersMatch ||
          genresMatch ||
          listsMatch
        );
      });
    }

    // Tür filtresi
    if (selectedGenre) {
      result = result.filter((movie) =>
        movie.genres?.includes(selectedGenre)
      );
    }

    // Yapım yılı filtresi
    if (selectedYear) {
      result = result.filter(
        (movie) => movie.year === Number(selectedYear)
      );
    }

    // Kişisel puan filtresi
    if (minMyRating) {
      result = result.filter(
        (movie) => movie.myRating >= Number(minMyRating)
      );
    }

    // IMDb puanı filtresi
    if (minImdbRating) {
      result = result.filter(
        (movie) => movie.imdbRating >= Number(minImdbRating)
      );
    }

    // Sıralama
    result.sort((a, b) => {
      if (sortBy === 'title-asc') {
        return a.title.localeCompare(b.title, 'tr');
      }

      if (sortBy === 'title-desc') {
        return b.title.localeCompare(a.title, 'tr');
      }

      if (sortBy === 'year-asc') {
        return a.year - b.year;
      }

      if (sortBy === 'year-desc') {
        return b.year - a.year;
      }

      if (sortBy === 'myRating-desc') {
        return (
          b.myRating - a.myRating ||
          b.imdbRating - a.imdbRating
        );
      }

      if (sortBy === 'myRating-asc') {
        return (
          a.myRating - b.myRating ||
          a.imdbRating - b.imdbRating
        );
      }

      if (sortBy === 'imdbRating-desc') {
        return (
          b.imdbRating - a.imdbRating ||
          b.myRating - a.myRating
        );
      }

      if (sortBy === 'watchDate-desc') {
        return (
          getWatchDateTimestamp(b.watchDate) -
          getWatchDateTimestamp(a.watchDate)
        );
      }

      if (sortBy === 'watchDate-asc') {
        const aTimestamp = getWatchDateTimestamp(a.watchDate);
        const bTimestamp = getWatchDateTimestamp(b.watchDate);

        /*
         * Tarihi olmayan yapımlar "İlk İzlenenler"
         * sıralamasında listenin sonunda kalır.
         */
        if (aTimestamp === 0 && bTimestamp === 0) return 0;
        if (aTimestamp === 0) return 1;
        if (bTimestamp === 0) return -1;

        return aTimestamp - bTimestamp;
      }

      return 0;
    });

    return result;
  }, [
    tabFilteredMovies,
    searchQuery,
    selectedGenre,
    selectedYear,
    minMyRating,
    minImdbRating,
    sortBy,
  ]);

  // Sonsuz kaydırma
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  // Filtre, arama, sıralama veya sekme değişince sayfalamayı sıfırlar.
  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [
    searchQuery,
    selectedGenre,
    selectedYear,
    minMyRating,
    minImdbRating,
    sortBy,
    activeTab,
  ]);

  // Sayfanın sonuna yaklaşınca daha fazla yapım gösterir.
  useEffect(() => {
    const handleScroll = () => {
      if (visibleCount >= filteredAndSortedMovies.length) return;

      const scrollHeight = document.documentElement.scrollHeight;
      const scrollTop =
        window.scrollY || document.documentElement.scrollTop;
      const clientHeight = window.innerHeight;

      if (scrollHeight - scrollTop - clientHeight < 300) {
        setVisibleCount((previousCount) =>
          Math.min(
            previousCount + PAGE_SIZE,
            filteredAndSortedMovies.length
          )
        );
      }
    };

    window.addEventListener('scroll', handleScroll, {
      passive: true,
    });

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [visibleCount, filteredAndSortedMovies.length]);

  // İlk yüklemede kaydırma çubuğu oluşmazsa ek yapım yükler.
  useEffect(() => {
    if (visibleCount >= filteredAndSortedMovies.length) return;

    const hasScrollbar =
      document.documentElement.scrollHeight > window.innerHeight;

    if (hasScrollbar) return;

    const timer = window.setTimeout(() => {
      setVisibleCount((previousCount) =>
        Math.min(
          previousCount + PAGE_SIZE,
          filteredAndSortedMovies.length
        )
      );
    }, 150);

    return () => {
      window.clearTimeout(timer);
    };
  }, [visibleCount, filteredAndSortedMovies.length]);

  // Ekranda gösterilecek yapımlar
  const displayedMovies = useMemo(() => {
    return filteredAndSortedMovies.slice(0, visibleCount);
  }, [filteredAndSortedMovies, visibleCount]);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-800 pb-5">
        <div>
          <h1 className="text-3xl font-black text-white">
            🎬 Kitaplığım
          </h1>

          <p className="text-zinc-500 text-sm mt-1">
            Toplam {filteredAndSortedMovies.length} yapım gösteriliyor
          </p>
        </div>

        {/* Görünüm düğmeleri */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setShowFilters((previous) => !previous)}
            className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl border text-sm font-semibold transition-all duration-300 ${showFilters ||
                selectedGenre ||
                selectedYear ||
                minMyRating ||
                minImdbRating ||
                sortBy !== DEFAULT_SORT
                ? 'bg-brand-primary/10 border-brand-primary/30 text-brand-primary'
                : 'bg-zinc-900 border-white/5 text-zinc-400 hover:text-white'
              }`}
          >
            <SlidersHorizontal className="w-4 h-4" />
            Filtreler
          </button>

          <div className="bg-zinc-950/60 p-1 rounded-xl border border-white/5 flex items-center gap-1">
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-lg transition-all ${viewMode === 'grid'
                  ? 'bg-zinc-800 text-brand-primary shadow'
                  : 'text-zinc-500 hover:text-zinc-300'
                }`}
              aria-label="Izgara görünümü"
              title="Izgara görünümü"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-lg transition-all ${viewMode === 'list'
                  ? 'bg-zinc-800 text-brand-primary shadow'
                  : 'text-zinc-500 hover:text-zinc-300'
                }`}
              aria-label="Liste görünümü"
              title="Liste görünümü"
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Sekmeler */}
      <div className="grid grid-cols-2 sm:flex sm:items-center gap-3 w-full sm:w-fit">
        {TABS.filter(
          (tab) => tab.key !== 'other' || tabCounts.other > 0
        ).map((tab) => {
          const active = activeTab === tab.key;

          return (
            <button
              type="button"
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`relative flex items-center justify-center gap-2 px-4 sm:px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 ${active
                  ? 'bg-brand-primary border border-brand-primary text-white shadow-[0_4px_15px_rgba(239,68,68,0.35)]'
                  : 'bg-zinc-950/60 border border-white/10 text-zinc-400 hover:text-white hover:bg-zinc-900'
                }`}
            >
              {tab.icon}
              {tab.label}

              <span
                className={`text-[10px] font-black px-1.5 py-0.5 rounded-md leading-none ${active
                    ? 'bg-white/20 text-white'
                    : 'bg-zinc-800 text-zinc-400'
                  }`}
              >
                {tabCounts[tab.key] ?? 0}
              </span>
            </button>
          );
        })}
      </div>

      {/* Filtre kutusu */}
      {(showFilters ||
        selectedGenre ||
        selectedYear ||
        minMyRating ||
        minImdbRating ||
        sortBy !== DEFAULT_SORT) && (
          <div className="glass p-6 rounded-2xl border border-white/5 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4 animate-fade-in">
            {/* Tür filtresi */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">
                Tür
              </label>

              <select
                value={selectedGenre}
                onChange={(event) => {
                  const value = event.target.value;

                  setSelectedGenre(value);
                  localStorage.setItem('movies-genre', value);
                }}
                className="w-full bg-zinc-900 border border-white/5 rounded-xl px-3 py-2 text-sm text-zinc-300 focus:border-brand-primary/50 focus:outline-none"
              >
                <option value="">Tümü</option>

                {genres.map((genre) => (
                  <option key={genre} value={genre}>
                    {genre}
                  </option>
                ))}
              </select>
            </div>

            {/* Yıl filtresi */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">
                Yapım Yılı
              </label>

              <select
                value={selectedYear}
                onChange={(event) => {
                  const value = event.target.value;

                  setSelectedYear(value);
                  localStorage.setItem('movies-year', value);
                }}
                className="w-full bg-zinc-900 border border-white/5 rounded-xl px-3 py-2 text-sm text-zinc-300 focus:border-brand-primary/50 focus:outline-none"
              >
                <option value="">Tümü</option>

                {years.map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            </div>

            {/* Kişisel puan filtresi */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">
                Benim Puanım (Min)
              </label>

              <select
                value={minMyRating}
                onChange={(event) => {
                  const value = event.target.value;

                  setMinMyRating(value);
                  localStorage.setItem(
                    'movies-min-my-rating',
                    value
                  );
                }}
                className="w-full bg-zinc-900 border border-white/5 rounded-xl px-3 py-2 text-sm text-zinc-300 focus:border-brand-primary/50 focus:outline-none"
              >
                <option value="">Tümü</option>

                {[10, 9, 8, 7, 6, 5, 4, 3, 2, 1].map((rating) => (
                  <option key={rating} value={rating}>
                    {rating}+ Puan
                  </option>
                ))}
              </select>
            </div>

            {/* IMDb puanı filtresi */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">
                IMDb Puanı (Min)
              </label>

              <select
                value={minImdbRating}
                onChange={(event) => {
                  const value = event.target.value;

                  setMinImdbRating(value);
                  localStorage.setItem(
                    'movies-min-imdb-rating',
                    value
                  );
                }}
                className="w-full bg-zinc-900 border border-white/5 rounded-xl px-3 py-2 text-sm text-zinc-300 focus:border-brand-primary/50 focus:outline-none"
              >
                <option value="">Tümü</option>

                {[9.0, 8.5, 8.0, 7.5, 7.0, 6.5, 6.0, 5.0].map(
                  (rating) => (
                    <option key={rating} value={rating}>
                      {rating.toFixed(1)}+ Puan
                    </option>
                  )
                )}
              </select>
            </div>

            {/* Sıralama */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">
                Sıralama
              </label>

              <select
                value={sortBy}
                onChange={(event) =>
                  setSortBy(event.target.value as SortType)
                }
                className="w-full bg-zinc-900 border border-white/5 rounded-xl px-3 py-2 text-sm text-zinc-300 focus:border-brand-primary/50 focus:outline-none"
              >
                <option value="year-desc">
                  Yapım Yılı (Yeni)
                </option>

                <option value="year-asc">
                  Yapım Yılı (Eski)
                </option>

                <option value="myRating-desc">
                  Benim Puanım (Yüksek)
                </option>

                <option value="myRating-asc">
                  Benim Puanım (Düşük)
                </option>

                <option value="imdbRating-desc">
                  IMDb Puanı (Yüksek)
                </option>

                <option value="title-asc">
                  İsim (A-Z)
                </option>

                <option value="title-desc">
                  İsim (Z-A)
                </option>

                <option value="watchDate-desc">
                  Son İzlenenler
                </option>

                <option value="watchDate-asc">
                  İlk İzlenenler
                </option>
              </select>
            </div>

            {/* Filtreleri sıfırla */}
            <div className="col-span-1 sm:col-span-2 md:col-span-5 flex justify-end pt-2 border-t border-zinc-800/60">
              <button
                type="button"
                onClick={resetFilters}
                className="inline-flex items-center gap-1.5 text-xs text-zinc-400 hover:text-white transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Filtreleri Sıfırla
              </button>
            </div>
          </div>
        )}

      {/* Arama alanı */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />

        <input
          type="text"
          placeholder={
            activeTab === 'tv'
              ? 'Dizi adı, yönetmen veya oyuncu ara...'
              : activeTab === 'movie'
                ? 'Film adı, yönetmen veya oyuncu ara...'
                : 'Yapım adı, yönetmen veya oyuncu ara...'
          }
          value={searchQuery}
          onChange={(event) =>
            setSearchQuery(event.target.value)
          }
          className="w-full bg-zinc-950/60 border border-white/5 rounded-2xl py-4 pl-12 pr-6 text-sm text-white placeholder-zinc-500 focus:border-brand-primary/50 focus:outline-none transition-all duration-300"
        />
      </div>

      {/* İçerik */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <div className="w-10 h-10 border-4 border-brand-primary border-t-transparent rounded-full animate-spin" />

          <span className="text-sm text-zinc-500">
            Kitaplık yükleniyor...
          </span>
        </div>
      ) : filteredAndSortedMovies.length === 0 ? (
        <div className="text-center py-20 border border-dashed border-zinc-800 rounded-2xl bg-zinc-950/20">
          <span className="text-4xl">🔍</span>

          <h3 className="text-lg font-bold text-zinc-300 mt-4">
            Hiçbir Sonuç Bulunamadı
          </h3>

          <p className="text-sm text-zinc-500 mt-1">
            Farklı anahtar kelimeler aramayı veya filtreleri
            sıfırlamayı deneyebilirsiniz.
          </p>

          <button
            type="button"
            onClick={resetFilters}
            className="mt-4 bg-brand-primary/10 hover:bg-brand-primary/20 border border-brand-primary/20 text-brand-primary px-4 py-2 rounded-xl text-xs font-bold transition-all"
          >
            Aramayı Temizle
          </button>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
          {displayedMovies.map((movie) => (
            <MovieCard
              key={movie.imdbId}
              movie={movie}
            />
          ))}
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {displayedMovies.map((movie) => (
            <MovieListRow
              key={movie.imdbId}
              movie={movie}
            />
          ))}
        </div>
      )}

      {/* Sonsuz kaydırma yükleniyor göstergesi */}
      {visibleCount < filteredAndSortedMovies.length && (
        <div className="flex justify-center py-8">
          <div className="w-8 h-8 border-4 border-brand-primary border-t-transparent rounded-full animate-spin" />
        </div>
      )}
    </div>
  );
}