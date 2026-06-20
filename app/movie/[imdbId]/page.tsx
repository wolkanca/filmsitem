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
    description: movie.overview || `${movie.title} (${movie.year}) filmine ait detaylar, kişisel puanlarım ve izleme notlarım.`,
    openGraph: {
      title: `${movie.title} (${movie.year}) | Film Günlüğüm`,
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

  // Find similar movies (matching genres or director)
  const similarMovies = allMovies
    .filter((m) => m.imdbId !== imdbId)
    .map((m) => {
      let score = 0;
      // Genre intersection
      m.genres.forEach((g) => {
        if (movie.genres.includes(g)) score += 2;
      });
      // Director match
      if (m.director && movie.director && m.director.toLowerCase() === movie.director.toLowerCase()) {
        score += 5;
      }
      return { movie: m, score };
    })
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 5)
    .map((x) => x.movie);

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
