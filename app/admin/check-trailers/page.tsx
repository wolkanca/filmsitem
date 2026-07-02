'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft, Film, Play, AlertTriangle, CheckCircle, Trash2, Edit2, Search,
  RefreshCw, Wrench, Sparkles, X, Check, ExternalLink, Loader2, StopCircle, Eye,
  Youtube
} from 'lucide-react';
import { Movie } from '@/types';

interface YtSearchResult {
  videoId: string;
  title: string;
  owner: string;
  length: string;
  viewCount: string;
  thumbnail: string;
}

interface BrokenMovieState {
  movie: Movie;
  status: string;
  suggestedId?: string | null;
  isSuggesting: boolean;
  suggestError: string;
  isSaving: boolean;
  saveError: string;
  isDeleted: boolean;
  inputVal: string;
  showPreview: boolean;
  previewVideoId?: string; // currently playing/previewing video ID
  isFixed: boolean;
  // YouTube search states
  showYtSearch: boolean;
  isSearchingYt: boolean;
  ytSearchError: string;
  ytSearchQuery: string;
  ytSearchResults?: YtSearchResult[] | null;
}

export default function CheckTrailersPage() {
  const router = useRouter();
  const [authorized, setAuthorized] = useState(false);
  const [apiKey, setApiKey] = useState('e3d09f93ae63545fe155c5bde68ca970');
  
  // Movie lists
  const [allMovies, setAllMovies] = useState<Movie[]>([]);
  const [moviesLoading, setMoviesLoading] = useState(false);
  
  // Scanning state
  const [checking, setChecking] = useState(false);
  const [checkedCount, setCheckedCount] = useState(0);
  const [totalToCheck, setTotalToCheck] = useState(0);
  const [brokenMovies, setBrokenMovies] = useState<BrokenMovieState[]>([]);
  const [scanFinished, setScanFinished] = useState(false);
  const [generalError, setGeneralError] = useState('');
  
  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [filterMode, setFilterMode] = useState<'all' | 'suggested' | 'fixed'>('all');

  const checkingRef = useRef(false);

  // Check admin session
  useEffect(() => {
    const cookies = document.cookie.split(';');
    const isAdmin = cookies.some((c) => c.trim().startsWith('is_admin=true'));
    if (!isAdmin) {
      router.push('/admin');
    } else {
      setAuthorized(true);
    }
  }, [router]);

  // Load all movies on mount to prepare scan
  useEffect(() => {
    if (!authorized) return;
    setMoviesLoading(true);
    fetch('/api/movies')
      .then((r) => {
        if (!r.ok) throw new Error('Filmler yüklenemedi.');
        return r.json();
      })
      .then((data: Movie[]) => {
        setAllMovies(data);
      })
      .catch((err) => {
        setGeneralError(err.message || 'Veri yüklenirken hata oluştu.');
      })
      .finally(() => setMoviesLoading(false));
  }, [authorized]);

  const stopScan = () => {
    checkingRef.current = false;
    setChecking(false);
  };

  const startScan = async () => {
    setGeneralError('');
    setScanFinished(false);
    setBrokenMovies([]);
    setCheckedCount(0);
    
    const withTrailers = allMovies.filter(m => m.trailerYoutubeId && m.trailerYoutubeId.trim() !== '');
    if (withTrailers.length === 0) {
      setGeneralError('Kitaplıkta fragmanı olan film bulunamadı.');
      return;
    }

    setTotalToCheck(withTrailers.length);
    setChecking(true);
    checkingRef.current = true;

    const concurrencyLimit = 5;
    const queue = [...withTrailers];
    let processed = 0;

    const runNext = async (): Promise<void> => {
      if (queue.length === 0 || !checkingRef.current) return;
      const movie = queue.shift();
      if (!movie) return;

      try {
        const res = await fetch(`/api/admin/check-trailer?id=${movie.trailerYoutubeId}`);
        const data = await res.json();
        
        if (!checkingRef.current) return;

        if (!data.valid) {
          setBrokenMovies(prev => [
            ...prev,
            {
              movie,
              status: data.error || `Hata (Kod: ${data.status})`,
              isSuggesting: false,
              suggestError: '',
              isSaving: false,
              saveError: '',
              isDeleted: false,
              inputVal: '',
              showPreview: false,
              isFixed: false,
              showYtSearch: false,
              isSearchingYt: false,
              ytSearchError: '',
              ytSearchQuery: `${movie.title} ${movie.year} fragman`,
              ytSearchResults: null,
            }
          ]);
        }
      } catch (err) {
        if (!checkingRef.current) return;
        setBrokenMovies(prev => [
          ...prev,
          {
            movie,
            status: 'Ağ veya API bağlantı hatası.',
            isSuggesting: false,
            suggestError: '',
            isSaving: false,
            saveError: '',
            isDeleted: false,
            inputVal: '',
            showPreview: false,
            isFixed: false,
            showYtSearch: false,
            isSearchingYt: false,
            ytSearchError: '',
            ytSearchQuery: `${movie.title} ${movie.year} fragman`,
            ytSearchResults: null,
          }
        ]);
      } finally {
        processed++;
        setCheckedCount(processed);
        
        if (processed === withTrailers.length) {
          setChecking(false);
          checkingRef.current = false;
          setScanFinished(true);
        } else {
          await runNext();
        }
      }
    };

    // Launch initial workers
    const workers = [];
    for (let i = 0; i < Math.min(concurrencyLimit, queue.length); i++) {
      workers.push(runNext());
    }
    await Promise.all(workers);
  };

  // Suggest a new trailer from TMDb for a single movie
  const getSuggestion = async (imdbId: string) => {
    setBrokenMovies(prev => prev.map(item => {
      if (item.movie.imdbId !== imdbId) return item;
      return { ...item, isSuggesting: true, suggestError: '' };
    }));

    try {
      const res = await fetch(`/api/admin/suggest-trailer?imdbId=${imdbId}&apiKey=${apiKey}`);
      const data = await res.json();

      setBrokenMovies(prev => prev.map(item => {
        if (item.movie.imdbId !== imdbId) return item;
        if (!res.ok) {
          return { ...item, isSuggesting: false, suggestError: data.error || 'Fragman bulunamadı.' };
        }
        return {
          ...item,
          isSuggesting: false,
          suggestedId: data.trailerYoutubeId,
          inputVal: data.trailerYoutubeId || '',
        };
      }));
    } catch (err) {
      setBrokenMovies(prev => prev.map(item => {
        if (item.movie.imdbId !== imdbId) return item;
        return { ...item, isSuggesting: false, suggestError: 'Bağlantı hatası oluştu.' };
      }));
    }
  };

  // Search YouTube
  const handleSearchYoutube = async (imdbId: string, searchPhrase: string) => {
    setBrokenMovies(prev => prev.map(item => {
      if (item.movie.imdbId !== imdbId) return item;
      return { ...item, isSearchingYt: true, ytSearchError: '', ytSearchQuery: searchPhrase };
    }));

    try {
      const res = await fetch(`/api/admin/search-youtube?q=${encodeURIComponent(searchPhrase)}`);
      const data = await res.json();

      setBrokenMovies(prev => prev.map(item => {
        if (item.movie.imdbId !== imdbId) return item;
        if (!res.ok) {
          return { ...item, isSearchingYt: false, ytSearchError: data.error || 'Arama hatası.' };
        }
        return {
          ...item,
          isSearchingYt: false,
          ytSearchResults: data.results,
        };
      }));
    } catch (err) {
      setBrokenMovies(prev => prev.map(item => {
        if (item.movie.imdbId !== imdbId) return item;
        return { ...item, isSearchingYt: false, ytSearchError: 'Ağ hatası oluştu.' };
      }));
    }
  };

  // Toggle YouTube search panel
  const toggleYtSearch = (imdbId: string, defaultQuery: string) => {
    setBrokenMovies(prev => prev.map(item => {
      if (item.movie.imdbId !== imdbId) return item;
      const willShow = !item.showYtSearch;
      
      // Auto search on first open
      if (willShow && !item.ytSearchResults && !item.isSearchingYt) {
        setTimeout(() => handleSearchYoutube(imdbId, defaultQuery), 50);
      }

      return { ...item, showYtSearch: willShow };
    }));
  };

  // Save new trailer Youtube ID (can be manual, suggestion, or YT search selection)
  const saveTrailer = async (imdbId: string, newId: string) => {
    let cleanId = newId.trim();
    if (!cleanId) return;

    // Parse full YouTube URL to extract video ID
    const ytMatch = cleanId.match(/(?:v=|youtu\.be\/|embed\/)([A-Za-z0-9_-]{11})/);
    if (ytMatch) cleanId = ytMatch[1];

    setBrokenMovies(prev => prev.map(item => {
      if (item.movie.imdbId !== imdbId) return item;
      return { ...item, isSaving: true, saveError: '' };
    }));

    try {
      const res = await fetch(`/api/movies/${imdbId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ trailerYoutubeId: cleanId }),
      });
      const data = await res.json();

      setBrokenMovies(prev => prev.map(item => {
        if (item.movie.imdbId !== imdbId) return item;
        if (!res.ok) {
          return { ...item, isSaving: false, saveError: data.error || 'Kaydetme hatası.' };
        }
        // Update local film array reference as well
        setAllMovies(all => all.map(m => m.imdbId === imdbId ? { ...m, trailerYoutubeId: cleanId } : m));
        return { ...item, isSaving: false, isFixed: true, movie: { ...item.movie, trailerYoutubeId: cleanId } };
      }));
    } catch (err) {
      setBrokenMovies(prev => prev.map(item => {
        if (item.movie.imdbId !== imdbId) return item;
        return { ...item, isSaving: false, saveError: 'Bağlantı hatası oluştu.' };
      }));
    }
  };

  // Delete the trailer altogether
  const deleteTrailer = async (imdbId: string) => {
    if (!confirm('Fragmanı kaldırmak istediğinize emin misiniz?')) return;

    setBrokenMovies(prev => prev.map(item => {
      if (item.movie.imdbId !== imdbId) return item;
      return { ...item, isSaving: true, saveError: '' };
    }));

    try {
      const res = await fetch(`/api/movies/${imdbId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ trailerYoutubeId: '' }),
      });
      const data = await res.json();

      setBrokenMovies(prev => prev.map(item => {
        if (item.movie.imdbId !== imdbId) return item;
        if (!res.ok) {
          return { ...item, isSaving: false, saveError: data.error || 'Kaydetme hatası.' };
        }
        setAllMovies(all => all.map(m => m.imdbId === imdbId ? { ...m, trailerYoutubeId: '' } : m));
        return { ...item, isSaving: false, isDeleted: true, isFixed: true, movie: { ...item.movie, trailerYoutubeId: '' } };
      }));
    } catch (err) {
      setBrokenMovies(prev => prev.map(item => {
        if (item.movie.imdbId !== imdbId) return item;
        return { ...item, isSaving: false, saveError: 'Bağlantı hatası oluştu.' };
      }));
    }
  };

  const setInputVal = (imdbId: string, val: string) => {
    setBrokenMovies(prev => prev.map(item => {
      if (item.movie.imdbId !== imdbId) return item;
      return { ...item, inputVal: val };
    }));
  };

  const togglePreview = (imdbId: string, specificVideoId?: string) => {
    setBrokenMovies(prev => prev.map(item => {
      if (item.movie.imdbId !== imdbId) return item;
      
      const nextShowPreview = specificVideoId 
        ? true 
        : (item.previewVideoId && item.previewVideoId !== item.movie.trailerYoutubeId)
          ? true
          : !item.showPreview;

      return {
        ...item,
        showPreview: nextShowPreview,
        previewVideoId: specificVideoId || item.movie.trailerYoutubeId,
      };
    }));
  };

  const setYtQueryState = (imdbId: string, query: string) => {
    setBrokenMovies(prev => prev.map(item => {
      if (item.movie.imdbId !== imdbId) return item;
      return { ...item, ytSearchQuery: query };
    }));
  };

  // Filter broken movies list
  const filteredBroken = brokenMovies.filter(item => {
    // Text search
    const query = searchQuery.toLowerCase().trim();
    if (query) {
      const titleMatch = item.movie.title.toLowerCase().includes(query);
      const idMatch = item.movie.imdbId.toLowerCase().includes(query);
      if (!titleMatch && !idMatch) return false;
    }

    // Filter modes
    if (filterMode === 'suggested') return !!item.suggestedId && !item.isFixed;
    if (filterMode === 'fixed') return item.isFixed;
    return !item.isFixed; // 'all' displays unresolved broken ones
  });

  const percentage = totalToCheck > 0 ? Math.round((checkedCount / totalToCheck) * 100) : 0;

  if (!authorized) return null;

  return (
    <div className="max-w-5xl mx-auto py-8 px-4 sm:px-6">
      {/* Back button */}
      <Link
        href="/admin"
        className="inline-flex items-center gap-2 text-zinc-400 hover:text-white mb-6 transition-colors font-bold text-xs"
      >
        <ArrowLeft className="w-4 h-4" /> Yönetici Kontrol Paneline Dön
      </Link>

      <div className="glass-card p-6 sm:p-8 rounded-3xl relative overflow-hidden border border-card-border/50 bg-gradient-to-br from-zinc-950/60 to-red-950/5">
        <div className="absolute top-0 right-0 w-96 h-96 bg-brand-primary/5 rounded-full blur-[100px] -z-10" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-brand-accent/5 rounded-full blur-[100px] -z-10" />

        {/* Title */}
        <div className="flex items-start gap-4 mb-8">
          <div className="p-3.5 bg-red-500/10 rounded-2xl text-brand-primary border border-brand-primary/20">
            <Wrench className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-3xl font-black text-white tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white via-zinc-200 to-zinc-400">
              Bozuk Fragman Kontrolcü
            </h1>
            <p className="text-zinc-400 text-sm mt-1">
              Kitaplığınızdaki tüm filmlerin fragmanlarını YouTube üzerinden tarayarak çalışmayan (silinmiş, gizli vb.) olanları tespit edin ve YouTube&apos;dan doğrudan arayarak güncelleyin.
            </p>
          </div>
        </div>

        {generalError && (
          <div className="mb-6 p-4 bg-red-950/30 border border-red-500/20 text-red-200 rounded-2xl flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
            <p className="text-sm font-semibold">{generalError}</p>
          </div>
        )}

        {/* Main Controls Panel */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-zinc-900/30 p-5 rounded-2xl border border-white/5 space-y-3">
              <label htmlFor="apiKey" className="block text-xs font-bold text-zinc-400 uppercase tracking-wider">
                TMDb API Anahtarı (TMDb Önerisi Almak İçin - Opsiyonel)
              </label>
              <input
                id="apiKey"
                type="text"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="TMDb API key girin..."
                className="w-full bg-zinc-950/50 border border-zinc-800 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:ring-1 focus:ring-red-500/50 transition-all font-mono text-sm"
              />
              <p className="text-zinc-500 text-[11px]">
                Otomatik TMDb fragman önerileri getirebilmek için gereklidir. Doğrudan YouTube araması için API key gerekmez.
              </p>
            </div>
          </div>

          <div className="flex flex-col justify-center">
            {checking ? (
              <button
                onClick={stopScan}
                className="w-full py-4 px-6 rounded-2xl bg-zinc-900 hover:bg-zinc-800 border border-red-500/30 hover:border-red-500/50 text-red-400 font-bold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg"
              >
                <StopCircle className="w-5 h-5" /> Taramayı Durdur
              </button>
            ) : (
              <button
                onClick={startScan}
                disabled={moviesLoading}
                className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-brand-primary to-brand-secondary hover:opacity-95 text-white font-bold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg shadow-brand-primary/20 disabled:opacity-50"
              >
                {moviesLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" /> Filmler Hazırlanıyor...
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-5 h-5" /> Fragmanları Doğrulamaya Başla
                  </>
                )}
              </button>
            )}
          </div>
        </div>

        {/* Scan Status & Progress Bar */}
        {(checking || checkedCount > 0) && (
          <div className="bg-zinc-950/40 p-6 rounded-3xl border border-white/5 space-y-4 mb-8">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-sm font-bold text-zinc-300">
                {checking ? (
                  <RefreshCw className="w-4 h-4 text-brand-primary animate-spin" />
                ) : (
                  <CheckCircle className="w-4 h-4 text-emerald-500" />
                )}
                {checking ? 'Kitaplık Taranıyor...' : 'Tarama Tamamlandı'}
              </span>
              <span className="text-xs font-mono text-zinc-400">
                {checkedCount} / {totalToCheck} Yapım Kontrol Edildi
              </span>
            </div>

            {/* Progress line */}
            <div className="h-3 bg-zinc-900 rounded-full overflow-hidden border border-zinc-800">
              <div
                className="h-full bg-gradient-to-r from-brand-primary to-brand-secondary rounded-full transition-all duration-300 ease-out"
                style={{ width: `${percentage}%` }}
              />
            </div>

            {/* Stats row */}
            <div className="grid grid-cols-3 gap-4 pt-3 border-t border-zinc-900/60">
              <div className="text-center">
                <span className="text-zinc-500 text-[10px] font-bold uppercase tracking-wider">İlerleme</span>
                <span className="block text-xl font-black text-white mt-0.5">%{percentage}</span>
              </div>
              <div className="text-center">
                <span className="text-zinc-500 text-[10px] font-bold uppercase tracking-wider">Taranan</span>
                <span className="block text-xl font-black text-zinc-300 mt-0.5">{checkedCount}</span>
              </div>
              <div className="text-center">
                <span className="text-zinc-500 text-[10px] font-bold uppercase tracking-wider text-red-400">Bozuk Bulunan</span>
                <span className={`block text-xl font-black mt-0.5 ${brokenMovies.length > 0 ? 'text-red-500' : 'text-zinc-400'}`}>
                  {brokenMovies.length}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Results Section */}
        {checkedCount > 0 && (
          <div className="space-y-6 pt-6 border-t border-zinc-900/80">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-900 pb-5">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-red-500/10 rounded-xl text-red-400">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-black text-white">Tespit Edilen Bozuk Fragmanlar</h2>
                  <p className="text-zinc-500 text-xs mt-0.5">Bulunan bozuk fragmanları aşağıdan güncelleyebilirsiniz.</p>
                </div>
              </div>

              {/* Status/Filters */}
              <div className="flex items-center gap-2 flex-wrap">
                {([
                  { key: 'all', label: 'Tümü', count: brokenMovies.filter(x => !x.isFixed).length },
                  { key: 'suggested', label: 'Önerisi Olanlar', count: brokenMovies.filter(x => !!x.suggestedId && !x.isFixed).length },
                  { key: 'fixed', label: 'Düzeltilenler', count: brokenMovies.filter(x => x.isFixed).length },
                ] as const).map(({ key, label, count }) => (
                  <button
                    key={key}
                    onClick={() => setFilterMode(key)}
                    className={`px-3 py-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                      filterMode === key
                        ? 'bg-zinc-900 border-zinc-700 text-white'
                        : 'bg-transparent border-transparent text-zinc-500 hover:text-zinc-300'
                    }`}
                  >
                    {label} <span className="text-[10px] ml-1 bg-zinc-900 px-1.5 py-0.5 rounded-md text-zinc-400">{count}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Search Input for Results */}
            <div className="relative">
              <Search className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Listelenen bozuk filmler içinde ara..."
                className="w-full bg-zinc-950/60 border border-zinc-900 focus:border-zinc-800 rounded-xl py-2.5 pl-10 pr-4 text-xs text-white focus:outline-none transition-all"
              />
            </div>

            {/* List */}
            {filteredBroken.length === 0 ? (
              <div className="text-center py-12 text-zinc-500 text-xs">
                {brokenMovies.length === 0
                  ? checking
                    ? 'Tarama devam ediyor, henüz bozuk fragman bulunmadı...'
                    : 'Harika! Hiç bozuk fragman bulunamadı veya henüz tarama başlatmadınız.'
                  : 'Filtreye uygun sonuç bulunamadı.'}
              </div>
            ) : (
              <div className="space-y-4">
                {filteredBroken.map((item) => {
                  const {
                    movie, status, suggestedId, isSuggesting, suggestError, isSaving, saveError,
                    isDeleted, isFixed, showPreview, previewVideoId, inputVal, showYtSearch,
                    isSearchingYt, ytSearchError, ytSearchQuery, ytSearchResults
                  } = item;

                  const defaultQuery = `${movie.title} ${movie.year} fragman`;

                  return (
                    <div
                      key={movie.imdbId}
                      className={`p-5 rounded-2xl border transition-all ${
                        isFixed
                          ? isDeleted
                            ? 'bg-zinc-950/20 border-zinc-900 opacity-60'
                            : 'bg-emerald-950/10 border-emerald-500/20'
                          : 'bg-zinc-950/40 border-zinc-800/80 hover:border-zinc-700/60'
                      }`}
                    >
                      {/* Top Header */}
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-14 bg-zinc-900 rounded overflow-hidden flex-shrink-0 border border-white/5">
                            {movie.poster ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={movie.poster} alt={movie.title} className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-zinc-700 font-bold text-[10px]">AFİŞ YOK</div>
                            )}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="text-sm font-extrabold text-zinc-200">{movie.title}</h3>
                              <span className="text-[10px] text-zinc-500">({movie.year})</span>
                            </div>
                            <p className="text-[10px] text-zinc-500 font-mono mt-0.5">
                              IMDb: <a href={`https://imdb.com/title/${movie.imdbId}`} target="_blank" rel="noreferrer" className="hover:underline text-blue-400">{movie.imdbId}</a>
                              {' · '} Türler: {movie.genres.join(', ')}
                            </p>
                            
                            {isFixed ? (
                              <div className="flex items-center gap-1 mt-2 text-xs font-bold text-emerald-400">
                                <CheckCircle className="w-3.5 h-3.5" />
                                {isDeleted ? 'Fragman başarıyla silindi' : `Fragman düzeltildi: ${movie.trailerYoutubeId}`}
                              </div>
                            ) : (
                              <div className="flex items-center gap-1.5 mt-2 text-xs font-semibold text-red-400">
                                <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                                Hata: {status}
                                <span className="text-zinc-500 text-[10px] font-mono">(Mevcut ID: {movie.trailerYoutubeId})</span>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Inline Actions */}
                        {!isFixed && (
                          <div className="flex items-center gap-2 ml-auto sm:ml-0 flex-wrap">
                            {/* Preview button */}
                            <button
                              onClick={() => togglePreview(movie.imdbId)}
                              className={`p-2 rounded-lg border text-xs font-bold transition-all cursor-pointer ${
                                showPreview && previewVideoId === movie.trailerYoutubeId ? 'bg-zinc-900 border-zinc-700 text-white' : 'bg-transparent border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-700'
                              }`}
                              title="Mevcut Fragmanı Önizle"
                            >
                              <Eye className="w-4 h-4" />
                            </button>

                            {/* YouTube Search button */}
                            <button
                              onClick={() => toggleYtSearch(movie.imdbId, defaultQuery)}
                              className={`px-3 py-2 rounded-lg border text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                                showYtSearch ? 'bg-red-600/20 border-red-500 text-red-400' : 'bg-zinc-900 hover:bg-zinc-800 border-zinc-800 text-zinc-300 hover:text-white'
                              }`}
                            >
                              <Youtube className="w-4 h-4 text-red-500 fill-red-500" />
                              YouTube&apos;da Ara
                            </button>

                            {/* Suggest button */}
                            <button
                              onClick={() => getSuggestion(movie.imdbId)}
                              disabled={isSuggesting}
                              className="px-3 py-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 hover:text-white text-xs font-bold flex items-center gap-1.5 transition-all disabled:opacity-50 cursor-pointer"
                            >
                              {isSuggesting ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              ) : (
                                <Sparkles className="w-3.5 h-3.5 text-brand-accent" />
                              )}
                              TMDb Önerisi
                            </button>

                            {/* Delete button */}
                            <button
                              onClick={() => deleteTrailer(movie.imdbId)}
                              disabled={isSaving}
                              className="p-2 rounded-lg border border-red-500/20 text-red-400 hover:text-red-300 hover:bg-red-500/5 transition-all disabled:opacity-50 cursor-pointer"
                              title="Fragmanı Tamamen Kaldır"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Preview Embed */}
                      {showPreview && !isFixed && previewVideoId && (
                        <div className="mt-4 p-3 bg-black/60 rounded-2xl border border-zinc-800">
                          <div className="flex justify-between items-center mb-2 px-1">
                            <span className="text-[10px] font-bold text-zinc-400">Fragman Oynatıcı (ID: {previewVideoId})</span>
                            <button
                              onClick={() => togglePreview(movie.imdbId)}
                              className="text-zinc-500 hover:text-white text-xs"
                            >
                              Kapat
                            </button>
                          </div>
                          <div className="relative aspect-video w-full max-w-lg mx-auto overflow-hidden rounded-xl border border-white/5">
                            <iframe
                              src={`https://www.youtube.com/embed/${previewVideoId}?autoplay=1&rel=0`}
                              title={`${movie.title} Fragman Önizleme`}
                              className="absolute inset-0 h-full w-full border-0"
                              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                              allowFullScreen
                            ></iframe>
                          </div>
                        </div>
                      )}

                      {/* YouTube Live Search Panel */}
                      {showYtSearch && !isFixed && (
                        <div className="mt-4 p-4 bg-zinc-950 border border-red-500/10 rounded-2xl space-y-4">
                          <div className="flex justify-between items-center">
                            <span className="text-xs font-bold text-zinc-300 flex items-center gap-1">
                              <Youtube className="w-4 h-4 text-red-500 fill-red-500" /> YouTube Arama Sonuçları
                            </span>
                            <button
                              onClick={() => toggleYtSearch(movie.imdbId, defaultQuery)}
                              className="text-zinc-500 hover:text-white text-xs font-semibold"
                            >
                              Kapat
                            </button>
                          </div>

                          {/* Search Input */}
                          <div className="flex gap-2">
                            <input
                              type="text"
                              value={ytSearchQuery}
                              onChange={(e) => setYtQueryState(movie.imdbId, e.target.value)}
                              placeholder="YouTube'da ara..."
                              className="flex-1 bg-zinc-900 border border-zinc-800 focus:border-red-500/50 rounded-xl py-2 px-3 text-xs text-white focus:outline-none transition-all font-sans"
                              onKeyDown={(e) => { if (e.key === 'Enter') handleSearchYoutube(movie.imdbId, ytSearchQuery); }}
                            />
                            <button
                              onClick={() => handleSearchYoutube(movie.imdbId, ytSearchQuery)}
                              disabled={isSearchingYt}
                              className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-1"
                            >
                              {isSearchingYt ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
                              Ara
                            </button>
                          </div>

                          {ytSearchError && (
                            <p className="text-[11px] text-red-400 font-medium">{ytSearchError}</p>
                          )}

                          {/* Search Results List */}
                          {isSearchingYt ? (
                            <div className="flex items-center justify-center py-8 gap-2 text-zinc-500">
                              <Loader2 className="w-4 h-4 animate-spin text-red-500" />
                              <span className="text-xs">YouTube aranıyor...</span>
                            </div>
                          ) : ytSearchResults && ytSearchResults.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[300px] overflow-y-auto pr-1">
                              {ytSearchResults.map((result) => (
                                <div
                                  key={result.videoId}
                                  className="flex gap-3 bg-zinc-900/60 p-2.5 rounded-xl border border-white/5 hover:border-zinc-800 transition-all text-left"
                                >
                                  {/* Video Thumbnail */}
                                  <div className="relative w-24 aspect-video rounded-lg overflow-hidden bg-black shrink-0 border border-white/5">
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img src={result.thumbnail} alt={result.title} className="w-full h-full object-cover" />
                                    {result.length && (
                                      <span className="absolute bottom-1 right-1 bg-black/85 text-[9px] font-black text-white px-1 py-0.5 rounded font-mono">
                                        {result.length}
                                      </span>
                                    )}
                                  </div>

                                  {/* Info */}
                                  <div className="flex-1 min-w-0 flex flex-col justify-between">
                                    <div>
                                      <h4
                                        className="text-xs font-bold text-zinc-200 line-clamp-2 hover:text-white cursor-pointer"
                                        title={result.title}
                                        onClick={() => togglePreview(movie.imdbId, result.videoId)}
                                      >
                                        {result.title}
                                      </h4>
                                      <p className="text-[10px] text-zinc-500 truncate mt-1">{result.owner} · {result.viewCount}</p>
                                    </div>
                                    
                                    <div className="flex gap-1.5 mt-2">
                                      <button
                                        onClick={() => togglePreview(movie.imdbId, result.videoId)}
                                        className="px-2 py-1 bg-zinc-950 hover:bg-zinc-900 border border-zinc-800 text-[9px] font-black text-zinc-400 hover:text-white rounded-md transition-all cursor-pointer flex items-center gap-1"
                                      >
                                        <Play className="w-2.5 h-2.5 fill-current" /> Önizle
                                      </button>
                                      <button
                                        onClick={() => saveTrailer(movie.imdbId, result.videoId)}
                                        disabled={isSaving}
                                        className="px-2 py-1 bg-red-600/90 hover:bg-red-600 text-[9px] font-black text-white rounded-md transition-all cursor-pointer flex items-center gap-1"
                                      >
                                        Seç ve Kaydet
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : ytSearchResults ? (
                            <p className="text-zinc-500 text-xs text-center py-4">Sonuç bulunamadı.</p>
                          ) : null}
                        </div>
                      )}

                      {/* Suggestion Info / Edit Form (TMDb) */}
                      {!isFixed && (
                        <div className="mt-4 pt-4 border-t border-zinc-900/60 space-y-3">
                          {suggestError && (
                            <p className="text-[11px] text-red-400 bg-red-950/20 border border-red-500/10 rounded-lg px-3 py-1.5 font-medium">
                              ⚠️ TMDb Arama Hatası: {suggestError}
                            </p>
                          )}

                          {suggestedId && (
                            <div className="p-3 bg-brand-primary/5 border border-brand-primary/10 rounded-xl flex items-center justify-between flex-wrap gap-3">
                              <div>
                                <span className="text-[10px] font-black text-brand-primary uppercase tracking-wider block">💡 TMDb Önerisi</span>
                                <span className="text-xs font-mono text-zinc-300">Yeni Fragman ID: <strong className="text-white">{suggestedId}</strong></span>
                              </div>
                              <div className="flex gap-2">
                                <button
                                  onClick={() => togglePreview(movie.imdbId, suggestedId)}
                                  className="px-2.5 py-1 rounded-lg border border-zinc-800 text-[10px] font-bold text-zinc-400 hover:text-white flex items-center gap-1 cursor-pointer"
                                >
                                  Test Et <Play className="w-3 h-3 fill-current" />
                                </button>
                                <button
                                  onClick={() => saveTrailer(movie.imdbId, suggestedId)}
                                  disabled={isSaving}
                                  className="px-3 py-1 rounded-lg bg-brand-primary text-white text-[10px] font-bold hover:bg-brand-primary/95 flex items-center gap-1 cursor-pointer transition-all"
                                >
                                  {isSaving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
                                  Öneriyi Uygula
                                </button>
                              </div>
                            </div>
                          )}

                          {/* Manual Input Form */}
                          <div className="flex flex-col sm:flex-row gap-2 items-end sm:items-center">
                            <div className="flex-1 w-full space-y-1">
                              <label className="text-[9px] font-black text-zinc-500 uppercase tracking-wider block">Manuel Düzenleme (YouTube Video ID veya URL girin)</label>
                              <input
                                type="text"
                                value={inputVal}
                                onChange={(e) => setInputVal(movie.imdbId, e.target.value)}
                                placeholder="Örn: dQw4w9WgXcQ veya https://www.youtube.com/watch?v=..."
                                className="w-full bg-zinc-900 border border-zinc-800 focus:border-zinc-700 rounded-xl py-2 px-3 text-xs text-white focus:outline-none transition-all font-mono"
                              />
                            </div>
                            <button
                              onClick={() => saveTrailer(movie.imdbId, inputVal)}
                              disabled={isSaving || !inputVal.trim()}
                              className="w-full sm:w-auto px-4 py-2 bg-zinc-900 border border-zinc-700 hover:border-zinc-600 text-zinc-200 hover:text-white text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1 cursor-pointer disabled:opacity-50 shrink-0"
                            >
                              {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                              Kaydet
                            </button>
                          </div>

                          {saveError && (
                            <p className="text-[11px] text-red-400 font-semibold bg-red-950/20 border border-red-500/20 rounded-lg px-3 py-1.5">{saveError}</p>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
