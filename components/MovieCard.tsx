import Link from 'next/link';
import { Star, Calendar } from 'lucide-react';
import { Movie } from '@/types';
import { getRatingColor } from '@/lib/utils';
import PosterImage from '@/components/PosterImage';

interface MovieCardProps {
  movie: Movie;
}

export default function MovieCard({ movie }: MovieCardProps) {
  const ratingColor = getRatingColor(movie.myRating);

  return (
    <Link href={`/movie/${movie.imdbId}`} className="group block relative">
      <div className="relative aspect-[2/3] w-full overflow-hidden rounded-xl bg-zinc-900 border border-card-border transition-all duration-500 group-hover:scale-105 group-hover:border-brand-primary/40 group-hover:shadow-[0_15px_30px_-10px_rgba(239,68,68,0.3)]">
        
        {/* Poster Image */}
        <PosterImage
          src={movie.poster}
          alt={movie.title}
          fill
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 20vw"
          className="object-cover transition-transform duration-500 group-hover:scale-110"
          priority={movie.myRating >= 9}
          fallbackTitle={movie.title}
          trailerYoutubeId={movie.trailerYoutubeId}
          disableYoutubeClick
        />

        {/* Hover Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-4">
          <h3 className="text-base font-bold text-white leading-tight mb-1 truncate">{movie.title}</h3>
          
          <div className="flex items-center justify-between text-xs text-zinc-300 mb-2">
            <span className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-zinc-400" />
              {movie.year}
            </span>
            <span className="text-zinc-400 truncate max-w-[65%]">{movie.director}</span>
          </div>

          {/* Genre tags as plain spans — no nested <a> inside <a> */}
          <div className="flex flex-wrap gap-1 mt-1">
            {movie.genres.slice(0, 2).map((g) => (
              <span
                key={g}
                className="text-[10px] bg-zinc-800/80 px-2 py-0.5 rounded border border-zinc-700/50 text-zinc-300"
              >
                {g}
              </span>
            ))}
          </div>
        </div>

        {/* My Rating Badge */}
        {movie.myRating > 0 && (
          <div className="absolute top-3 left-3 bg-black/70 backdrop-blur-md px-2 py-1 rounded-lg border border-white/10 flex items-center gap-1 shadow-md">
            <Star className="w-3.5 h-3.5 text-brand-accent fill-brand-accent" />
            <span className={`text-xs font-black ${ratingColor}`}>{movie.myRating}</span>
          </div>
        )}

        {/* IMDb Rating Badge */}
        {movie.imdbRating > 0 && (
          <div className="absolute top-3 right-3 bg-zinc-950/70 backdrop-blur-md px-1.5 py-0.5 rounded border border-white/5 text-[10px] text-zinc-400">
            IMDb {movie.imdbRating}
          </div>
        )}
      </div>

      {/* Title & Info below card */}
      <div className="mt-2.5 px-1 block group-hover:text-brand-primary transition-colors">
        <h4 className="text-sm font-semibold text-zinc-200 truncate leading-snug group-hover:text-brand-primary transition-colors">
          {movie.title}
        </h4>
        <div className="flex items-center gap-2 text-xs text-zinc-500 mt-0.5">
          <span>{movie.year}</span>
          <span>•</span>
          <span className="truncate">{movie.genres[0]}</span>
        </div>
      </div>
    </Link>
  );
}
