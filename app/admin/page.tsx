'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Shield, Lock, User, LogOut, ArrowRight, Sparkles, Video,
  Search, Pencil, Check, X, Loader2, Film, Image as ImageIcon,
} from 'lucide-react';
import { Movie } from '@/types';

export default function AdminPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // Form states
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  // Film düzenleyici states
  const [movies, setMovies] = useState<Movie[]>([]);
  const [moviesLoading, setMoviesLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Per-movie edit states: { [imdbId]: { poster, trailer, saving, error, posterOpen, trailerOpen } }
  const [editStates, setEditStates] = useState<
    Record<string, { poster: string; trailer: string; saving: boolean; error: string; posterOpen: boolean; trailerOpen: boolean }>
  >({});

  // Check login cookie on mount
  useEffect(() => {
    setMounted(true);
    const cookies = document.cookie.split(';');
    const isAlreadyAdmin = cookies.some((c) => c.trim().startsWith('is_admin=true'));
    setIsLoggedIn(isAlreadyAdmin);
  }, []);

  // Load movies when logged in
  useEffect(() => {
    if (!isLoggedIn) return;
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
      .catch(() => {})
      .finally(() => setMoviesLoading(false));
  }, [isLoggedIn]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (username === 'wolkanca' && password === 'wolkanca') {
      document.cookie = 'is_admin=true; path=/; max-age=604800; SameSite=Lax';
      setIsLoggedIn(true);
      setUsername('');
      setPassword('');
    } else {
      setError('Geçersiz kullanıcı adı veya şifre.');
    }
  };

  const handleLogout = () => {
    document.cookie = 'is_admin=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax';
    setIsLoggedIn(false);
    router.refresh();
  };

  // Filter movies by search
  const filteredMovies = useMemo(() => {
    if (!searchQuery.trim()) return movies;
    const q = searchQuery.toLowerCase();
    return movies.filter(
      (m) =>
        m.title.toLowerCase().includes(q) ||
        m.imdbId.toLowerCase().includes(q) ||
        (m.originalTitle && m.originalTitle.toLowerCase().includes(q))
    );
  }, [movies, searchQuery]);

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
      if (field === 'poster') body.poster = value;
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

  if (!mounted) return null;

  return (
    <div className="max-w-5xl mx-auto py-12 px-4 sm:px-6">
      {isLoggedIn ? (
        // ADMIN DASHBOARD PANEL
        <div className="space-y-10 animate-fade-in">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800 pb-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-brand-primary/10 rounded-2xl text-brand-primary border border-brand-primary/20">
                <Shield className="w-8 h-8" />
              </div>
              <div>
                <h1 className="text-3xl font-black text-white tracking-tight">Yönetici Kontrol Paneli</h1>
                <p className="text-zinc-500 text-sm mt-1">Hoş geldiniz, Volkan Yılmaz. Kitaplık verilerini zenginleştirin.</p>
              </div>
            </div>

            <button
              onClick={handleLogout}
              className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl border border-red-500/20 bg-red-500/5 hover:bg-red-500/10 text-red-500 text-sm font-semibold transition-all duration-300 shadow-sm cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              Çıkış Yap
            </button>
          </div>

          {/* Wizard Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Poster Wizard Card */}
            <Link href="/enrich" className="group">
              <div className="glass-card p-8 rounded-3xl border border-white/5 bg-gradient-to-br from-zinc-950/40 to-red-950/10 hover:border-brand-primary/30 hover:to-red-950/20 transition-all duration-300 h-full flex flex-col justify-between relative overflow-hidden group shadow-lg hover:shadow-[0_15px_40px_rgba(239,68,68,0.1)]">
                <div className="absolute top-0 right-0 w-32 h-32 bg-brand-primary/10 rounded-full blur-3xl -z-10 group-hover:bg-brand-primary/20 transition-colors" />
                <div>
                  <div className="p-3 bg-brand-primary/10 rounded-2xl text-brand-primary border border-brand-primary/20 w-fit mb-6">
                    <Sparkles className="w-7 h-7" />
                  </div>
                  <h2 className="text-2xl font-black text-white group-hover:text-brand-primary transition-colors">Poster Sihirbazı</h2>
                  <p className="text-zinc-400 text-sm mt-3 leading-relaxed">
                    Kitaplığınızdaki afişi olmayan veya görseli kırık/eksik olan filmlerin afişlerini ve genel bilgilerini OMDB API üzerinden otomatik olarak güncelleyin.
                  </p>
                </div>
                <div className="flex items-center gap-2 text-brand-primary font-bold text-sm mt-8 group-hover:translate-x-1 transition-transform">
                  Sihirbaza Git <ArrowRight className="w-4 h-4" />
                </div>
              </div>
            </Link>

            {/* Trailer Wizard Card */}
            <Link href="/enrich-trailers" className="group">
              <div className="glass-card p-8 rounded-3xl border border-white/5 bg-gradient-to-br from-zinc-950/40 to-red-950/10 hover:border-red-500/30 hover:to-red-950/20 transition-all duration-300 h-full flex flex-col justify-between relative overflow-hidden group shadow-lg hover:shadow-[0_15px_40px_rgba(239,68,68,0.1)]">
                <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/10 rounded-full blur-3xl -z-10 group-hover:bg-red-500/20 transition-colors" />
                <div>
                  <div className="p-3 bg-red-500/10 rounded-2xl text-red-500 border border-red-500/20 w-fit mb-6">
                    <Video className="w-7 h-7" />
                  </div>
                  <h2 className="text-2xl font-black text-white group-hover:text-red-500 transition-colors">Fragman Sihirbazı</h2>
                  <p className="text-zinc-400 text-sm mt-3 leading-relaxed">
                    Sinema kitaplığınızdaki yapımların resmi YouTube fragman linklerini TMDb API ile otomatik olarak sorgulayarak veritabanınıza eşleyin.
                  </p>
                </div>
                <div className="flex items-center gap-2 text-red-500 font-bold text-sm mt-8 group-hover:translate-x-1 transition-transform">
                  Sihirbaza Git <ArrowRight className="w-4 h-4" />
                </div>
              </div>
            </Link>
          </div>

          {/* ─── Manuel Film Düzenleyici ─── */}
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800 pb-5">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-violet-500/10 rounded-xl text-violet-400 border border-violet-500/20">
                  <Film className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-xl font-black text-white">Film Düzenleyici</h2>
                  <p className="text-zinc-500 text-xs mt-0.5">Poster URL ve fragman YouTube ID&apos;sini manuel olarak düzenleyin.</p>
                </div>
              </div>
              <span className="text-xs font-bold text-zinc-500 bg-zinc-900 border border-zinc-800 px-3 py-1.5 rounded-lg">
                {movies.length} film
              </span>
            </div>

            {/* Search */}
            <div className="relative">
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
                              <p className="text-[11px] text-zinc-500 font-mono mt-0.5">{movie.imdbId} · {movie.year} · {movie.type}</p>
                            </div>
                            {/* Status badges */}
                            <div className="flex items-center gap-1.5 flex-shrink-0">
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
                            {/* Poster edit toggle */}
                            <button
                              onClick={() => setField(movie.imdbId, 'posterOpen', !es.posterOpen)}
                              className={`flex items-center gap-1.5 text-[11px] font-bold px-3 py-1.5 rounded-lg border transition-all cursor-pointer ${es.posterOpen ? 'bg-violet-500/15 border-violet-500/40 text-violet-300' : 'bg-zinc-900 border-zinc-700 text-zinc-400 hover:text-white hover:border-zinc-600'}`}
                            >
                              <ImageIcon className="w-3 h-3" />
                              {es.posterOpen ? 'Poster Kapat' : 'Poster Düzenle'}
                            </button>
                            {/* Trailer edit toggle */}
                            <button
                              onClick={() => setField(movie.imdbId, 'trailerOpen', !es.trailerOpen)}
                              className={`flex items-center gap-1.5 text-[11px] font-bold px-3 py-1.5 rounded-lg border transition-all cursor-pointer ${es.trailerOpen ? 'bg-brand-primary/15 border-brand-primary/40 text-red-300' : 'bg-zinc-900 border-zinc-700 text-zinc-400 hover:text-white hover:border-zinc-600'}`}
                            >
                              <Video className="w-3 h-3" />
                              {es.trailerOpen ? 'Fragman Kapat' : 'Fragman Düzenle'}
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
                              placeholder="https://example.com/poster.jpg"
                              className="flex-1 bg-zinc-900 border border-zinc-700 focus:border-violet-500/60 rounded-xl py-2 px-3 text-xs text-white focus:outline-none transition-all font-mono"
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
                              {/* Preview */}
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
                              className="flex-1 bg-zinc-900 border border-zinc-700 focus:border-brand-primary/60 rounded-xl py-2 px-3 text-xs text-white focus:outline-none transition-all font-mono"
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
        </div>
      ) : (
        // ADMIN LOGIN FORM
        <div className="flex justify-center items-center py-12 animate-fade-in">
          <div className="glass-card w-full max-w-md p-8 rounded-3xl border border-white/5 bg-gradient-to-b from-zinc-900/60 to-zinc-950/60 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-64 bg-brand-primary/10 rounded-full blur-[80px] -z-10" />

            <div className="text-center mb-8">
              <div className="p-3 bg-zinc-950/80 rounded-2xl text-brand-primary border border-white/5 w-fit mx-auto mb-4 shadow-inner">
                <Shield className="w-8 h-8" />
              </div>
              <h1 className="text-2xl font-black text-white tracking-tight">Yönetici Girişi</h1>
              <p className="text-zinc-500 text-xs mt-1.5">Sihirbaz araçlarına erişmek için lütfen kimliğinizi doğrulayın.</p>
            </div>

            {error && (
              <div className="mb-5 p-3.5 bg-red-950/30 border border-red-500/20 text-red-200 rounded-xl text-xs font-semibold flex items-center gap-2 animate-pulse-subtle">
                <span>⚠️</span> {error}
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-5">
              {/* Username field */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">Kullanıcı Adı</label>
                <div className="relative">
                  <User className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Kullanıcı adınızı girin..."
                    className="w-full bg-zinc-950/50 border border-zinc-800 rounded-xl py-3 pl-10 pr-4 text-sm text-white focus:border-brand-primary/50 focus:outline-none transition-all duration-300"
                  />
                </div>
              </div>

              {/* Password field */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">Şifre</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Şifrenizi girin..."
                    className="w-full bg-zinc-950/50 border border-zinc-800 rounded-xl py-3 pl-10 pr-4 text-sm text-white focus:border-brand-primary/50 focus:outline-none transition-all duration-300"
                  />
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-brand-primary to-brand-secondary hover:opacity-95 text-white font-bold py-3 px-6 rounded-xl shadow-lg shadow-brand-primary/20 transition-all duration-300 cursor-pointer mt-2"
              >
                Giriş Yap
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
