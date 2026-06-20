'use client';

import Link from 'next/link';
import { Star, Calendar, Clock } from 'lucide-react';
import { Movie } from '@/types';
import { getRatingColor } from '@/lib/utils';
import PosterImage from '@/components/PosterImage';

interface MovieListRowProps {
  movie: Movie;
}

export default function MovieListRow({ movie }: MovieListRowProps) {
  const ratingColor = getRatingColor(movie.myRating);

  return (
    // Outer container is a div — no nested <a> issues
    <div className="glass-card p-4 rounded-xl flex gap-4 items-center border border-white/5 hover:border-brand-primary/20 transition-all duration-300 group">
      {/* Small poster thumbnail — links to movie */}
      <Link
        href={`/movie/${movie.imdbId}`}
        className="relative w-16 h-24 flex-shrink-0 bg-zinc-900 rounded-lg overflow-hidden border border-zinc-800"
      >
        <PosterImage
          src={movie.poster}
          alt={movie.title}
          fill
          sizes="64px"
          className="object-cover group-hover:scale-105 transition-transform duration-300"
          fallbackTitle={movie.title}
          trailerYoutubeId={movie.trailerYoutubeId}
          disableYoutubeClick
        />
      </Link>

      {/* Movie Details */}
      <div className="flex-grow min-w-0">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
          {/* Title links to movie detail */}
          <Link
            href={`/movie/${movie.imdbId}`}
            className="text-base font-bold text-zinc-100 hover:text-brand-primary transition-colors truncate"
          >
            {movie.title}
            {movie.originalTitle && movie.originalTitle !== movie.title && (
              <span className="text-zinc-500 font-normal text-xs ml-2">({movie.originalTitle})</span>
            )}
          </Link>

          <div className="flex items-center gap-3 flex-shrink-0">
            {/* My Rating */}
            {movie.myRating > 0 && (
              <div className="flex items-center gap-1 bg-black/40 px-2 py-0.5 rounded border border-white/5">
                <Star className="w-3.5 h-3.5 text-brand-accent fill-brand-accent" />
                <span className={`text-xs font-black ${ratingColor}`}>{movie.myRating}</span>
              </div>
            )}
            {/* IMDb Rating */}
            {movie.imdbRating > 0 && (
              <div className="text-[10px] text-zinc-500 bg-zinc-950/40 px-1.5 py-0.5 rounded border border-white/5">
                IMDb {movie.imdbRating}
              </div>
            )}
          </div>
        </div>

        {/* Metadata: Year (link), Runtime, Director (links) */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-zinc-400 mt-1">
          <Link
            href={`/year/${movie.year}`}
            className="flex items-center gap-1 hover:text-brand-primary transition-colors"
          >
            <Calendar className="w-3.5 h-3.5 text-zinc-500" />
            {movie.year}
          </Link>
          {movie.runtime > 0 && (
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-zinc-500" />
              {movie.runtime} dk
            </span>
          )}
          {movie.director && (
            <span className="truncate">
              Yönetmen:{' '}
              {movie.director.split(',').map((d, i) => (
                <span key={d}>
                  <Link
                    href={`/director/${encodeURIComponent(d.trim())}`}
                    className="text-zinc-300 font-medium hover:text-brand-primary transition-colors"
                  >
                    {d.trim()}
                  </Link>
                  {i < movie.director!.split(',').length - 1 && ', '}
                </span>
              ))}
            </span>
          )}
        </div>

        {/* Genre and list tags */}
        <div className="flex flex-wrap items-center gap-1.5 mt-2.5">
          {movie.genres.map((g) => (
            <Link
              key={g}
              href={`/genre/${encodeURIComponent(g)}`}
              className="text-[10px] bg-zinc-800 hover:bg-brand-primary/20 hover:border-brand-primary/30 border border-transparent px-2 py-0.5 rounded-md text-zinc-300 transition-colors"
            >
              {g}
            </Link>
          ))}
          {movie.listName.slice(0, 2).map((l) => (
            <span key={l} className="text-[10px] bg-red-950/40 text-red-300 border border-red-900/30 px-2 py-0.5 rounded-md">
              {l}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
