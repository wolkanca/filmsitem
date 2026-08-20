import { getMovies } from '@/lib/db';
import ArchiveGrid from '@/components/ArchiveGrid';
import Link from 'next/link';
import { ArrowLeft, Film, Clock, Star, User, Pencil } from 'lucide-react';
import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { normalizeSearchString } from '@/lib/utils';

export const revalidate = 2592000; // 30 gün (saniye)

interface Props {
  params: Promise<{ name: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const resolvedParams = await params;
  const decodedName = decodeURIComponent(resolvedParams.name);
  const movies = await getMovies();
  const exists = movies.some((m) => {
    if (!m.cast) return false;
    return m.cast.some((c) => normalizeSearchString(c) === normalizeSearchString(decodedName));
  });
  if (!exists) {
    notFound();
  }
  return {
    title: `${decodedName} Rol Aldığı Filmler`,
    description: `Kütüphanemdeki oyuncu ${decodedName} tarafından rol alınmış filmler, incelemelerim ve kişisel puanlarım.`,
  };
}

export default async function ActorPage({ params }: Props) {
  const resolvedParams = await params;
  const decodedName = decodeURIComponent(resolvedParams.name);

  const movies = await getMovies();
  const filteredMovies = movies.filter((m) => {
    if (!m.cast) return false;
    return m.cast.some((c) => normalizeSearchString(c) === normalizeSearchString(decodedName));
  });

  if (filteredMovies.length === 0) {
    notFound();
  }

  // Check other roles and count
  const actorMoviesCount = movies.filter((m) => {
    if (!m.cast) return false;
    return m.cast.some((c) => normalizeSearchString(c) === normalizeSearchString(decodedName));
  }).length;

  // Check other roles and count
  const directorMoviesCount = movies.filter((m) => {
    if (!m.director) return false;
    return m.director.split(',').map((d) => d.trim()).some((d) => normalizeSearchString(d) === normalizeSearchString(decodedName));
  }).length;

  const writerMoviesCount = movies.filter((m) => {
    if (!m.writers) return false;
    return m.writers.some((w) => normalizeSearchString(w) === normalizeSearchString(decodedName));
  }).length;

  // Calculate statistics
  const totalCount = filteredMovies.length;
  const ratedMovies = filteredMovies.filter((m) => m.myRating > 0);
  const avgRating = ratedMovies.length > 0
    ? (ratedMovies.reduce((acc, m) => acc + m.myRating, 0) / ratedMovies.length).toFixed(1)
    : 'N/A';
  const totalRuntimeMinutes = filteredMovies.reduce((acc, m) => acc + (m.runtime || 0), 0);
  const totalRuntimeHours = Math.round(totalRuntimeMinutes / 60);

  return (
    <div className="space-y-8">
      {/* Header and Statistics Banner */}
      <div className="glass-card p-6 sm:p-8 rounded-2xl relative overflow-hidden border border-card-border/50">
        <div className="absolute top-0 right-0 w-80 h-80 bg-brand-secondary/10 rounded-full blur-[100px] -z-10" />

        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <span className="text-xs font-bold text-brand-secondary uppercase tracking-widest block mb-1">Oyuncuya Göre Arşiv</span>
            <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight flex items-center gap-3">
              <User className="w-8 h-8 text-brand-secondary shrink-0" />
              {decodedName}
            </h1>
            <p className="text-zinc-500 text-sm mt-1">
              {decodedName} rol aldığı {totalCount} yapım.
            </p>
            {(directorMoviesCount > 0 || writerMoviesCount > 0) && (
              <div className="flex flex-wrap gap-2 mt-4">
                {actorMoviesCount > 0 && (
                  <Link
                    href={`/actor/${encodeURIComponent(decodedName)}`}
                    className="flex items-center gap-1.5 bg-brand-secondary/10 text-white/80 hover:text-white border border-brand-secondary/20 hover:border-brand-secondary/40 hover:bg-brand-secondary/20 px-2.5 py-1 rounded-lg text-xs font-bold transition-all"
                  >
                    <User className="w-3.5 h-3.5" />
                    Oyuncu ({actorMoviesCount})
                  </Link>
                )}
                {directorMoviesCount > 0 && (
                  <Link
                    href={`/director/${encodeURIComponent(decodedName)}`}
                    className="flex items-center gap-1.5 bg-brand-secondary/10 text-zinc-400 hover:text-white border border-brand-secondary/20 hover:border-brand-secondary/40 hover:bg-brand-secondary/20 px-2.5 py-1 rounded-lg text-xs font-bold transition-all"
                  >
                    <Film className="w-3.5 h-3.5" />
                    Yönetmen ({directorMoviesCount})
                  </Link>
                )}
                {writerMoviesCount > 0 && (
                  <Link
                    href={`/writer/${encodeURIComponent(decodedName)}`}
                    className="flex items-center gap-1.5 bg-brand-secondary/10 text-zinc-400 hover:text-white border border-brand-secondary/20 hover:border-brand-secondary/40 hover:bg-brand-secondary/20 px-2.5 py-1 rounded-lg text-xs font-bold transition-all"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                    Senarist ({writerMoviesCount})
                  </Link>
                )}
              </div>
            )}
          </div>

          {/* Key Stats Cards */}
          <div className="flex flex-wrap gap-4 w-full md:w-auto">
            <div className="bg-zinc-950/40 border border-white/5 p-4 rounded-xl text-center min-w-[100px] flex-grow md:flex-grow-0">
              <span className="block text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Yapım Sayısı</span>
              <span className="block text-2xl font-black text-white mt-1">{totalCount}</span>
            </div>
            <div className="bg-zinc-950/40 border border-white/5 p-4 rounded-xl text-center min-w-[100px] flex-grow md:flex-grow-0">
              <span className="block text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Ortalama Puan</span>
              <span className="block text-2xl font-black text-brand-accent mt-1 flex items-center justify-center gap-1">
                <Star className="w-4 h-4 text-brand-accent fill-brand-accent shrink-0" />
                {avgRating}
              </span>
            </div>
            <div className="bg-zinc-950/40 border border-white/5 p-4 rounded-xl text-center min-w-[100px] flex-grow md:flex-grow-0">
              <span className="block text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Toplam Süre</span>
              <span className="block text-2xl font-black text-zinc-300 mt-1 flex items-center justify-center gap-1">
                <Clock className="w-4 h-4 text-zinc-400 shrink-0" />
                {totalRuntimeHours} sa
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Movie Grid with tabs */}
      <ArchiveGrid movies={filteredMovies} defaultSort="year-desc" />
    </div>
  );
}

