import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getMovies } from '@/lib/db';
import { slugify } from '@/lib/utils';
import Link from 'next/link';
import { ArrowLeft, List } from 'lucide-react';
import ListDetailTabs from '@/components/ListDetailTabs';

export const revalidate = 604800; // 7 gün (saniye)

interface Props {
  params: Promise<{ slug: string }>;
}

type MovieItem = Awaited<ReturnType<typeof getMovies>>[number];

type SmartCollection = {
  name: string;
  description: string;
  filter: (movie: MovieItem) => boolean;
};

function normalizeText(value: unknown) {
  return String(value || '')
    .toLocaleLowerCase('tr-TR')
    .trim();
}

function includesAny(value: unknown, words: string[]) {
  const normalized = normalizeText(value);
  return words.some((word) => normalized.includes(normalizeText(word)));
}

function getMovieCountry(movie: MovieItem) {
  return normalizeText((movie as any).country);
}

function getMovieGenres(movie: MovieItem) {
  return Array.isArray((movie as any).genres)
    ? ((movie as any).genres as string[])
    : [];
}

function getMovieType(movie: MovieItem) {
  return normalizeText((movie as any).type || (movie as any).omdbType);
}

function getMovieRuntime(movie: MovieItem) {
  const runtime = Number((movie as any).runtime || 0);
  return Number.isFinite(runtime) ? runtime : 0;
}

function getMovieYear(movie: MovieItem) {
  const year = Number((movie as any).year || 0);
  return Number.isFinite(year) ? year : 0;
}

function hasGenre(movie: MovieItem, genres: string[]) {
  return getMovieGenres(movie).some((genre) => includesAny(genre, genres));
}

function getSmartCollections(): SmartCollection[] {
  return [
    {
      name: 'Video Game',
      description: 'IMDb türü veya kayıt tipi Video Game olan oyun odaklı yapımlar.',
      filter: (movie) => getMovieType(movie).includes('video game'),
    },
    {
      name: 'TV Mini Series',
      description: 'Kısa sezonlu, mini dizi formatındaki seçili yapımlar.',
      filter: (movie) => getMovieType(movie).includes('tv mini series'),
    },
    {
      name: 'TV Series',
      description: 'Dizi formatındaki tüm izlediğim yapımlar.',
      filter: (movie) =>
        getMovieType(movie).includes('tv series') ||
        getMovieType(movie) === 'series',
    },
    {
      name: 'Türk Filmleri',
      description: 'Türkiye yapımı veya ülke bilgisi Türkiye/Turkey olan yerli yapımlar.',
      filter: (movie) => includesAny(getMovieCountry(movie), ['türkiye', 'turkey']),
    },
    {
      name: 'Animasyon',
      description: 'Animasyon türündeki film ve dizilerden oluşan renkli arşiv.',
      filter: (movie) => hasGenre(movie, ['animation']),
    },
    {
      name: 'Belgeseller',
      description: 'Documentary türündeki belgesel film, dizi ve özel yapımlar.',
      filter: (movie) => hasGenre(movie, ['documentary']),
    },
    {
      name: 'Korku ve Gerilim',
      description: 'Horror ve Thriller türlerini barındıran karanlık atmosferli yapımlar.',
      filter: (movie) => hasGenre(movie, ['horror', 'thriller']),
    },
    {
      name: 'Aksiyon',
      description: 'Aksiyon türündeki tempolu, yüksek enerjili yapımlar.',
      filter: (movie) => hasGenre(movie, ['action']),
    },
    {
      name: '2020 Sonrası',
      description: '2020 ve sonrası çıkan yeni dönem yapımlar.',
      filter: (movie) => getMovieYear(movie) >= 2020,
    },
    {
      name: '90lar',
      description: '1990-1999 yılları arasında çıkan nostaljik yapımlar.',
      filter: (movie) => {
        const year = getMovieYear(movie);
        return year >= 1990 && year <= 1999;
      },
    },
    {
      name: '80ler',
      description: '1980-1989 yılları arasında çıkan dönem yapımları.',
      filter: (movie) => {
        const year = getMovieYear(movie);
        return year >= 1980 && year <= 1989;
      },
    },
    {
      name: 'Kısa Yapımlar',
      description: 'Süresi 60 dakika ve altında olan kısa film, özel bölüm veya kısa içerikler.',
      filter: (movie) => {
        const runtime = getMovieRuntime(movie);
        return runtime > 0 && runtime <= 60;
      },
    },
  ];
}

