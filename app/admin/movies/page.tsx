'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft, Search, Pencil, Check, X, Loader2, Film, Image as ImageIcon, Video, Download
} from 'lucide-react';
import { Movie } from '@/types';
import { normalizeSearchString } from '@/lib/utils';

export default function AdminMoviesPage() {
  const router = useRouter();
  const [authorized, setAuthorized] = useState(false);

  // Film düzenleyici states
  const [movies, setMovies] = useState<Movie[]>([]);
  const [moviesLoading, setMoviesLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterMode, setFilterMode] = useState<
    'all' | 'is-featured' | 'no-poster' | 'no-trailer' | 'both-missing' |
    'no-overview' | 'no-plot' | 'no-plotTr' | 'no-genres' | 'no-director' |
    'no-cast' | 'no-runtime' | 'no-country' | 'no-year' | 'no-imdb-rating' | 'no-release-date'
  >('all');
  const [sortBy, setSortBy] = useState<'default' | 'watch-date' | 'imdb-rating' | 'my-rating' | 'country' | 'year' | 'title'>('default');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Per-movie edit states: { [imdbId]: { poster, trailer, saving, error, posterOpen, trailerOpen } }
  const [editStates, setEditStates] = useState<
    Record<string, { poster: string; trailer: string; saving: boolean; error: string; posterOpen: boolean; trailerOpen: boolean }>
  >({});

  // Detailed movie edit modal states
  interface ModalFormState {
    title: string;
    originalTitle: string;
    year: number;
    type: string;
    myRating: number;
    watchDate: string;
    listName: string;
    poster: string;
    backdrop: string;
    overview: string;
    plot: string;
    plotTr: string;
    country: string;
    omdbType: string;
    boxOffice: string;
    genres: string;
    runtime: number;
    cast: string;
    director: string;
    writers: string;
    imdbRating: number;
    tmdbRating: number;
    releaseDate: string;
    trailerYoutubeId: string;
    isFeatured: boolean;
  }

  const [editingMovie, setEditingMovie] = useState<Movie | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalSaving, setModalSaving] = useState(false);
  const [modalError, setModalError] = useState('');
  const [modalForm, setModalForm] = useState<ModalFormState>({
    title: '',
    originalTitle: '',
    year: 0,
    type: 'Movie',
    myRating: 0,
    watchDate: '',
    listName: '',
    poster: '',
    backdrop: '',
    overview: '',
    plot: '',
    plotTr: '',
    country: '',
    omdbType: '',
    boxOffice: '',
    genres: '',
    runtime: 0,
    cast: '',
    director: '',
    writers: '',
    imdbRating: 0,
    tmdbRating: 0,
    releaseDate: '',
    trailerYoutubeId: '',
    isFeatured: false,
  });

  // Check admin session
  useEffect(() => {
    const cookies = document.cookie.split(';');
    const isAdmin = cookies.some((c) => c.trim().startsWith('is_admin=true'));
    if (!isAdmin) {
      router.push('/admin');
    } else {
      setAuthorized(true);
    }
  }, [router]);

  // Load movies when authorized
  useEffect(() => {
    if (!authorized) return;
    setMoviesLoading(true);
    fetch('/api/movies')
      .then((r) => r.json())
      .then((data: Movie[]) => {
        setMovies(data);
        // Initialize edit states
        const initStates: typeof editStates = {};
        data.forEach((m) => {
          initStates[m.imdbId] = {
            poster: m.poster || '',
            trailer: m.trailerYoutubeId || '',
            saving: false,
            error: '',
            posterOpen: false,
            trailerOpen: false,
          };
        });
        setEditStates(initStates);
      })
      .catch(() => { })
      .finally(() => setMoviesLoading(false));
  }, [authorized]);

  // Filter and sort movies
  const filteredMovies = useMemo(() => {
    let list = movies;

    // Apply filter mode
    const noPoster = (m: Movie) => !m.poster || m.poster.includes('unsplash.com') || m.poster.includes('placeholder');
    if (filterMode === 'is-featured') {
      list = list.filter((m) => m.isFeatured);
    } else if (filterMode === 'no-poster') {
      list = list.filter(noPoster);
    } else if (filterMode === 'no-trailer') {
      list = list.filter((m) => !m.trailerYoutubeId);
    } else if (filterMode === 'both-missing') {
      list = list.filter((m) => noPoster(m) && !m.trailerYoutubeId);
    } else if (filterMode === 'no-overview') {
      list = list.filter((m) => !m.overview || m.overview.trim().length === 0);
    } else if (filterMode === 'no-plot') {
      list = list.filter((m) => !m.plot || m.plot.trim().length === 0);
    } else if (filterMode === 'no-plotTr') {
      list = list.filter((m) => !m.plotTr || m.plotTr.trim().length === 0);
    } else if (filterMode === 'no-genres') {
      list = list.filter((m) => !m.genres || m.genres.length === 0);
    } else if (filterMode === 'no-director') {
      list = list.filter((m) => !m.director || m.director.trim().length === 0);
    } else if (filterMode === 'no-cast') {
      list = list.filter((m) => !m.cast || m.cast.length === 0);
    } else if (filterMode === 'no-runtime') {
      list = list.filter((m) => !m.runtime || m.runtime === 0);
    } else if (filterMode === 'no-country') {
      list = list.filter((m) => !m.country || m.country.trim().length === 0);
    } else if (filterMode === 'no-year') {
      list = list.filter((m) => !m.year || m.year === 0);
    } else if (filterMode === 'no-imdb-rating') {
      list = list.filter((m) => !m.imdbRating || m.imdbRating === 0);
    } else if (filterMode === 'no-release-date') {
      list = list.filter((m) => !m.releaseDate || m.releaseDate.trim().length === 0);
    }

    // Apply text search on top
    if (searchQuery.trim()) {
      const q = normalizeSearchString(searchQuery);
      list = list.filter(
        (m) =>
          normalizeSearchString(m.title).includes(q) ||
          normalizeSearchString(m.imdbId).includes(q) ||
          (m.originalTitle && normalizeSearchString(m.originalTitle).includes(q))
      );
    }

    // Sort movies
    if (sortBy === 'default') {
      if (sortOrder === 'desc') {
        list = [...list].reverse();
      }
    } else {
      list = [...list].sort((a, b) => {
        let valA: any = '';
        let valB: any = '';

        if (sortBy === 'watch-date') {
          valA = a.watchDate || '';
          valB = b.watchDate || '';
        } else if (sortBy === 'imdb-rating') {
          valA = a.imdbRating || 0;
          valB = b.imdbRating || 0;
        } else if (sortBy === 'my-rating') {
          valA = a.myRating || 0;
          valB = b.myRating || 0;
        } else if (sortBy === 'year') {
          valA = a.year || 0;
          valB = b.year || 0;
        } else if (sortBy === 'title') {
          valA = a.title || '';
          valB = b.title || '';
        }

        if (typeof valA === 'string') {
          return sortOrder === 'asc'
            ? valA.localeCompare(valB, 'tr')
            : valB.localeCompare(valA, 'tr');
        } else {
          return sortOrder === 'asc'
            ? valA - valB
            : valB - valA;
        }
      });
    }

    return list;
  }, [movies, searchQuery, filterMode, sortBy, sortOrder]);

  // Update a single movie's field in editStates
  const setField = (imdbId: string, field: string, value: string | boolean) => {
    setEditStates((prev) => ({
      ...prev,
      [imdbId]: { ...prev[imdbId], [field]: value },
    }));
  };

  // Save poster or trailer for a movie
  const saveField = async (imdbId: string, field: 'poster' | 'trailer') => {
    const state = editStates[imdbId];
    if (!state) return;

    let value = field === 'poster' ? state.poster.trim() : state.trailer.trim();

    // Parse YouTube URL if needed for trailer
    if (field === 'trailer') {
      const ytMatch = value.match(/(?:v=|youtu\.be\/|embed\/)([A-Za-z0-9_-]{11})/);
      if (ytMatch) value = ytMatch[1];
    }

    setField(imdbId, 'saving', true);
    setField(imdbId, 'error', '');

    try {
      const body: Record<string, string> = {};
      if (field === 'poster') {
        body.poster = value;
      }
      if (field === 'trailer') body.trailerYoutubeId = value;

      const res = await fetch(`/api/movies/${imdbId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Kaydetme başarısız.');

      // Update local movies list too
      setMovies((prev) =>
        prev.map((m) => {
          if (m.imdbId !== imdbId) return m;
          if (field === 'poster') return { ...m, poster: value };
          return { ...m, trailerYoutubeId: value };
        })
      );

      // Close the open field, update value in state
      setEditStates((prev) => ({
        ...prev,
        [imdbId]: {
          ...prev[imdbId],
          saving: false,
          error: '',
          posterOpen: field === 'poster' ? false : prev[imdbId].posterOpen,
          trailerOpen: field === 'trailer' ? false : prev[imdbId].trailerOpen,
          poster: field === 'poster' ? value : prev[imdbId].poster,
          trailer: field === 'trailer' ? value : prev[imdbId].trailer,
        },
      }));
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Hata oluştu.';
      setEditStates((prev) => ({
        ...prev,
        [imdbId]: { ...prev[imdbId], saving: false, error: msg },
      }));
    }
  };

  const openEditModal = (movie: Movie) => {
    setEditingMovie(movie);
    setModalForm({
      title: movie.title || '',
      originalTitle: movie.originalTitle || '',
      year: movie.year || 0,
      type: movie.type || 'Movie',
      myRating: movie.myRating || 0,
      watchDate: movie.watchDate || '',
      listName: Array.isArray(movie.listName) ? movie.listName.join(', ') : '',
      poster: movie.poster || '',
      backdrop: movie.backdrop || '',
      overview: movie.overview || '',
      plot: movie.plot || '',
      plotTr: movie.plotTr || '',
      country: movie.country || '',
      omdbType: movie.omdbType || '',
      boxOffice: movie.boxOffice || '',
      genres: Array.isArray(movie.genres) ? movie.genres.join(', ') : '',
      runtime: movie.runtime || 0,
      cast: Array.isArray(movie.cast) ? movie.cast.join(', ') : '',
      director: movie.director || '',
      writers: Array.isArray(movie.writers) ? movie.writers.join(', ') : '',
      imdbRating: movie.imdbRating || 0,
      tmdbRating: movie.tmdbRating || 0,
      releaseDate: movie.releaseDate || '',
      trailerYoutubeId: movie.trailerYoutubeId || '',
      isFeatured: Boolean(movie.isFeatured),
    });
    setModalError('');
    setIsModalOpen(true);
  };

  const toggleFeatured = async (movie: Movie) => {
    const nextVal = !movie.isFeatured;
    try {
      setMovies((prev) =>
        prev.map((m) => (m.imdbId === movie.imdbId ? { ...m, isFeatured: nextVal } : m))
      );
      const res = await fetch(`/api/movies/${movie.imdbId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isFeatured: nextVal }),
      });
      if (!res.ok) {
        setMovies((prev) =>
          prev.map((m) => (m.imdbId === movie.imdbId ? { ...m, isFeatured: !nextVal } : m))
        );
      }
    } catch {
      setMovies((prev) =>
        prev.map((m) => (m.imdbId === movie.imdbId ? { ...m, isFeatured: !nextVal } : m))
      );
    }
  };

  // CSV Export for filtered movies
  const exportFilteredCSV = () => {
    if (filteredMovies.length === 0) return;

    const noPoster = (m: Movie) => !m.poster || m.poster.includes('unsplash.com') || m.poster.includes('placeholder');

    const headers = [
      'IMDb ID', 'Title', 'Original Title', 'Year', 'IMDb Rating',
      'Director', 'Country', 'Runtime', 'Genres', 'Missing Fields'
    ];

    const escapeCSV = (val: string) => {
      if (val.includes(',') || val.includes('"') || val.includes('\n')) {
        return `"${val.replace(/"/g, '""')}"`;
      }
      return val;
    };

    const rows = filteredMovies.map((m) => {
      const missing: string[] = [];
      if (noPoster(m)) missing.push('Poster');
      if (!m.trailerYoutubeId) missing.push('Fragman');
      if (!m.overview || m.overview.trim().length === 0) missing.push('Özet');
      if (!m.plot || m.plot.trim().length === 0) missing.push('Konu');
      if (!m.plotTr || m.plotTr.trim().length === 0) missing.push('Konu TR');
      if (!m.genres || m.genres.length === 0) missing.push('Tür');
      if (!m.director || m.director.trim().length === 0) missing.push('Yönetmen');
      if (!m.cast || m.cast.length === 0) missing.push('Oyuncu');
      if (!m.runtime || m.runtime === 0) missing.push('Süre');
      if (!m.country || m.country.trim().length === 0) missing.push('Ülke');
      if (!m.year || m.year === 0) missing.push('Yıl');
      if (!m.imdbRating || m.imdbRating === 0) missing.push('IMDb Puanı');
      if (!m.releaseDate || m.releaseDate.trim().length === 0) missing.push('Vizyon Tarihi');

      return [
        m.imdbId,
        escapeCSV(m.title || ''),
        escapeCSV(m.originalTitle || ''),
        String(m.year || ''),
        String(m.imdbRating || ''),
        escapeCSV(m.director || ''),
        escapeCSV(m.country || ''),
        String(m.runtime || ''),
        escapeCSV(Array.isArray(m.genres) ? m.genres.join(', ') : ''),
        escapeCSV(missing.join(', ')),
      ].join(',');
    });

    const csvContent = '\uFEFF' + [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');

    const filterLabel = filterMode === 'all' ? 'tum_filmler' : filterMode;
    link.href = url;
    link.download = `eksik_filmler_${filterLabel}_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleSaveModal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMovie) return;

    setModalSaving(true);
    setModalError('');

    try {
      const payload = {
        ...modalForm,
        listName: modalForm.listName.split(',').map(s => s.trim()).filter(Boolean),
        genres: modalForm.genres.split(',').map(s => s.trim()).filter(Boolean),
        cast: modalForm.cast.split(',').map(s => s.trim()).filter(Boolean),
        writers: modalForm.writers.split(',').map(s => s.trim()).filter(Boolean),
      };

      const res = await fetch(`/api/movies/${editingMovie.imdbId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Kaydetme başarısız.');

      setMovies((prev) =>
        prev.map((m) => {
          if (m.imdbId !== editingMovie.imdbId) return m;
          return {
            ...m,
            ...payload,
          };
        })
      );

      setIsModalOpen(false);
      setEditingMovie(null);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Hata oluştu.';
      setModalError(msg);
    } finally {
      setModalSaving(false);
    }
  };

  if (!authorized) return null;

  return (
    <div className="max-w-5xl mx-auto py-12 px-4 sm:px-6 min-h-[70vh]">
      <div className="space-y-6 animate-fade-in">
        {/* Header / Back */}
        <div className="flex items-center gap-4 border-b border-zinc-800 pb-5">
          <Link
            href="/admin"
            className="flex items-center justify-center p-2.5 rounded-xl border border-zinc-800 hover:border-zinc-700 bg-zinc-900/50 hover:bg-zinc-900 text-zinc-400 hover:text-white transition-all cursor-pointer"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="flex-grow">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-violet-500/10 rounded-xl text-violet-400 border border-violet-500/20">
                  <Film className="w-6 h-6" />
                </div>
                <div>
                  <h1 className="text-2xl font-black text-white">Film Düzenleyici</h1>
                  <p className="text-zinc-500 text-xs mt-0.5">Afiş, fragman ve tüm film alanlarını manuel olarak düzenleyin.</p>
                </div>
              </div>
              <div className="flex items-center gap-2 self-start sm:self-auto">
                <span className="text-xs font-bold text-zinc-500 bg-zinc-900 border border-zinc-800 px-3 py-1.5 rounded-lg">
                  {filteredMovies.length} / {movies.length} film
                </span>
                {filteredMovies.length > 0 && filterMode !== 'all' && (
                  <button
                    onClick={exportFilteredCSV}
                    className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 hover:border-emerald-500/50 transition-all cursor-pointer"
                    title="Filtrelenmiş filmleri CSV olarak indir"
                  >
                    <Download className="w-3.5 h-3.5" />
                    CSV İndir
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Filter Mode Buttons */}
        <div className="space-y-2">
          <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Eksik Alan Filtresi</p>
          <div className="flex flex-wrap gap-2">
            {([
              { key: 'all', label: '🎬 Tümü', color: 'violet', count: movies.length },
              { key: 'is-featured', label: '⭐ Slider Öne Çıkarılanlar', color: 'yellow', count: movies.filter((m) => m.isFeatured).length },
              { key: 'no-poster', label: '🖼️ Afiş Yok', color: 'amber', count: movies.filter((m) => !m.poster || m.poster.includes('unsplash.com') || m.poster.includes('placeholder')).length },
              { key: 'no-trailer', label: '▶️ Fragman Yok', color: 'blue', count: movies.filter((m) => !m.trailerYoutubeId).length },
              { key: 'both-missing', label: '⚠️ Afiş+Fragman Yok', color: 'red', count: movies.filter((m) => (!m.poster || m.poster.includes('unsplash.com') || m.poster.includes('placeholder')) && !m.trailerYoutubeId).length },
              { key: 'no-overview', label: '📝 Özet Yok', color: 'orange', count: movies.filter((m) => !m.overview || m.overview.trim().length === 0).length },
              { key: 'no-plot', label: '📖 Konu Yok', color: 'orange', count: movies.filter((m) => !m.plot || m.plot.trim().length === 0).length },
              { key: 'no-plotTr', label: '📖 Konu TR Yok', color: 'orange', count: movies.filter((m) => !m.plotTr || m.plotTr.trim().length === 0).length },
              { key: 'no-genres', label: '🏷️ Tür Yok', color: 'pink', count: movies.filter((m) => !m.genres || m.genres.length === 0).length },
              { key: 'no-director', label: '🎥 Yönetmen Yok', color: 'pink', count: movies.filter((m) => !m.director || m.director.trim().length === 0).length },
              { key: 'no-cast', label: '👥 Oyuncu Yok', color: 'pink', count: movies.filter((m) => !m.cast || m.cast.length === 0).length },
              { key: 'no-runtime', label: '⏱️ Süre Yok', color: 'teal', count: movies.filter((m) => !m.runtime || m.runtime === 0).length },
              { key: 'no-year', label: '📅 Yıl Yok', color: 'teal', count: movies.filter((m) => !m.year || m.year === 0).length },
              { key: 'no-country', label: '🌍 Ülke Yok', color: 'teal', count: movies.filter((m) => !m.country || m.country.trim().length === 0).length },
              { key: 'no-imdb-rating', label: '⭐ IMDb Puanı Yok', color: 'yellow', count: movies.filter((m) => !m.imdbRating || m.imdbRating === 0).length },
              { key: 'no-release-date', label: '🗓️ Vizyon Tarihi Yok', color: 'yellow', count: movies.filter((m) => !m.releaseDate || m.releaseDate.trim().length === 0).length },
            ] as { key: any; label: string; color: string; count: number }[]).map(({ key, label, color, count }) => {
              const isActive = filterMode === key;
              const activeClasses: Record<string, string> = {
                violet: 'bg-violet-500/20 border-violet-500/50 text-violet-300',
                amber: 'bg-amber-500/15  border-amber-500/40  text-amber-300',
                blue: 'bg-blue-500/15   border-blue-500/40   text-blue-300',
                red: 'bg-red-500/15    border-red-500/40    text-red-300',
                orange: 'bg-orange-500/15 border-orange-500/40 text-orange-300',
                pink: 'bg-pink-500/15   border-pink-500/40   text-pink-300',
                teal: 'bg-teal-500/15   border-teal-500/40   text-teal-300',
                yellow: 'bg-yellow-500/15 border-yellow-500/40 text-yellow-300',
              };
              return (
                <button
                  key={key}
                  onClick={() => setFilterMode(key)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${isActive
                    ? activeClasses[color]
                    : 'bg-zinc-900/60 border-zinc-800 text-zinc-500 hover:text-zinc-300 hover:border-zinc-700'
                    }`}
                >
                  {label}
                  <span className={`px-1.5 py-0.5 rounded-md text-[10px] font-black ${isActive ? 'bg-white/10' : 'bg-zinc-800'}`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Search & Sort */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {/* Search input */}
          <div className="relative md:col-span-2">
            <Search className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Film adı veya IMDb ID ile ara..."
              className="w-full bg-zinc-950/60 border border-zinc-800 focus:border-violet-500/40 rounded-xl py-3 pl-10 pr-4 text-sm text-white focus:outline-none transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Sort controls */}
          <div className="flex gap-2">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="flex-1 bg-zinc-950/60 border border-zinc-800 focus:border-violet-500/40 rounded-xl px-3 py-2 text-xs text-zinc-300 focus:outline-none transition-all cursor-pointer"
            >
              <option value="default">Sıralama: Eklenme Sırası</option>
              <option value="watch-date">Sıralama: İzleme Tarihi</option>
              <option value="imdb-rating">Sıralama: IMDb Puanı</option>
              <option value="my-rating">Sıralama: Benim Puanım</option>
              <option value="year">Sıralama: Yapım Yılı</option>
              <option value="title">Sıralama: Film Adı</option>
            </select>

            <button
              type="button"
              onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
              className="bg-zinc-950/60 border border-zinc-800 hover:border-zinc-700 hover:text-white rounded-xl px-3 py-2 text-xs text-zinc-400 font-bold transition-all cursor-pointer flex items-center justify-center min-w-[44px]"
              title={sortOrder === 'asc' ? 'Artan Sıralama' : 'Azalan Sıralama'}
            >
              {sortOrder === 'asc' ? '↑' : '↓'}
            </button>
          </div>
        </div>

        {/* Movie list */}
        {moviesLoading ? (
          <div className="flex items-center justify-center py-16 gap-3 text-zinc-500">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span className="text-sm font-medium">Filmler yükleniyor...</span>
          </div>
        ) : filteredMovies.length === 0 ? (
          <div className="text-center py-12 text-zinc-500 text-sm">
            {searchQuery ? `"${searchQuery}" için sonuç bulunamadı.` : 'Film bulunamadı.'}
          </div>
        ) : (
          <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-zinc-800 scrollbar-track-transparent">
            {filteredMovies.map((movie) => {
              const es = editStates[movie.imdbId];
              if (!es) return null;
              const hasPoster = !!movie.poster && !movie.poster.includes('unsplash.com') && !movie.poster.includes('placeholder');
              const hasTrailer = !!movie.trailerYoutubeId;

              return (
                <div
                  key={movie.imdbId}
                  className="bg-zinc-950/50 border border-zinc-800/60 rounded-2xl p-4 transition-all hover:border-zinc-700/80"
                >
                  {/* Movie row header */}
                  <div className="flex items-start gap-4">
                    {/* Poster thumbnail */}
                    <div className="flex-shrink-0 w-12 h-16 rounded-lg overflow-hidden bg-zinc-900 border border-white/5">
                      {hasPoster ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={movie.poster}
                          alt={movie.title}
                          className="w-full h-full object-cover"
                          onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-zinc-700">
                          <ImageIcon className="w-5 h-5" />
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-grow min-w-0">
                      <div className="flex items-start justify-between gap-2 flex-wrap">
                        <div>
                          <p className="text-sm font-extrabold text-zinc-200 truncate max-w-xs">{movie.title}</p>
                          <p className="text-[11px] text-zinc-500 font-mono mt-0.5">{movie.imdbId} · {movie.year}</p>
                        </div>
                        {/* Status badges */}
                        <div className="flex items-center gap-1.5 flex-shrink-0">
                          <button
                            type="button"
                            onClick={() => toggleFeatured(movie)}
                            title="Slider'da Öne Çıkar durumunu aç/kapat"
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full border cursor-pointer transition-all ${movie.isFeatured ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 hover:bg-amber-500/30' : 'bg-zinc-800 text-zinc-500 border-zinc-700 hover:text-zinc-300 hover:border-zinc-600'}`}
                          >
                            {movie.isFeatured ? '⭐ Slider Öne Çıkarıldı' : '+ Slider Öne Çıkar'}
                          </button>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${hasPoster ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-zinc-800 text-zinc-500 border-zinc-700'}`}>
                            {hasPoster ? '✓ Poster' : '✗ Poster'}
                          </span>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${hasTrailer ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' : 'bg-zinc-800 text-zinc-500 border-zinc-700'}`}>
                            {hasTrailer ? '✓ Fragman' : '✗ Fragman'}
                          </span>
                        </div>
                      </div>

                      {/* Edit buttons row */}
                      <div className="flex flex-wrap gap-2 mt-3">
                        <button
                          onClick={() => setField(movie.imdbId, 'posterOpen', !es.posterOpen)}
                          className={`flex items-center gap-1.5 text-[11px] font-bold px-3 py-1.5 rounded-lg border transition-all cursor-pointer ${es.posterOpen ? 'bg-violet-500/15 border-violet-500/40 text-violet-300' : 'bg-zinc-900 border-zinc-700 text-zinc-400 hover:text-white hover:border-zinc-600'}`}
                        >
                          <ImageIcon className="w-3 h-3" />
                          {es.posterOpen ? 'Poster Kapat' : 'Poster Düzenle'}
                        </button>
                        <button
                          onClick={() => setField(movie.imdbId, 'trailerOpen', !es.trailerOpen)}
                          className={`flex items-center gap-1.5 text-[11px] font-bold px-3 py-1.5 rounded-lg border transition-all cursor-pointer ${es.trailerOpen ? 'bg-brand-primary/15 border-brand-primary/40 text-red-300' : 'bg-zinc-900 border-zinc-700 text-zinc-400 hover:text-white hover:border-zinc-600'}`}
                        >
                          <Video className="w-3 h-3" />
                          {es.trailerOpen ? 'Fragman Kapat' : 'Fragman Düzenle'}
                        </button>
                        <button
                          onClick={() => openEditModal(movie)}
                          className="flex items-center gap-1.5 text-[11px] font-bold px-3 py-1.5 rounded-lg border bg-zinc-900 border-zinc-700 text-zinc-400 hover:text-white hover:border-zinc-600 transition-all cursor-pointer"
                        >
                          <Pencil className="w-3 h-3" />
                          Tüm Alanları Düzenle
                        </button>
                        <Link
                          href={`/movie/${movie.imdbId}`}
                          target="_blank"
                          className="ml-auto flex items-center gap-1 text-[11px] font-bold px-3 py-1.5 rounded-lg border border-zinc-700 text-zinc-500 hover:text-white hover:border-zinc-600 transition-all"
                        >
                          Film Sayfası →
                        </Link>
                      </div>
                    </div>
                  </div>

                  {/* Error message */}
                  {es.error && (
                    <p className="mt-2 text-xs text-red-400 font-semibold bg-red-950/20 border border-red-500/20 rounded-lg px-3 py-1.5">{es.error}</p>
                  )}

                  {/* Poster edit inline form */}
                  {es.posterOpen && (
                    <div className="mt-3 pt-3 border-t border-zinc-800/60 space-y-2">
                      <label className="text-[10px] font-black text-violet-400 uppercase tracking-wider block">🖼️ Poster URL</label>
                      <div className="flex gap-2">
                        <input
                          type="url"
                          value={es.poster}
                          onChange={(e) => setField(movie.imdbId, 'poster', e.target.value)}
                          placeholder="/images/movies/poster.jpg"
                          className="flex-1 bg-zinc-900 border border-zinc-700 focus:border-violet-500/60 rounded-xl py-2.5 px-3 text-xs text-white focus:outline-none transition-all font-mono"
                          onKeyDown={(e) => { if (e.key === 'Enter') saveField(movie.imdbId, 'poster'); }}
                        />
                        <button
                          onClick={() => saveField(movie.imdbId, 'poster')}
                          disabled={es.saving}
                          className="flex items-center gap-1 bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold px-3 py-2 rounded-xl transition-all disabled:opacity-60 cursor-pointer whitespace-nowrap"
                        >
                          {es.saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                          Kaydet
                        </button>
                      </div>
                      {es.poster && (
                        <div className="mt-1 flex items-center gap-2">
                          <div className="w-8 h-11 rounded overflow-hidden border border-white/10 flex-shrink-0">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={es.poster} alt="preview" className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                          </div>
                          <span className="text-[10px] text-zinc-500 font-mono truncate max-w-[200px]">{es.poster}</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Trailer edit inline form */}
                  {es.trailerOpen && (
                    <div className="mt-3 pt-3 border-t border-zinc-800/60 space-y-2">
                      <label className="text-[10px] font-black text-red-400 uppercase tracking-wider block">▶️ YouTube Fragman ID veya URL</label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={es.trailer}
                          onChange={(e) => setField(movie.imdbId, 'trailer', e.target.value)}
                          placeholder="Örn: dQw4w9WgXcQ veya https://youtube.com/watch?v=..."
                          className="flex-1 bg-zinc-900 border border-zinc-700 focus:border-brand-primary/60 rounded-xl py-2.5 px-3 text-xs text-white focus:outline-none transition-all font-mono"
                          onKeyDown={(e) => { if (e.key === 'Enter') saveField(movie.imdbId, 'trailer'); }}
                        />
                        <button
                          onClick={() => saveField(movie.imdbId, 'trailer')}
                          disabled={es.saving}
                          className="flex items-center gap-1 bg-brand-primary hover:bg-red-600 text-white text-xs font-bold px-3 py-2 rounded-xl transition-all disabled:opacity-60 cursor-pointer whitespace-nowrap"
                        >
                          {es.saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                          Kaydet
                        </button>
                      </div>
                      {es.trailer && (
                        <p className="text-[10px] text-zinc-500 font-mono">
                          Mevcut ID: <span className="text-blue-400">{es.trailer}</span>
                          {' · '}
                          <a
                            href={`https://youtube.com/watch?v=${es.trailer}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-zinc-400 hover:text-white underline underline-offset-2"
                          >
                            YouTube&apos;da Aç ↗
                          </a>
                        </p>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Detailed Edit Modal */}
      {isModalOpen && editingMovie && (
        <div
          onClick={() => { setIsModalOpen(false); setEditingMovie(null); }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto animate-fade-in"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="glass w-full max-w-4xl rounded-3xl border border-white/10 bg-zinc-950/90 shadow-2xl overflow-hidden my-8 max-h-[90vh] flex flex-col"
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-zinc-800 bg-zinc-900/40">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-violet-500/10 rounded-xl text-violet-400 border border-violet-500/20">
                  <Pencil className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-white">Film Bilgilerini Düzenle</h3>
                  <p className="text-zinc-500 text-xs mt-0.5">{editingMovie.title} ({editingMovie.imdbId})</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => { setIsModalOpen(false); setEditingMovie(null); }}
                className="p-2 rounded-xl text-zinc-500 hover:text-white hover:bg-zinc-800 border border-zinc-800 transition-all cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content - Scrollable Form */}
            <form onSubmit={handleSaveModal} className="flex-1 overflow-y-auto p-6 md:p-8 space-y-8 custom-scrollbar">
              {modalError && (
                <div className="p-4 bg-red-950/30 border border-red-500/20 text-red-200 rounded-xl text-xs font-semibold">
                  ⚠️ {modalError}
                </div>
              )}

              {/* Group 1: Temel Bilgiler */}
              <div className="space-y-4">
                <h4 className="text-xs font-black text-violet-400 uppercase tracking-widest border-b border-zinc-800/80 pb-2">1. Temel Bilgiler</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Film Adı (Türkçe / Genel)</label>
                    <input
                      type="text"
                      required
                      value={modalForm.title}
                      onChange={(e) => setModalForm(prev => ({ ...prev, title: e.target.value }))}
                      className="w-full bg-zinc-900/60 border border-zinc-800 focus:border-violet-500/50 rounded-xl py-2.5 px-3 text-sm text-white focus:outline-none transition-all"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Orijinal Film Adı</label>
                    <input
                      type="text"
                      required
                      value={modalForm.originalTitle}
                      onChange={(e) => setModalForm(prev => ({ ...prev, originalTitle: e.target.value }))}
                      className="w-full bg-zinc-900/60 border border-zinc-800 focus:border-violet-500/50 rounded-xl py-2.5 px-3 text-sm text-white focus:outline-none transition-all"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Yapım Yılı</label>
                    <input
                      type="number"
                      required
                      value={modalForm.year}
                      onChange={(e) => setModalForm(prev => ({ ...prev, year: parseInt(e.target.value) || 0 }))}
                      className="w-full bg-zinc-900/60 border border-zinc-800 focus:border-violet-500/50 rounded-xl py-2.5 px-3 text-sm text-white focus:outline-none transition-all"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Yapım Tipi</label>
                    <select
                      value={modalForm.type}
                      onChange={(e) => setModalForm(prev => ({ ...prev, type: e.target.value }))}
                      className="w-full bg-zinc-900/60 border border-zinc-800 focus:border-violet-500/50 rounded-xl py-2.5 px-3 text-sm text-white focus:outline-none transition-all"
                    >
                      <option value="Movie">Movie</option>
                      <option value="TV Series">TV Series</option>
                      <option value="TV Episode">TV Episode</option>
                      <option value="TV Special">TV Special</option>
                      <option value="TV Mini Series">TV Mini Series</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Group 2: Değerlendirme & Durum */}
              <div className="space-y-4">
                <h4 className="text-xs font-black text-violet-400 uppercase tracking-widest border-b border-zinc-800/80 pb-2">2. Değerlendirme & Durum</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Benim Puanım (1-10)</label>
                    <input
                      type="number"
                      min="0"
                      max="10"
                      step="1"
                      value={modalForm.myRating}
                      onChange={(e) => setModalForm(prev => ({ ...prev, myRating: parseInt(e.target.value) || 0 }))}
                      className="w-full bg-zinc-900/60 border border-zinc-800 focus:border-violet-500/50 rounded-xl py-2.5 px-3 text-sm text-white focus:outline-none transition-all"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">İzleme Tarihi</label>
                    <input
                      type="date"
                      value={modalForm.watchDate}
                      onChange={(e) => setModalForm(prev => ({ ...prev, watchDate: e.target.value }))}
                      className="w-full bg-zinc-900/60 border border-zinc-800 focus:border-violet-500/50 rounded-xl py-2.5 px-3 text-sm text-white focus:outline-none transition-all"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Dahil Olduğu Listeler (Virgülle Ayırın)</label>
                    <input
                      type="text"
                      value={modalForm.listName}
                      onChange={(e) => setModalForm(prev => ({ ...prev, listName: e.target.value }))}
                      placeholder="Favoriler, Komedi Günlükleri vb."
                      className="w-full bg-zinc-900/60 border border-zinc-800 focus:border-violet-500/50 rounded-xl py-2.5 px-3 text-sm text-white focus:outline-none transition-all"
                    />
                  </div>
                </div>
                <div className="pt-2">
                  <label className="inline-flex items-center gap-3 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={modalForm.isFeatured}
                      onChange={(e) => setModalForm(prev => ({ ...prev, isFeatured: e.target.checked }))}
                      className="w-4 h-4 text-amber-500 bg-zinc-900 border-zinc-700 rounded focus:ring-amber-500/30"
                    />
                    <span className="text-xs font-bold text-amber-300 flex items-center gap-1">
                      ⭐ Slider&apos;da Öne Çıkar (Hero & Slider Featured)
                    </span>
                  </label>
                </div>
              </div>

              {/* Group 3: Görseller & Medya */}
              <div className="space-y-4">
                <h4 className="text-xs font-black text-violet-400 uppercase tracking-widest border-b border-zinc-800/80 pb-2">3. Görseller & Medya</h4>
                <div className="grid grid-cols-1 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Poster URL</label>
                    <input
                      type="text"
                      value={modalForm.poster}
                      onChange={(e) => setModalForm(prev => ({ ...prev, poster: e.target.value }))}
                      className="w-full bg-zinc-900/60 border border-zinc-800 focus:border-violet-500/50 rounded-xl py-2.5 px-3 text-sm text-white focus:outline-none transition-all font-mono"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Arka Plan (Backdrop) URL</label>
                    <input
                      type="text"
                      value={modalForm.backdrop}
                      onChange={(e) => setModalForm(prev => ({ ...prev, backdrop: e.target.value }))}
                      className="w-full bg-zinc-900/60 border border-zinc-800 focus:border-violet-500/50 rounded-xl py-2.5 px-3 text-sm text-white focus:outline-none transition-all font-mono"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">YouTube Fragman ID</label>
                    <input
                      type="text"
                      value={modalForm.trailerYoutubeId}
                      onChange={(e) => setModalForm(prev => ({ ...prev, trailerYoutubeId: e.target.value }))}
                      placeholder="Örn: dQw4w9WgXcQ"
                      className="w-full bg-zinc-900/60 border border-zinc-800 focus:border-violet-500/50 rounded-xl py-2.5 px-3 text-sm text-white focus:outline-none transition-all font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Group 4: Açıklamalar */}
              <div className="space-y-4">
                <h4 className="text-xs font-black text-violet-400 uppercase tracking-widest border-b border-zinc-800/80 pb-2">4. Konu & Özet</h4>
                <div className="grid grid-cols-1 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Kısa Özet (Overview)</label>
                    <textarea
                      value={modalForm.overview}
                      onChange={(e) => setModalForm(prev => ({ ...prev, overview: e.target.value }))}
                      rows={3}
                      className="w-full bg-zinc-900/60 border border-zinc-800 focus:border-violet-500/50 rounded-xl py-2.5 px-3 text-sm text-white focus:outline-none transition-all resize-y"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">İngilizce Konu (Plot)</label>
                    <textarea
                      value={modalForm.plot}
                      onChange={(e) => setModalForm(prev => ({ ...prev, plot: e.target.value }))}
                      rows={4}
                      className="w-full bg-zinc-900/60 border border-zinc-800 focus:border-violet-500/50 rounded-xl py-2.5 px-3 text-sm text-white focus:outline-none transition-all resize-y"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Türkçe Konu Detayı (Plot TR)</label>
                    <textarea
                      value={modalForm.plotTr}
                      onChange={(e) => setModalForm(prev => ({ ...prev, plotTr: e.target.value }))}
                      rows={4}
                      className="w-full bg-zinc-900/60 border border-zinc-800 focus:border-violet-500/50 rounded-xl py-2.5 px-3 text-sm text-white focus:outline-none transition-all resize-y"
                    />
                  </div>
                </div>
              </div>

              {/* Group 5: Yapım Bilgileri */}
              <div className="space-y-4">
                <h4 className="text-xs font-black text-violet-400 uppercase tracking-widest border-b border-zinc-800/80 pb-2">5. Yapım Bilgileri</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Türler (Virgülle Ayırın)</label>
                    <input
                      type="text"
                      value={modalForm.genres}
                      onChange={(e) => setModalForm(prev => ({ ...prev, genres: e.target.value }))}
                      placeholder="Comedy, Drama, Action"
                      className="w-full bg-zinc-900/60 border border-zinc-800 focus:border-violet-500/50 rounded-xl py-2.5 px-3 text-sm text-white focus:outline-none transition-all"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Süre (Dakika)</label>
                    <input
                      type="number"
                      value={modalForm.runtime}
                      onChange={(e) => setModalForm(prev => ({ ...prev, runtime: parseInt(e.target.value) || 0 }))}
                      className="w-full bg-zinc-900/60 border border-zinc-800 focus:border-violet-500/50 rounded-xl py-2.5 px-3 text-sm text-white focus:outline-none transition-all"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Yönetmen (Virgülle Ayırın)</label>
                    <input
                      type="text"
                      value={modalForm.director}
                      onChange={(e) => setModalForm(prev => ({ ...prev, director: e.target.value }))}
                      className="w-full bg-zinc-900/60 border border-zinc-800 focus:border-violet-500/50 rounded-xl py-2.5 px-3 text-sm text-white focus:outline-none transition-all"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Senaristler (Virgülle Ayırın)</label>
                    <input
                      type="text"
                      value={modalForm.writers}
                      onChange={(e) => setModalForm(prev => ({ ...prev, writers: e.target.value }))}
                      className="w-full bg-zinc-900/60 border border-zinc-800 focus:border-violet-500/50 rounded-xl py-2.5 px-3 text-sm text-white focus:outline-none transition-all"
                    />
                  </div>
                  <div className="space-y-1 md:col-span-2">
                    <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Oyuncular (Virgülle Ayırın)</label>
                    <input
                      type="text"
                      value={modalForm.cast}
                      onChange={(e) => setModalForm(prev => ({ ...prev, cast: e.target.value }))}
                      className="w-full bg-zinc-900/60 border border-zinc-800 focus:border-violet-500/50 rounded-xl py-2.5 px-3 text-sm text-white focus:outline-none transition-all"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Ülke</label>
                    <input
                      type="text"
                      value={modalForm.country}
                      onChange={(e) => setModalForm(prev => ({ ...prev, country: e.target.value }))}
                      className="w-full bg-zinc-900/60 border border-zinc-800 focus:border-violet-500/50 rounded-xl py-2.5 px-3 text-sm text-white focus:outline-none transition-all"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Gişe (Box Office)</label>
                    <input
                      type="text"
                      value={modalForm.boxOffice}
                      onChange={(e) => setModalForm(prev => ({ ...prev, boxOffice: e.target.value }))}
                      className="w-full bg-zinc-900/60 border border-zinc-800 focus:border-violet-500/50 rounded-xl py-2.5 px-3 text-sm text-white focus:outline-none transition-all"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">IMDb Puanı</label>
                    <input
                      type="number"
                      step="0.1"
                      value={modalForm.imdbRating}
                      onChange={(e) => setModalForm(prev => ({ ...prev, imdbRating: parseFloat(e.target.value) || 0 }))}
                      className="w-full bg-zinc-900/60 border border-zinc-800 focus:border-violet-500/50 rounded-xl py-2.5 px-3 text-sm text-white focus:outline-none transition-all"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">TMDb Puanı</label>
                    <input
                      type="number"
                      step="0.1"
                      value={modalForm.tmdbRating}
                      onChange={(e) => setModalForm(prev => ({ ...prev, tmdbRating: parseFloat(e.target.value) || 0 }))}
                      className="w-full bg-zinc-900/60 border border-zinc-800 focus:border-violet-500/50 rounded-xl py-2.5 px-3 text-sm text-white focus:outline-none transition-all"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Vizyon Tarihi (Release Date)</label>
                    <input
                      type="text"
                      value={modalForm.releaseDate}
                      onChange={(e) => setModalForm(prev => ({ ...prev, releaseDate: e.target.value }))}
                      placeholder="Örn: 1999-10-15"
                      className="w-full bg-zinc-900/60 border border-zinc-800 focus:border-violet-500/50 rounded-xl py-2.5 px-3 text-sm text-white focus:outline-none transition-all"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">OMDb Tipi</label>
                    <input
                      type="text"
                      value={modalForm.omdbType}
                      onChange={(e) => setModalForm(prev => ({ ...prev, omdbType: e.target.value }))}
                      className="w-full bg-zinc-900/60 border border-zinc-800 focus:border-violet-500/50 rounded-xl py-2.5 px-3 text-sm text-white focus:outline-none transition-all"
                    />
                  </div>
                </div>
              </div>

              {/* Modal Footer Buttons */}
              <div className="flex items-center justify-end gap-3 pt-6 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => { setIsModalOpen(false); setEditingMovie(null); }}
                  className="px-5 py-2.5 rounded-xl border border-zinc-800 hover:border-zinc-700 bg-zinc-900/50 hover:bg-zinc-900 text-zinc-400 hover:text-white text-sm font-bold transition-all cursor-pointer"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  disabled={modalSaving}
                  className="flex items-center justify-center gap-2 bg-gradient-to-r from-violet-600 to-indigo-600 hover:opacity-95 text-white font-bold py-2.5 px-6 rounded-xl shadow-lg shadow-violet-600/10 transition-all duration-300 disabled:opacity-60 cursor-pointer text-sm"
                >
                  {modalSaving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Kaydediliyor...
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      Değişiklikleri Kaydet
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
