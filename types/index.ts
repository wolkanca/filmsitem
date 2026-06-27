export interface Episode {
  imdbId: string;
  title: string;
  episodeNumber: number;
  seasonNumber: number;
  myRating: number;
  watchDate: string;
  runtime: number;
  imdbRating: number;
  overview?: string;
}

export interface Season {
  seasonNumber: number;
  episodes: Episode[];
}

export interface Movie {
  imdbId: string;
  title: string;
  originalTitle: string;
  year: number;
  type: string; // Movie, TV Series, TV Episode, TV Special, TV Mini Series

  myRating: number;
  watchDate: string;
  listName: string[];

  poster: string;
  backdrop: string;

  overview: string;

  genres: string[];

  runtime: number;

  cast: string[];

  director: string;

  writers: string[];

  imdbRating: number;
  tmdbRating: number;
  releaseDate?: string;
  trailerYoutubeId?: string;
  seasons?: Season[];
}