function getManualListNames(movies: MovieItem[]) {
  const listNames = new Set<string>();

  movies.forEach((movie) => {
    ((movie as any).listName || []).forEach((listName: string) => {
      listNames.add(listName);
    });
  });

  return Array.from(listNames);
}

function resolveCollection(slug: string, movies: MovieItem[]) {
  const manualListName = getManualListNames(movies).find(
    (listName) => slugify(listName) === slug
  );

  if (manualListName) {
    return {
      name: manualListName,
      description: `"${manualListName}" koleksiyonunda bulunan filmler, diziler, kişisel yorumlarım ve puanlarım.`,
      movies: movies.filter((movie) =>
        ((movie as any).listName || []).includes(manualListName)
      ),
    };
  }

  const smartCollection = getSmartCollections().find(
    (collection) => slugify(collection.name) === slug
  );

  if (smartCollection) {
    return {
      name: smartCollection.name,
      description: smartCollection.description,
      movies: movies.filter(smartCollection.filter),
    };
  }

  return null;
}

export async function generateStaticParams() {
  const movies = await getMovies();

  const manualParams = getManualListNames(movies).map((listName) => ({
    slug: slugify(listName),
  }));

  const smartParams = getSmartCollections().map((collection) => ({
    slug: slugify(collection.name),
  }));

  return [...manualParams, ...smartParams];
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const movies = await getMovies();

  const collection = resolveCollection(slug, movies);

  if (!collection || collection.movies.length === 0) {
    return {
      title: 'Liste Bulunamadı',
    };
  }

  return {
    title: `${collection.name} Koleksiyonu`,
    description: collection.description,
  };
}

export default async function ListDetailPage({ params }: Props) {
  const { slug } = await params;
  const movies = await getMovies();

  const collection = resolveCollection(slug, movies);

  if (!collection || collection.movies.length === 0) {
    notFound();
  }

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="space-y-4">
        <Link
          href="/lists"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-zinc-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Koleksiyonlara Dön
        </Link>


        <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-zinc-950 via-zinc-950 to-red-950/20 p-6 sm:p-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div>
              <div className="flex items-center gap-3 text-brand-primary">
                <List className="w-7 h-7" />
                <span className="text-xs font-extrabold uppercase tracking-[0.22em]">
                  Koleksiyon Arşivi
                </span>
              </div>

              <h1 className="text-3xl sm:text-4xl font-black text-white mt-2">
                {collection.name}
              </h1>

              <p className="text-zinc-500 text-sm mt-2">
                Bu koleksiyonda toplam {collection.movies.length} yapım izlediniz.
              </p>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-xl border border-white/10 bg-black/20 px-5 py-4 text-center min-w-[105px]">
                <div className="text-[10px] font-black uppercase tracking-wider text-zinc-500">
                  Yapım Sayısı
                </div>
                <div className="mt-2 text-2xl font-black text-white">
                  {collection.movies.length}
                </div>
              </div>

              <div className="rounded-xl border border-white/10 bg-black/20 px-5 py-4 text-center min-w-[105px]">
                <div className="text-[10px] font-black uppercase tracking-wider text-zinc-500">
                  Ortalama Puan
                </div>
                <div className="mt-2 text-2xl font-black text-brand-accent">
                  ★{' '}
                  {(
                    collection.movies
                      .filter((m) => m.myRating > 0)
                      .reduce((acc, m) => acc + m.myRating, 0) /
                    Math.max(collection.movies.filter((m) => m.myRating > 0).length, 1)
                  ).toFixed(1)}
                </div>
              </div>

              <div className="rounded-xl border border-white/10 bg-black/20 px-5 py-4 text-center min-w-[105px]">
                <div className="text-[10px] font-black uppercase tracking-wider text-zinc-500">
                  Toplam Süre
                </div>
                <div className="mt-2 text-2xl font-black text-zinc-200">
                  {Math.round(
                    collection.movies.reduce((acc, m) => acc + (m.runtime || 0), 0) / 60
                  )}{' '}
                  sa
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>

      <ListDetailTabs movies={collection.movies} />
    </div>
  );
}