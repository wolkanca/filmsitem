import { Metadata } from 'next';
import { getMovies } from '@/lib/db';
import ArchiveGrid from '@/components/ArchiveGrid';
import { Heart } from 'lucide-react';

export const revalidate = 3600; // Revalidate every hour (ISR)

export const metadata: Metadata = {
  title: 'Favorilerim',
  description: 'Kişisel film arşivimde 8 ve üzeri yüksek puan verdiğim gözbebeğim yapımlar.',
};

export default async function FavoritesPage() {
  const movies = await getMovies();
  
  // Filter movies rated 8, 9, or 10
  const favoriteMovies = movies
    .filter((m) => m.myRating >= 8);

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Title */}
      <div className="border-b border-zinc-800 pb-5">
        <div className="flex items-center gap-2 text-brand-rose">
          <Heart className="w-5 h-5 fill-brand-rose" />
          <span className="text-xs font-extrabold uppercase tracking-wider">Favori Listem</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-black text-white mt-1">
          💖 Başyapıtlarım
        </h1>
        <p className="text-zinc-500 text-sm mt-1">
          Kişisel arşivimde 8, 9 veya 10 puan verdiğim toplam {favoriteMovies.length} seçkin yapım yer alıyor.
        </p>
      </div>

      {favoriteMovies.length === 0 ? (
        <div className="text-center py-20 border border-dashed border-zinc-800 rounded-2xl bg-zinc-950/20">
          <span className="text-4xl">💖</span>
          <h3 className="text-lg font-bold text-zinc-300 mt-4">Henüz Favori Yapım Yok</h3>
          <p className="text-sm text-zinc-500 mt-1">
            İzlediğiniz filmlere 8 ve üzeri puan verdiğinizde bu listede otomatik olarak listelenecektir.
          </p>
        </div>
      ) : (
        <ArchiveGrid movies={favoriteMovies} flat defaultSort="myrating-desc" />
      )}
    </div>
  );
}
