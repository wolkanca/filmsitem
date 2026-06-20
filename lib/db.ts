import fs from 'fs';
import path from 'path';
import { Movie } from '@/types';

const DATA_FILE = path.join(process.cwd(), 'data', 'movies.json');

export async function getMovies(): Promise<Movie[]> {
  try {
    if (!fs.existsSync(DATA_FILE)) {
      return [];
    }
    const fileContent = fs.readFileSync(DATA_FILE, 'utf8');
    return JSON.parse(fileContent) as Movie[];
  } catch (error) {
    console.error('getMovies error:', error);
    return [];
  }
}

export async function getMovieById(imdbId: string): Promise<Movie | null> {
  const movies = await getMovies();
  return movies.find((m) => m.imdbId === imdbId) || null;
}

export async function getMoviesByList(listName: string): Promise<Movie[]> {
  const movies = await getMovies();
  return movies.filter((m) => m.listName.includes(listName));
}

export interface Stats {
  totalCount: number;
  averageRating: number;
  totalRuntimeHours: number;
  topGenre: string;
  favoriteDirector: string;
  mostWatchedActor: string;
  genreDistribution: { name: string; count: number }[];
  ratingDistribution: { rating: number; count: number }[];
  yearDistribution: { year: number; count: number }[];
  topDirectors: { name: string; count: number }[];
  topActors: { name: string; count: number }[];

  // New enhanced stats
  typeBreakdown: { type: string; count: number }[];
  decadeDistribution: { decade: string; count: number }[];
  watchYearDistribution: { year: number; count: number }[];
  monthlyWatchDistribution: { month: string; count: number }[];
  imdbRatingDistribution: { rating: number; count: number }[];
  avgImdbRating: number;
  avgMyRating: number;
  ratingComparison: { label: string; imdb: number; my: number }[];
  longestMovies: { title: string; runtime: number; year: number; imdbId: string }[];
  shortestMovies: { title: string; runtime: number; year: number; imdbId: string }[];
  highestRatedByMe: { title: string; myRating: number; imdbRating: number; year: number; imdbId: string }[];
  highestRatedOnImdb: { title: string; myRating: number; imdbRating: number; year: number; imdbId: string }[];
  mostControversial: { title: string; myRating: number; imdbRating: number; diff: number; imdbId: string }[];
  totalMovieCount: number;
  totalTvCount: number;
  totalRatedCount: number;
  totalDaysWatching: number;
  uniqueDirectors: number;
  uniqueActors: number;
  uniqueGenres: number;
  currentYearCount: number;
  currentYearLabel: string;
}

const MONTH_NAMES_TR = [
  'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
  'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'
];

