import { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { getMovies } from '@/lib/db';
import { slugify } from '@/lib/utils';
import { List, Film, ChevronRight } from 'lucide-react';

export const revalidate = 3600; // Revalidate every hour (ISR)

export const metadata: Metadata = {
  title: 'Listeler',
  description: 'Otomatik olarak oluşturulmuş kişisel film koleksiyonları ve kategoriler.',
};

export default async function ListsPage() {
  const movies = await getMovies();

  // Find all unique list names and map movies belonging to them
  const listsMap: Record<string, { name: string; count: number; backdrop: string; description: string }> = {};

  // Standard predefined descriptions
  const listDescriptions: Record<string, string> = {
    'Favoriler': 'Kişisel olarak en yüksek beğeni alan ve 9+ puan verdiğim seçkin yapımlar.',
    '10 Puanlık Başyapıtlar': 'Sinema sanatının zirvesini temsil eden, kusursuz bulduğum 10 tam puanlık başyapıtlar.',
    'Bilim Kurgu': 'Zaman yolculuğu, yapay zeka, uzay keşifleri ve geleceğin teknolojilerini barındıran bilim kurgu arşivim.',
    'Komedi Günlükleri': 'Gülümseten, hayattan koparan, mizah dolu ve eğlenceli anlar yaşatan komedi yapımları.',
    'Sinema Klasikleri': 'Sinema tarihine yön vermiş, 1980 öncesi çekilmiş unutulmaz klasik eserler.',
    'Kült Eserler': 'IMDb puanı 8.5 ve üzeri olan, sinema dünyasında geniş kitlelerce kabul görmüş kült başyapıtlar.',
    'Uzun Metraj Maratonu': 'Süresi 150 dakikanın üzerinde olan, derin hikaye anlatımlı uzun soluklu maraton yapımları.',
  };

  movies.forEach((m) => {
    (m.listName || []).forEach((listName) => {
      if (!listsMap[listName]) {
        listsMap[listName] = {
          name: listName,
          count: 0,
          backdrop: '',
          description: listDescriptions[listName] || `"${listName}" kategorisine ait izlediğim yapımlardan oluşan seçki.`,
        };
      }
      listsMap[listName].count++;
      // Set the backdrop of the list to be the backdrop of one of the highest-rated movies in that list
      if (!listsMap[listName].backdrop && m.backdrop) {
        listsMap[listName].backdrop = m.backdrop;
      }
    });
  });

  const lists = Object.values(listsMap).sort((a, b) => b.count - a.count);

  return (
    <div className="space-y-10 animate-fade-in">
      {/* Title */}
      <div className="border-b border-zinc-800 pb-5">
        <h1 className="text-3xl font-black text-white">📁 Film Koleksiyonlarım</h1>
        <p className="text-zinc-500 text-sm mt-1">
          Kişisel puanlarıma, yapım yılına ve türlerine göre otomatik olarak derlenen akıllı listeler.
        </p>
      </div>

      {lists.length === 0 ? (
        <div className="text-center py-20 border border-dashed border-zinc-800 rounded-2xl bg-zinc-950/20">
          <span className="text-4xl">📁</span>
          <h3 className="text-lg font-bold text-zinc-300 mt-4">Hiçbir Koleksiyon Bulunamadı</h3>
          <p className="text-sm text-zinc-500 mt-1">
            CSV kütüphaneniz yüklendikten sonra listeleriniz burada otomatik olarak oluşacaktır.
          </p>
        </div>
      ) : (
        /* Lists Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {lists.map((list) => {
            const slug = slugify(list.name);
            return (
              <Link
                key={list.name}
                href={`/list/${slug}`}
                className="group relative overflow-hidden rounded-2xl border border-white/5 bg-zinc-950/50 min-h-[160px] flex items-center transition-all duration-300 hover:border-brand-primary/30 hover:scale-[1.01] hover:shadow-[0_10px_25px_rgba(239,68,68,0.15)]"
              >
                {/* Background Cover */}
                {list.backdrop && (
                  <div className="absolute inset-0 z-0 opacity-15 transition-opacity duration-500 group-hover:opacity-25">
                    <Image
                      src={list.backdrop}
                      alt={list.name}
                      fill
                      className="object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-transparent"></div>
                  </div>
                )}

                {/* Details Content */}
                <div className="relative z-10 p-6 flex flex-col justify-between h-full w-full gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-brand-primary">
                      <List className="w-4 h-4" />
                      <span className="text-xs font-extrabold uppercase tracking-wider">
                        Koleksiyon
                      </span>
                    </div>
                    <h2 className="text-xl font-black text-white group-hover:text-brand-primary transition-colors">
                      {list.name}
                    </h2>
                    <p className="text-xs text-zinc-400 leading-relaxed max-w-md">
                      {list.description}
                    </p>
                  </div>

                  <div className="flex items-center justify-between border-t border-white/5 pt-3 text-xs">
                    <span className="flex items-center gap-1 text-zinc-500 font-bold">
                      <Film className="w-3.5 h-3.5 text-zinc-600" />
                      {list.count} yapım barındırıyor
                    </span>
                    <span className="text-zinc-400 font-bold group-hover:text-white flex items-center gap-0.5 transition-colors">
                      Görüntüle <ChevronRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
