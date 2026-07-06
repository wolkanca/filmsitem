'use client';

import { useMemo, useState } from 'react';
import ArchiveGrid from '@/components/ArchiveGrid';
import { Movie } from '@/types';

type TabType = 'all' | 'movie' | 'tv' | 'other';

function isTV(movie: Movie) {
    const type = String(movie.type || '').trim();

    return (
        type === 'TV Series' ||
        type === 'TV Mini Series' ||
        type === 'TV Movie' ||
        type === 'TV Special' ||
        type === 'TV Episode' ||
        type === 'tvSeries' ||
        type === 'tvMiniSeries' ||
        type.startsWith('TV ')
    );
}

function isMovie(movie: Movie) {
    return String(movie.type || '').trim() === 'Movie';
}

function isOther(movie: Movie) {
    return !isMovie(movie) && !isTV(movie);
}

function filterByTab(movies: Movie[], tab: TabType) {
    if (tab === 'movie') return movies.filter(isMovie);
    if (tab === 'tv') return movies.filter(isTV);
    if (tab === 'other') return movies.filter(isOther);
    return movies;
}

export default function ListDetailTabs({ movies }: { movies: Movie[] }) {
    const [activeTab, setActiveTab] = useState<TabType>('all');

    const tabCounts = useMemo(
        () => ({
            all: movies.length,
            movie: movies.filter(isMovie).length,
            tv: movies.filter(isTV).length,
            other: movies.filter(isOther).length,
        }),
        [movies]
    );

    const filteredMovies = useMemo(
        () => filterByTab(movies, activeTab),
        [movies, activeTab]
    );

    const tabs: { key: TabType; label: string }[] = [
        { key: 'all', label: 'Tümü' },
        { key: 'movie', label: 'Filmler' },
        { key: 'tv', label: 'Diziler' },
        { key: 'other', label: 'Diğer' },
    ];

    return (
        <div className="space-y-8">
            <div className="grid grid-cols-2 sm:flex sm:items-center gap-3 w-full sm:w-fit">
                {tabs
                    .filter((tab) => tab.key === 'all' || tabCounts[tab.key] > 0)
                    .map((tab) => {
                        const active = activeTab === tab.key;

                        return (
                            <button
                                key={tab.key}
                                type="button"
                                onClick={() => setActiveTab(tab.key)}
                                className={`relative flex items-center justify-center gap-2 px-4 sm:px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 ${active
                                    ? 'bg-brand-primary border border-brand-primary text-white shadow-[0_4px_15px_rgba(239,68,68,0.35)]'
                                    : 'bg-zinc-950/60 border border-white/10 text-zinc-400 hover:text-white hover:bg-zinc-900'
                                    }`}
                            >
                                {tab.label}

                                <span
                                    className={`text-[10px] font-black px-1.5 py-0.5 rounded-md leading-none ${active ? 'bg-white/20 text-white' : 'bg-zinc-800 text-zinc-400'
                                        }`}
                                >
                                    {tabCounts[tab.key]}
                                </span>
                            </button>
                        );
                    })}
            </div>

            <ArchiveGrid movies={filteredMovies} flat defaultSort="watchdate-desc" />
        </div>
    );
}