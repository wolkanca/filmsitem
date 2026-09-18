import moviesData from '@/data/movies.json';
import { Movie, MovieCardMovie } from '@/types';
import MoviesClient from '@/components/MoviesClient';

/**
 * /movies sayfası — Server Component.
 *
 * movies.json sunucu tarafında okunur; yalnızca MovieCard ve arama
 * için gereken alanlar client'a prop olarak iletilir.
 * Bu sayede ~1.4 MB JSON client bundle'ına dahil olmaz.
 */
export default function MoviesPage() {
  const movies = moviesData as Movie[];

  const clientMovies: MovieCardMovie[] = movies.map((movie) => ({
    imdbId: movie.imdbId,
    title: movie.title,
    originalTitle: movie.originalTitle,
    year: movie.year,
    type: movie.type,
    myRating: movie.myRating,
    imdbRating: movie.imdbRating,
    watchDate: movie.watchDate,
    poster: movie.poster,
    genres: movie.genres,
    director: movie.director,
    trailerYoutubeId: movie.trailerYoutubeId,
    cast: movie.cast,
    writers: movie.writers,
    listName: movie.listName,
  }));

  return <MoviesClient movies={clientMovies} />;
}