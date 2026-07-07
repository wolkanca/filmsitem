'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Shield, Lock, User, LogOut, ArrowRight, Sparkles, Video,
  Search, Pencil, Check, X, Loader2, Film, Image as ImageIcon,
  FileSpreadsheet, Mail, Trash2,
} from 'lucide-react';
import { Movie } from '@/types';

export default function AdminPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // Form states
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  // Contact messages states
  interface ContactMessage {
    id: string;
    name: string;
    email: string;
    subject?: string;
    message: string;
    createdAt: string;
  }
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [deletingMessageId, setDeletingMessageId] = useState<string | null>(null);
  const [messageError, setMessageError] = useState('');

  // Film düzenleyici states
  const [movies, setMovies] = useState<Movie[]>([]);
  const [moviesLoading, setMoviesLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterMode, setFilterMode] = useState<'all' | 'no-poster' | 'no-trailer' | 'both-missing'>('all');
  const [sortBy, setSortBy] = useState<'default' | 'watch-date' | 'imdb-rating' | 'my-rating' | 'year' | 'title'>('default');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Per-movie edit states: { [imdbId]: { poster, trailer, saving, error, posterOpen, trailerOpen } }
  const [editStates, setEditStates] = useState<
    Record<string, { poster: string; trailer: string; saving: boolean; error: string; posterOpen: boolean; trailerOpen: boolean }>
  >({});

  // Detailed movie edit modal states
  interface ModalFormState {
    title: string;
    originalTitle: string;
    year: number;
    type: string;
    myRating: number;
    watchDate: string;
    listName: string;
    poster: string;
    backdrop: string;
    overview: string;
    plot: string;
    plotTr: string;
    country: string;
    omdbType: string;
    boxOffice: string;
    genres: string;
    runtime: number;
    cast: string;
    director: string;
    writers: string;
    imdbRating: number;
    tmdbRating: number;
    releaseDate: string;
    trailerYoutubeId: string;
  }

  const [editingMovie, setEditingMovie] = useState<Movie | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalSaving, setModalSaving] = useState(false);
  const [modalError, setModalError] = useState('');
  const [modalForm, setModalForm] = useState<ModalFormState>({
    title: '',
    originalTitle: '',
    year: 0,
    type: 'Movie',
    myRating: 0,
    watchDate: '',
    listName: '',
    poster: '',
    backdrop: '',
    overview: '',
    plot: '',
    plotTr: '',
    country: '',
    omdbType: '',
    boxOffice: '',
    genres: '',
    runtime: 0,
    cast: '',
    director: '',
    writers: '',
    imdbRating: 0,
    tmdbRating: 0,
    releaseDate: '',
    trailerYoutubeId: '',
  });

  const openEditModal = (movie: Movie) => {
    setEditingMovie(movie);
    setModalForm({
      title: movie.title || '',
      originalTitle: movie.originalTitle || '',
      year: movie.year || 0,
      type: movie.type || 'Movie',
      myRating: movie.myRating || 0,
      watchDate: movie.watchDate || '',
      listName: Array.isArray(movie.listName) ? movie.listName.join(', ') : '',
      poster: movie.poster || '',
      backdrop: movie.backdrop || '',
      overview: movie.overview || '',
      plot: movie.plot || '',
      plotTr: movie.plotTr || '',
      country: movie.country || '',
      omdbType: movie.omdbType || '',
      boxOffice: movie.boxOffice || '',
      genres: Array.isArray(movie.genres) ? movie.genres.join(', ') : '',
      runtime: movie.runtime || 0,
      cast: Array.isArray(movie.cast) ? movie.cast.join(', ') : '',
      director: movie.director || '',
      writers: Array.isArray(movie.writers) ? movie.writers.join(', ') : '',
      imdbRating: movie.imdbRating || 0,
      tmdbRating: movie.tmdbRating || 0,
      releaseDate: movie.releaseDate || '',
      trailerYoutubeId: movie.trailerYoutubeId || '',
    });
    setModalError('');
    setIsModalOpen(true);
  };

  const handleSaveModal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMovie) return;

    setModalSaving(true);
    setModalError('');

    try {
      const payload = {
        ...modalForm,
        listName: modalForm.listName.split(',').map(s => s.trim()).filter(Boolean),
        genres: modalForm.genres.split(',').map(s => s.trim()).filter(Boolean),
        cast: modalForm.cast.split(',').map(s => s.trim()).filter(Boolean),
        writers: modalForm.writers.split(',').map(s => s.trim()).filter(Boolean),
      };

      const res = await fetch(`/api/movies/${editingMovie.imdbId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Kaydetme başarısız.');

      setMovies((prev) =>
        prev.map((m) => {
          if (m.imdbId !== editingMovie.imdbId) return m;
          return {
            ...m,
            ...payload,
          };
        })
      );

      setIsModalOpen(false);
      setEditingMovie(null);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Hata oluştu.';
      setModalError(msg);
    } finally {
      setModalSaving(false);
    }
  };


  const [enrichStatus, setEnrichStatus] = useState<{
    isRunning: boolean;
    total: number;
    processed: number;
    updated: number;
    failed: number;
    status: string;
    changes?: string[];
  } | null>(null);


  // Check login cookie on mount
  useEffect(() => {
    setMounted(true);
    const cookies = document.cookie.split(';');
    const isAlreadyAdmin = cookies.some((c) => c.trim().startsWith('is_admin=true'));
    setIsLoggedIn(isAlreadyAdmin);
  }, []);



  // Load movies when logged in
  useEffect(() => {
    if (!isLoggedIn) return;
    setMoviesLoading(true);
    fetch('/api/movies')
      .then((r) => r.json())
      .then((data: Movie[]) => {
        setMovies(data);
        // Initialize edit states
        const initStates: typeof editStates = {};
        data.forEach((m) => {
          initStates[m.imdbId] = {
            poster: m.poster || '',
            trailer: m.trailerYoutubeId || '',
            saving: false,
            error: '',
            posterOpen: false,
            trailerOpen: false,
          };
        });
        setEditStates(initStates);
      })
      .catch(() => { })
      .finally(() => setMoviesLoading(false));
  }, [isLoggedIn]);

  useEffect(() => {
    if (!isLoggedIn) return;

    async function checkEnrichStatus() {
      try {
        const res = await fetch('/api/enrich');
        const data = await res.json();
        setEnrichStatus(data);
      } catch { }
    }

    checkEnrichStatus();

    const interval = setInterval(checkEnrichStatus, 1500);

    return () => clearInterval(interval);
  }, [isLoggedIn]);

  // Fetch messages when logged in
  useEffect(() => {
    if (!isLoggedIn) return;
    setMessagesLoading(true);
    fetch('/api/admin/messages')
      .then((r) => r.json())
      .then((data: ContactMessage[]) => {
        if (Array.isArray(data)) {
          setMessages(data);
        }
      })
      .catch(() => { })
      .finally(() => setMessagesLoading(false));
  }, [isLoggedIn]);

  const handleDeleteMessage = async (id: string) => {
    if (!confirm('Bu mesajı silmek istediğinize emin misiniz?')) return;
    setDeletingMessageId(id);
    setMessageError('');
    try {
      const res = await fetch(`/api/admin/messages?id=${id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Mesaj silinemedi.');
      setMessages((prev) => prev.filter((m) => m.id !== id));
    } catch (err: any) {
      setMessageError(err.message || 'Silme işlemi sırasında hata oluştu.');
    } finally {
      setDeletingMessageId(null);
    }
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (username === 'wolkanca' && password === 'wolkanca') {
      document.cookie = 'is_admin=true; path=/; max-age=604800; SameSite=Lax';
      setIsLoggedIn(true);
      setUsername('');
      setPassword('');
    } else {
      setError('Geçersiz kullanıcı adı veya şifre.');
    }
  };

  const handleLogout = () => {
    document.cookie = 'is_admin=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax';
    setIsLoggedIn(false);
    router.refresh();
  };

  // Filter and sort movies
  const filteredMovies = useMemo(() => {
    let list = movies;

    // Apply filter mode
    if (filterMode === 'no-poster') {
      list = list.filter((m) => !m.poster || m.poster.includes('unsplash.com') || m.poster.includes('placeholder'));
    } else if (filterMode === 'no-trailer') {
      list = list.filter((m) => !m.trailerYoutubeId);
    } else if (filterMode === 'both-missing') {
      list = list.filter(
        (m) =>
          (!m.poster || m.poster.includes('unsplash.com') || m.poster.includes('placeholder')) &&
          !m.trailerYoutubeId
      );
    }

    // Apply text search on top
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (m) =>
          m.title.toLowerCase().includes(q) ||
          m.imdbId.toLowerCase().includes(q) ||
          (m.originalTitle && m.originalTitle.toLowerCase().includes(q))
      );
    }

    // Sort movies
    if (sortBy === 'default') {
      if (sortOrder === 'desc') {
        list = [...list].reverse();
      }
    } else {
      list = [...list].sort((a, b) => {
        let valA: any = '';
        let valB: any = '';

        if (sortBy === 'watch-date') {
          valA = a.watchDate || '';
          valB = b.watchDate || '';
        } else if (sortBy === 'imdb-rating') {
          valA = a.imdbRating || 0;
          valB = b.imdbRating || 0;
        } else if (sortBy === 'my-rating') {
          valA = a.myRating || 0;
          valB = b.myRating || 0;
        } else if (sortBy === 'year') {
          valA = a.year || 0;
          valB = b.year || 0;
        } else if (sortBy === 'title') {
          valA = a.title || '';
          valB = b.title || '';
        }

        if (typeof valA === 'string') {
          return sortOrder === 'asc'
            ? valA.localeCompare(valB, 'tr')
            : valB.localeCompare(valA, 'tr');
        } else {
          return sortOrder === 'asc'
            ? valA - valB
            : valB - valA;
        }
      });
    }

    return list;
  }, [movies, searchQuery, filterMode, sortBy, sortOrder]);

  // Update a single movie's field in editStates
  const setField = (imdbId: string, field: string, value: string | boolean) => {
    setEditStates((prev) => ({
      ...prev,
      [imdbId]: { ...prev[imdbId], [field]: value },
    }));
  };

  // Save poster or trailer for a movie
  const saveField = async (imdbId: string, field: 'poster' | 'trailer') => {
    const state = editStates[imdbId];
    if (!state) return;

    let value = field === 'poster' ? state.poster.trim() : state.trailer.trim();

    // Parse YouTube URL if needed for trailer
    if (field === 'trailer') {
      const ytMatch = value.match(/(?:v=|youtu\.be\/|embed\/)([A-Za-z0-9_-]{11})/);
      if (ytMatch) value = ytMatch[1];
    }

    setField(imdbId, 'saving', true);
    setField(imdbId, 'error', '');

    try {
      const body: Record<string, string> = {};
      if (field === 'poster') {
        body.poster = value;
      }
      if (field === 'trailer') body.trailerYoutubeId = value;

      const res = await fetch(`/api/movies/${imdbId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Kaydetme başarısız.');

      // Update local movies list too
      setMovies((prev) =>
        prev.map((m) => {
          if (m.imdbId !== imdbId) return m;
          if (field === 'poster') return { ...m, poster: value };
          return { ...m, trailerYoutubeId: value };
        })
      );

      // Close the open field, update value in state
      setEditStates((prev) => ({
        ...prev,
        [imdbId]: {
          ...prev[imdbId],
          saving: false,
          error: '',
          posterOpen: field === 'poster' ? false : prev[imdbId].posterOpen,
          trailerOpen: field === 'trailer' ? false : prev[imdbId].trailerOpen,
          poster: field === 'poster' ? value : prev[imdbId].poster,
          trailer: field === 'trailer' ? value : prev[imdbId].trailer,
        },
      }));
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Hata oluştu.';
      setEditStates((prev) => ({
        ...prev,
        [imdbId]: { ...prev[imdbId], saving: false, error: msg },
      }));
    }
  };

  if (!mounted) return null;

  return (
    <div className="max-w-5xl mx-auto py-12 px-4 sm:px-6">
      {isLoggedIn ? (
        // ADMIN DASHBOARD PANEL
        <div className="space-y-10 animate-fade-in">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800 pb-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-brand-primary/10 rounded-2xl text-brand-primary border border-brand-primary/20">
                <Shield className="w-8 h-8" />
              </div>
              <div>
                <h1 className="text-3xl font-black text-white tracking-tight">Yönetici Kontrol Paneli</h1>
                <p className="text-zinc-500 text-sm mt-1">Hoş geldiniz, Volkan Yılmaz. Kitaplık verilerini zenginleştirin.</p>
              </div>
            </div>

            <button
              onClick={handleLogout}
              className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl border border-red-500/20 bg-red-500/5 hover:bg-red-500/10 text-red-500 text-sm font-semibold transition-all duration-300 shadow-sm cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              Çıkış Yap
            </button>
          </div>

          {/* Wizard Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Poster Wizard Card */}
            <Link href="/enrich" className="group">
              <div className="glass-card p-8 rounded-3xl border border-white/5 bg-gradient-to-br from-zinc-950/40 to-red-950/10 hover:border-brand-primary/30 hover:to-red-950/20 transition-all duration-300 h-full flex flex-col justify-between relative overflow-hidden group shadow-lg hover:shadow-[0_15px_40px_rgba(239,68,68,0.1)]">
                <div className="absolute top-0 right-0 w-32 h-32 bg-brand-primary/10 rounded-full blur-3xl -z-10 group-hover:bg-brand-primary/20 transition-colors" />
                <div>
                  <div className="p-3 bg-brand-primary/10 rounded-2xl text-brand-primary border border-brand-primary/20 w-fit mb-6">
                    <Sparkles className="w-7 h-7" />
                  </div>
                  <h2 className="text-xl font-black text-white group-hover:text-brand-primary transition-colors">Poster Sihirbazı</h2>
                  <p className="text-zinc-400 text-xs mt-3 leading-relaxed">
                    Kitaplığınızdaki afişi olmayan veya görseli kırık/eksik olan filmlerin afişlerini ve genel bilgilerini OMDB API üzerinden otomatik olarak güncelleyin.
                  </p>
                </div>
                <div className="flex items-center gap-2 text-brand-primary font-bold text-xs mt-8 group-hover:translate-x-1 transition-transform">
                  Sihirbaza Git <ArrowRight className="w-4 h-4" />
                </div>
              </div>
            </Link>

            {/* Trailer Wizard Card */}
            <Link href="/enrich-trailers" className="group">
              <div className="glass-card p-8 rounded-3xl border border-white/5 bg-gradient-to-br from-zinc-950/40 to-red-950/10 hover:border-red-500/30 hover:to-red-950/20 transition-all duration-300 h-full flex flex-col justify-between relative overflow-hidden group shadow-lg hover:shadow-[0_15px_40px_rgba(239,68,68,0.1)]">
                <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/10 rounded-full blur-3xl -z-10 group-hover:bg-red-500/20 transition-colors" />
                <div>
                  <div className="p-3 bg-red-500/10 rounded-2xl text-red-500 border border-red-500/20 w-fit mb-6">
                    <Video className="w-7 h-7" />
                  </div>
                  <h2 className="text-xl font-black text-white group-hover:text-red-500 transition-colors">Fragman Sihirbazı</h2>
                  <p className="text-zinc-400 text-xs mt-3 leading-relaxed">
                    Sinema kitaplığınızdaki yapımların resmi YouTube fragman linklerini TMDb API ile otomatik olarak sorgulayarak veritabanınıza eşleyin.
                  </p>
                </div>
                <div className="flex items-center gap-2 text-red-500 font-bold text-xs mt-8 group-hover:translate-x-1 transition-transform">
                  Sihirbaza Git <ArrowRight className="w-4 h-4" />
                </div>
              </div>
            </Link>

            {/* Broken Trailer Checker Card */}
            <Link href="/admin/check-trailers" className="group">
              <div className="glass-card p-8 rounded-3xl border border-white/5 bg-gradient-to-br from-zinc-950/40 to-red-950/10 hover:border-red-500/30 hover:to-red-950/20 transition-all duration-300 h-full flex flex-col justify-between relative overflow-hidden group shadow-lg hover:shadow-[0_15px_40px_rgba(239,68,68,0.1)]">
                <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/10 rounded-full blur-3xl -z-10 group-hover:bg-red-500/20 transition-colors" />
                <div>
                  <div className="p-3 bg-red-500/10 rounded-2xl text-red-500 border border-red-500/20 w-fit mb-6">
                    <Video className="w-7 h-7" />
                  </div>
                  <h2 className="text-xl font-black text-white group-hover:text-red-500 transition-colors">Bozuk Fragman Kontrolcü</h2>
                  <p className="text-zinc-400 text-xs mt-3 leading-relaxed">
                    YouTube fragmanlarını otomatik doğrulayarak silinmiş, özel veya ulaşılamayan videoları saptayın ve tek tıkla düzeltin.
                  </p>
                </div>
                <div className="flex items-center gap-2 text-red-500 font-bold text-xs mt-8 group-hover:translate-x-1 transition-transform">
                  Kontrolcüye Git <ArrowRight className="w-4 h-4" />
                </div>
              </div>
            </Link>

            {/* IMDb CSV Import Card */}
            <Link href="/admin/import" className="group">
              <div className="glass-card p-8 rounded-3xl border border-white/5 bg-gradient-to-br from-zinc-950/40 to-emerald-950/10 hover:border-emerald-500/30 hover:to-emerald-950/20 transition-all duration-300 h-full flex flex-col justify-between relative overflow-hidden group shadow-lg hover:shadow-[0_15px_40px_rgba(16,185,129,0.1)]">
                <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-3xl -z-10 group-hover:bg-emerald-500/20 transition-colors" />
                <div>
                  <div className="p-3 bg-emerald-500/10 rounded-2xl text-emerald-400 border border-emerald-500/20 w-fit mb-6">
                    <FileSpreadsheet className="w-7 h-7" />
                  </div>
                  <h2 className="text-xl font-black text-white group-hover:text-emerald-400 transition-colors">IMDb CSV Yükleyici</h2>
                  <p className="text-zinc-400 text-xs mt-3 leading-relaxed">
                    IMDb listenizden dışa aktardığınız CSV dosyasını yükleyin, yalnızca yeni eklenen yapımları akıllıca sisteme kaydedin.
                  </p>
                </div>
                <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs mt-8 group-hover:translate-x-1 transition-transform">
                  Yükleyiciye Git <ArrowRight className="w-4 h-4" />
                </div>
              </div>
            </Link>
          </div>

          {/* ─── Gelen Mesajlar (Inbox) ─── */}
          <div className="glass-card p-6 md:p-8 rounded-3xl border border-white/5 bg-zinc-950/40">
            <div className="flex items-center justify-between gap-4 border-b border-zinc-800/60 pb-4 mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-red-500/10 rounded-xl text-red-500 border border-red-500/20">
                  <Mail className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-xl font-black text-white">Gelen Mesajlar (Inbox)</h2>
                  <p className="text-zinc-500 text-xs mt-0.5">Ziyaretçilerden gelen son iletişim formları.</p>
                </div>
              </div>
              <span className="text-xs font-bold text-zinc-400 bg-zinc-900 border border-zinc-800 px-3 py-1.5 rounded-lg">
                {messages.length} mesaj
              </span>
            </div>

            {messageError && (
              <div className="mb-5 p-3.5 bg-red-950/30 border border-red-500/20 text-red-200 rounded-xl text-xs font-semibold animate-pulse-subtle">
                ⚠️ {messageError}
              </div>
            )}

            {messagesLoading ? (
              <div className="flex items-center justify-center py-10 gap-3 text-zinc-500">
                <Loader2 className="w-5 h-5 animate-spin" />
                <span className="text-sm font-medium">Mesajlar yükleniyor...</span>
              </div>
            ) : messages.length === 0 ? (
              <div className="text-center py-12 text-zinc-500 text-sm">
                Gelen kutusu boş. Henüz hiç mesaj gönderilmemiş.
              </div>
            ) : (
              <div className="grid gap-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                {messages.map((msg) => (
                  <div key={msg.id} className="p-5 rounded-2xl bg-zinc-900/40 border border-zinc-800/80 hover:border-zinc-700/80 transition duration-300">
                    <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
                      <div>
                        <h4 className="font-bold text-white text-base">{msg.name}</h4>
                        <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-zinc-400 mt-1">
                          <a href={`mailto:${msg.email}`} className="hover:text-red-400 underline underline-offset-2 decoration-zinc-700">{msg.email}</a>
                          {msg.subject && <span className="text-zinc-600">•</span>}
                          {msg.subject && <span className="text-zinc-300">Konu: {msg.subject}</span>}
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-[10px] font-medium text-zinc-500">
                          {new Date(msg.createdAt).toLocaleString('tr-TR')}
                        </span>
                        <button
                          onClick={() => handleDeleteMessage(msg.id)}
                          disabled={deletingMessageId === msg.id}
                          className="p-2 rounded-lg text-zinc-500 hover:text-red-400 hover:bg-red-500/10 border border-zinc-800 hover:border-red-500/20 transition-all duration-300 cursor-pointer disabled:opacity-50"
                          title="Mesajı Sil"
                        >
                          {deletingMessageId === msg.id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Trash2 className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </div>
                    <p className="text-sm text-zinc-300 leading-relaxed whitespace-pre-line bg-zinc-950/40 p-4 rounded-xl border border-zinc-800/40">
                      {msg.message}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>


          {enrichStatus && enrichStatus.changes && enrichStatus.changes.length > 0 && (
            <div className="glass-card p-6 rounded-3xl border border-white/5 bg-zinc-950/40">
              <div className="flex items-center justify-between gap-4 mb-4">
                <div>
                  <h2 className="text-lg font-black text-white">Poster Sihirbazı Değişiklik Özeti</h2>
                  <p className="text-zinc-500 text-xs mt-1">
                    Durum: {enrichStatus.status} · {enrichStatus.processed} / {enrichStatus.total} işlendi
                  </p>
                </div>

                {enrichStatus.isRunning && (
                  <Loader2 className="w-5 h-5 text-brand-primary animate-spin" />
                )}
              </div>

              <div className="grid grid-cols-3 gap-3 mb-4">
                <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-3 text-center">
                  <span className="block text-[10px] text-zinc-500 font-bold uppercase">Güncellenen</span>
                  <span className="block text-xl font-black text-emerald-400 mt-1">{enrichStatus.updated}</span>
                </div>

                <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-3 text-center">
                  <span className="block text-[10px] text-zinc-500 font-bold uppercase">Hatalı</span>
                  <span className="block text-xl font-black text-red-400 mt-1">{enrichStatus.failed}</span>
                </div>

                <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-3 text-center">
                  <span className="block text-[10px] text-zinc-500 font-bold uppercase">Toplam</span>
                  <span className="block text-xl font-black text-white mt-1">{enrichStatus.total}</span>
                </div>
              </div>

              <div className="max-h-72 overflow-y-auto rounded-xl border border-zinc-800 bg-zinc-950/60 p-4">
                <ul className="space-y-2">
                  {enrichStatus.changes.map((change, index) => (
                    <li
                      key={index}
                      className="text-xs text-zinc-400 border-b border-zinc-800/70 pb-2 last:border-b-0 last:pb-0"
                    >
                      {change}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}




          {/* ─── Manuel Film Düzenleyici ─── */}
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800 pb-5">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-violet-500/10 rounded-xl text-violet-400 border border-violet-500/20">
                  <Film className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-xl font-black text-white">Film Düzenleyici</h2>
                  <p className="text-zinc-500 text-xs mt-0.5">Poster URL ve fragman YouTube ID&apos;sini manuel olarak düzenleyin.</p>
                </div>
              </div>
              <span className="text-xs font-bold text-zinc-500 bg-zinc-900 border border-zinc-800 px-3 py-1.5 rounded-lg">
                {filteredMovies.length} / {movies.length} film
              </span>
            </div>

            {/* Filter Mode Buttons */}
            <div className="flex flex-wrap gap-2">
              {([
                { key: 'all', label: '🎬 Tümü', desc: `${movies.length} film` },
                { key: 'no-poster', label: '🖼️ Posteri Eksik/Bozuk', desc: `${movies.filter((m) => !m.poster || m.poster.includes('unsplash.com') || m.poster.includes('placeholder')).length} film` },
                { key: 'no-trailer', label: '▶️ Fragmanı Eksik', desc: `${movies.filter((m) => !m.trailerYoutubeId).length} film` },
                { key: 'both-missing', label: '⚠️ İkisi de Eksik', desc: `${movies.filter((m) => (!m.poster || m.poster.includes('unsplash.com') || m.poster.includes('placeholder')) && !m.trailerYoutubeId).length} film` },
              ] as { key: 'all' | 'no-poster' | 'no-trailer' | 'both-missing'; label: string; desc: string }[]).map(({ key, label, desc }) => (
                <button
                  key={key}
                  onClick={() => setFilterMode(key)}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl border text-xs font-bold transition-all cursor-pointer ${filterMode === key
                    ? key === 'all'
                      ? 'bg-violet-500/20 border-violet-500/50 text-violet-300'
                      : key === 'no-poster'
                        ? 'bg-amber-500/15 border-amber-500/40 text-amber-300'
                        : key === 'no-trailer'
                          ? 'bg-blue-500/15 border-blue-500/40 text-blue-300'
                          : 'bg-red-500/15 border-red-500/40 text-red-300'
                    : 'bg-zinc-900/60 border-zinc-800 text-zinc-500 hover:text-zinc-300 hover:border-zinc-700'
                    }`}
                >
                  {label}
                  <span className={`px-1.5 py-0.5 rounded-md text-[10px] font-black ${filterMode === key ? 'bg-white/10' : 'bg-zinc-800'
                    }`}>
                    {desc}
                  </span>
                </button>
              ))}
            </div>

            {/* Search & Sort */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {/* Search input */}
              <div className="relative md:col-span-2">
                <Search className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Film adı veya IMDb ID ile ara..."
                  className="w-full bg-zinc-950/60 border border-zinc-800 focus:border-violet-500/40 rounded-xl py-3 pl-10 pr-4 text-sm text-white focus:outline-none transition-all"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Sort controls */}
              <div className="flex gap-2">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="flex-1 bg-zinc-950/60 border border-zinc-800 focus:border-violet-500/40 rounded-xl px-3 py-2 text-xs text-zinc-300 focus:outline-none transition-all cursor-pointer"
                >
                  <option value="default">Sıralama: Eklenme Sırası</option>
                  <option value="watch-date">Sıralama: İzleme Tarihi</option>
                  <option value="imdb-rating">Sıralama: IMDb Puanı</option>
                  <option value="my-rating">Sıralama: Benim Puanım</option>
                  <option value="year">Sıralama: Yapım Yılı</option>
                  <option value="title">Sıralama: Film Adı</option>
                </select>

                <button
                  type="button"
                  onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
                  className="bg-zinc-950/60 border border-zinc-800 hover:border-zinc-700 hover:text-white rounded-xl px-3 py-2 text-xs text-zinc-400 font-bold transition-all cursor-pointer flex items-center justify-center min-w-[44px]"
                  title={sortOrder === 'asc' ? 'Artan Sıralama' : 'Azalan Sıralama'}
                >
                  {sortOrder === 'asc' ? '↑' : '↓'}
                </button>
              </div>
            </div>

            {/* Movie list */}
            {moviesLoading ? (
              <div className="flex items-center justify-center py-16 gap-3 text-zinc-500">
                <Loader2 className="w-5 h-5 animate-spin" />
                <span className="text-sm font-medium">Filmler yükleniyor...</span>
              </div>
            ) : filteredMovies.length === 0 ? (
              <div className="text-center py-12 text-zinc-500 text-sm">
                {searchQuery ? `"${searchQuery}" için sonuç bulunamadı.` : 'Film bulunamadı.'}
              </div>
            ) : (
              <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-zinc-800 scrollbar-track-transparent">
                {filteredMovies.map((movie) => {
                  const es = editStates[movie.imdbId];
                  if (!es) return null;
                  const hasPoster = !!movie.poster && !movie.poster.includes('unsplash.com') && !movie.poster.includes('placeholder');
                  const hasTrailer = !!movie.trailerYoutubeId;

                  return (
                    <div
                      key={movie.imdbId}
                      className="bg-zinc-950/50 border border-zinc-800/60 rounded-2xl p-4 transition-all hover:border-zinc-700/80"
                    >
                      {/* Movie row header */}
                      <div className="flex items-start gap-4">
                        {/* Poster thumbnail */}
                        <div className="flex-shrink-0 w-12 h-16 rounded-lg overflow-hidden bg-zinc-900 border border-white/5">
                          {hasPoster ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={movie.poster}
                              alt={movie.title}
                              className="w-full h-full object-cover"
                              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-zinc-700">
                              <ImageIcon className="w-5 h-5" />
                            </div>
                          )}
                        </div>

                        {/* Info */}
                        <div className="flex-grow min-w-0">
                          <div className="flex items-start justify-between gap-2 flex-wrap">
                            <div>
                              <p className="text-sm font-extrabold text-zinc-200 truncate max-w-xs">{movie.title}</p>
                              <p className="text-[11px] text-zinc-500 font-mono mt-0.5">{movie.imdbId} · {movie.year} · {movie.type}</p>
                            </div>
                            {/* Status badges */}
                            <div className="flex items-center gap-1.5 flex-shrink-0">
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${hasPoster ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-zinc-800 text-zinc-500 border-zinc-700'}`}>
                                {hasPoster ? '✓ Poster' : '✗ Poster'}
                              </span>
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${hasTrailer ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' : 'bg-zinc-800 text-zinc-500 border-zinc-700'}`}>
                                {hasTrailer ? '✓ Fragman' : '✗ Fragman'}
                              </span>
                            </div>
                          </div>

                          {/* Edit buttons row */}
                          <div className="flex flex-wrap gap-2 mt-3">
                            {/* Poster edit toggle */}
                            <button
                              onClick={() => setField(movie.imdbId, 'posterOpen', !es.posterOpen)}
                              className={`flex items-center gap-1.5 text-[11px] font-bold px-3 py-1.5 rounded-lg border transition-all cursor-pointer ${es.posterOpen ? 'bg-violet-500/15 border-violet-500/40 text-violet-300' : 'bg-zinc-900 border-zinc-700 text-zinc-400 hover:text-white hover:border-zinc-600'}`}
                            >
                              <ImageIcon className="w-3 h-3" />
                              {es.posterOpen ? 'Poster Kapat' : 'Poster Düzenle'}
                            </button>
                            {/* Trailer edit toggle */}
                            <button
                              onClick={() => setField(movie.imdbId, 'trailerOpen', !es.trailerOpen)}
                              className={`flex items-center gap-1.5 text-[11px] font-bold px-3 py-1.5 rounded-lg border transition-all cursor-pointer ${es.trailerOpen ? 'bg-brand-primary/15 border-brand-primary/40 text-red-300' : 'bg-zinc-900 border-zinc-700 text-zinc-400 hover:text-white hover:border-zinc-600'}`}
                            >
                              <Video className="w-3 h-3" />
                              {es.trailerOpen ? 'Fragman Kapat' : 'Fragman Düzenle'}
                            </button>
                            {/* Detailed Edit button */}
                            <button
                              onClick={() => openEditModal(movie)}
                              className="flex items-center gap-1.5 text-[11px] font-bold px-3 py-1.5 rounded-lg border bg-zinc-900 border-zinc-700 text-zinc-400 hover:text-white hover:border-zinc-600 transition-all cursor-pointer"
                            >
                              <Pencil className="w-3 h-3" />
                              Tüm Alanları Düzenle
                            </button>
                            <Link
                              href={`/movie/${movie.imdbId}`}
                              target="_blank"
                              className="ml-auto flex items-center gap-1 text-[11px] font-bold px-3 py-1.5 rounded-lg border border-zinc-700 text-zinc-500 hover:text-white hover:border-zinc-600 transition-all"
                            >
                              Film Sayfası →
                            </Link>
                          </div>
                        </div>
                      </div>

                      {/* Error message */}
                      {es.error && (
                        <p className="mt-2 text-xs text-red-400 font-semibold bg-red-950/20 border border-red-500/20 rounded-lg px-3 py-1.5">{es.error}</p>
                      )}

                      {/* Poster edit inline form */}
                      {es.posterOpen && (
                        <div className="mt-3 pt-3 border-t border-zinc-800/60 space-y-2">
                          <label className="text-[10px] font-black text-violet-400 uppercase tracking-wider block">🖼️ Poster URL</label>
                          <div className="flex gap-2">
                            <input
                              type="url"
                              value={es.poster}
                              onChange={(e) => setField(movie.imdbId, 'poster', e.target.value)}
                              placeholder="https://example.com/poster.jpg"
                              className="flex-1 bg-zinc-900 border border-zinc-700 focus:border-violet-500/60 rounded-xl py-2 px-3 text-xs text-white focus:outline-none transition-all font-mono"
                              onKeyDown={(e) => { if (e.key === 'Enter') saveField(movie.imdbId, 'poster'); }}
                            />
                            <button
                              onClick={() => saveField(movie.imdbId, 'poster')}
                              disabled={es.saving}
                              className="flex items-center gap-1 bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold px-3 py-2 rounded-xl transition-all disabled:opacity-60 cursor-pointer whitespace-nowrap"
                            >
                              {es.saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                              Kaydet
                            </button>
                          </div>
                          {es.poster && (
                            <div className="mt-1 flex items-center gap-2">
                              {/* Preview */}
                              <div className="w-8 h-11 rounded overflow-hidden border border-white/10 flex-shrink-0">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img src={es.poster} alt="preview" className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                              </div>
                              <span className="text-[10px] text-zinc-500 font-mono truncate max-w-[200px]">{es.poster}</span>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Trailer edit inline form */}
                      {es.trailerOpen && (
                        <div className="mt-3 pt-3 border-t border-zinc-800/60 space-y-2">
                          <label className="text-[10px] font-black text-red-400 uppercase tracking-wider block">▶️ YouTube Fragman ID veya URL</label>
                          <div className="flex gap-2">
                            <input
                              type="text"
                              value={es.trailer}
                              onChange={(e) => setField(movie.imdbId, 'trailer', e.target.value)}
                              placeholder="Örn: dQw4w9WgXcQ veya https://youtube.com/watch?v=..."
                              className="flex-1 bg-zinc-900 border border-zinc-700 focus:border-brand-primary/60 rounded-xl py-2 px-3 text-xs text-white focus:outline-none transition-all font-mono"
                              onKeyDown={(e) => { if (e.key === 'Enter') saveField(movie.imdbId, 'trailer'); }}
                            />
                            <button
                              onClick={() => saveField(movie.imdbId, 'trailer')}
                              disabled={es.saving}
                              className="flex items-center gap-1 bg-brand-primary hover:bg-red-600 text-white text-xs font-bold px-3 py-2 rounded-xl transition-all disabled:opacity-60 cursor-pointer whitespace-nowrap"
                            >
                              {es.saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                              Kaydet
                            </button>
                          </div>
                          {es.trailer && (
                            <p className="text-[10px] text-zinc-500 font-mono">
                              Mevcut ID: <span className="text-blue-400">{es.trailer}</span>
                              {' · '}
                              <a
                                href={`https://youtube.com/watch?v=${es.trailer}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-zinc-400 hover:text-white underline underline-offset-2"
                              >
                                YouTube&apos;da Aç ↗
                              </a>
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      ) : (
        // ADMIN LOGIN FORM
        <div className="flex justify-center items-center py-12 animate-fade-in">
          <div className="glass-card w-full max-w-md p-8 rounded-3xl border border-white/5 bg-gradient-to-b from-zinc-900/60 to-zinc-950/60 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-64 bg-brand-primary/10 rounded-full blur-[80px] -z-10" />

            <div className="text-center mb-8">
              <div className="p-3 bg-zinc-950/80 rounded-2xl text-brand-primary border border-white/5 w-fit mx-auto mb-4 shadow-inner">
                <Shield className="w-8 h-8" />
              </div>
              <h1 className="text-2xl font-black text-white tracking-tight">Yönetici Girişi</h1>
              <p className="text-zinc-500 text-xs mt-1.5">Sihirbaz araçlarına erişmek için lütfen kimliğinizi doğrulayın.</p>
            </div>

            {error && (
              <div className="mb-5 p-3.5 bg-red-950/30 border border-red-500/20 text-red-200 rounded-xl text-xs font-semibold flex items-center gap-2 animate-pulse-subtle">
                <span>⚠️</span> {error}
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-5">
              {/* Username field */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">Kullanıcı Adı</label>
                <div className="relative">
                  <User className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Kullanıcı adınızı girin..."
                    className="w-full bg-zinc-950/50 border border-zinc-800 rounded-xl py-3 pl-10 pr-4 text-sm text-white focus:border-brand-primary/50 focus:outline-none transition-all duration-300"
                  />
                </div>
              </div>

              {/* Password field */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">Şifre</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Şifrenizi girin..."
                    className="w-full bg-zinc-950/50 border border-zinc-800 rounded-xl py-3 pl-10 pr-4 text-sm text-white focus:border-brand-primary/50 focus:outline-none transition-all duration-300"
                  />
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-brand-primary to-brand-secondary hover:opacity-95 text-white font-bold py-3 px-6 rounded-xl shadow-lg shadow-brand-primary/20 transition-all duration-300 cursor-pointer mt-2"
              >
                Giriş Yap
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Detailed Edit Modal */}
      {isModalOpen && editingMovie && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto animate-fade-in">
          <div className="glass w-full max-w-4xl rounded-3xl border border-white/10 bg-zinc-950/90 shadow-2xl overflow-hidden my-8 max-h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-zinc-800 bg-zinc-900/40">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-violet-500/10 rounded-xl text-violet-400 border border-violet-500/20">
                  <Pencil className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-white">Film Bilgilerini Düzenle</h3>
                  <p className="text-zinc-500 text-xs mt-0.5">{editingMovie.title} ({editingMovie.imdbId})</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => { setIsModalOpen(false); setEditingMovie(null); }}
                className="p-2 rounded-xl text-zinc-500 hover:text-white hover:bg-zinc-800 border border-zinc-800 transition-all cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content - Scrollable Form */}
            <form onSubmit={handleSaveModal} className="flex-1 overflow-y-auto p-6 md:p-8 space-y-8 custom-scrollbar">
              {modalError && (
                <div className="p-4 bg-red-950/30 border border-red-500/20 text-red-200 rounded-xl text-xs font-semibold">
                  ⚠️ {modalError}
                </div>
              )}

              {/* Group 1: Temel Bilgiler */}
              <div className="space-y-4">
                <h4 className="text-xs font-black text-violet-400 uppercase tracking-widest border-b border-zinc-800/80 pb-2">1. Temel Bilgiler</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Film Adı (Türkçe / Genel)</label>
                    <input
                      type="text"
                      required
                      value={modalForm.title}
                      onChange={(e) => setModalForm(prev => ({ ...prev, title: e.target.value }))}
                      className="w-full bg-zinc-900/60 border border-zinc-800 focus:border-violet-500/50 rounded-xl py-2.5 px-3 text-sm text-white focus:outline-none transition-all"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Orijinal Film Adı</label>
                    <input
                      type="text"
                      required
                      value={modalForm.originalTitle}
                      onChange={(e) => setModalForm(prev => ({ ...prev, originalTitle: e.target.value }))}
                      className="w-full bg-zinc-900/60 border border-zinc-800 focus:border-violet-500/50 rounded-xl py-2.5 px-3 text-sm text-white focus:outline-none transition-all"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Yapım Yılı</label>
                    <input
                      type="number"
                      required
                      value={modalForm.year}
                      onChange={(e) => setModalForm(prev => ({ ...prev, year: parseInt(e.target.value) || 0 }))}
                      className="w-full bg-zinc-900/60 border border-zinc-800 focus:border-violet-500/50 rounded-xl py-2.5 px-3 text-sm text-white focus:outline-none transition-all"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Yapım Tipi</label>
                    <select
                      value={modalForm.type}
                      onChange={(e) => setModalForm(prev => ({ ...prev, type: e.target.value }))}
                      className="w-full bg-zinc-900/60 border border-zinc-800 focus:border-violet-500/50 rounded-xl py-2.5 px-3 text-sm text-white focus:outline-none transition-all"
                    >
                      <option value="Movie">Movie</option>
                      <option value="TV Series">TV Series</option>
                      <option value="TV Episode">TV Episode</option>
                      <option value="TV Special">TV Special</option>
                      <option value="TV Mini Series">TV Mini Series</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Group 2: Değerlendirme & Durum */}
              <div className="space-y-4">
                <h4 className="text-xs font-black text-violet-400 uppercase tracking-widest border-b border-zinc-800/80 pb-2">2. Değerlendirme & Durum</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Benim Puanım (1-10)</label>
                    <input
                      type="number"
                      min="0"
                      max="10"
                      step="1"
                      value={modalForm.myRating}
                      onChange={(e) => setModalForm(prev => ({ ...prev, myRating: parseInt(e.target.value) || 0 }))}
                      className="w-full bg-zinc-900/60 border border-zinc-800 focus:border-violet-500/50 rounded-xl py-2.5 px-3 text-sm text-white focus:outline-none transition-all"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">İzleme Tarihi</label>
                    <input
                      type="date"
                      value={modalForm.watchDate}
                      onChange={(e) => setModalForm(prev => ({ ...prev, watchDate: e.target.value }))}
                      className="w-full bg-zinc-900/60 border border-zinc-800 focus:border-violet-500/50 rounded-xl py-2.5 px-3 text-sm text-white focus:outline-none transition-all"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Dahil Olduğu Listeler (Virgülle Ayırın)</label>
                    <input
                      type="text"
                      value={modalForm.listName}
                      onChange={(e) => setModalForm(prev => ({ ...prev, listName: e.target.value }))}
                      placeholder="Favoriler, Komedi Günlükleri vb."
                      className="w-full bg-zinc-900/60 border border-zinc-800 focus:border-violet-500/50 rounded-xl py-2.5 px-3 text-sm text-white focus:outline-none transition-all"
                    />
                  </div>
                </div>
              </div>

              {/* Group 3: Görseller & Medya */}
              <div className="space-y-4">
                <h4 className="text-xs font-black text-violet-400 uppercase tracking-widest border-b border-zinc-800/80 pb-2">3. Görseller & Medya</h4>
                <div className="grid grid-cols-1 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Poster URL</label>
                    <input
                      type="url"
                      value={modalForm.poster}
                      onChange={(e) => setModalForm(prev => ({ ...prev, poster: e.target.value }))}
                      className="w-full bg-zinc-900/60 border border-zinc-800 focus:border-violet-500/50 rounded-xl py-2.5 px-3 text-sm text-white focus:outline-none transition-all font-mono"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Arka Plan (Backdrop) URL</label>
                    <input
                      type="url"
                      value={modalForm.backdrop}
                      onChange={(e) => setModalForm(prev => ({ ...prev, backdrop: e.target.value }))}
                      className="w-full bg-zinc-900/60 border border-zinc-800 focus:border-violet-500/50 rounded-xl py-2.5 px-3 text-sm text-white focus:outline-none transition-all font-mono"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">YouTube Fragman ID</label>
                    <input
                      type="text"
                      value={modalForm.trailerYoutubeId}
                      onChange={(e) => setModalForm(prev => ({ ...prev, trailerYoutubeId: e.target.value }))}
                      placeholder="Örn: dQw4w9WgXcQ"
                      className="w-full bg-zinc-900/60 border border-zinc-800 focus:border-violet-500/50 rounded-xl py-2.5 px-3 text-sm text-white focus:outline-none transition-all font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Group 4: Açıklamalar */}
              <div className="space-y-4">
                <h4 className="text-xs font-black text-violet-400 uppercase tracking-widest border-b border-zinc-800/80 pb-2">4. Konu & Özet</h4>
                <div className="grid grid-cols-1 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Kısa Özet (Overview)</label>
                    <textarea
                      value={modalForm.overview}
                      onChange={(e) => setModalForm(prev => ({ ...prev, overview: e.target.value }))}
                      rows={3}
                      className="w-full bg-zinc-900/60 border border-zinc-800 focus:border-violet-500/50 rounded-xl py-2.5 px-3 text-sm text-white focus:outline-none transition-all resize-y"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">İngilizce Konu (Plot)</label>
                    <textarea
                      value={modalForm.plot}
                      onChange={(e) => setModalForm(prev => ({ ...prev, plot: e.target.value }))}
                      rows={4}
                      className="w-full bg-zinc-900/60 border border-zinc-800 focus:border-violet-500/50 rounded-xl py-2.5 px-3 text-sm text-white focus:outline-none transition-all resize-y"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Türkçe Konu Detayı (Plot TR)</label>
                    <textarea
                      value={modalForm.plotTr}
                      onChange={(e) => setModalForm(prev => ({ ...prev, plotTr: e.target.value }))}
                      rows={4}
                      className="w-full bg-zinc-900/60 border border-zinc-800 focus:border-violet-500/50 rounded-xl py-2.5 px-3 text-sm text-white focus:outline-none transition-all resize-y"
                    />
                  </div>
                </div>
              </div>

              {/* Group 5: Yapım Bilgileri */}
              <div className="space-y-4">
                <h4 className="text-xs font-black text-violet-400 uppercase tracking-widest border-b border-zinc-800/80 pb-2">5. Yapım Bilgileri</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Türler (Virgülle Ayırın)</label>
                    <input
                      type="text"
                      value={modalForm.genres}
                      onChange={(e) => setModalForm(prev => ({ ...prev, genres: e.target.value }))}
                      placeholder="Comedy, Drama, Action"
                      className="w-full bg-zinc-900/60 border border-zinc-800 focus:border-violet-500/50 rounded-xl py-2.5 px-3 text-sm text-white focus:outline-none transition-all"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Süre (Dakika)</label>
                    <input
                      type="number"
                      value={modalForm.runtime}
                      onChange={(e) => setModalForm(prev => ({ ...prev, runtime: parseInt(e.target.value) || 0 }))}
                      className="w-full bg-zinc-900/60 border border-zinc-800 focus:border-violet-500/50 rounded-xl py-2.5 px-3 text-sm text-white focus:outline-none transition-all"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Yönetmen (Virgülle Ayırın)</label>
                    <input
                      type="text"
                      value={modalForm.director}
                      onChange={(e) => setModalForm(prev => ({ ...prev, director: e.target.value }))}
                      className="w-full bg-zinc-900/60 border border-zinc-800 focus:border-violet-500/50 rounded-xl py-2.5 px-3 text-sm text-white focus:outline-none transition-all"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Senaristler (Virgülle Ayırın)</label>
                    <input
                      type="text"
                      value={modalForm.writers}
                      onChange={(e) => setModalForm(prev => ({ ...prev, writers: e.target.value }))}
                      className="w-full bg-zinc-900/60 border border-zinc-800 focus:border-violet-500/50 rounded-xl py-2.5 px-3 text-sm text-white focus:outline-none transition-all"
                    />
                  </div>
                  <div className="space-y-1 md:col-span-2">
                    <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Oyuncular (Virgülle Ayırın)</label>
                    <input
                      type="text"
                      value={modalForm.cast}
                      onChange={(e) => setModalForm(prev => ({ ...prev, cast: e.target.value }))}
                      className="w-full bg-zinc-900/60 border border-zinc-800 focus:border-violet-500/50 rounded-xl py-2.5 px-3 text-sm text-white focus:outline-none transition-all"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Ülke</label>
                    <input
                      type="text"
                      value={modalForm.country}
                      onChange={(e) => setModalForm(prev => ({ ...prev, country: e.target.value }))}
                      className="w-full bg-zinc-900/60 border border-zinc-800 focus:border-violet-500/50 rounded-xl py-2.5 px-3 text-sm text-white focus:outline-none transition-all"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Gişe (Box Office)</label>
                    <input
                      type="text"
                      value={modalForm.boxOffice}
                      onChange={(e) => setModalForm(prev => ({ ...prev, boxOffice: e.target.value }))}
                      className="w-full bg-zinc-900/60 border border-zinc-800 focus:border-violet-500/50 rounded-xl py-2.5 px-3 text-sm text-white focus:outline-none transition-all"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">IMDb Puanı</label>
                    <input
                      type="number"
                      step="0.1"
                      value={modalForm.imdbRating}
                      onChange={(e) => setModalForm(prev => ({ ...prev, imdbRating: parseFloat(e.target.value) || 0 }))}
                      className="w-full bg-zinc-900/60 border border-zinc-800 focus:border-violet-500/50 rounded-xl py-2.5 px-3 text-sm text-white focus:outline-none transition-all"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">TMDb Puanı</label>
                    <input
                      type="number"
                      step="0.1"
                      value={modalForm.tmdbRating}
                      onChange={(e) => setModalForm(prev => ({ ...prev, tmdbRating: parseFloat(e.target.value) || 0 }))}
                      className="w-full bg-zinc-900/60 border border-zinc-800 focus:border-violet-500/50 rounded-xl py-2.5 px-3 text-sm text-white focus:outline-none transition-all"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Vizyon Tarihi (Release Date)</label>
                    <input
                      type="text"
                      value={modalForm.releaseDate}
                      onChange={(e) => setModalForm(prev => ({ ...prev, releaseDate: e.target.value }))}
                      placeholder="Örn: 1999-10-15"
                      className="w-full bg-zinc-900/60 border border-zinc-800 focus:border-violet-500/50 rounded-xl py-2.5 px-3 text-sm text-white focus:outline-none transition-all"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">OMDb Tipi</label>
                    <input
                      type="text"
                      value={modalForm.omdbType}
                      onChange={(e) => setModalForm(prev => ({ ...prev, omdbType: e.target.value }))}
                      className="w-full bg-zinc-900/60 border border-zinc-800 focus:border-violet-500/50 rounded-xl py-2.5 px-3 text-sm text-white focus:outline-none transition-all"
                    />
                  </div>
                </div>
              </div>

              {/* Modal Footer Buttons */}
              <div className="flex items-center justify-end gap-3 pt-6 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => { setIsModalOpen(false); setEditingMovie(null); }}
                  className="px-5 py-2.5 rounded-xl border border-zinc-800 hover:border-zinc-700 bg-zinc-900/50 hover:bg-zinc-900 text-zinc-400 hover:text-white text-sm font-bold transition-all cursor-pointer"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  disabled={modalSaving}
                  className="flex items-center justify-center gap-2 bg-gradient-to-r from-violet-600 to-indigo-600 hover:opacity-95 text-white font-bold py-2.5 px-6 rounded-xl shadow-lg shadow-violet-600/10 transition-all duration-300 disabled:opacity-60 cursor-pointer text-sm"
                >
                  {modalSaving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Kaydediliyor...
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      Değişiklikleri Kaydet
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
