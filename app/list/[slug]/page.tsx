import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getMovies } from '@/lib/db';
import { slugify } from '@/lib/utils';
import MovieCard from '@/components/MovieCard';
import Link from 'next/link';
import { ArrowLeft, List } from 'lucide-react';

interface Props {
  params: Promise<{ slug: string }>;
}

// Generate static routes for lists
export async function generateStaticParams() {
  const movies = await getMovies();
  const listNames = new Set<string>();
  movies.forEach((m) => {
    (m.listName || []).forEach((ln) => listNames.add(ln));
  });

  return Array.from(listNames).map((ln) => ({
    slug: slugify(ln),
  }));
}

// Dynamic SEO metadata
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const movies = await getMovies();
  
  // Resolve list name from slug
  let listName = '';
  movies.forEach((m) => {
    (m.listName || []).forEach((ln) => {
      if (slugify(ln) === slug) {
        listName = ln;
      }
    });
  });

  if (!listName) {
    return {
      title: 'Liste Bulunamadı',
    };
  }

  return {
    title: `${listName} Koleksiyonu`,
    description: `"${listName}" koleksiyonunda bulunan filmler, diziler, kişisel yorumlarım ve puanlarım.`,
  };
}

export default async function ListDetailPage({ params }: Props) {
  const { slug } = await params;
  const movies = await getMovies();

  // Find original list name
  let listName = '';
  movies.forEach((m) => {
    (m.listName || []).forEach((ln) => {
      if (slugify(ln) === slug) {
        listName = ln;
      }
    });
  });

  if (!listName) {
    notFound();
  }

  // Filter movies that belong to this list
  const listMovies = movies.filter((m) => m.listName.includes(listName));

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Navigation and header */}
      <div className="space-y-4">
        <Link
          href="/lists"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-zinc-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Koleksiyonlara Dön
        </Link>

        <div className="border-b border-zinc-800 pb-5">
          <div className="flex items-center gap-2 text-brand-primary">
            <List className="w-5 h-5" />
            <span className="text-xs font-extrabold uppercase tracking-wider">Otomatik Koleksiyon</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-white mt-1">
            📁 {listName}
          </h1>
          <p className="text-zinc-500 text-sm mt-1">
            Bu koleksiyonda toplam {listMovies.length} yapım kayıtlı.
          </p>
        </div>
      </div>

      {/* Movies Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
        {listMovies.map((movie) => (
          <MovieCard key={movie.imdbId} movie={movie} />
        ))}
      </div>
    </div>
  );
}
