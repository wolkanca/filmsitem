import { Metadata } from 'next';
import { getStats } from '@/lib/db';
import StatsCharts from '@/components/StatsCharts';
import { Film, Star, Clock, Trophy, Heart, UserCheck } from 'lucide-react';

export const revalidate = 3600; // Revalidate every hour (ISR)

export const metadata: Metadata = {
  title: 'İstatistikler',
  description: 'Kişisel film izleme istatistiklerim, puan dağılımım ve en çok izlediğim yönetmen/oyuncu analizleri.',
};

export default async function StatsPage() {
  const stats = await getStats();

  const cards = [
    {
      title: 'Toplam İzlenen',
      value: `${stats.totalCount} Yapım`,
      icon: Film,
      color: 'text-red-400 border-red-500/20 bg-red-500/5',
      desc: 'IMDb listesindeki toplam kayıt sayısı',
    },
    {
      title: 'Ortalama Puanım',
      value: `${stats.averageRating} / 10`,
      icon: Star,
      color: 'text-amber-400 border-amber-500/20 bg-amber-500/5',
      desc: 'İzlenen yapımlara verilen genel puan ortalaması',
    },
    {
      title: 'Toplam Süre',
      value: `${stats.totalRuntimeHours} Saat`,
      icon: Clock,
      color: 'text-rose-400 border-rose-500/20 bg-rose-500/5',
      desc: 'Ekran başında geçirilen toplam süre',
    },
    {
      title: 'En Çok İzlenen Tür',
      value: stats.topGenre,
      icon: Trophy,
      color: 'text-emerald-400 border-emerald-500/20 bg-emerald-500/5',
      desc: 'Kütüphanede en çok ağırlığı olan film türü',
    },
    {
      title: 'En Sevilen Yönetmen',
      value: stats.favoriteDirector,
      icon: Heart,
      color: 'text-rose-400 border-rose-500/20 bg-rose-500/5',
      desc: 'En fazla yapımı izlenen yönetmen',
    },
    {
      title: 'En Çok İzlenen Oyuncu',
      value: stats.mostWatchedActor,
      icon: UserCheck,
      color: 'text-sky-400 border-sky-500/20 bg-sky-500/5',
      desc: 'Rol aldığı en fazla yapım izlenen aktör',
    },
  ];

  return (
    <div className="space-y-10 animate-fade-in">
      {/* Title */}
      <div className="border-b border-zinc-800 pb-5">
        <h1 className="text-3xl font-black text-white">📊 Film İstatistiklerim</h1>
        <p className="text-zinc-500 text-sm mt-1">
          Yıllar süren sinema izleme alışkanlıklarımın ve tercihlerimin grafiksel analizi.
        </p>
      </div>

      {/* Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.title}
              className={`glass-card p-6 rounded-2xl border ${card.color} flex items-start gap-4`}
            >
              <div className="p-3 rounded-xl bg-black/40 flex-shrink-0">
                <Icon className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider block">
                  {card.title}
                </span>
                <span className="text-2xl font-black text-white block tracking-tight">
                  {card.value}
                </span>
                <span className="text-[11px] text-zinc-500 block leading-snug">
                  {card.desc}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Charts Components */}
      <StatsCharts stats={stats} />
    </div>
  );
}
