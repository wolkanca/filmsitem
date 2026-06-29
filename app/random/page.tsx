'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Sparkles, Star, Calendar, RefreshCw, Film, ArrowRight } from 'lucide-react';
import { Movie } from '@/types';
import { getRatingColor } from '@/lib/utils';
import PosterImage from '@/components/PosterImage';

export default function RandomPage() {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter options
  const [genreFilter, setGenreFilter] = useState('');
  const [ratingFilter, setRatingFilter] = useState('');
  const [onlyMovies, setOnlyMovies] = useState(true);

  // Selection states
  const [selectedMovie, setSelectedMovie] = useState<Movie | null>(null);
  const [isShuffling, setIsShuffling] = useState(false);
  const [tempMovie, setTempMovie] = useState<Movie | null>(null);

  // Load movies
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
  }, []);

  // Filter genres list
  const genres = useEffect(() => {}, [movies]);
  const availableGenres = Array.from(new Set(movies.flatMap(m => m.genres || []))).sort();

  // Filter movies pool
  const getFilteredPool = () => {
    let pool = [...movies];
    if (onlyMovies) {
      pool = pool.filter(m => m.type === 'Movie');
    }
    if (genreFilter) {
      pool = pool.filter(m => m.genres.includes(genreFilter));
    }
    if (ratingFilter) {
      pool = pool.filter(m => m.myRating >= parseInt(ratingFilter, 10));
    }
    return pool;
  };

  // Perform slot machine shuffle animation
  const handleShuffle = () => {
    const pool = getFilteredPool();
    if (pool.length === 0) return;

    setIsShuffling(true);
    setSelectedMovie(null);
    
    let speed = 60; // Initial shuffle interval speed in ms
    let iterations = 0;
    const maxIterations = 20; // Number of flashes

    const tick = () => {
      const randomIndex = Math.floor(Math.random() * pool.length);
      setTempMovie(pool[randomIndex]);

      iterations++;
      if (iterations < maxIterations) {
        // Slow down linearly
        speed += 12;
        setTimeout(tick, speed);
      } else {
        // Slow final flash
        setTimeout(() => {
          const finalIndex = Math.floor(Math.random() * pool.length);
          const winner = pool[finalIndex];
          setSelectedMovie(winner);
          setTempMovie(null);
          setIsShuffling(false);
        }, speed + 100);
      }
    };

    tick();
  };

  const ratingColor = selectedMovie ? getRatingColor(selectedMovie.myRating) : '';

  return (
    <div className="space-y-10 animate-fade-in">
      {/* Title */}
      <div className="border-b border-zinc-800 pb-5 text-center md:text-left">
        <h1 className="text-3xl font-black text-white flex items-center justify-center md:justify-start gap-2">
          <span>🎲</span> Bu Akşam Ne İzlesem?
        </h1>
        <p className="text-zinc-500 text-sm mt-1">
          Koleksiyonunuzdan rastgele seçimler yapan akıllı şans çarkı. Alışkanlıklarınıza uygun filtreler uygulayabilirsiniz.
        </p>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <div className="w-10 h-10 border-4 border-brand-primary border-t-transparent rounded-full animate-spin"></div>
          <span className="text-sm text-zinc-500">Kütüphane taranıyor...</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
          
          {/* Left panel: Filters / Settings */}
          <div className="md:col-span-4 glass p-6 rounded-3xl border border-white/5 space-y-6">
            <h2 className="text-sm font-extrabold uppercase tracking-wider text-zinc-400 border-b border-zinc-800 pb-2">
              Çark Ayarları
            </h2>

            {/* Only Movies Toggle */}
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-zinc-300">Sadece Sinema Filmleri</span>
              <button
                onClick={() => setOnlyMovies(!onlyMovies)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-300 ${
                  onlyMovies ? 'bg-brand-primary' : 'bg-zinc-800 border border-zinc-700'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-300 ${
                    onlyMovies ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            {/* Genre Filter */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Tür Sınırla</label>
              <select
                value={genreFilter}
                onChange={(e) => setGenreFilter(e.target.value)}
                className="w-full bg-zinc-900 border border-white/5 rounded-xl px-3 py-2 text-sm text-zinc-300 focus:border-brand-primary/50 focus:outline-none"
              >
                <option value="">Tüm Türler</option>
                {availableGenres.map((g) => (
                  <option key={g} value={g}>
                    {g}
                  </option>
                ))}
              </select>
            </div>

            {/* Min Rating Filter */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Puan Eşiği (Min)</label>
              <select
                value={ratingFilter}
                onChange={(e) => setRatingFilter(e.target.value)}
                className="w-full bg-zinc-900 border border-white/5 rounded-xl px-3 py-2 text-sm text-zinc-300 focus:border-brand-primary/50 focus:outline-none"
              >
                <option value="">Tüm Puanlar</option>
                {[9, 8, 7, 6, 5].map((r) => (
                  <option key={r} value={r}>
                    Benim Puanım: {r}+
                  </option>
                ))}
              </select>
            </div>

            {/* Pool indicator */}
            <div className="text-xs text-zinc-500 font-medium">
              Eşleşen aday havuzu:{' '}
              <strong className="text-zinc-300 font-bold">{getFilteredPool().length}</strong> yapım.
            </div>

            <button
              onClick={handleShuffle}
              disabled={isShuffling || getFilteredPool().length === 0}
              className="w-full inline-flex items-center justify-center gap-2 bg-gradient-to-r from-brand-primary to-brand-secondary hover:opacity-95 text-white font-bold py-3 px-4 rounded-xl transition-all duration-300 shadow-[0_4px_20px_rgba(239,68,68,0.2)] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <RefreshCw className={`w-4 h-4 ${isShuffling ? 'animate-spin' : ''}`} />
              {isShuffling ? 'Seçiliyor...' : 'Çarkı Döndür'}
            </button>
          </div>

          {/* Right panel: Spinner Screen & Reveal */}
          <div className="md:col-span-8 flex flex-col items-center justify-center min-h-[380px] glass bg-zinc-950/30 rounded-3xl border border-white/5 p-8 relative overflow-hidden">
            
            {/* Shuffling animation flash card */}
            {isShuffling && tempMovie && (
              <div className="flex flex-col items-center space-y-4 animate-shuffle">
                <div className="relative aspect-[2/3] w-48 overflow-hidden rounded-2xl border border-white/15 bg-zinc-900 shadow-2xl">
                  <PosterImage
                    src={tempMovie.poster}
                    alt={tempMovie.title}
                    fill
                    className="object-cover opacity-60"
                    fallbackTitle={tempMovie.title}
                    trailerYoutubeId={tempMovie.trailerYoutubeId}
                    disableYoutubeClick
                  />
                </div>
                <h3 className="text-lg font-extrabold text-zinc-400 truncate w-60 text-center">
                  {tempMovie.title}
                </h3>
              </div>
            )}

            {/* Revealed Movie Result Card */}
            {!isShuffling && selectedMovie && (
              <div className="w-full flex flex-col items-center text-center space-y-6 animate-fade-in relative z-10">
                {/* Visual Glow border effect */}
                <div className="absolute -inset-10 bg-red-500/10 rounded-full blur-3xl z-0 pointer-events-none"></div>

                <div className="relative z-10 aspect-[2/3] w-48 sm:w-56 overflow-hidden rounded-2xl border border-red-500/30 bg-zinc-900 shadow-[0_15px_40px_rgba(239,68,68,0.25)] group hover:scale-105 transition-transform duration-300">
                  <PosterImage
                    src={selectedMovie.poster}
                    alt={selectedMovie.title}
                    fill
                    className="object-cover"
                    fallbackTitle={selectedMovie.title}
                    trailerYoutubeId={selectedMovie.trailerYoutubeId}
                    disableYoutubeClick
                  />
                  {/* Rating badge */}
                  {selectedMovie.myRating > 0 && (
                    <div className="absolute top-3 left-3 bg-black/80 backdrop-blur-md px-2.5 py-1 rounded-xl border border-white/10 flex items-center gap-1 shadow-lg">
                      <Star className="w-4 h-4 text-brand-accent fill-brand-accent" />
                      <span className={`text-xs font-black ${ratingColor}`}>{selectedMovie.myRating}</span>
                    </div>
                  )}
                </div>

                <div className="space-y-2 relative z-10">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-red-500/10 text-red-300 border border-red-500/20">
                    <Sparkles className="w-3 h-3 text-brand-accent" /> ŞANSLI YAPIM SEÇİLDİ
                  </span>
                  <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                    {selectedMovie.title}{' '}
                    <span className="text-zinc-500 font-normal">({selectedMovie.year})</span>
                  </h2>
                  <p className="text-xs text-zinc-400">
                    Yönetmen: {selectedMovie.director} • Tür: {selectedMovie.genres.join(', ')}
                  </p>
                </div>

                <p className="text-sm text-zinc-400 max-w-md leading-relaxed line-clamp-3 relative z-10">
                  {selectedMovie.overview}
                </p>

                <div className="flex items-center gap-4 relative z-10">
                  <button
                    onClick={handleShuffle}
                    className="bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white border border-white/10 font-bold px-4 py-2.5 rounded-xl text-xs transition-all flex items-center gap-1"
                  >
                    <RefreshCw className="w-3.5 h-3.5" /> Tekrar Döndür
                  </button>
                  <Link
                    href={`/movie/${selectedMovie.imdbId}`}
                    className="bg-brand-primary text-white font-bold px-4 py-2.5 rounded-xl text-xs hover:bg-red-600 transition-all flex items-center gap-1 shadow-md shadow-brand-primary/10"
                  >
                    Detayları İncele <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            )}

            {/* Waiting state when no selection and not shuffling */}
            {!isShuffling && !selectedMovie && (
              <div className="flex flex-col items-center justify-center text-center space-y-4 max-w-sm">
                <span className="text-6xl animate-bounce">🎲</span>
                <h3 className="text-lg font-bold text-zinc-300">Gecenin Yapımını Seçin!</h3>
                <p className="text-xs text-zinc-500 leading-relaxed">
                  Çark ayarlarından sınırlandırma yapabilir veya doğrudan kütüphanenizden rastgele bir seçime başlamak için sol taraftaki butona basabilirsiniz.
                </p>
                {getFilteredPool().length === 0 && (
                  <div className="bg-rose-500/10 border border-rose-500/20 text-rose-300 rounded-xl p-3 text-xs font-semibold">
                    Seçili filtrelere uygun aday yapım bulunamadı. Lütfen filtrelerinizi gevşetin.
                  </div>
                )}
              </div>
            )}

          </div>

        </div>
      )}
    </div>
  );
}
