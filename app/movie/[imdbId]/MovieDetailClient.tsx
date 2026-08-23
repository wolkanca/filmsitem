'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Star, Calendar, Clock, User, Film, ExternalLink, Eye, Play, Pencil, Clapperboard, Share2, Globe, CalendarDays, Banknote } from 'lucide-react';
import { Movie } from '@/types';
import { getRatingColor, formatDate } from '@/lib/utils';
import PosterModal from '@/components/PosterModal';
import TrailerModal from '@/components/TrailerModal';
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
  franchiseMovies: Movie[];
}

export default function MovieDetailClient({
  movie: initialMovie,
  prevImdbId,
  nextImdbId,
  similarMovies,
  franchiseMovies,
}: MovieDetailClientProps) {

  const [isPosterModalOpen, setIsPosterModalOpen] = useState(false);
  const [isTrailerModalOpen, setIsTrailerModalOpen] = useState(false);

  // Admin state
  const [isAdmin, setIsAdmin] = useState(false);

  // Client-side random selection.
  // Server sends a relevant pool of up to 12 similar movies; this displays 4 of them randomly.
  const [randomSimilarMovies, setRandomSimilarMovies] = useState<Movie[]>([]);

  const overviewContentRef = useRef<HTMLDivElement | null>(null);

  // Local state for the movie to handle visual updates immediately after saving edits
  const [movie, setMovie] = useState<Movie>(initialMovie);

  useEffect(() => {
    setMovie(initialMovie);
  }, [initialMovie]);

  useEffect(() => {
    if (!similarMovies || similarMovies.length === 0) {
      setRandomSimilarMovies([]);
      return;
    }

    const candidatePool = similarMovies
      .filter((similarMovie) => similarMovie.imdbId !== movie.imdbId)
      .slice(0, 12);

    const selectedMovies = [...candidatePool]
      .sort(() => Math.random() - 0.5)
      .slice(0, 5);

    setRandomSimilarMovies(selectedMovies);
  }, [similarMovies, movie.imdbId]);

  const handleSaveTrailer = async (inputVal?: string) => {
    try {
      let youtubeId = (inputVal || '').trim();
      const ytMatch = youtubeId.match(/(?:v=|youtu\.be\/|embed\/)([A-Za-z0-9_-]{11})/);
      if (ytMatch) youtubeId = ytMatch[1];

      if (!youtubeId) {
        throw new Error('Geçerli bir YouTube ID veya URL girin.');
      }

      // YouTube oEmbed ile embed edilebilirlik kontrolü
      const oembedRes = await fetch(
        `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${youtubeId}&format=json`
      );
      if (!oembedRes.ok) {
        throw new Error(
          '⚠️ Bu video embed edilemiyor. Lütfen embed iznine sahip başka bir video deneyin.'
        );
      }

      const res = await fetch(`/api/movies/${movie.imdbId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ trailerYoutubeId: youtubeId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Kaydetme başarısız.');

      setMovie((prev) => ({ ...prev, trailerYoutubeId: youtubeId }));
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Hata oluştu.';
      throw new Error(msg);
    }
  };

  const handleSavePoster = async (inputVal?: string) => {
    try {
      const posterUrl = (inputVal || '').trim();
      if (!posterUrl) {
        throw new Error('Geçerli bir poster URL girin.');
      }

      const res = await fetch(`/api/movies/${movie.imdbId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ poster: posterUrl }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Kaydetme başarısız.');

      setMovie((prev) => ({ ...prev, poster: posterUrl }));
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Hata oluştu.';
      throw new Error(msg);
    }
  };

  // Detect admin cookie
  useEffect(() => {
    const cookies = document.cookie.split(';');
    const adminCookie = cookies.some((c) => c.trim().startsWith('is_admin=true'));
    setIsAdmin(adminCookie);
  }, []);

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

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://izlediklerim.com';
  const movieUrl = `${baseUrl}/movie/${movie.imdbId}`;

  const hasRealPoster = !!movie.poster && !isPlaceholderUrl(movie.poster);

  function formatBoxOffice(value?: string | null) {
    if (!value || value === 'N/A') return null;

    const number = Number(value.replace(/[^0-9]/g, ''));

    if (number >= 1_000_000_000) return `$${(number / 1_000_000_000).toFixed(1)}B`;
    if (number >= 1_000_000) return `$${(number / 1_000_000).toFixed(1)}M`;
    if (number >= 1_000) return `$${(number / 1_000).toFixed(1)}K`;

    return value;
  }

  const handleShare = async () => {
    const shareData = {
      title: `${movie.title} (${movie.year})`,
      text: `${movie.title} filmini İzlediklerim'de görüntüle.`,
      url: window.location.href,
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(window.location.href);
        alert('Bağlantı panoya kopyalandı.');
      }
    } catch (error) {
      if (error instanceof Error && error.name !== 'AbortError') {
        console.error('Paylaşım hatası:', error);
      }
    }
  };

  return (
    <div className="space-y-10 relative">
      {/* Cinematic Backdrop Hero Area */}
      <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-zinc-950/60 min-h-[380px] flex items-end">
        {isAdmin && (
          <div className="z-20 absolute top-3 right-3 flex items-center gap-2">
            <button
              type="button"
              onClick={async (e) => {
                e.stopPropagation();
                const nextVal = !movie.isFeatured;
                setMovie((prev) => ({ ...prev, isFeatured: nextVal }));
                try {
                  await fetch(`/api/movies/${movie.imdbId}`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ isFeatured: nextVal }),
                  });
                } catch {
                  setMovie((prev) => ({ ...prev, isFeatured: !nextVal }));
                }
              }}
              className={`cursor-pointer duration-300 flex font-bold gap-1.5 items-center justify-center px-4 py-1.5 rounded-xl text-xs transition-all border ${movie.isFeatured ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 hover:bg-amber-500/30' : 'bg-zinc-900/80 text-zinc-300 border-zinc-700 hover:bg-zinc-800'}`}
              title="Slider'da Öne Çıkar durumunu değiştir"
            >
              <Star className={`w-3.5 h-3.5 ${movie.isFeatured ? 'fill-amber-300 text-amber-300' : ''}`} />
              {movie.isFeatured ? 'Öne Çıkarıldı' : 'Öne Çıkar'}
            </button>
            <Link
              href={`/admin/movies?edit=${movie.imdbId}`}
              className="bg-gradient-to-r cursor-pointer duration-300 flex font-bold from-violet-600 gap-2 hover:opacity-95 items-center justify-center px-5 py-1.5 rounded-xl shadow-lg shadow-violet-600/10 text-xs text-white to-indigo-600 transition-all"
              title="Filmi Admin Panelinde Düzenle"
            >
              <Pencil className="w-3 h-3" /> Düzenle
            </Link>
          </div>
        )}
        {/* Backdrop Image */}
        <div className="absolute inset-0 z-0">
          <PosterImage
            src={movie.poster}
            alt={movie.title}
            fill
            sizes="100vw"
            className="object-cover opacity-30 select-none pointer-events-none"
            priority
            fallbackTitle={movie.title}
            trailerYoutubeId={movie.trailerYoutubeId}
          />
          {/* Dark gradient to cover bottom & edges */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#080c14] via-zinc-950/70 to-transparent"></div>
          <div className="absolute inset-0 bg-gradient-to-r from-zinc-950/90 via-transparent to-zinc-950/50"></div>
        </div>

        {/* Content Container */}
        <div className="relative z-10 p-6 sm:p-10 w-full flex flex-col md:flex-row gap-8 items-start md:items-end">
          {/* Movie Poster Image (clickable) */}
          <div className="relative flex-shrink-0 mx-auto">
            <div
              onClick={() => (hasRealPoster || isAdmin) && setIsPosterModalOpen(true)}
              className={`relative aspect-[2/3] w-60 sm:w-60 md:w-60 overflow-hidden rounded-2xl bg-zinc-900 border border-white/10 shadow-2xl transition-transform hover:scale-[1.02] duration-300 group ${(hasRealPoster || isAdmin) ? 'cursor-pointer' : 'cursor-default'}`}>
              <PosterImage
                src={movie.poster}
                alt={movie.title}
                fill
                sizes="(max-width: 640px) 240px, 240px"
                className="object-cover"
                priority
                fallbackTitle={movie.title}
                trailerYoutubeId={movie.trailerYoutubeId}
              />
              {/* Zoom / Edit hint */}
              {(hasRealPoster || isAdmin) && (
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                  <span className="text-white text-xs font-bold bg-black/60 px-3 py-1.5 rounded-full border border-white/10 flex items-center gap-1">
                    <Eye className="w-3.5 h-3.5" /> {isAdmin ? 'Görüntüle / Düzenle' : 'Büyüt'}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Title & Stats */}
          <div className="flex-grow space-y-4 text-left">
            <div className="space-y-1">
              <div className="flex flex-wrap gap-2 mb-1.5">
                <span className="px-2.5 py-0.5 rounded-md text-[10px] font-bold bg-red-500/10 text-red-300 border border-red-500/20 capitalize tracking-wider">
                  {movie.type === 'Movie' ? 'Sinema Filmi' : movie.type}
                </span>
                {Array.from(new Set(movie.listName)).map((list, idx) => (
                  <span key={`${list}-${idx}`} className="px-2.5 py-0.5 rounded-md text-[10px] font-bold bg-rose-500/10 text-rose-300 border border-rose-500/20 capitalize">
                    {list}
                  </span>
                ))}
              </div>
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-zinc-100 tracking-tight">
                {movie.title}
              </h1>
              {movie.originalTitle && movie.originalTitle !== movie.title && (
                <p className="text-zinc-400 text-sm sm:text-base font-medium italic">
                  Orijinal İsim: {movie.originalTitle}
                </p>
              )}
            </div>

            {/* Quick Meta */}
            <div className="flex flex-wrap gap-4 text-xs font-bold text-zinc-300 pt-2 items-center">
              <Link
                href={`/year/${movie.year}`}
                className="flex items-center gap-1.5 hover:text-brand-primary transition-colors"
              >
                <Calendar className="w-4 h-4 text-zinc-500" />
                <span>{movie.year}</span>
              </Link>
              {movie.runtime > 0 && (
                <div className="flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-zinc-500" />
                  <span>{movie.runtime} dk</span>
                </div>
              )}
              {movie.releaseDate && (
                <div className="flex items-center gap-1.5">
                  <CalendarDays className="w-4 h-4 text-zinc-500" />
                  <span>{formatDate(movie.releaseDate)}</span>
                </div>
              )}
              {movie.country && (
                <div className="flex items-center gap-1.5">
                  <Globe className="w-4 h-4 text-blue-400" />
                  <span>
                    {(() => {
                      const countries = movie.country.split(',').map((c) => c.trim());
                      return countries.length >= 3
                        ? countries.slice(0, 2).join(', ')
                        : movie.country;
                    })()}
                  </span>
                </div>
              )}
              {movie.boxOffice && (
                <div className="flex items-center gap-1.5">
                  <Banknote className="w-4 h-4 text-emerald-400" />
                  <span className="text-emerald-300 text-[11px] font-semibold">
                    {formatBoxOffice(movie.boxOffice)}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Layout Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left / Main info */}
        <div className="lg:col-span-8 space-y-6">

          {/* Overview */}
          <div className="glass p-6 sm:p-8 rounded-3xl border border-white/5 space-y-4 min-h-[300px]">
            <div className="flex items-center justify-between gap-4">
              <h2 className="text-xl font-extrabold text-zinc-200">
                {movie.type === 'TV Series' || movie.type === 'TV Mini Series' ? 'Dizinin Özeti' : 'Filmin Özeti'}
              </h2>
            </div>

            <div
              ref={overviewContentRef}
              className={`relative overflow-hidden text-sm transition-all duration-300 pb-2`}
            >
              <p className="text-zinc-400 text-md leading-relaxed whitespace-pre-line mt-2 mb-4">
                {movie.overview || 'Özet eklenmemiş.'}
              </p>
              <p className="text-zinc-400 text-md leading-relaxed whitespace-pre-line mt-4">
                {movie.plotTr || movie.plot}
              </p>
            </div>
          </div>

          {/* Credits Box */}
          <div className="glass p-6 sm:p-8 rounded-3xl border border-white/5 space-y-6">
            <div className="flex items-center justify-between gap-4">
              <h2 className="text-xl font-extrabold text-zinc-200">Künye ve Ekip</h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-sm">
              <div className="space-y-4">
                {movie.director && (
                  <div>
                    <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1.5">Yönetmen</h3>
                    <div className="flex flex-wrap gap-1.5">
                      {Array.from(new Set(movie.director.split(',').map((d) => d.trim()).filter(Boolean))).map((d, idx) => (
                        <Link
                          key={`${d}-${idx}`}
                          href={`/director/${encodeURIComponent(d)}`}
                          className="flex items-center gap-1.5 bg-zinc-900 border border-white/5 hover:border-brand-primary/40 hover:bg-brand-primary/5 text-zinc-200 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
                        >
                          <User className="w-3.5 h-3.5 text-zinc-500" />
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
                      {Array.from(new Set(movie.writers)).map((w, idx) => (
                        <Link
                          key={`${w}-${idx}`}
                          href={`/writer/${encodeURIComponent(w)}`}
                          className="flex items-center gap-1.5 bg-zinc-900 border border-white/5 hover:border-brand-rose/40 hover:bg-brand-rose/5 text-zinc-200 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
                        >
                          <Pencil className="w-3.5 h-3.5 text-zinc-500" />
                          {w}
                        </Link>
                      ))}
                    </div>
                  </div>
                )}

                <div>
                  <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1.5">Kategoriler / Türler</h3>
                  <div className="flex flex-wrap gap-1.5">
                    {Array.from(new Set(movie.genres)).map((g, idx) => (
                      <Link
                        key={`${g}-${idx}`}
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
                  <div className="flex flex-col gap-2 max-w-sm">
                    {Array.from(new Set(movie.cast)).map((actor, idx) => (
                      <Link
                        key={`${actor}-${idx}`}
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
          <div className="glass bg-gradient-to-br from-zinc-900/60 to-red-950/10 p-6 sm:p-8 rounded-3xl border border-brand-primary/20 space-y-6 mb-4 shadow-[0_10px_35px_rgba(239,68,68,0.1)]">
            <h2 className="text-lg font-black text-zinc-200 tracking-tight flex items-center gap-2">
              <Eye className="w-5 h-5 text-zinc-500" /> Notlarım
            </h2>

            <div className="cursor-pointer" onClick={() => window.open(`https://www.imdb.com/title/${movie.imdbId}/`, '_blank', 'noopener,noreferrer')}>
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
                <div className="bg-zinc-950/60 border border-white/5 rounded-2xl p-4 text-center flex justify-between items-center px-6">
                  <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">İzleme Tarihi: </span>
                  <span className="text-sm font-extrabold text-zinc-200">
                    {formatDate(movie.watchDate)}
                  </span>
                </div>
              )}

              {/* IMDb rating score */}
              <div className="bg-zinc-950/60 border border-white/5 rounded-2xl p-4 flex justify-between items-center px-6">
                <div className="text-left">
                  <a
                    href={`https://www.imdb.com/title/${movie.imdbId}/`}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="group"
                  >
                    <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">
                      IMDb Puanı
                    </span>

                    <div className="mt-0.5 flex items-center gap-1">
                      <span className="text-sm font-extrabold text-zinc-300">
                        {movie.imdbRating} / 10
                      </span>

                      <ExternalLink className="h-4 w-4 text-brand-accent transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 ml-2" />
                    </div>
                  </a>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">TMDb Puanı</span>
                  <span className="text-sm font-extrabold text-zinc-300 mt-0.5 block">{movie.tmdbRating || movie.imdbRating} / 10</span>
                </div>
              </div>

            </div>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {/* Right side: Trailer Image & Play Button with Title Overlay */}
            {movie.trailerYoutubeId && (
              <div className="lg:col-span-5 w-full flex flex-col">
                <div
                  onClick={() => setIsTrailerModalOpen(true)}
                  className="relative aspect-video w-full overflow-hidden rounded-2xl border border-white/10 shadow-xl bg-zinc-900 group cursor-pointer"
                >
                  <Image
                    src={`https://img.youtube.com/vi/${movie.trailerYoutubeId}/hqdefault.jpg`}
                    alt={`${movie.title} Fragman`}
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
                    <div className="self-center flex items-center justify-center">
                      <div className="w-14 h-14 rounded-full bg-brand-primary/90 text-white flex items-center justify-center shadow-[0_0_25px_rgba(239,68,68,0.5)] group-hover:scale-110 group-hover:bg-brand-primary transition-all duration-300">
                        <Play className="w-7 h-7 fill-white ml-0.5" />
                      </div>
                    </div>

                    {/* Bottom Movie / Trailer Title */}
                    <div className="space-y-0.5 text-left">
                      <p className="text-sm font-black text-white tracking-tight line-clamp-1 drop-shadow-md">
                        {movie.title}
                      </p>
                      <p className="text-xs text-zinc-300 font-medium line-clamp-1">
                        Fragman ({movie.year})
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <a
              href={`https://www.google.com/search?q=${encodeURIComponent(movie.title + ' ' + movie.year + ' izle')}`}
              target="_blank"
              title="İzle"
              rel="noopener noreferrer"
              className="flex h-8 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-brand-primary to-brand-secondary px-5 text-center text-sm font-bold leading-none text-white shadow-[0_10px_25px_rgba(239,68,68,0.3)] transition-opacity hover:opacity-90"
            >
              <Play className="h-4 w-4 fill-white" />
              İzle
            </a>
            <button
              type="button"
              onClick={handleShare}
              aria-label={`${movie.title} filmini paylaş`}
              title="Paylaş"
              className="flex h-8 items-center justify-center gap-2 rounded-xl bg-zinc-900/80 px-5 text-center text-sm font-bold leading-none text-zinc-200 shadow-[0_10px_25px_rgba(39,39,42,0.35)] transition-all hover:bg-zinc-800 hover:text-white"
            >
              <Share2 className="h-4 w-4" /> Paylaş
            </button>
          </div>
        </div>
      </div>

      {/* Franchise / Film Series Section */}
      {franchiseMovies.length > 1 && (
        <section className="space-y-6 pt-6 border-t border-zinc-800">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
                <Film className="h-6 w-6 text-brand-primary" />
                {movie.franchiseName || 'Film Serisi'}
              </h2>

              <p className="mt-1 text-sm text-zinc-500">
                Serideki {franchiseMovies.length} yapım
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 md:grid-cols-5">
            {franchiseMovies.map((franchiseMovie) => {
              const isCurrentMovie =
                franchiseMovie.imdbId === movie.imdbId;

              return (
                <div
                  key={franchiseMovie.imdbId}
                  className="relative"
                >
                  {isCurrentMovie && (
                    <div className="absolute -top-3 left-1/2 z-20 -translate-x-1/2 whitespace-nowrap rounded-full bg-brand-primary px-3 py-1 text-[10px] font-black uppercase tracking-wider text-white shadow-lg">
                      Şu an görüntüleniyor
                    </div>
                  )}

                  <div
                    className={
                      isCurrentMovie
                        ? 'rounded-2xl ring-2 ring-brand-primary ring-offset-4 ring-offset-zinc-950'
                        : ''
                    }
                  >
                    <MovieCard movie={franchiseMovie} />
                  </div>

                  {franchiseMovie.franchiseOrder && (
                    <div className="mt-3 text-center text-xs font-bold text-zinc-500">
                      Serinin {franchiseMovie.franchiseOrder}. yapımı
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Similar Movies Section */}
      {randomSimilarMovies.length > 0 && (
        <section className="space-y-6 pt-6 border-t border-zinc-800">
          <h2 className="text-xl font-black text-white tracking-tight flex items-center gap-2">
            <Clapperboard className="w-5 h-5" /> Benzer Yapımlar
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-6">
            {randomSimilarMovies.map((sm) => (
              <MovieCard key={sm.imdbId} movie={sm} />
            ))}
          </div>
        </section>
      )}

      {/* Large Poster view overlay modal */}
      {(movie.poster || isAdmin) && (
        <PosterModal
          isOpen={isPosterModalOpen}
          onClose={() => setIsPosterModalOpen(false)}
          imageUrl={movie.poster}
          title={movie.title}
          year={movie.year}
          isAdmin={isAdmin}
          onSavePoster={handleSavePoster}
        />
      )}

      <TrailerModal
        isOpen={isTrailerModalOpen}
        onClose={() => setIsTrailerModalOpen(false)}
        trailerYoutubeId={movie.trailerYoutubeId}
        title={movie.title}
        year={movie.year}
        isAdmin={isAdmin}
        onSaveTrailer={handleSaveTrailer}
      />
    </div>
  );
}