export async function getStats(): Promise<Stats> {
  const movies = await getMovies();
  
  if (movies.length === 0) {
    return {
      totalCount: 0,
      averageRating: 0,
      totalRuntimeHours: 0,
      topGenre: 'N/A',
      favoriteDirector: 'N/A',
      mostWatchedActor: 'N/A',
      genreDistribution: [],
      ratingDistribution: [],
      yearDistribution: [],
      topDirectors: [],
      topActors: [],
      typeBreakdown: [],
      decadeDistribution: [],
      watchYearDistribution: [],
      monthlyWatchDistribution: [],
      imdbRatingDistribution: [],
      avgImdbRating: 0,
      avgMyRating: 0,
      ratingComparison: [],
      longestMovies: [],
      shortestMovies: [],
      highestRatedByMe: [],
      highestRatedOnImdb: [],
      mostControversial: [],
      totalMovieCount: 0,
      totalTvCount: 0,
      totalRatedCount: 0,
      totalDaysWatching: 0,
      uniqueDirectors: 0,
      uniqueActors: 0,
      uniqueGenres: 0,
      currentYearCount: 0,
      currentYearLabel: new Date().getFullYear().toString(),
    };
  }

  const totalCount = movies.length;
  
  // Average rating
  const ratedMovies = movies.filter(m => m.myRating > 0);
  const averageRating = ratedMovies.length > 0 
    ? parseFloat((ratedMovies.reduce((acc, m) => acc + m.myRating, 0) / ratedMovies.length).toFixed(1)) 
    : 0;

  // Total runtime
  const totalRuntimeMinutes = movies.reduce((acc, m) => acc + (m.runtime || 0), 0);
  const totalRuntimeHours = Math.round(totalRuntimeMinutes / 60);

  // Genre distribution
  const genresMap: Record<string, number> = {};
  movies.forEach(m => {
    (m.genres || []).forEach(g => {
      genresMap[g] = (genresMap[g] || 0) + 1;
    });
  });
  const genreDistribution = Object.entries(genresMap)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);

  const topGenre = genreDistribution.length > 0 ? genreDistribution[0].name : 'N/A';

  // Rating distribution (1 to 10)
  const ratingMap: Record<number, number> = {};
  for (let r = 1; r <= 10; r++) ratingMap[r] = 0;
  ratedMovies.forEach(m => {
    ratingMap[m.myRating] = (ratingMap[m.myRating] || 0) + 1;
  });
  const ratingDistribution = Object.entries(ratingMap).map(([rating, count]) => ({
    rating: parseInt(rating, 10),
    count
  }));

  // Year distribution
  const yearMap: Record<number, number> = {};
  movies.forEach(m => {
    if (m.year > 0) {
      yearMap[m.year] = (yearMap[m.year] || 0) + 1;
    }
  });
  const yearDistribution = Object.entries(yearMap)
    .map(([year, count]) => ({ year: parseInt(year, 10), count }))
    .sort((a, b) => a.year - b.year);

  // Top Directors
  const directorsMap: Record<string, number> = {};
  movies.forEach(m => {
    if (m.director) {
      const dirs = m.director.split(',').map(d => d.trim()).filter(d => d.length > 0);
      dirs.forEach(d => {
        directorsMap[d] = (directorsMap[d] || 0) + 1;
      });
    }
  });
  const topDirectors = Object.entries(directorsMap)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  const favoriteDirector = topDirectors.length > 0 ? topDirectors[0].name : 'N/A';

  // Top Actors
  const actorsMap: Record<string, number> = {};
  movies.forEach(m => {
    (m.cast || []).forEach(actor => {
      actorsMap[actor] = (actorsMap[actor] || 0) + 1;
    });
  });
  const topActors = Object.entries(actorsMap)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  const mostWatchedActor = topActors.length > 0 ? topActors[0].name : 'N/A';

  // ====== NEW ENHANCED STATS ======

  // Type breakdown
  const typeMap: Record<string, number> = {};
  movies.forEach(m => {
    const type = m.type || 'Bilinmiyor';
    typeMap[type] = (typeMap[type] || 0) + 1;
  });
  const typeBreakdown = Object.entries(typeMap)
    .map(([type, count]) => ({ type, count }))
    .sort((a, b) => b.count - a.count);

  const totalMovieCount = movies.filter(m => m.type === 'Movie').length;
  const totalTvCount = movies.filter(m =>
    m.type === 'TV Series' || m.type === 'TV Episode' || m.type === 'TV Special' || m.type === 'TV Mini Series'
  ).length;

  // Decade distribution
  const decadeMap: Record<string, number> = {};
  movies.forEach(m => {
    if (m.year > 0) {
      const decade = `${Math.floor(m.year / 10) * 10}`;
      decadeMap[decade] = (decadeMap[decade] || 0) + 1;
    }
  });
  const decadeDistribution = Object.entries(decadeMap)
    .map(([decade, count]) => ({ decade: `${decade}'ler`, count }))
    .sort((a, b) => parseInt(a.decade) - parseInt(b.decade));

  // Watch year distribution (from watchDate)
  const watchYearMap: Record<number, number> = {};
  movies.forEach(m => {
    if (m.watchDate) {
      const watchYear = new Date(m.watchDate).getFullYear();
      if (watchYear > 2000 && watchYear <= new Date().getFullYear()) {
        watchYearMap[watchYear] = (watchYearMap[watchYear] || 0) + 1;
      }
    }
  });
  const watchYearDistribution = Object.entries(watchYearMap)
    .map(([year, count]) => ({ year: parseInt(year, 10), count }))
    .sort((a, b) => a.year - b.year);

  // Monthly watch distribution
  const monthMap: Record<number, number> = {};
  for (let i = 0; i < 12; i++) monthMap[i] = 0;
  movies.forEach(m => {
    if (m.watchDate) {
      const month = new Date(m.watchDate).getMonth();
      monthMap[month] = (monthMap[month] || 0) + 1;
    }
  });
  const monthlyWatchDistribution = Object.entries(monthMap).map(([month, count]) => ({
    month: MONTH_NAMES_TR[parseInt(month, 10)],
    count
  }));

  // IMDb rating distribution (grouped by integer)
  const imdbRatingMap: Record<number, number> = {};
  for (let r = 1; r <= 10; r++) imdbRatingMap[r] = 0;
  movies.forEach(m => {
    if (m.imdbRating > 0) {
      const rounded = Math.round(m.imdbRating);
      imdbRatingMap[rounded] = (imdbRatingMap[rounded] || 0) + 1;
    }
  });
  const imdbRatingDistribution = Object.entries(imdbRatingMap).map(([rating, count]) => ({
    rating: parseInt(rating, 10),
    count
  }));

  // Average IMDb rating
  const imdbRatedMovies = movies.filter(m => m.imdbRating > 0);
  const avgImdbRating = imdbRatedMovies.length > 0
    ? parseFloat((imdbRatedMovies.reduce((acc, m) => acc + m.imdbRating, 0) / imdbRatedMovies.length).toFixed(1))
    : 0;
  const avgMyRating = averageRating;

  // Rating comparison by genre (my rating vs imdb for top genres)
  const ratingComparison = genreDistribution.slice(0, 8).map(genre => {
    const genreMovies = movies.filter(m => m.genres.includes(genre.name));
    const myRated = genreMovies.filter(m => m.myRating > 0);
    const imdbRated = genreMovies.filter(m => m.imdbRating > 0);
    return {
      label: genre.name,
      my: myRated.length > 0
        ? parseFloat((myRated.reduce((acc, m) => acc + m.myRating, 0) / myRated.length).toFixed(1))
        : 0,
      imdb: imdbRated.length > 0
        ? parseFloat((imdbRated.reduce((acc, m) => acc + m.imdbRating, 0) / imdbRated.length).toFixed(1))
        : 0,
    };
  });

  // Longest movies
  const moviesWithRuntime = movies.filter(m => m.runtime > 0 && m.type === 'Movie');
  const longestMovies = [...moviesWithRuntime]
    .sort((a, b) => b.runtime - a.runtime)
    .slice(0, 5)
    .map(m => ({ title: m.title, runtime: m.runtime, year: m.year, imdbId: m.imdbId }));

  const shortestMovies = [...moviesWithRuntime]
    .sort((a, b) => a.runtime - b.runtime)
    .slice(0, 5)
    .map(m => ({ title: m.title, runtime: m.runtime, year: m.year, imdbId: m.imdbId }));

  // Highest rated by me
  const highestRatedByMe = [...ratedMovies]
    .sort((a, b) => b.myRating - a.myRating || b.imdbRating - a.imdbRating)
    .slice(0, 5)
    .map(m => ({ title: m.title, myRating: m.myRating, imdbRating: m.imdbRating, year: m.year, imdbId: m.imdbId }));

  // Highest rated on IMDb
  const highestRatedOnImdb = [...imdbRatedMovies]
    .sort((a, b) => b.imdbRating - a.imdbRating)
    .slice(0, 5)
    .map(m => ({ title: m.title, myRating: m.myRating, imdbRating: m.imdbRating, year: m.year, imdbId: m.imdbId }));

  // Most controversial (biggest difference between my rating and IMDb)
  const bothRated = movies.filter(m => m.myRating > 0 && m.imdbRating > 0);
  const mostControversial = [...bothRated]
    .map(m => ({
      title: m.title,
      myRating: m.myRating,
      imdbRating: m.imdbRating,
      diff: Math.abs(m.myRating - m.imdbRating),
      imdbId: m.imdbId,
    }))
    .sort((a, b) => b.diff - a.diff)
    .slice(0, 5);

  // Counts
  const totalRatedCount = ratedMovies.length;

  // Total days watching
  const totalDaysWatching = parseFloat((totalRuntimeMinutes / (60 * 24)).toFixed(1));

  // Unique directors
  const uniqueDirectors = Object.keys(directorsMap).length;
  const uniqueActors = Object.keys(actorsMap).length;
  const uniqueGenres = Object.keys(genresMap).length;

  // Current year stats
  const currentYear = new Date().getFullYear();
  const currentYearCount = movies.filter(m => {
    if (m.watchDate) {
      return new Date(m.watchDate).getFullYear() === currentYear;
    }
    return false;
  }).length;

  return {
    totalCount,
    averageRating,
    totalRuntimeHours,
    topGenre,
    favoriteDirector,
    mostWatchedActor,
    genreDistribution,
    ratingDistribution,
    yearDistribution,
    topDirectors,
    topActors,
    typeBreakdown,
    decadeDistribution,
    watchYearDistribution,
    monthlyWatchDistribution,
    imdbRatingDistribution,
    avgImdbRating,
    avgMyRating,
    ratingComparison,
    longestMovies,
    shortestMovies,
    highestRatedByMe,
    highestRatedOnImdb,
    mostControversial,
    totalMovieCount,
    totalTvCount,
    totalRatedCount,
    totalDaysWatching,
    uniqueDirectors,
    uniqueActors,
    uniqueGenres,
    currentYearCount,
    currentYearLabel: currentYear.toString(),
  };
}
