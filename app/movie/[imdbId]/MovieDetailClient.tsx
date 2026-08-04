'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Star, Calendar, Clock, User, Film, ExternalLink, Eye, Play, Pencil, X, Check, Loader2, Share } from 'lucide-react';
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

  // Long overview / plot collapse state
  const [isOverviewExpanded, setIsOverviewExpanded] = useState(false);

  // Client-side random selection.
  // Server sends a relevant pool of up to 12 similar movies; this displays 4 of them randomly.
  const [randomSimilarMovies, setRandomSimilarMovies] = useState<Movie[]>([]);


  const overviewContentRef = useRef<HTMLDivElement | null>(null);
  const [isOverviewOverflowing, setIsOverviewOverflowing] = useState(false);

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
  }

  const [isModalOpen, setIsModalOpen] = useState(false);

  // Trailer inline edit
  const [isTrailerEditOpen, setIsTrailerEditOpen] = useState(false);
  const [trailerInput, setTrailerInput] = useState('');
  const [trailerSaving, setTrailerSaving] = useState(false);
  const [trailerError, setTrailerError] = useState('');

  const handleSaveTrailer = async (inputVal?: string) => {
    setTrailerSaving(true);
    setTrailerError('');
    try {
      let youtubeId = (inputVal !== undefined ? inputVal : trailerInput).trim();
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
      setIsTrailerEditOpen(false);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Hata oluştu.';
      setTrailerError(msg);
      throw new Error(msg);
    } finally {
      setTrailerSaving(false);
    }
  };


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
  });

  // Active season tab for series
  const [activeSeasonTab, setActiveSeasonTab] = useState<number>(() => {
    if (movie.seasons && movie.seasons.length > 0) {
      return movie.seasons[0].seasonNumber;
    }
    return 1;
  });

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

  const openEditModal = (movieToEdit: Movie) => {
    setModalForm({
      title: movieToEdit.title || '',
      originalTitle: movieToEdit.originalTitle || '',
      year: movieToEdit.year || 0,
      type: movieToEdit.type || 'Movie',
      myRating: movieToEdit.myRating || 0,
      watchDate: movieToEdit.watchDate || '',
      listName: Array.isArray(movieToEdit.listName) ? movieToEdit.listName.join(', ') : '',
      poster: movieToEdit.poster || '',
      backdrop: movieToEdit.backdrop || '',
      overview: movieToEdit.overview || '',
      plot: movieToEdit.plot || '',
      plotTr: movieToEdit.plotTr || '',
      country: movieToEdit.country || '',
      omdbType: movieToEdit.omdbType || '',
      boxOffice: movieToEdit.boxOffice || '',
      genres: Array.isArray(movieToEdit.genres) ? movieToEdit.genres.join(', ') : '',
      runtime: movieToEdit.runtime || 0,
      cast: Array.isArray(movieToEdit.cast) ? movieToEdit.cast.join(', ') : '',
      director: movieToEdit.director || '',
      writers: Array.isArray(movieToEdit.writers) ? movieToEdit.writers.join(', ') : '',
      imdbRating: movieToEdit.imdbRating || 0,
      tmdbRating: movieToEdit.tmdbRating || 0,
      releaseDate: movieToEdit.releaseDate || '',
      trailerYoutubeId: movieToEdit.trailerYoutubeId || '',
    });
    setModalError('');
    setIsModalOpen(true);
  };

  const handleSaveModal = async (e: React.FormEvent) => {
    e.preventDefault();

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

      // Accept full YouTube URL or just the ID
      let youtubeId = payload.trailerYoutubeId.trim();
      const ytMatch = youtubeId.match(/(?:v=|youtu\.be\/|embed\/)([A-Za-z0-9_-]{11})/);
      if (ytMatch) youtubeId = ytMatch[1];
      payload.trailerYoutubeId = youtubeId;

      const res = await fetch(`/api/movies/${movie.imdbId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Kaydetme başarısız.');

      setMovie((prev) => ({
        ...prev,
        ...payload,
      }));

      setIsModalOpen(false);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Hata oluştu.';
      setModalError(msg);
    } finally {
      setModalSaving(false);
    }
  };

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://izlediklerim.wolkanca.com';
  const movieUrl = `${baseUrl}/movie/${movie.imdbId}`;

  const whatsappShareUrl = `https://wa.me/?text=${encodeURIComponent(
    `${movie.title} - ${movieUrl}`
  )}`;

  const hasRealPoster = !!movie.poster && !isPlaceholderUrl(movie.poster);


  function formatBoxOffice(value?: string | null) {
    if (!value || value === 'N/A') return null;

    const number = Number(value.replace(/[^0-9]/g, ''));

    if (number >= 1_000_000_000) return `$${(number / 1_000_000_000).toFixed(1)}B`;
    if (number >= 1_000_000) return `$${(number / 1_000_000).toFixed(1)}M`;
    if (number >= 1_000) return `$${(number / 1_000).toFixed(1)}K`;

    return value;
  }

  return (
    <div className="space-y-10 relative">
      {/* Cinematic Backdrop Hero Area */}
      <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-zinc-950/60 min-h-[380px] flex items-end">
        {isAdmin && (
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); openEditModal(movie); }}
            className="z-20 absolute top-1 right-3 bg-gradient-to-r cursor-pointer disabled:opacity-60 duration-300 flex font-bold from-violet-600 gap-2 hover:opacity-95 items-center justify-center px-6 py-1.5 rounded-xl shadow-lg shadow-violet-600/10 text-xs text-white to-indigo-600 transition-all"
            title="Filmi Düzenle"
          >
            <Pencil className="w-3 h-3" /> Düzenle
          </button>
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
              onClick={() => hasRealPoster && setIsPosterModalOpen(true)}
              className={`relative aspect-[2/3] w-60 sm:w-60 md:w-60 overflow-hidden rounded-2xl
      
                bg-zinc-900 border border-white/10 shadow-2xl transition-transform hover:scale-[1.02] duration-300
                 group ${hasRealPoster ? 'cursor-zoom-in' : 'cursor-default'}`}
            >
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
              {/* Zoom hint only when there is a real (non-placeholder) poster */}
              {hasRealPoster && (
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                  <span className="text-white text-xs font-bold bg-black/60 px-3 py-1.5 rounded-full border border-white/10 flex items-center gap-1">
                    <Eye className="w-3.5 h-3.5" /> Büyüt
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Title & Stats */}
          <div className="flex-grow space-y-4 text-left">
            <div className="space-y-1">
              <div className="flex flex-wrap gap-2 mb-1.5">
                <span className="px-2.5 py-0.5 rounded-md text-[10px] font-bold bg-red-500/10 text-red-300 border border-red-500/20 uppercase tracking-wider">
                  {movie.type === 'Movie' ? 'Sinema Filmi' : movie.type}
                </span>
                {Array.from(new Set(movie.listName)).map((list, idx) => (
                  <span key={`${list}-${idx}`} className="px-2.5 py-0.5 rounded-md text-[10px] font-bold bg-rose-500/10 text-rose-300 border border-rose-500/20">
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
              {movie.omdbType && (
                <span className="font-medium text-zinc-400 bg-zinc-900/60 border border-white/5 px-2.5 py-1.5 rounded-lg">
                  Tür: <strong className="text-zinc-300 capitalize">{movie.omdbType}</strong>
                </span>
              )}

              {movie.country && (
                <span className="font-medium text-zinc-400 bg-zinc-900/60 border border-white/5 px-2.5 py-1.5 rounded-lg">
                  Ülke: <strong className="text-zinc-300">{movie.country?.split(",").slice(0, 3).join(", ")}</strong>
                </span>
              )}

              {movie.boxOffice && (
                <span className="font-medium text-zinc-400 bg-zinc-900/60 border border-white/5 px-2.5 py-1.5 rounded-lg">
                  Gişe: <strong className="text-zinc-300">{formatBoxOffice(movie.boxOffice)}</strong>
                </span>
              )}

              {movie.releaseDate && (
                <span className="font-medium text-zinc-400 bg-zinc-900/60 border border-white/5 px-2.5 py-1.5 rounded-lg">
                  Vizyon: <strong className="text-zinc-300">{formatDate(movie.releaseDate)}</strong>
                </span>
              )}
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
            <div className="flex items-center justify-between gap-4">
              <h2 className="text-xl font-extrabold text-zinc-200">
                {movie.type === 'TV Series' || movie.type === 'TV Mini Series' ? 'Dizinin Özeti' : 'Filmin Özeti'}
              </h2>
            </div>

            <div
              ref={overviewContentRef}
              className={`relative overflow-hidden text-sm transition-all duration-300 min-h-[160px]`}
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
                      {Array.from(new Set(movie.writers)).map((w, idx) => (
                        <Link
                          key={`${w}-${idx}`}
                          href={`/writer/${encodeURIComponent(w)}`}
                          className="flex items-center gap-1.5 bg-zinc-900 border border-white/5 hover:border-brand-rose/40 hover:bg-brand-rose/5 text-zinc-200 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
                        >
                          <Pencil className="w-3.5 h-3.5 text-brand-rose" />
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
          <div className="glass bg-gradient-to-br from-zinc-900/60 to-red-950/10 p-6 sm:p-8 rounded-3xl border border-brand-primary/20 space-y-6 mb-8 shadow-[0_10px_35px_rgba(239,68,68,0.1)]">
            <h2 className="text-lg font-black text-white tracking-tight flex items-center gap-2">
              <Eye className="w-5 h-5 text-brand-primary" /> Notlarım
            </h2>

            <div>
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
              rel="noopener noreferrer"
              className="flex h-8 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-brand-primary to-brand-secondary px-5 text-center text-sm font-bold leading-none text-white shadow-[0_10px_25px_rgba(239,68,68,0.3)] transition-opacity hover:opacity-90"
            >
              <Play className="h-4 w-4 fill-white" />
              İzle
            </a>
            <a
              href={whatsappShareUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex h-8 items-center justify-center gap-2 rounded-xl bg-zinc-900/80 px-5 text-center text-sm font-bold leading-none text-zinc-200 shadow-[0_10px_25px_rgba(39,39,42,0.35)] transition-all hover:bg-zinc-800 hover:text-white"
            >
              <Share className="h-4 w-4" />
              Paylaş
            </a>
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
          <h2 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
            <span>🎬</span> Benzer Yapımlar
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-6">
            {randomSimilarMovies.map((sm) => (
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

      {/* Detailed Edit Modal */}
      {isModalOpen && (
        <div
          onClick={() => setIsModalOpen(false)}
          className="fixed inset-0 z-50 flex justify-center bg-black/80 overflow-y-auto animate-fade-in text-left w-full h-full"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="glass w-full rounded-3xl border border-white/10 bg-zinc-950/90 shadow-2xl overflow-hidden flex flex-col"
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-zinc-800 bg-zinc-900/40">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-violet-500/10 rounded-xl text-violet-400 border border-violet-500/20">
                  <Pencil className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-white">Film Bilgilerini Düzenle</h3>
                  <p className="text-zinc-500 text-xs mt-0.5">{movie.title} ({movie.imdbId})</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
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
                      className="w-full bg-zinc-900/60 border border-zinc-800 focus:border-violet-500/50 rounded-xl py-2.5 px-3 text-sm text-white focus:outline-none transition-all bg-zinc-950"
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
                  onClick={() => setIsModalOpen(false)}
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
