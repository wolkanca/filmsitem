import { Metadata } from 'next';
import Link from 'next/link';
import { getStats } from '@/lib/db';
import StatsCharts from '@/components/StatsCharts';
import { Film, Star, Clock, Trophy, Heart, UserCheck, ChartNoAxesColumn } from 'lucide-react';

export const revalidate = 2592000; // 30 gün (saniye)

export const metadata: Metadata = {
  title: 'İstatistikler',
  description: 'Kişisel film izleme istatistiklerim, puan dağılımım ve en çok izlediğim yönetmen/oyuncu analizleri. Kişisel sinema istatistiklerimi barındıran modern film günlüğü.',
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
      link: `/movies`,
    },
    {
      title: 'Ortalama Puanım',
      value: `${stats.averageRating} / 10`,
      icon: Star,
      color: 'text-amber-400 border-amber-500/20 bg-amber-500/5',
      desc: 'İzlenen yapımlara verilen genel puan ortalaması',
      link: `/movies`,
    },
    {
      title: 'Toplam Süre',
      value: `${stats.totalRuntimeHours} Saat`,
      icon: Clock,
      color: 'text-rose-400 border-rose-500/20 bg-rose-500/5',
      desc: 'Ekran başında geçirilen toplam süre',
      link: `/movies`,
    },
    {
      title: 'En Çok İzlenen Tür',
      value: stats.topGenre,
      icon: Trophy,
      color: 'text-emerald-400 border-emerald-500/20 bg-emerald-500/5',
      desc: 'Kütüphanede en çok ağırlığı olan film türü',
      link: `/genre/${stats.topGenre}`,
    },
    {
      title: 'En Sevilen Yönetmen',
      value: stats.favoriteDirector,
      icon: Heart,
      color: 'text-rose-400 border-rose-500/20 bg-rose-500/5',
      desc: 'En fazla yapımı izlenen yönetmen',
      link: `/director/${stats.favoriteDirector}`,
    },
    {
      title: 'En Çok İzlenen Oyuncu',
      value: stats.mostWatchedActor,
      icon: UserCheck,
      color: 'text-sky-400 border-sky-500/20 bg-sky-500/5',
      desc: 'Rol aldığı en fazla yapım izlenen aktör',
      link: `/actor/${stats.mostWatchedActor}`,
    },
  ];

  return (
    <div className="space-y-10 animate-fade-in">
      {/* Title */}
      <div className="border-b border-zinc-800 pb-5">
        <h1 className="text-3xl font-black text-white">
          <ChartNoAxesColumn className="text-zinc-500 h-9 w-9 mr-2 inline" /> Film İstatistiklerim</h1>
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
                  {card.link ? (
                    <Link href={card.link} title={card.value} className="hover:text-white transition-colors line-clamp-1">{card.value}</Link>
                  ) : (
                    card.value
                  )}
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
