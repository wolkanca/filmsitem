import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getMovies, getMovieById } from '@/lib/db';
import MovieDetailClient from './MovieDetailClient';

export const revalidate = 604800; // 7 gün (saniye)

interface Props {
  params: Promise<{ imdbId: string }>;
}

// Generate static params for SSG
export async function generateStaticParams() {
  const movies = await getMovies();

  return movies.map((movie) => ({
    imdbId: movie.imdbId,
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

  const moviePlot = movie.plotTr || movie.plot || '';

  const metaDescription =
    [
      movie.overview,
      moviePlot ? `${moviePlot}` : '',
    ]
      .filter(Boolean)
      .join(' ')
      .slice(0, 250)
      .trimEnd() + '...';

  return {
    title: `${movie.originalTitle &&
      movie.originalTitle.trim().toLowerCase() !== movie.title?.trim().toLowerCase()
      ? `${movie.originalTitle} - ${movie.title}`
      : movie.title} (${movie.year})`,
    description: metaDescription,

    openGraph: {
      title: `${movie.originalTitle &&
        movie.originalTitle.trim().toLowerCase() !== movie.title?.trim().toLowerCase()
        ? `${movie.originalTitle} - ${movie.title}`
        : movie.title} (${movie.year})`,
      description: metaDescription,
      images: movie.poster ? [{ url: movie.poster }] : [],
      type: 'video.movie',
    },

    twitter: {
      card: 'summary_large_image',
      title: `${movie.originalTitle &&
        movie.originalTitle.trim().toLowerCase() !== movie.title?.trim().toLowerCase()
        ? `${movie.originalTitle} - ${movie.title}`
        : movie.title} (${movie.year})`,
      description: metaDescription,
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

  // Klavye ile önceki / sonraki film geçişi için tüm filmleri yükle
  const allMovies = await getMovies();

  const currentIndex = allMovies.findIndex(
    (candidate) => candidate.imdbId === imdbId
  );

  // Sıralama IMDb CSV kronolojik sıralamasıyla eşleşir
  const prevMovie =
    currentIndex > 0
      ? allMovies[currentIndex - 1]
      : null;

  const nextMovie =
    currentIndex >= 0 && currentIndex < allMovies.length - 1
      ? allMovies[currentIndex + 1]
      : null;

  /*
   * Benzer filmleri ağırlıklı ve dönem duyarlı bir puanlama sistemiyle bul.
   * İstemci bu 12 filmlik havuzdan rastgele 4 tanesini gösterir.
   */
  const normalize = (value?: string | null) =>
    value?.trim().toLowerCase() || '';

  const splitNames = (value?: string | null) =>
    new Set(
      (value || '')
        .split(',')
        .map((item) => normalize(item))
        .filter(Boolean)
    );

  const getYearDiff = (candidateYear?: number | string) => {
    if (!movie.year || !candidateYear) {
      return 0;
    }

    return Math.abs(
      Number(movie.year) - Number(candidateYear)
    );
  };

  const currentGenres = new Set(
    (movie.genres || []).map((genre) => normalize(genre))
  );

  const currentDirectors = splitNames(movie.director);

  const currentWriters = new Set(
    (movie.writers || []).map((writer) => normalize(writer))
  );

  const currentCast = new Set(
    (movie.cast || []).map((actor) => normalize(actor))
  );

  const currentCountry = normalize(movie.country);
  const currentType = normalize(movie.type);
  const currentOmdbType = normalize(movie.omdbType);

  const scoredSimilarMovies = allMovies
    .filter((candidate) => {
      // Filmin kendisini benzerlerde gösterme
      if (candidate.imdbId === imdbId) {
        return false;
      }

      /*
       * Mevcut film bir seriye aitse aynı seride bulunan
       * diğer filmleri benzer yapımların dışında bırak.
       *
       * Örnek:
       * The Fellowship of the Ring sayfasında
       * The Two Towers ve The Return of the King
       * benzer yapımlarda gösterilmez.
       */
      if (
        movie.franchiseId &&
        candidate.franchiseId === movie.franchiseId
      ) {
        return false;
      }

      return true;
    })
    .map((candidate) => {
      let score = 0;

      const candidateGenres = new Set(
        (candidate.genres || []).map((genre) =>
          normalize(genre)
        )
      );

      const sharedGenres = [...candidateGenres].filter(
        (genre) => currentGenres.has(genre)
      );

      if (sharedGenres.length > 0) {
        score += sharedGenres.length * 20;
      }

      if (
        currentType &&
        normalize(candidate.type) === currentType
      ) {
        score += 10;
      }

      if (
        currentOmdbType &&
        normalize(candidate.omdbType) === currentOmdbType
      ) {
        score += 8;
      }

      const candidateDirectors = splitNames(
        candidate.director
      );

      const sharedDirectors = [...candidateDirectors].filter(
        (director) => currentDirectors.has(director)
      );

      score += sharedDirectors.length * 45;

      const candidateWriters = new Set(
        (candidate.writers || []).map((writer) =>
          normalize(writer)
        )
      );

      const sharedWriters = [...candidateWriters].filter(
        (writer) => currentWriters.has(writer)
      );

      score += sharedWriters.length * 18;

      const candidateCast = new Set(
        (candidate.cast || []).map((actor) =>
          normalize(actor)
        )
      );

      const sharedCast = [...candidateCast].filter(
        (actor) => currentCast.has(actor)
      );

      score += sharedCast.length * 8;

      if (
        currentCountry &&
        normalize(candidate.country) === currentCountry
      ) {
        score += 6;
      }

      const yearDiff = getYearDiff(candidate.year);

      if (yearDiff <= 3) {
        score += 25;
      } else if (yearDiff <= 7) {
        score += 16;
      } else if (yearDiff <= 15) {
        score += 8;
      } else if (yearDiff <= 25) {
        score -= 8;
      } else if (yearDiff <= 40) {
        score -= 35;
      } else {
        score -= 70;
      }

      if (
        movie.myRating > 0 &&
        candidate.myRating > 0
      ) {
        const ratingDiff = Math.abs(
          movie.myRating - candidate.myRating
        );

        if (ratingDiff <= 1) {
          score += 8;
        } else if (ratingDiff <= 2) {
          score += 4;
        }
      }

      if (
        movie.imdbRating > 0 &&
        candidate.imdbRating > 0
      ) {
        const imdbDiff = Math.abs(
          movie.imdbRating - candidate.imdbRating
        );

        if (imdbDiff <= 0.5) {
          score += 5;
        } else if (imdbDiff <= 1) {
          score += 2;
        }
      }

      return {
        movie: candidate,
        score,
        yearDiff,
      };
    })
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score);

  /*
   * Yakın dönem filmlerine öncelik ver.
   * Yeterli yakın dönem eşleşmesi varsa eski klasiklerin
   * benzer yapımlara hakim olmasını önle.
   */
  const closePeriodItems = scoredSimilarMovies.filter(
    (item) => item.yearDiff <= 25
  );

  const baseSimilarItems =
    closePeriodItems.length >= 12
      ? closePeriodItems
      : [
        ...closePeriodItems,
        ...scoredSimilarMovies.filter(
          (item) => item.yearDiff > 25
        ),
      ];

  /*
   * Havuzu çeşitlendir:
   * Mümkün olduğu sürece aynı yönetmenden en fazla
   * bir film ilk 12 aday içine girsin.
   */
  const diverseSimilarMovies: typeof allMovies = [];
  const directorCounts = new Map<string, number>();

  for (const item of baseSimilarItems) {
    const directorKey =
      normalize(item.movie.director) || 'unknown';

    const currentCount =
      directorCounts.get(directorKey) || 0;

    if (currentCount >= 1) {
      continue;
    }

    diverseSimilarMovies.push(item.movie);

    directorCounts.set(
      directorKey,
      currentCount + 1
    );

    if (diverseSimilarMovies.length === 12) {
      break;
    }
  }

  const diverseMovieIds = new Set(
    diverseSimilarMovies.map(
      (candidate) => candidate.imdbId
    )
  );

  const backupSimilarMovies = baseSimilarItems
    .map((item) => item.movie)
    .filter(
      (candidate) =>
        !diverseMovieIds.has(candidate.imdbId)
    );

  const similarMovies = [
    ...diverseSimilarMovies,
    ...backupSimilarMovies,
  ].slice(0, 12);

  /*
   * Aynı franchiseId değerine sahip filmleri bul.
   * Seri sırasına göre, sıra yoksa yapım yılına göre sırala.
   */
  const franchiseMovies = movie.franchiseId
    ? allMovies
      .filter(
        (candidate) =>
          candidate.franchiseId === movie.franchiseId
      )
      .sort((a, b) => {
        const orderA = a.franchiseOrder ?? 999;
        const orderB = b.franchiseOrder ?? 999;

        if (orderA !== orderB) {
          return orderA - orderB;
        }

        const dateA = a.releaseDate
          ? new Date(a.releaseDate).getTime()
          : Number(a.year || 0) * 10000;

        const dateB = b.releaseDate
          ? new Date(b.releaseDate).getTime()
          : Number(b.year || 0) * 10000;

        return dateA - dateB;
      })
    : [];

  // JSON-LD Movie Schema Markup
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Movie',
    name: movie.title,
    image: movie.poster,
    dateCreated: movie.year.toString(),

    director: movie.director
      ? {
        '@type': 'Person',
        name: movie.director,
      }
      : undefined,

    description: movie.overview,

    aggregateRating: movie.imdbRating
      ? {
        '@type': 'AggregateRating',
        ratingValue: movie.imdbRating.toString(),
        bestRating: '10',
        worstRating: '1',
        ratingCount: '1000',
      }
      : undefined,
  };

  return (
    <>
      {/* JSON-LD Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(jsonLd),
        }}
      />

      <MovieDetailClient
        movie={movie}
        prevImdbId={prevMovie?.imdbId || null}
        nextImdbId={nextMovie?.imdbId || null}
        similarMovies={similarMovies}
        franchiseMovies={franchiseMovies}
      />
    </>
  );
}