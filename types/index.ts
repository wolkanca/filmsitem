/** MovieCard bileşeni ve /movies arama için gereken minimum film alanları. */
export interface MovieCardMovie {
  imdbId: string;
  title: string;
  originalTitle: string;
  year: number;
  type: string;
  myRating: number;
  imdbRating: number;
  watchDate: string;
  poster: string;
  genres: string[];
  director: string;
  trailerYoutubeId?: string;
  cast: string[];
  writers: string[];
  listName: string[];
}

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

  overview: string;
  plot: string;
  plotTr?: string;
  country: string;
  omdbType: string;
  boxOffice: string;

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

  // Film serisi bilgileri
  franchiseId?: string;
  franchiseName?: string;
  franchiseOrder?: number;

  // Slider'da öne çıkarılan film mi?
  isFeatured?: boolean;
}

