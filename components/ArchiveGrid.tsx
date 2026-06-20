'use client';

import { useState } from 'react';
import { Film, Tv } from 'lucide-react';
import { Movie } from '@/types';
import MovieCard from '@/components/MovieCard';
import { Star, Clock } from 'lucide-react';

interface ArchiveGridProps {
  movies: Movie[];
}

function StatsBar({ movies }: { movies: Movie[] }) {
  const ratedMovies = movies.filter((m) => m.myRating > 0);
  const avgRating =
    ratedMovies.length > 0
      ? (
          ratedMovies.reduce((acc, m) => acc + m.myRating, 0) / ratedMovies.length
        ).toFixed(1)
      : 'N/A';
  const totalRuntimeHours = Math.round(
    movies.reduce((acc, m) => acc + (m.runtime || 0), 0) / 60
  );

  return (
    <div className="flex items-center gap-4 text-xs text-zinc-400">
      <span className="font-bold text-white">{movies.length} Yapım</span>
      <span className="flex items-center gap-1">
        <Star className="w-3.5 h-3.5 text-brand-accent fill-brand-accent" />
        Ort. {avgRating}
      </span>
      <span className="flex items-center gap-1">
        <Clock className="w-3.5 h-3.5 text-zinc-500" />
        {totalRuntimeHours} sa
      </span>
    </div>
  );
}

export default function ArchiveGrid({ movies }: ArchiveGridProps) {
  const cinemaMovies = movies.filter((m) => m.type === 'Movie');
  const tvContent = movies.filter(
    (m) =>
      m.type === 'TV Series' ||
      m.type === 'TV Episode' ||
      m.type === 'TV Special' ||
      m.type === 'TV Mini Series'
  );
  const otherContent = movies.filter(
    (m) =>
      m.type !== 'Movie' &&
      m.type !== 'TV Series' &&
      m.type !== 'TV Episode' &&
      m.type !== 'TV Special' &&
      m.type !== 'TV Mini Series'
  );

  // Determine default tab
  const defaultTab =
    cinemaMovies.length >= tvContent.length ? 'cinema' : 'tv';

  const [activeTab, setActiveTab] = useState<'cinema' | 'tv' | 'other'>(
    defaultTab
  );

  const tabs = [
    {
      id: 'cinema' as const,
      label: 'Sinema Filmleri',
      icon: Film,
      count: cinemaMovies.length,
      items: cinemaMovies,
      color: 'text-brand-primary',
      activeBg:
        'bg-gradient-to-r from-red-950/40 to-rose-950/40 border-brand-primary/30 text-white',
    },
    {
      id: 'tv' as const,
      label: 'Dizi & Bölümler',
      icon: Tv,
      count: tvContent.length,
      items: tvContent,
      color: 'text-brand-secondary',
      activeBg:
        'bg-gradient-to-r from-rose-950/40 to-red-950/40 border-brand-secondary/30 text-white',
    },
    ...(otherContent.length > 0
      ? [
          {
            id: 'other' as const,
            label: 'Diğer',
            icon: Film,
            count: otherContent.length,
            items: otherContent,
            color: 'text-zinc-400',
            activeBg: 'bg-zinc-800/60 border-zinc-700 text-white',
          },
        ]
      : []),
  ];

  const activeItems =
    activeTab === 'cinema'
      ? cinemaMovies
      : activeTab === 'tv'
      ? tvContent
      : otherContent;

  return (
    <div className="space-y-6">
      {/* Tab Bar */}
      <div className="flex items-center gap-2 flex-wrap">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl border text-sm font-bold transition-all duration-300 ${
                isActive
                  ? `${tab.activeBg} shadow-[0_0_20px_rgba(239,68,68,0.15)]`
                  : 'bg-zinc-950/60 border-white/5 text-zinc-400 hover:text-white hover:border-white/10'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-current' : tab.color}`} />
              {tab.label}
              <span
                className={`text-xs px-2 py-0.5 rounded-full font-black ${
                  isActive
                    ? 'bg-white/10 text-white'
                    : 'bg-zinc-800 text-zinc-400'
                }`}
              >
                {tab.count}
              </span>
            </button>
          );
        })}

        {/* Stats for active tab */}
        {activeItems.length > 0 && (
          <div className="ml-auto">
            <StatsBar movies={activeItems} />
          </div>
        )}
      </div>

      {/* Grid */}
      {activeItems.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
          {activeItems.map((movie) => (
            <MovieCard key={movie.imdbId} movie={movie} />
          ))}
        </div>
      ) : (
        <div className="glass p-12 rounded-2xl text-center border border-white/5">
          <Film className="w-12 h-12 text-zinc-600 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-zinc-300">Bu kategoride yapım yok</h3>
          <p className="text-zinc-500 text-sm mt-1">
            Seçilen filtreye ait bu türde herhangi bir kayıt bulunmuyor.
          </p>
        </div>
      )}
    </div>
  );
}
