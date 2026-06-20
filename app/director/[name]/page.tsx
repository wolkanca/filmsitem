import { getMovies } from '@/lib/db';
import ArchiveGrid from '@/components/ArchiveGrid';
import Link from 'next/link';
import { ArrowLeft, Film, Clock, Star, User } from 'lucide-react';
import { Metadata } from 'next';

interface Props {
  params: Promise<{ name: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const resolvedParams = await params;
  const decodedName = decodeURIComponent(resolvedParams.name);
  return {
    title: `${decodedName} Filmleri`,
    description: `Kütüphanemdeki yönetmen ${decodedName} tarafından çekilmiş filmler, incelemelerim ve kişisel puanlarım.`,
  };
}

export default async function DirectorPage({ params }: Props) {
  const resolvedParams = await params;
  const decodedName = decodeURIComponent(resolvedParams.name);
  
  const movies = await getMovies();
  const filteredMovies = movies.filter((m) => {
    if (!m.director) return false;
    const directors = m.director.split(',').map((d) => d.trim().toLowerCase());
    return directors.includes(decodedName.toLowerCase());
  });

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
      {/* Breadcrumb / Back button */}
      <Link
        href="/movies"
        className="inline-flex items-center gap-2 text-zinc-400 hover:text-white transition-colors text-sm font-semibold"
      >
        <ArrowLeft className="w-4 h-4" /> Filmlerime Dön
      </Link>

      {/* Header and Statistics Banner */}
      <div className="glass-card p-6 sm:p-8 rounded-2xl relative overflow-hidden border border-card-border/50">
        <div className="absolute top-0 right-0 w-80 h-80 bg-brand-primary/10 rounded-full blur-[100px] -z-10" />
        
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <span className="text-xs font-bold text-brand-primary uppercase tracking-widest block mb-1">Yönetmene Göre Arşiv</span>
            <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight flex items-center gap-3">
              <User className="w-8 h-8 text-brand-primary shrink-0" />
              {decodedName} Filmleri
            </h1>
            <p className="text-zinc-500 text-sm mt-1">
              Bu yönetmene ait toplam {totalCount} yapım izlediniz.
            </p>
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
      <ArchiveGrid movies={filteredMovies} />
    </div>
  );
}

