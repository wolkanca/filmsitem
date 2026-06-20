'use client';

import { Stats } from '@/lib/db';

interface StatsChartsProps {
  stats: Stats;
}

export default function StatsCharts({ stats }: StatsChartsProps) {
  const {
    genreDistribution,
    ratingDistribution,
    yearDistribution,
    topDirectors,
    topActors,
  } = stats;

  // Maximum values for scaling charts
  const maxRatingCount = Math.max(...ratingDistribution.map((d) => d.count), 1);
  const maxYearCount = Math.max(...yearDistribution.map((d) => d.count), 1);
  const maxGenreCount = Math.max(...genreDistribution.map((d) => d.count), 1);
  const maxDirectorCount = Math.max(...topDirectors.map((d) => d.count), 1);
  const maxActorCount = Math.max(...topActors.map((d) => d.count), 1);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* 1. Rating Distribution (Histogram) */}
      <div className="glass p-6 rounded-2xl border border-white/5 flex flex-col h-[350px]">
        <h3 className="text-lg font-bold text-zinc-200 mb-6 flex items-center gap-2">
          <span>📊</span> Puan Dağılımı (Kişisel Skorlar)
        </h3>
        <div className="flex-grow flex items-end justify-between gap-2 px-2 pb-6 border-b border-zinc-800">
          {ratingDistribution.map((item) => {
            const heightPercent = (item.count / maxRatingCount) * 100;
            return (
              <div key={item.rating} className="flex-grow flex flex-col items-center group h-full justify-end">
                {/* Count tooltip on hover */}
                <div className="text-[10px] text-zinc-400 font-bold opacity-0 group-hover:opacity-100 transition-opacity mb-1.5 duration-200 bg-zinc-900 px-1.5 py-0.5 rounded border border-white/10">
                  {item.count}
                </div>
                {/* Bar */}
                <div
                  style={{ height: `${Math.max(heightPercent, 4)}%` }}
                  className="w-full rounded-t-md bg-gradient-to-t from-red-600 to-red-400 hover:from-rose-500 hover:to-rose-300 transition-all duration-300 shadow-[0_0_15px_rgba(239,68,68,0.2)] group-hover:shadow-[0_0_20px_rgba(244,63,94,0.4)]"
                ></div>
                {/* Label */}
                <span className="text-xs text-zinc-500 font-semibold mt-2">{item.rating}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* 2. Years Distribution (Bar Chart) */}
      <div className="glass p-6 rounded-2xl border border-white/5 flex flex-col h-[350px]">
        <h3 className="text-lg font-bold text-zinc-200 mb-6 flex items-center gap-2">
          <span>📅</span> Yapım Yıllarına Göre Dağılım
        </h3>
        {yearDistribution.length === 0 ? (
          <div className="flex-grow flex items-center justify-center text-zinc-500 text-sm">
            Veri bulunamadı
          </div>
        ) : (
          <div className="flex-grow flex items-end justify-between gap-1.5 px-2 pb-6 border-b border-zinc-800 overflow-x-auto">
            {yearDistribution.slice(-12).map((item) => {
              const heightPercent = (item.count / maxYearCount) * 100;
              return (
                <div key={item.year} className="flex-1 min-w-[32px] flex flex-col items-center group h-full justify-end">
                  <div className="text-[9px] text-zinc-400 font-bold opacity-0 group-hover:opacity-100 transition-opacity mb-1.5 duration-200 bg-zinc-900 px-1 py-0.5 rounded border border-white/10">
                    {item.count}
                  </div>
                  <div
                    style={{ height: `${Math.max(heightPercent, 4)}%` }}
                    className="w-full rounded-t bg-gradient-to-t from-rose-600 to-rose-400 hover:from-red-500 hover:to-red-300 transition-all duration-300 shadow-[0_0_15px_rgba(244,63,94,0.2)] group-hover:shadow-[0_0_20px_rgba(239,68,68,0.4)]"
                  ></div>
                  <span className="text-[10px] text-zinc-500 font-bold mt-2 whitespace-nowrap">{item.year}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 3. Genres Distribution (Horizontal Bar Chart) */}
      <div className="glass p-6 rounded-2xl border border-white/5 flex flex-col justify-between">
        <h3 className="text-lg font-bold text-zinc-200 mb-6 flex items-center gap-2">
          <span>🎭</span> En Çok İzlenen Türler
        </h3>
        <div className="space-y-4 flex-grow flex flex-col justify-center">
          {genreDistribution.slice(0, 6).map((item) => {
            const widthPercent = (item.count / maxGenreCount) * 100;
            return (
              <div key={item.name} className="space-y-1.5">
                <div className="flex justify-between text-xs font-semibold text-zinc-400">
                  <span>{item.name}</span>
                  <span className="text-zinc-300 font-bold">{item.count} yapım</span>
                </div>
                <div className="w-full bg-zinc-950/60 rounded-full h-2.5 overflow-hidden border border-white/5">
                  <div
                    style={{ width: `${widthPercent}%` }}
                    className="bg-gradient-to-r from-red-500 to-rose-500 h-full rounded-full shadow-[0_0_10px_rgba(239,68,68,0.3)]"
                  ></div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 4. Top Directors & Actors Leaderboard */}
      <div className="glass p-6 rounded-2xl border border-white/5 flex flex-col gap-6">
        <div>
          <h3 className="text-sm font-extrabold uppercase tracking-wider text-zinc-400 mb-4 flex items-center gap-2">
            <span>🎬</span> En Çok İzlenen Yönetmenler
          </h3>
          <div className="space-y-3">
            {topDirectors.map((item) => {
              const widthPercent = (item.count / maxDirectorCount) * 100;
              return (
                <div key={item.name} className="flex items-center gap-4">
                  <span className="w-32 text-xs font-bold text-zinc-300 truncate">{item.name}</span>
                  <div className="flex-grow bg-zinc-950/60 rounded-full h-2 overflow-hidden border border-white/5">
                    <div
                      style={{ width: `${widthPercent}%` }}
                      className="bg-brand-accent h-full rounded-full shadow-[0_0_10px_rgba(245,158,11,0.3)]"
                    ></div>
                  </div>
                  <span className="w-10 text-right text-xs font-extrabold text-brand-accent">{item.count}</span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="border-t border-zinc-800/80 pt-4">
          <h3 className="text-sm font-extrabold uppercase tracking-wider text-zinc-400 mb-4 flex items-center gap-2">
            <span>🎭</span> En Çok İzlenen Oyuncular
          </h3>
          <div className="space-y-3">
            {topActors.map((item) => {
              const widthPercent = (item.count / maxActorCount) * 100;
              return (
                <div key={item.name} className="flex items-center gap-4">
                  <span className="w-32 text-xs font-bold text-zinc-300 truncate">{item.name}</span>
                  <div className="flex-grow bg-zinc-950/60 rounded-full h-2 overflow-hidden border border-white/5">
                    <div
                      style={{ width: `${widthPercent}%` }}
                      className="bg-brand-rose h-full rounded-full shadow-[0_0_10px_rgba(244,63,94,0.3)]"
                    ></div>
                  </div>
                  <span className="w-10 text-right text-xs font-extrabold text-brand-rose">{item.count}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
