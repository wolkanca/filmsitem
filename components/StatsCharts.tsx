'use client';

import { Stats } from '@/lib/db';
import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';

interface StatsChartsProps {
  stats: Stats;
}

function SectionTitle({ emoji, title }: { emoji: string; title: string }) {
  return (
    <h3 className="text-lg font-bold text-zinc-200 mb-6 flex items-center gap-2">
      <span>{emoji}</span> {title}
    </h3>
  );
}

export default function StatsCharts({ stats }: StatsChartsProps) {
  const {
    genreDistribution,
    ratingDistribution,
    yearDistribution,
    topDirectors,
    topActors,
    typeBreakdown,
    decadeDistribution,
    watchYearDistribution,
    monthlyWatchDistribution,
    imdbRatingDistribution,
    ratingComparison,
    longestMovies,
    shortestMovies,
    highestRatedByMe,
    highestRatedOnImdb,
    mostControversial,
  } = stats;

  // Maximum values for scaling charts
  const maxRatingCount = Math.max(...ratingDistribution.map((d) => d.count), 1);
  const maxYearCount = Math.max(...yearDistribution.map((d) => d.count), 1);
  const maxGenreCount = Math.max(...genreDistribution.map((d) => d.count), 1);
  const maxDirectorCount = Math.max(...topDirectors.map((d) => d.count), 1);
  const maxActorCount = Math.max(...topActors.map((d) => d.count), 1);
  const maxDecadeCount = Math.max(...decadeDistribution.map((d) => d.count), 1);
  const maxWatchYearCount = Math.max(...watchYearDistribution.map((d) => d.count), 1);
  const maxMonthCount = Math.max(...monthlyWatchDistribution.map((d) => d.count), 1);
  const maxImdbRatingCount = Math.max(...imdbRatingDistribution.map((d) => d.count), 1);

  return (
    <div className="space-y-8">
      {/* Row 1: Rating Distribution + IMDb Rating Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* 1. My Rating Distribution */}
        <div className="glass p-6 rounded-2xl border border-white/5 flex flex-col h-[350px]">
          <SectionTitle emoji="⭐" title="Puan Dağılımı (Kişisel Skorlar)" />
          <div className="flex-grow flex items-end justify-between gap-2 px-2 pb-6 border-b border-zinc-800">
            {ratingDistribution.map((item) => {
              const heightPercent = (item.count / maxRatingCount) * 100;
              return (
                <div key={item.rating} className="flex-grow flex flex-col items-center group h-full justify-end">
                  <div className="text-[10px] text-zinc-400 font-bold opacity-0 group-hover:opacity-100 transition-opacity mb-1.5 duration-200 bg-zinc-900 px-1.5 py-0.5 rounded border border-white/10">
                    {item.count}
                  </div>
                  <div
                    style={{ height: `${Math.max(heightPercent, 4)}%` }}
                    className="w-full rounded-t-md bg-gradient-to-t from-red-600 to-red-400 hover:from-rose-500 hover:to-rose-300 transition-all duration-300 shadow-[0_0_15px_rgba(239,68,68,0.2)] group-hover:shadow-[0_0_20px_rgba(244,63,94,0.4)]"
                  ></div>
                  <span className="text-xs text-zinc-500 font-semibold mt-2">{item.rating}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* 2. IMDb Rating Distribution */}
        <div className="glass p-6 rounded-2xl border border-white/5 flex flex-col h-[350px]">
          <SectionTitle emoji="🎯" title="IMDb Puan Dağılımı" />
          <div className="flex-grow flex items-end justify-between gap-2 px-2 pb-6 border-b border-zinc-800">
            {imdbRatingDistribution.map((item) => {
              const heightPercent = (item.count / maxImdbRatingCount) * 100;
              return (
                <div key={item.rating} className="flex-grow flex flex-col items-center group h-full justify-end">
                  <div className="text-[10px] text-zinc-400 font-bold opacity-0 group-hover:opacity-100 transition-opacity mb-1.5 duration-200 bg-zinc-900 px-1.5 py-0.5 rounded border border-white/10">
                    {item.count}
                  </div>
                  <div
                    style={{ height: `${Math.max(heightPercent, 4)}%` }}
                    className="w-full rounded-t-md bg-gradient-to-t from-amber-600 to-amber-400 hover:from-amber-500 hover:to-yellow-300 transition-all duration-300 shadow-[0_0_15px_rgba(245,158,11,0.2)] group-hover:shadow-[0_0_20px_rgba(245,158,11,0.4)]"
                  ></div>
                  <span className="text-xs text-zinc-500 font-semibold mt-2">{item.rating}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Row 2: Genre comparison chart + Type Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Rating Comparison by Genre (My vs IMDb) */}
        <div className="glass p-6 rounded-2xl border border-white/5">
          <SectionTitle emoji="⚖️" title="Türlere Göre Puan Karşılaştırması" />
          <p className="text-[11px] text-zinc-600 -mt-4 mb-5">Benim puanım vs IMDb ortalaması</p>
          <div className="space-y-4">
            {ratingComparison.map((item) => (
              <Link
                key={item.label}
                href={`/genre/${encodeURIComponent(item.label)}`}
                className="block group"
              >
                <div className="flex items-center justify-between text-xs font-semibold text-zinc-400 mb-1.5">
                  <span className="group-hover:text-white transition-colors flex items-center gap-1">
                    {item.label}
                    <ArrowUpRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity text-brand-primary" />
                  </span>
                  <span className="text-zinc-500 text-[10px]">
                    <span className="text-red-400">Ben: {item.my}</span>
                    {' / '}
                    <span className="text-amber-400">IMDb: {item.imdb}</span>
                  </span>
                </div>
                <div className="relative w-full h-3 bg-zinc-950/60 rounded-full overflow-hidden border border-white/5">
                  {/* IMDb bar (background) */}
                  <div
                    style={{ width: `${(item.imdb / 10) * 100}%` }}
                    className="absolute top-0 left-0 h-full rounded-full bg-amber-500/30"
                  ></div>
                  {/* My bar (foreground) */}
                  <div
                    style={{ width: `${(item.my / 10) * 100}%` }}
                    className="absolute top-0 left-0 h-full rounded-full bg-gradient-to-r from-red-500 to-rose-500 shadow-[0_0_10px_rgba(239,68,68,0.3)]"
                  ></div>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Type breakdown */}
        <div className="glass p-6 rounded-2xl border border-white/5">
          <SectionTitle emoji="🎞️" title="Yapım Türü Dağılımı" />
          <div className="space-y-4">
            {typeBreakdown.map((item) => {
              const maxTypeCount = Math.max(...typeBreakdown.map(t => t.count), 1);
              const widthPercent = (item.count / maxTypeCount) * 100;
              const typeLabels: Record<string, string> = {
                'Movie': '🎬 Sinema Filmi',
                'TV Series': '📺 TV Dizisi',
                'TV Episode': '📺 TV Bölümü',
                'TV Special': '📺 TV Özel',
                'TV Mini Series': '📺 Mini Dizi',
              };
              return (
                <div key={item.type} className="space-y-1.5">
                  <div className="flex justify-between text-xs font-semibold text-zinc-400">
                    <span>{typeLabels[item.type] || item.type}</span>
                    <span className="text-zinc-300 font-bold">{item.count} yapım</span>
                  </div>
                  <div className="w-full bg-zinc-950/60 rounded-full h-2.5 overflow-hidden border border-white/5">
                    <div
                      style={{ width: `${widthPercent}%` }}
                      className="bg-gradient-to-r from-violet-500 to-purple-500 h-full rounded-full shadow-[0_0_10px_rgba(139,92,246,0.3)]"
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Row 3: Decade + Watch Year distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Decade distribution */}
        <div className="glass p-6 rounded-2xl border border-white/5 flex flex-col h-[350px]">
          <SectionTitle emoji="📆" title="On Yıllara Göre Dağılım" />
          <div className="flex-grow flex items-end justify-between gap-1.5 px-2 pb-6 border-b border-zinc-800 overflow-x-auto">
            {decadeDistribution.map((item) => {
              const heightPercent = (item.count / maxDecadeCount) * 100;
              const rawDecade = item.decade.replace("'ler", '');
              return (
                <Link
                  key={item.decade}
                  href={`/year/${rawDecade}`}
                  className="flex-1 min-w-[40px] flex flex-col items-center group h-full justify-end"
                >
                  <div className="text-[9px] text-zinc-400 font-bold opacity-0 group-hover:opacity-100 transition-opacity mb-1.5 duration-200 bg-zinc-900 px-1 py-0.5 rounded border border-white/10">
                    {item.count}
                  </div>
                  <div
                    style={{ height: `${Math.max(heightPercent, 4)}%` }}
                    className="w-full rounded-t bg-gradient-to-t from-emerald-600 to-emerald-400 hover:from-emerald-500 hover:to-green-300 transition-all duration-300 shadow-[0_0_15px_rgba(16,185,129,0.2)] group-hover:shadow-[0_0_20px_rgba(16,185,129,0.4)]"
                  ></div>
                  <span className="text-[10px] text-zinc-500 font-bold mt-2 whitespace-nowrap group-hover:text-emerald-400 transition-colors">{item.decade}</span>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Watch year distribution */}
        <div className="glass p-6 rounded-2xl border border-white/5 flex flex-col h-[350px]">
          <SectionTitle emoji="👁️" title="İzlenme Yılına Göre Dağılım" />
          {watchYearDistribution.length === 0 ? (
            <div className="flex-grow flex items-center justify-center text-zinc-500 text-sm">
              İzlenme tarihi verisi bulunamadı
            </div>
          ) : (
            <div className="flex-grow flex items-end justify-between gap-1.5 px-2 pb-6 border-b border-zinc-800 overflow-x-auto">
              {watchYearDistribution.map((item) => {
                const heightPercent = (item.count / maxWatchYearCount) * 100;
                return (
                  <div key={item.year} className="flex-1 min-w-[32px] flex flex-col items-center group h-full justify-end">
                    <div className="text-[9px] text-zinc-400 font-bold opacity-0 group-hover:opacity-100 transition-opacity mb-1.5 duration-200 bg-zinc-900 px-1 py-0.5 rounded border border-white/10">
                      {item.count}
                    </div>
                    <div
                      style={{ height: `${Math.max(heightPercent, 4)}%` }}
                      className="w-full rounded-t bg-gradient-to-t from-sky-600 to-sky-400 hover:from-sky-500 hover:to-cyan-300 transition-all duration-300 shadow-[0_0_15px_rgba(14,165,233,0.2)] group-hover:shadow-[0_0_20px_rgba(14,165,233,0.4)]"
                    ></div>
                    <span className="text-[10px] text-zinc-500 font-bold mt-2 whitespace-nowrap">{item.year}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Row 4: Production Year + Monthly Watch */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Year distribution */}
        <div className="glass p-6 rounded-2xl border border-white/5 flex flex-col h-[350px]">
          <SectionTitle emoji="📅" title="Yapım Yıllarına Göre Dağılım (Son 20)" />
          {yearDistribution.length === 0 ? (
            <div className="flex-grow flex items-center justify-center text-zinc-500 text-sm">
              Veri bulunamadı
            </div>
          ) : (
            <div className="flex-grow flex items-end justify-between gap-1.5 px-2 pb-6 border-b border-zinc-800 overflow-x-auto">
              {yearDistribution.slice(-20).map((item) => {
                const heightPercent = (item.count / maxYearCount) * 100;
                return (
                  <Link
                    key={item.year}
                    href={`/year/${item.year}`}
                    className="flex-1 min-w-[28px] flex flex-col items-center group h-full justify-end"
                  >
                    <div className="text-[9px] text-zinc-400 font-bold opacity-0 group-hover:opacity-100 transition-opacity mb-1.5 duration-200 bg-zinc-900 px-1 py-0.5 rounded border border-white/10">
                      {item.count}
                    </div>
                    <div
                      style={{ height: `${Math.max(heightPercent, 4)}%` }}
                      className="w-full rounded-t bg-gradient-to-t from-rose-600 to-rose-400 hover:from-red-500 hover:to-red-300 transition-all duration-300 shadow-[0_0_15px_rgba(244,63,94,0.2)] group-hover:shadow-[0_0_20px_rgba(239,68,68,0.4)]"
                    ></div>
                    <span className="text-[10px] text-zinc-500 font-bold mt-2 whitespace-nowrap group-hover:text-rose-400 transition-colors">{item.year}</span>
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        {/* Monthly watch distribution */}
        <div className="glass p-6 rounded-2xl border border-white/5 flex flex-col h-[350px]">
          <SectionTitle emoji="📅" title="Aylara Göre İzleme Alışkanlığı" />
          <div className="flex-grow flex items-end justify-between gap-1.5 px-2 pb-6 border-b border-zinc-800">
            {monthlyWatchDistribution.map((item) => {
              const heightPercent = (item.count / maxMonthCount) * 100;
              return (
                <div key={item.month} className="flex-1 min-w-[28px] flex flex-col items-center group h-full justify-end">
                  <div className="text-[9px] text-zinc-400 font-bold opacity-0 group-hover:opacity-100 transition-opacity mb-1.5 duration-200 bg-zinc-900 px-1 py-0.5 rounded border border-white/10">
                    {item.count}
                  </div>
                  <div
                    style={{ height: `${Math.max(heightPercent, 4)}%` }}
                    className="w-full rounded-t bg-gradient-to-t from-pink-600 to-pink-400 hover:from-pink-500 hover:to-rose-300 transition-all duration-300 shadow-[0_0_15px_rgba(236,72,153,0.2)] group-hover:shadow-[0_0_20px_rgba(236,72,153,0.4)]"
                  ></div>
                  <span className="text-[9px] text-zinc-500 font-bold mt-2 whitespace-nowrap">{item.month.substring(0, 3)}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Row 5: Genre Distribution + Directors/Actors */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Genres Distribution (Horizontal Bar Chart) */}
        <div className="glass p-6 rounded-2xl border border-white/5 flex flex-col justify-between">
          <SectionTitle emoji="🎭" title="En Çok İzlenen Türler" />
          <div className="space-y-4 flex-grow flex flex-col justify-center">
            {genreDistribution.slice(0, 10).map((item) => {
              const widthPercent = (item.count / maxGenreCount) * 100;
              return (
                <Link
                  key={item.name}
                  href={`/genre/${encodeURIComponent(item.name)}`}
                  className="block space-y-1.5 group"
                >
                  <div className="flex justify-between text-xs font-semibold text-zinc-400">
                    <span className="group-hover:text-white transition-colors flex items-center gap-1">
                      {item.name}
                      <ArrowUpRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity text-brand-primary" />
                    </span>
                    <span className="text-zinc-300 font-bold">{item.count} yapım</span>
                  </div>
                  <div className="w-full bg-zinc-950/60 rounded-full h-2.5 overflow-hidden border border-white/5">
                    <div
                      style={{ width: `${widthPercent}%` }}
                      className="bg-gradient-to-r from-red-500 to-rose-500 h-full rounded-full shadow-[0_0_10px_rgba(239,68,68,0.3)] group-hover:from-red-400 group-hover:to-rose-400 transition-all duration-300"
                    ></div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Top Directors & Actors Leaderboard */}
        <div className="glass p-6 rounded-2xl border border-white/5 flex flex-col gap-6">
          <div>
            <h3 className="text-sm font-extrabold uppercase tracking-wider text-zinc-400 mb-4 flex items-center gap-2">
              <span>🎬</span> En Çok İzlenen Yönetmenler
            </h3>
            <div className="space-y-3">
              {topDirectors.map((item) => {
                const widthPercent = (item.count / maxDirectorCount) * 100;
                return (
                  <Link
                    key={item.name}
                    href={`/director/${encodeURIComponent(item.name)}`}
                    className="flex items-center gap-4 group"
                  >
                    <span className="w-32 text-xs font-bold text-zinc-300 truncate group-hover:text-white transition-colors flex items-center gap-1">
                      {item.name}
                      <ArrowUpRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity text-brand-accent shrink-0" />
                    </span>
                    <div className="flex-grow bg-zinc-950/60 rounded-full h-2 overflow-hidden border border-white/5">
                      <div
                        style={{ width: `${widthPercent}%` }}
                        className="bg-brand-accent h-full rounded-full shadow-[0_0_10px_rgba(245,158,11,0.3)] group-hover:shadow-[0_0_15px_rgba(245,158,11,0.5)] transition-all duration-300"
                      ></div>
                    </div>
                    <span className="w-10 text-right text-xs font-extrabold text-brand-accent">{item.count}</span>
                  </Link>
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
                  <Link
                    key={item.name}
                    href={`/actor/${encodeURIComponent(item.name)}`}
                    className="flex items-center gap-4 group"
                  >
                    <span className="w-32 text-xs font-bold text-zinc-300 truncate group-hover:text-white transition-colors flex items-center gap-1">
                      {item.name}
                      <ArrowUpRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity text-brand-rose shrink-0" />
                    </span>
                    <div className="flex-grow bg-zinc-950/60 rounded-full h-2 overflow-hidden border border-white/5">
                      <div
                        style={{ width: `${widthPercent}%` }}
                        className="bg-brand-rose h-full rounded-full shadow-[0_0_10px_rgba(244,63,94,0.3)] group-hover:shadow-[0_0_15px_rgba(244,63,94,0.5)] transition-all duration-300"
                      ></div>
                    </div>
                    <span className="w-10 text-right text-xs font-extrabold text-brand-rose">{item.count}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Row 6: Movie Lists (Longest, Shortest, Most Controversial) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Longest Movies */}
        <div className="glass p-6 rounded-2xl border border-white/5">
          <SectionTitle emoji="⏱️" title="En Uzun Filmler" />
          <div className="space-y-3">
            {longestMovies.map((m, i) => (
              <Link
                key={m.imdbId}
                href={`/movie/${m.imdbId}`}
                className="flex items-center gap-3 group"
              >
                <span className="text-lg font-black text-zinc-700 w-6 text-center">{i + 1}</span>
                <div className="flex-grow min-w-0">
                  <span className="text-sm font-semibold text-zinc-300 truncate block group-hover:text-white transition-colors">
                    {m.title}
                  </span>
                  <span className="text-[11px] text-zinc-600">{m.year}</span>
                </div>
                <span className="text-xs font-black text-emerald-400 shrink-0">{m.runtime} dk</span>
              </Link>
            ))}
          </div>
        </div>

        {/* Shortest Movies */}
        <div className="glass p-6 rounded-2xl border border-white/5">
          <SectionTitle emoji="⚡" title="En Kısa Filmler" />
          <div className="space-y-3">
            {shortestMovies.map((m, i) => (
              <Link
                key={m.imdbId}
                href={`/movie/${m.imdbId}`}
                className="flex items-center gap-3 group"
              >
                <span className="text-lg font-black text-zinc-700 w-6 text-center">{i + 1}</span>
                <div className="flex-grow min-w-0">
                  <span className="text-sm font-semibold text-zinc-300 truncate block group-hover:text-white transition-colors">
                    {m.title}
                  </span>
                  <span className="text-[11px] text-zinc-600">{m.year}</span>
                </div>
                <span className="text-xs font-black text-sky-400 shrink-0">{m.runtime} dk</span>
              </Link>
            ))}
          </div>
        </div>

        {/* Most Controversial */}
        <div className="glass p-6 rounded-2xl border border-white/5">
          <SectionTitle emoji="🔥" title="En Tartışmalı Puanlar" />
          <p className="text-[10px] text-zinc-600 -mt-4 mb-4">IMDb ile en çok fark verdiğim filmler</p>
          <div className="space-y-3">
            {mostControversial.map((m, i) => (
              <Link
                key={m.imdbId}
                href={`/movie/${m.imdbId}`}
                className="flex items-center gap-3 group"
              >
                <span className="text-lg font-black text-zinc-700 w-6 text-center">{i + 1}</span>
                <div className="flex-grow min-w-0">
                  <span className="text-sm font-semibold text-zinc-300 truncate block group-hover:text-white transition-colors">
                    {m.title}
                  </span>
                  <div className="flex gap-2 text-[10px]">
                    <span className="text-red-400">Ben: {m.myRating}</span>
                    <span className="text-amber-400">IMDb: {m.imdbRating}</span>
                  </div>
                </div>
                <span className={`text-xs font-black shrink-0 px-2 py-0.5 rounded-full ${
                  m.myRating > m.imdbRating
                    ? 'text-emerald-400 bg-emerald-500/10'
                    : 'text-red-400 bg-red-500/10'
                }`}>
                  {m.myRating > m.imdbRating ? '+' : ''}{(m.myRating - m.imdbRating).toFixed(1)}
                </span>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Row 7: Top Rated Lists */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Highest rated by me */}
        <div className="glass p-6 rounded-2xl border border-white/5">
          <SectionTitle emoji="💖" title="En Yüksek Puanladıklarım" />
          <div className="space-y-3">
            {highestRatedByMe.map((m, i) => (
              <Link
                key={m.imdbId}
                href={`/movie/${m.imdbId}`}
                className="flex items-center gap-3 group"
              >
                <span className="text-lg font-black text-zinc-700 w-6 text-center">{i + 1}</span>
                <div className="flex-grow min-w-0">
                  <span className="text-sm font-semibold text-zinc-300 truncate block group-hover:text-white transition-colors">
                    {m.title}
                  </span>
                  <span className="text-[11px] text-zinc-600">{m.year} • IMDb {m.imdbRating}</span>
                </div>
                <span className="text-sm font-black text-brand-accent shrink-0">⭐ {m.myRating}</span>
              </Link>
            ))}
          </div>
        </div>

        {/* Highest rated on IMDb */}
        <div className="glass p-6 rounded-2xl border border-white/5">
          <SectionTitle emoji="🏆" title="IMDb&apos;de En Yüksek Puanlılar" />
          <div className="space-y-3">
            {highestRatedOnImdb.map((m, i) => (
              <Link
                key={m.imdbId}
                href={`/movie/${m.imdbId}`}
                className="flex items-center gap-3 group"
              >
                <span className="text-lg font-black text-zinc-700 w-6 text-center">{i + 1}</span>
                <div className="flex-grow min-w-0">
                  <span className="text-sm font-semibold text-zinc-300 truncate block group-hover:text-white transition-colors">
                    {m.title}
                  </span>
                  <span className="text-[11px] text-zinc-600">{m.year} • Ben: {m.myRating}</span>
                </div>
                <span className="text-sm font-black text-amber-400 shrink-0">⭐ {m.imdbRating}</span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
