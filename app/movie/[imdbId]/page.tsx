import { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getMovies, getMovieById } from '@/lib/db';
import MovieDetailClient from './MovieDetailClient';


interface Props {
  params: Promise<{ imdbId: string }>;
}

// Generate static params for SSG
export async function generateStaticParams() {
  const movies = await getMovies();
  return movies.map((m) => ({
    imdbId: m.imdbId,
  }));
}

// Dynamic SEO Metadata
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { imdbId } = await params;
  const movie = await getMovieById(imdbId);

  if (!movie) {
    return {
      title: 'Film Bulunamadı',
    };
  }

  return {
    title: `${movie.title} (${movie.year})`,
    description: movie.overview || `${movie.title} (${movie.year}) filmine ait detaylar. Konu: ${movie.plotTr || movie.plot}`,
    openGraph: {
      title: `${movie.title} (${movie.year}) - İzlediklerim`,
      description: movie.overview,
      images: movie.poster ? [{ url: movie.poster }] : [],
      type: 'video.movie',
    },
    twitter: {
      card: 'summary_large_image',
      title: `${movie.title} (${movie.year})`,
      description: movie.overview,
      images: movie.poster ? [movie.poster] : [],
    },
    alternates: {
      canonical: `/movie/${movie.imdbId}`,
    },
  };
}

export default async function MovieDetailPage({ params }: Props) {
  const { imdbId } = await params;
  const movie = await getMovieById(imdbId);

  if (!movie) {
    notFound();
  }

  // Load all movies to calculate prev/next indices for keyboard navigation
  const allMovies = await getMovies();
  const currentIndex = allMovies.findIndex((m) => m.imdbId === imdbId);

  // Sorting matches IMDb CSV chronological order
  const prevMovie = currentIndex > 0 ? allMovies[currentIndex - 1] : null;
  const nextMovie = currentIndex < allMovies.length - 1 ? allMovies[currentIndex + 1] : null;

  // Find similar movies with a weighted, period-aware scoring system.
  // The client receives a relevant pool and randomly displays 4 of them.
  const normalize = (value?: string | null) => value?.trim().toLowerCase() || '';

  const splitNames = (value?: string | null) =>
    new Set(
      (value || '')
        .split(',')
        .map((item) => normalize(item))
        .filter(Boolean)
    );

  const getYearDiff = (candidateYear?: number | string) => {
    if (!movie.year || !candidateYear) return 0;
    return Math.abs(Number(movie.year) - Number(candidateYear));
  };

  const currentGenres = new Set((movie.genres || []).map((genre) => normalize(genre)));
  const currentDirectors = splitNames(movie.director);
  const currentWriters = new Set((movie.writers || []).map((writer) => normalize(writer)));
  const currentCast = new Set((movie.cast || []).map((actor) => normalize(actor)));
  const currentCountry = normalize(movie.country);
  const currentType = normalize(movie.type);
  const currentOmdbType = normalize(movie.omdbType);

  const scoredSimilarMovies = allMovies
    .filter((candidate) => candidate.imdbId !== imdbId)
    .map((candidate) => {
      let score = 0;

      const candidateGenres = new Set((candidate.genres || []).map((genre) => normalize(genre)));
      const sharedGenres = [...candidateGenres].filter((genre) => currentGenres.has(genre));

      if (sharedGenres.length > 0) {
        score += sharedGenres.length * 20;
      }

      if (currentType && normalize(candidate.type) === currentType) {
        score += 10;
      }

      if (currentOmdbType && normalize(candidate.omdbType) === currentOmdbType) {
        score += 8;
      }

      const candidateDirectors = splitNames(candidate.director);
      const sharedDirectors = [...candidateDirectors].filter((director) => currentDirectors.has(director));
      score += sharedDirectors.length * 45;

      const candidateWriters = new Set((candidate.writers || []).map((writer) => normalize(writer)));
      const sharedWriters = [...candidateWriters].filter((writer) => currentWriters.has(writer));
      score += sharedWriters.length * 18;

      const candidateCast = new Set((candidate.cast || []).map((actor) => normalize(actor)));
      const sharedCast = [...candidateCast].filter((actor) => currentCast.has(actor));
      score += sharedCast.length * 8;

      if (currentCountry && normalize(candidate.country) === currentCountry) {
        score += 6;
      }

      const yearDiff = getYearDiff(candidate.year);

      if (yearDiff <= 3) score += 25;
      else if (yearDiff <= 7) score += 16;
      else if (yearDiff <= 15) score += 8;
      else if (yearDiff <= 25) score -= 8;
      else if (yearDiff <= 40) score -= 35;
      else score -= 70;

      if (movie.myRating > 0 && candidate.myRating > 0) {
        const ratingDiff = Math.abs(movie.myRating - candidate.myRating);
        if (ratingDiff <= 1) score += 8;
        else if (ratingDiff <= 2) score += 4;
      }

      if (movie.imdbRating > 0 && candidate.imdbRating > 0) {
        const imdbDiff = Math.abs(movie.imdbRating - candidate.imdbRating);
        if (imdbDiff <= 0.5) score += 5;
        else if (imdbDiff <= 1) score += 2;
      }

      return {
        movie: candidate,
        score,
        yearDiff,
      };
    })
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score);

  // Prefer the same era. If there are enough close-period matches, avoid old classics dominating.
  const closePeriodItems = scoredSimilarMovies.filter((item) => item.yearDiff <= 25);
  const baseSimilarItems =
    closePeriodItems.length >= 12
      ? closePeriodItems
      : [...closePeriodItems, ...scoredSimilarMovies.filter((item) => item.yearDiff > 25)];

  // Keep the pool diverse: maximum 1 movie per exact director string where possible.
  const diverseSimilarMovies = [];
  const directorCounts = new Map<string, number>();

  for (const item of baseSimilarItems) {
    const directorKey = normalize(item.movie.director) || 'unknown';
    const currentCount = directorCounts.get(directorKey) || 0;

    if (currentCount >= 1) continue;

    diverseSimilarMovies.push(item.movie);
    directorCounts.set(directorKey, currentCount + 1);

    if (diverseSimilarMovies.length === 12) break;
  }

  const diverseMovieIds = new Set(diverseSimilarMovies.map((candidate) => candidate.imdbId));
  const backupSimilarMovies = baseSimilarItems
    .map((item) => item.movie)
    .filter((candidate) => !diverseMovieIds.has(candidate.imdbId));

  const similarMovies = [...diverseSimilarMovies, ...backupSimilarMovies].slice(0, 12);

  // JSON-LD Movie Schema Markup
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Movie',
    'name': movie.title,
    'image': movie.poster,
    'dateCreated': movie.year.toString(),
    'director': movie.director ? {
      '@type': 'Person',
      'name': movie.director
    } : undefined,
    'description': movie.overview,
    'aggregateRating': {
      '@type': 'AggregateRating',
      'ratingValue': movie.imdbRating.toString(),
      'bestRating': '10',
      'worstRating': '1',
      'ratingCount': '1000' // Mock count
    }
  };

  return (
    <>
      {/* Inject JSON-LD Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <MovieDetailClient
        movie={movie}
        prevImdbId={prevMovie?.imdbId || null}
        nextImdbId={nextMovie?.imdbId || null}
        similarMovies={similarMovies}
      />
    </>
  );
}
