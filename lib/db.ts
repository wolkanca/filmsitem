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
}

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
      topActors: []
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
    topActors
  };
}
