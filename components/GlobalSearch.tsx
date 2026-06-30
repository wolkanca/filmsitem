'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Search, X, Film, Tv, User, Tag, List, Star, Loader2, Sparkles } from 'lucide-react';
import { Movie } from '@/types';
import { slugify, getRatingColor } from '@/lib/utils';
import Image from 'next/image';

interface SearchItem {
  id: string;
  type: 'movie' | 'actor' | 'director' | 'writer' | 'genre' | 'list';
  title: string;
  subtitle?: string;
  url: string;
  poster?: string;
  myRating?: number;
  imdbRating?: number;
}

export default function GlobalSearch() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [movies, setMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);

  const inputRef = useRef<HTMLInputElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  const resultsContainerRef = useRef<HTMLDivElement>(null);

  // Listen to open events from Navbar/other components and keyboard shortcuts
  useEffect(() => {
    const handleOpen = () => {
      setIsOpen(true);
      setQuery('');
      setSelectedIndex(0);
    };

    window.addEventListener('open-global-search', handleOpen);

    const handleKeyDown = (e: KeyboardEvent) => {
      const activeEl = document.activeElement;
      const isTyping = activeEl && (
        activeEl.tagName === 'INPUT' ||
        activeEl.tagName === 'TEXTAREA' ||
        activeEl.getAttribute('contenteditable') === 'true'
      );

      // Cmd+K, Ctrl+K or / (if not typing)
      if (
        (e.key === 'k' && (e.metaKey || e.ctrlKey)) ||
        (e.key === '/' && !isTyping)
      ) {
        e.preventDefault();
        setIsOpen((prev) => !prev);
        setQuery('');
        setSelectedIndex(0);
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('open-global-search', handleOpen);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  // Fetch movies database when search modal is opened
  useEffect(() => {
    if (isOpen && movies.length === 0 && !loading) {
      setLoading(true);
      fetch('/api/movies')
        .then((res) => res.json())
        .then((data) => {
          setMovies(data);
          setLoading(false);
        })
        .catch((err) => {
          console.error('Arama dizini yüklenemedi:', err);
          setLoading(false);
        });
    }
  }, [isOpen, movies, loading]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
      // Lock scroll
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Perform search matching
  const searchResults = useMemo(() => {
    if (!query.trim() || movies.length === 0) return null;

    const term = query.toLowerCase().trim();

    // 1. Movies & TV Series
    const matchedMovies = movies.filter(
      (m) =>
        m.title.toLowerCase().includes(term) ||
        m.originalTitle.toLowerCase().includes(term) ||
        (m.overview && m.overview.toLowerCase().includes(term)) ||
        m.year.toString().includes(term)
    );

    // 2. Actors (cast)
    const actorMatches = new Map<string, number>();
    movies.forEach((m) => {
      (m.cast || []).forEach((actor) => {
        if (actor.toLowerCase().includes(term)) {
          actorMatches.set(actor, (actorMatches.get(actor) || 0) + 1);
        }
      });
    });
    const matchedActors = Array.from(actorMatches.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);

    // 3. Directors
    const directorMatches = new Map<string, number>();
    movies.forEach((m) => {
      if (m.director) {
        m.director
          .split(',')
          .map((d) => d.trim())
          .filter(Boolean)
          .forEach((dir) => {
            if (dir.toLowerCase().includes(term)) {
              directorMatches.set(dir, (directorMatches.get(dir) || 0) + 1);
            }
          });
      }
    });
    const matchedDirectors = Array.from(directorMatches.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);

    // 4. Writers (senaristler)
    const writerMatches = new Map<string, number>();
    movies.forEach((m) => {
      (m.writers || []).forEach((writer) => {
        if (writer.toLowerCase().includes(term)) {
          writerMatches.set(writer, (writerMatches.get(writer) || 0) + 1);
        }
      });
    });
    const matchedWriters = Array.from(writerMatches.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);

    // 5. Genres (kategoriler)
    const genreMatches = new Map<string, number>();
    movies.forEach((m) => {
      (m.genres || []).forEach((g) => {
        if (g.toLowerCase().includes(term)) {
          genreMatches.set(g, (genreMatches.get(g) || 0) + 1);
        }
      });
    });
    const matchedGenres = Array.from(genreMatches.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);

    // 6. Lists (koleksiyonlar)
    const listMatches = new Map<string, number>();
    movies.forEach((m) => {
      (m.listName || []).forEach((ln) => {
        if (ln.toLowerCase().includes(term)) {
          listMatches.set(ln, (listMatches.get(ln) || 0) + 1);
        }
      });
    });
    const matchedLists = Array.from(listMatches.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);

    return {
      movies: matchedMovies,
      actors: matchedActors,
      directors: matchedDirectors,
      writers: matchedWriters,
      genres: matchedGenres,
      lists: matchedLists,
    };
  }, [query, movies]);

  // Flattened results for keyboard navigation
  const flattenedResults = useMemo(() => {
    if (!searchResults) return [];
    const list: SearchItem[] = [];

    // Movies (max 6)
    searchResults.movies.slice(0, 6).forEach((m) => {
      list.push({
        id: `movie-${m.imdbId}`,
        type: 'movie',
        title: m.title,
        subtitle: `${m.year} • ${
          m.type === 'Movie'
            ? 'Sinema Filmi'
            : m.type === 'TV Series'
            ? 'Dizi'
            : m.type
        }`,
        url: `/movie/${m.imdbId}`,
        poster: m.poster,
        myRating: m.myRating,
        imdbRating: m.imdbRating,
      });
    });

    // Actors (max 4)
    searchResults.actors.slice(0, 4).forEach((a) => {
      list.push({
        id: `actor-${a.name}`,
        type: 'actor',
        title: a.name,
        subtitle: `${a.count} Yapım`,
        url: `/actor/${encodeURIComponent(a.name)}`,
      });
    });

    // Directors (max 3)
    searchResults.directors.slice(0, 3).forEach((d) => {
      list.push({
        id: `director-${d.name}`,
        type: 'director',
        title: d.name,
        subtitle: `${d.count} Yapım`,
        url: `/director/${encodeURIComponent(d.name)}`,
      });
    });

    // Writers (max 3)
    searchResults.writers.slice(0, 3).forEach((w) => {
      list.push({
        id: `writer-${w.name}`,
        type: 'writer',
        title: w.name,
        subtitle: `${w.count} Yapım`,
        url: `/writer/${encodeURIComponent(w.name)}`,
      });
    });

    // Genres (max 3)
    searchResults.genres.slice(0, 3).forEach((g) => {
      list.push({
        id: `genre-${g.name}`,
        type: 'genre',
        title: g.name,
        subtitle: `${g.count} Yapım`,
        url: `/genre/${encodeURIComponent(g.name)}`,
      });
    });

    // Lists (max 3)
    searchResults.lists.slice(0, 3).forEach((l) => {
      list.push({
        id: `list-${l.name}`,
        type: 'list',
        title: l.name,
        subtitle: `${l.count} Yapım`,
        url: `/list/${slugify(l.name)}`,
      });
    });

    return list;
  }, [searchResults]);

  // Handle keyboard navigation inside modal
  useEffect(() => {
    if (!isOpen || flattenedResults.length === 0) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % flattenedResults.length);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(
          (prev) => (prev - 1 + flattenedResults.length) % flattenedResults.length
        );
      } else if (e.key === 'Enter') {
        e.preventDefault();
        const selected = flattenedResults[selectedIndex];
        if (selected) {
          router.push(selected.url);
          setIsOpen(false);
        }
      } else if (e.key === 'Escape') {
        e.preventDefault();
        setIsOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, flattenedResults, selectedIndex, router]);

  // Auto-scroll active item into view
  useEffect(() => {
    if (selectedIndex >= 0 && resultsContainerRef.current) {
      const activeEl = resultsContainerRef.current.querySelector(
        `[data-index="${selectedIndex}"]`
      );
      if (activeEl) {
        activeEl.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [selectedIndex]);

  // Reset index when query changes
  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  if (!isOpen) return null;

  // Icon selector based on type
  const getItemIcon = (type: string) => {
    switch (type) {
      case 'movie':
        return <Film className="w-4 h-4 text-zinc-400" />;
      case 'actor':
        return <User className="w-4 h-4 text-amber-500" />;
      case 'director':
        return <User className="w-4 h-4 text-red-500" />;
      case 'writer':
        return <User className="w-4 h-4 text-rose-400" />;
      case 'genre':
        return <Tag className="w-4 h-4 text-teal-400" />;
      case 'list':
        return <List className="w-4 h-4 text-sky-400" />;
      default:
        return <Search className="w-4 h-4 text-zinc-500" />;
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black/75 backdrop-blur-md flex items-start justify-center pt-[10vh] p-4 animate-fade-in">
      {/* Click outside backdrop to close */}
      <div className="absolute inset-0 -z-10" onClick={() => setIsOpen(false)} />

      {/* Main Search Panel */}
      <div
        ref={modalRef}
        className="w-full max-w-2xl bg-zinc-950/95 border border-white/10 rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[75vh]"
      >
        {/* Search Input Box */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-white/5 relative">
          {loading ? (
            <Loader2 className="w-5 h-5 text-brand-primary animate-spin shrink-0" />
          ) : (
            <Search className="w-5 h-5 text-zinc-400 shrink-0" />
          )}

          <input
            ref={inputRef}
            type="text"
            placeholder="Yapım, oyuncu, yönetmen, senarist, tür veya liste adı ara..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-grow bg-transparent text-white placeholder-zinc-500 border-none outline-none focus:ring-0 text-sm font-medium pr-10"
          />

          <div className="flex items-center gap-2">
            {query && (
              <button
                onClick={() => setQuery('')}
                className="p-1 rounded-lg text-zinc-500 hover:text-white hover:bg-white/5 transition-colors"
                title="Aramayı Temizle"
              >
                <X className="w-4 h-4" />
              </button>
            )}
            <kbd className="hidden sm:inline-block px-2 py-0.5 text-[9px] font-black bg-zinc-900 text-zinc-500 rounded-md border border-white/5 select-none leading-none">
              ESC
            </kbd>
          </div>
        </div>

        {/* Search Results */}
        <div
          ref={resultsContainerRef}
          className="flex-grow overflow-y-auto p-3 custom-scrollbar"
        >
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12 gap-3">
              <Loader2 className="w-6 h-6 text-brand-primary animate-spin" />
              <span className="text-xs text-zinc-500 font-medium">Arama dizini hazırlanıyor...</span>
            </div>
          ) : !query.trim() ? (
            // Empty state helper
            <div className="py-10 px-6 text-center space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-center mx-auto text-zinc-400">
                <Sparkles className="w-6 h-6 text-brand-primary animate-pulse-subtle" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-zinc-200">Kapsamlı Arama Sistemi</h3>
                <p className="text-xs text-zinc-500 max-w-sm mx-auto mt-1 leading-relaxed">
                  Kütüphanedeki tüm filmleri, dizileri, oyuncuları, yönetmenleri, senaristleri, türleri ve listeleri anında bulabilirsiniz.
                </p>
              </div>
              <div className="flex flex-wrap items-center justify-center gap-2 pt-2 text-[10px] text-zinc-500 font-semibold uppercase tracking-wider">
                <span className="bg-zinc-900 border border-white/5 px-2 py-1 rounded-lg">🎬 Film & Dizi</span>
                <span className="bg-zinc-900 border border-white/5 px-2 py-1 rounded-lg">⭐ Oyuncu</span>
                <span className="bg-zinc-900 border border-white/5 px-2 py-1 rounded-lg">🎥 Yönetmen</span>
                <span className="bg-zinc-900 border border-white/5 px-2 py-1 rounded-lg">✍️ Senarist</span>
              </div>
            </div>
          ) : flattenedResults.length === 0 ? (
            // No results found
            <div className="py-12 text-center">
              <span className="text-3xl">🔍</span>
              <h3 className="text-sm font-bold text-zinc-300 mt-3">Sonuç Bulunamadı</h3>
              <p className="text-xs text-zinc-500 mt-1 max-w-xs mx-auto">
                &quot;{query}&quot; araması için eşleşen bir yapım, kişi, tür veya liste bulunamadı.
              </p>
            </div>
          ) : (
            // Results list grouped by category
            <div className="space-y-4">
              {/* Categorized rendering using flattenedResults selection indexing */}
              {(() => {
                let cumulativeIndex = 0;

                const renderCategory = (
                  title: string,
                  items: any[],
                  type: SearchItem['type']
                ) => {
                  if (items.length === 0) return null;

                  const categoryStartIndex = cumulativeIndex;
                  cumulativeIndex += items.length;

                  return (
                    <div key={type} className="space-y-1">
                      <h4 className="text-[10px] font-black text-zinc-500 uppercase tracking-widest px-3 py-1">
                        {title}
                      </h4>
                      <div className="space-y-0.5">
                        {items.map((item, index) => {
                          const flatIndex = categoryStartIndex + index;
                          const isSelected = selectedIndex === flatIndex;

                          return (
                            <button
                              key={item.id}
                              data-index={flatIndex}
                              onClick={() => {
                                router.push(item.url);
                                setIsOpen(false);
                              }}
                              className={`w-full text-left flex items-center justify-between p-2 rounded-xl transition-all duration-150 ${
                                isSelected
                                  ? 'bg-brand-primary/10 border border-brand-primary/25 text-white shadow-[0_0_15px_rgba(239,68,68,0.08)]'
                                  : 'border border-transparent hover:bg-white/5 text-zinc-300'
                              }`}
                            >
                              <div className="flex items-center gap-3 min-w-0">
                                {/* Small poster for movies */}
                                {type === 'movie' ? (
                                  <div className="relative w-8 h-12 bg-zinc-900 border border-white/5 rounded-md overflow-hidden shrink-0">
                                    {item.poster ? (
                                      <Image
                                        src={item.poster}
                                        alt={item.title}
                                        fill
                                        sizes="32px"
                                        className="object-cover"
                                      />
                                    ) : (
                                      <div className="flex items-center justify-center h-full w-full text-[10px]">
                                        🎬
                                      </div>
                                    )}
                                  </div>
                                ) : (
                                  <div className="w-8 h-8 bg-zinc-900 border border-white/5 rounded-xl flex items-center justify-center shrink-0">
                                    {getItemIcon(type)}
                                  </div>
                                )}

                                <div className="min-w-0">
                                  <span className="block text-sm font-bold text-zinc-200 truncate">
                                    {item.title}
                                  </span>
                                  <span className="block text-[11px] text-zinc-500 font-semibold">
                                    {item.subtitle}
                                  </span>
                                </div>
                              </div>

                              {/* Right side badges for rating / count */}
                              {type === 'movie' && (item.myRating || item.imdbRating) ? (
                                <div className="flex items-center gap-2">
                                  {item.myRating && (
                                    <span className={`text-[11px] font-black flex items-center gap-0.5 px-2 py-0.5 rounded bg-brand-primary/10 border border-brand-primary/20 ${getRatingColor(item.myRating)}`}>
                                      <Star className="w-3 h-3 text-brand-accent fill-brand-accent shrink-0" />
                                      {item.myRating}
                                    </span>
                                  )}
                                  {item.imdbRating && (
                                    <span className="text-[10px] font-bold text-zinc-400 bg-zinc-900 border border-white/5 px-1.5 py-0.5 rounded leading-none shrink-0">
                                      IMDb {item.imdbRating}
                                    </span>
                                  )}
                                </div>
                              ) : (
                                <span className="text-[10px] font-bold text-zinc-500 bg-zinc-900 border border-white/5 px-2 py-0.5 rounded-lg">
                                  {item.subtitle}
                                </span>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                };

                // Split flattened list back into category layouts for visually distinct groups
                const moviesList = flattenedResults.filter((r) => r.type === 'movie');
                const actorsList = flattenedResults.filter((r) => r.type === 'actor');
                const directorsList = flattenedResults.filter((r) => r.type === 'director');
                const writersList = flattenedResults.filter((r) => r.type === 'writer');
                const genresList = flattenedResults.filter((r) => r.type === 'genre');
                const listsList = flattenedResults.filter((r) => r.type === 'list');

                return (
                  <>
                    {renderCategory('Yapımlar (Film & Dizi)', moviesList, 'movie')}
                    {renderCategory('Oyuncular', actorsList, 'actor')}
                    {renderCategory('Yönetmenler', directorsList, 'director')}
                    {renderCategory('Senaristler', writersList, 'writer')}
                    {renderCategory('Kategoriler / Türler', genresList, 'genre')}
                    {renderCategory('Koleksiyonlar', listsList, 'list')}
                  </>
                );
              })()}
            </div>
          )}
        </div>

        {/* Modal Footer Controls */}
        <div className="px-5 py-3.5 bg-zinc-900/60 border-t border-white/5 flex items-center justify-between text-[11px] text-zinc-500 font-semibold select-none">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-zinc-950 border border-white/5 rounded">↑↓</kbd> Gezinme
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-zinc-950 border border-white/5 rounded">Enter</kbd> Seç
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-zinc-950 border border-white/5 rounded">ESC</kbd> Kapat
            </span>
          </div>
          <div>
            Kütüphanede <strong className="text-zinc-400">{movies.length}</strong> Yapım Var
          </div>
        </div>
      </div>
    </div>
  );
}
