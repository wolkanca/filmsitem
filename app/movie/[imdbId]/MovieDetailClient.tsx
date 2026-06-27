'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { Star, Calendar, Clock, User, Film, ChevronLeft, ChevronRight, CornerDownLeft, Eye, Play } from 'lucide-react';
import { Movie } from '@/types';
import { getRatingColor, formatDate } from '@/lib/utils';
import PosterModal from '@/components/PosterModal';
import MovieCard from '@/components/MovieCard';
import PosterImage from '@/components/PosterImage';

// Same placeholder patterns as PosterImage — a poster with these URLs is treated as "no real poster"
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

interface MovieDetailClientProps {
  movie: Movie;
  prevImdbId: string | null;
  nextImdbId: string | null;
  similarMovies: Movie[];
}

export default function MovieDetailClient({
  movie,
  prevImdbId,
  nextImdbId,
  similarMovies,
}: MovieDetailClientProps) {
  const router = useRouter();
  const [isPosterModalOpen, setIsPosterModalOpen] = useState(false);

  // Active season tab for series
  const [activeSeasonTab, setActiveSeasonTab] = useState<number>(() => {
    if (movie.seasons && movie.seasons.length > 0) {
      return movie.seasons[0].seasonNumber;
    }
    return 1;
  });

  // Calculate average rating of episodes if the series itself is not rated
  const averageEpisodeRating = useMemo(() => {
    if (!movie.seasons || movie.seasons.length === 0) return 0;
    let total = 0;
    let count = 0;
    movie.seasons.forEach((s) => {
      s.episodes.forEach((ep) => {
        if (ep.myRating > 0) {
          total += ep.myRating;
          count++;
        }
      });
    });
    return count > 0 ? parseFloat((total / count).toFixed(1)) : 0;
  }, [movie]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if modal is open to prevent double actions
      if (isPosterModalOpen) return;

      if (e.key === 'ArrowLeft' && prevImdbId) {
        router.push(`/movie/${prevImdbId}`);
      } else if (e.key === 'ArrowRight' && nextImdbId) {
        router.push(`/movie/${nextImdbId}`);
      } else if (e.key === 'Escape') {
        router.push('/movies');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [prevImdbId, nextImdbId, router, isPosterModalOpen]);

  const ratingColor = getRatingColor(movie.myRating);

  return (
    <div className="space-y-10 relative">

      {/* Back to list and Prev/Next Navigation Controls */}
      <div className="flex items-center justify-between z-10 relative">
        <Link
          href="/movies"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-zinc-400 hover:text-white transition-colors bg-zinc-900/80 px-3.5 py-2 rounded-xl border border-white/5"
        >
          <CornerDownLeft className="w-3.5 h-3.5" />
          Kitaplığa Dön <span className="text-[10px] text-zinc-500 font-normal">(ESC)</span>
        </Link>

        <div className="flex items-center gap-2">
          {prevImdbId ? (
            <Link
              href={`/movie/${prevImdbId}`}
              className="p-2 rounded-xl bg-zinc-900/80 hover:bg-zinc-800 text-zinc-400 hover:text-white border border-white/5 transition-all"
              title="Önceki Film (Sol Yön Tuşu)"
            >
              <ChevronLeft className="w-4 h-4" />
            </Link>
          ) : (
            <span className="p-2 rounded-xl bg-zinc-950/40 text-zinc-700 border border-transparent cursor-not-allowed">
              <ChevronLeft className="w-4 h-4" />
            </span>
          )}

          <span className="text-xs text-zinc-500 font-bold px-1.5">Gezinme</span>

          {nextImdbId ? (
            <Link
              href={`/movie/${nextImdbId}`}
              className="p-2 rounded-xl bg-zinc-900/80 hover:bg-zinc-800 text-zinc-400 hover:text-white border border-white/5 transition-all"
              title="Sonraki Film (Sağ Yön Tuşu)"
            >
              <ChevronRight className="w-4 h-4" />
            </Link>
          ) : (
            <span className="p-2 rounded-xl bg-zinc-950/40 text-zinc-700 border border-transparent cursor-not-allowed">
              <ChevronRight className="w-4 h-4" />
            </span>
          )}
        </div>
      </div>

      {/* Cinematic Backdrop Hero Area */}
      <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-zinc-950/60 min-h-[380px] flex items-end">
        {/* Backdrop Image */}
        <div className="absolute inset-0 z-0">
          <PosterImage
            src={movie.backdrop || movie.poster}
            alt={movie.title}
            fill
            className="object-cover opacity-30 select-none pointer-events-none"
            priority
          />
          {/* Dark gradient to cover bottom & edges */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#080c14] via-zinc-950/70 to-transparent"></div>
          <div className="absolute inset-0 bg-gradient-to-r from-zinc-950/90 via-transparent to-zinc-950/50"></div>
        </div>

        {/* Content Container */}
        <div className="relative z-10 p-6 sm:p-10 w-full flex flex-col md:flex-row gap-8 items-start md:items-end">

          {/* Movie Poster Image (clickable) */}
          {(() => {
            // A "real" poster = has a URL AND it's not a known placeholder
            const hasRealPoster = !!movie.poster && !isPlaceholderUrl(movie.poster);
            return (
              <div
                onClick={() => hasRealPoster && setIsPosterModalOpen(true)}
                className={`relative aspect-[2/3] w-40 sm:w-52 md:w-60 flex-shrink-0 overflow-hidden rounded-2xl bg-zinc-900 border border-white/10 shadow-2xl transition-transform hover:scale-[1.02] duration-300 group ${hasRealPoster ? 'cursor-zoom-in' : 'cursor-default'
                  }`}
              >
                <PosterImage
                  src={movie.poster}
                  alt={movie.title}
                  fill
                  className="object-cover"
                  priority
                  fallbackTitle={movie.title}
                  trailerYoutubeId={movie.trailerYoutubeId}
                />
                {/* Zoom hint only when there is a real (non-placeholder) poster */}
                {hasRealPoster && (
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                    <span className="text-white text-xs font-bold bg-black/60 px-3 py-1.5 rounded-full border border-white/10 flex items-center gap-1">
                      <Eye className="w-3.5 h-3.5" /> Büyüt
                    </span>
                  </div>
                )}
              </div>
            );
          })()}

          {/* Title & Stats */}
          <div className="flex-grow space-y-4 text-left">
            <div className="space-y-1">
              <div className="flex flex-wrap gap-2 mb-1.5">
                <span className="px-2.5 py-0.5 rounded-md text-[10px] font-bold bg-red-500/10 text-red-300 border border-red-500/20 uppercase tracking-wider">
                  {movie.type === 'Movie' ? 'Sinema Filmi' : movie.type}
                </span>
                {movie.listName.map((list) => (
                  <span key={list} className="px-2.5 py-0.5 rounded-md text-[10px] font-bold bg-rose-500/10 text-rose-300 border border-rose-500/20">
                    {list}
                  </span>
                ))}
              </div>
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-white tracking-tight">
                {movie.title}
              </h1>
              {movie.originalTitle && movie.originalTitle !== movie.title && (
                <p className="text-zinc-400 text-sm sm:text-base font-medium italic">
                  Orijinal İsim: {movie.originalTitle}
                </p>
              )}
            </div>

            {/* Quick Metadata Info */}
            <div className="flex flex-wrap items-center gap-y-2 gap-x-3 text-xs text-zinc-300 border-t border-white/5 pt-4">
              <Link
                href={`/year/${movie.year}`}
                className="flex items-center gap-1.5 font-bold hover:text-brand-primary transition-colors bg-zinc-900/60 border border-white/5 hover:border-brand-primary/20 px-2.5 py-1.5 rounded-lg"
              >
                <Calendar className="w-3.5 h-3.5 text-zinc-500" />
                {movie.year}
              </Link>
              {movie.runtime > 0 && (
                <span className="flex items-center gap-1.5 font-bold bg-zinc-900/60 border border-white/5 px-2.5 py-1.5 rounded-lg">
                  <Clock className="w-3.5 h-3.5 text-zinc-500" />
                  {movie.runtime} dakika
                </span>
              )}
              {movie.releaseDate && (
                <span className="font-medium text-zinc-400 bg-zinc-900/60 border border-white/5 px-2.5 py-1.5 rounded-lg">
                  Vizyon Tarihi: <strong className="text-zinc-300">{formatDate(movie.releaseDate)}</strong>
                </span>
              )}

              {/* IMDb External Link */}
              <a
                href={`https://www.imdb.com/title/${movie.imdbId}/`}
                target="_blank"
                rel="noopener noreferrer"
                className="ml-auto flex items-center gap-2 px-4 py-1.5 rounded-lg font-bold text-xs bg-[#f5c518]/10 hover:bg-[#f5c518]/20 text-[#f5c518] border border-[#f5c518]/30 hover:border-[#f5c518]/60 transition-all duration-200 shadow-[0_0_12px_rgba(245,197,24,0.08)] hover:shadow-[0_0_16px_rgba(245,197,24,0.2)]"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M14.31 9.588v.005c-.077-.048-1.575-.31-1.575-.31l-.35 2.06-.342-2.06S10.551 9.54 10.473 9.588C10.247 9.732 10.1 10.127 10.1 10.7v2.602c0 .572.145.964.37 1.108.076.048.575.1.575.1l.342-2.268.35 2.268s.498-.052.575-.1c.226-.144.37-.536.37-1.108V10.7c0-.573-.147-.968-.372-1.112zM6.792 9.35L6.35 12.23l-.44-2.88H4.2v5.3h1.2v-3.3l.527 3.3h.848l.526-3.3v3.3h1.2v-5.3H6.792zm5.36-5.85C5.664 3.5 1 8.164 1 13.652c0 5.488 4.664 9.848 11.152 9.848S23.5 19.14 23.5 13.652C23.5 8.164 18.64 3.5 12.152 3.5zm4.33 12.51a.5.5 0 01-.5.5H8.02a.5.5 0 01-.5-.5V8.64a.5.5 0 01.5-.5h7.962a.5.5 0 01.5.5v7.37zm-.45-6.01h-1.42v5.3h1.42v-5.3z" />
                </svg>
                IMDb&apos;de Gör
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Two Column details: Details & Review */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

        {/* Left main: Plot and Credits */}
        <div className="lg:col-span-8 space-y-8">
          {/* Overview */}
          <div className="glass p-6 sm:p-8 rounded-3xl border border-white/5 space-y-4">
            <h2 className="text-xl font-extrabold text-zinc-200">
              {movie.type === 'TV Series' || movie.type === 'TV Mini Series' ? 'Dizinin Özeti' : 'Filmin Özeti'}
            </h2>
            <p className="text-zinc-400 text-sm leading-relaxed whitespace-pre-line">
              {movie.overview || 'Özet eklenmemiş.'}
            </p>
          </div>

          {/* Seasons & Episodes */}
          {movie.seasons && movie.seasons.length > 0 && (
            <div className="glass p-6 sm:p-8 rounded-3xl border border-white/5 space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-zinc-800 pb-4">
                <h2 className="text-xl font-extrabold text-zinc-200 flex items-center gap-2">
                  <span>📺</span> Sezonlar & Bölümler
                </h2>
                <span className="text-xs font-bold text-zinc-500 bg-zinc-950/60 px-3 py-1 rounded-lg border border-white/5 w-fit">
                  Toplam {movie.seasons.reduce((acc, s) => acc + s.episodes.length, 0)} Bölüm İzlenmiş
                </span>
              </div>

              {/* Season Tabs */}
              {movie.seasons.length > 1 && (
                <div className="flex flex-wrap gap-2">
                  {movie.seasons.map((s) => {
                    const isActive = activeSeasonTab === s.seasonNumber;
                    return (
                      <button
                        key={s.seasonNumber}
                        onClick={() => setActiveSeasonTab(s.seasonNumber)}
                        className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all duration-200 ${
                          isActive
                            ? 'bg-brand-primary border-brand-primary/30 text-white shadow-[0_4px_12px_rgba(239,68,68,0.25)]'
                            : 'bg-zinc-950/60 border-white/5 text-zinc-400 hover:text-white hover:bg-zinc-900/60'
                        }`}
                      >
                        {s.seasonNumber}. Sezon ({s.episodes.length} Bölüm)
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Episodes List */}
              <div className="space-y-3">
                {movie.seasons
                  .find((s) => s.seasonNumber === activeSeasonTab)
                  ?.episodes.map((ep) => (
                    <div
                      key={ep.imdbId}
                      className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-zinc-950/40 border border-white/5 hover:border-zinc-800 transition-all duration-300 group"
                    >
                      <div className="space-y-1 text-left">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-black text-brand-primary bg-brand-primary/10 px-2 py-0.5 rounded border border-brand-primary/20">
                            {ep.episodeNumber}. Bölüm
                          </span>
                          <h4 className="text-sm font-extrabold text-zinc-200 group-hover:text-white transition-colors">
                            {ep.title.includes(': ') ? ep.title.split(': ').slice(1).join(': ') : ep.title}
                          </h4>
                        </div>
                        {ep.overview && (
                          <p className="text-xs text-zinc-500 line-clamp-2 max-w-xl">
                            {ep.overview}
                          </p>
                        )}
                        {ep.watchDate && (
                          <span className="text-[10px] text-zinc-500 font-bold block mt-1">
                            İzleme Tarihi: {formatDate(ep.watchDate)}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-4 ml-auto sm:ml-0">
                        {/* Ratings */}
                        <div className="flex items-center gap-3">
                          {ep.myRating > 0 && (
                            <div className="flex items-center gap-1 bg-brand-primary/10 border border-brand-primary/20 px-2.5 py-1 rounded-xl">
                              <Star className="w-3.5 h-3.5 text-brand-accent fill-brand-accent animate-pulse-subtle" />
                              <span className={`text-xs font-black ${getRatingColor(ep.myRating)}`}>
                                {ep.myRating}
                              </span>
                            </div>
                          )}
                          {ep.imdbRating > 0 && (
                            <div className="flex items-center gap-1 bg-yellow-500/5 border border-yellow-500/10 px-2.5 py-1 rounded-xl">
                              <span className="text-[10px] font-black text-[#f5c518]">IMDb</span>
                              <span className="text-xs font-black text-zinc-400">
                                {ep.imdbRating}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* Credits Box */}
          <div className="glass p-6 sm:p-8 rounded-3xl border border-white/5 space-y-6">
            <h2 className="text-xl font-extrabold text-zinc-200">Künye ve Ekip</h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-sm">
              <div className="space-y-4">
                {movie.director && (
                  <div>
                    <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1.5">Yönetmen</h3>
                    <div className="flex flex-wrap gap-1.5">
                      {movie.director.split(',').map((d) => d.trim()).filter(Boolean).map((d) => (
                        <Link
                          key={d}
                          href={`/director/${encodeURIComponent(d)}`}
                          className="flex items-center gap-1.5 bg-zinc-900 border border-white/5 hover:border-brand-primary/40 hover:bg-brand-primary/5 text-zinc-200 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
                        >
                          <User className="w-3.5 h-3.5 text-brand-primary" />
                          {d}
                        </Link>
                      ))}
                    </div>
                  </div>
                )}

                {movie.writers && movie.writers.length > 0 && (
                  <div>
                    <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1.5">Senaristler</h3>
                    <div className="flex flex-wrap gap-1.5">
                      {movie.writers.map((w) => (
                        <span key={w} className="bg-zinc-900 border border-white/5 text-zinc-300 px-2.5 py-1 rounded-lg text-xs font-medium">
                          {w}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <div>
                  <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1.5">Kategoriler / Türler</h3>
                  <div className="flex flex-wrap gap-1.5">
                    {movie.genres.map((g) => (
                      <Link
                        key={g}
                        href={`/genre/${encodeURIComponent(g)}`}
                        className="bg-gradient-to-r from-zinc-900 to-slate-900 border border-zinc-800 hover:border-brand-primary/40 hover:from-zinc-900/80 hover:to-slate-900/80 text-zinc-200 px-3 py-1.5 rounded-lg text-xs font-bold transition-all"
                      >
                        {g}
                      </Link>
                    ))}
                  </div>
                </div>
              </div>

              {/* Cast */}
              <div>
                <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2.5">Başrol Oyuncuları</h3>
                {movie.cast && movie.cast.length > 0 ? (
                  <div className="flex flex-col gap-2">
                    {movie.cast.map((actor, idx) => (
                      <Link
                        key={actor}
                        href={`/actor/${encodeURIComponent(actor)}`}
                        className="flex items-center gap-2 text-zinc-300 hover:text-brand-primary hover:border-brand-primary/20 bg-zinc-900/40 border border-white/5 px-3 py-2 rounded-xl text-xs font-semibold transition-all"
                      >
                        <span className="text-zinc-500 font-mono">{idx + 1}.</span>
                        <span>{actor}</span>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <span className="text-zinc-500 text-xs italic">Oyuncu bilgisi eklenmemiş.</span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Right side: Personal entry details */}
        <div className="lg:col-span-4 space-y-6">

          {/* Personal review card */}
          <div className="glass bg-gradient-to-br from-zinc-900/60 to-red-950/10 p-6 sm:p-8 rounded-3xl border border-brand-primary/20 space-y-6 shadow-[0_10px_35px_rgba(239,68,68,0.1)]">
            <h2 className="text-lg font-black text-white tracking-tight flex items-center gap-2">
              <Eye className="w-5 h-5 text-brand-primary" /> Notlarım
            </h2>

            <div className="space-y-4">
              {/* My Rating */}
              <div className="bg-zinc-950/60 border border-white/5 rounded-2xl p-4 text-center">
                <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider">
                  {movie.myRating > 0 ? 'Benim Puanım' : 'Bölüm Ortalamam'}
                </span>
                <div className="flex items-center justify-center gap-2 mt-2">
                  <Star className="w-7 h-7 text-brand-accent fill-brand-accent shadow-sm animate-pulse-subtle" />
                  <span className={`text-4xl font-black tracking-tight ${getRatingColor(movie.myRating || averageEpisodeRating)}`}>
                    {movie.myRating || averageEpisodeRating || '-'}
                  </span>
                  {(movie.myRating > 0 || averageEpisodeRating > 0) && <span className="text-zinc-500 text-lg">/10</span>}
                </div>
                {/* Score bar */}
                {(movie.myRating > 0 || averageEpisodeRating > 0) && (
                  <div className="w-full bg-zinc-900 rounded-full h-1.5 mt-3 overflow-hidden border border-white/5">
                    <div
                      style={{ width: `${(movie.myRating || averageEpisodeRating) * 10}%` }}
                      className="bg-brand-accent h-full rounded-full"
                    ></div>
                  </div>
                )}
              </div>

              {/* Watch Date */}
              {movie.watchDate && (
                <div className="bg-zinc-950/60 border border-white/5 rounded-2xl p-4 text-center">
                  <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider block">İzleme Tarihi</span>
                  <span className="text-base font-extrabold text-zinc-200 mt-1 block">
                    {formatDate(movie.watchDate)}
                  </span>
                </div>
              )}

              {/* IMDb rating score */}
              <div className="bg-zinc-950/60 border border-white/5 rounded-2xl p-4 flex justify-between items-center px-6">
                <div className="text-left">
                  <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">IMDb Puanı</span>
                  <span className="text-sm font-extrabold text-zinc-300 mt-0.5 block">{movie.imdbRating} / 10</span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">TMDb Puanı</span>
                  <span className="text-sm font-extrabold text-zinc-300 mt-0.5 block">{movie.tmdbRating || movie.imdbRating} / 10</span>
                </div>
              </div>
            </div>
          </div>

          <a
            href={`https://www.google.com/search?q=${encodeURIComponent(movie.title + ' izle')}`}
            target="_blank"
            rel="noopener noreferrer"
            className="block text-center bg-gradient-to-r from-brand-primary to-brand-secondary text-white px-6 py-3 rounded-xl font-bold hover:opacity-90 transition-opacity w-full shadow-[0_10px_25px_rgba(239,68,68,0.3)]"
          >
            Filmi İzle
          </a>

        </div>

        {/* Trailer */}
        <div className="lg:col-span-12">
          {movie.trailerYoutubeId && (
            <div className="glass p-6 sm:p-8 rounded-3xl border border-white/5 space-y-4">
              <h2 className="text-xl font-extrabold text-zinc-200 flex items-center gap-2">
                <Play className="w-5 h-5 text-red-500 fill-red-500" /> Resmi Fragman
              </h2>
              <div className="relative aspect-video w-full overflow-hidden rounded-2xl border border-white/5 shadow-md">
                <iframe
                  src={`https://www.youtube.com/embed/${movie.trailerYoutubeId}?autoplay=0&rel=0`}
                  title={`${movie.title} Fragman`}
                  className="absolute inset-0 h-full w-full border-0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                ></iframe>
              </div>
            </div>
          )}
        </div>

      </div>

      {/* Similar Movies Section */}
      {similarMovies.length > 0 && (
        <section className="space-y-6 pt-6 border-t border-zinc-800">
          <h2 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
            <span>🎬</span> Benzer Yapım Önerileri
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-6">
            {similarMovies.map((sm) => (
              <MovieCard key={sm.imdbId} movie={sm} />
            ))}
          </div>
        </section>
      )}

      {/* Large Poster view overlay modal */}
      {movie.poster && (
        <PosterModal
          isOpen={isPosterModalOpen}
          onClose={() => setIsPosterModalOpen(false)}
          imageUrl={movie.poster}
          title={movie.title}
        />
      )}
    </div>
  );
}
