'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Film, RefreshCw, AlertTriangle, CheckCircle, Play, ArrowLeft, Video } from 'lucide-react';

interface ProgressState {
  isRunning: boolean;
  total: number;
  processed: number;
  updated: number;
  failed: number;
  status: string;
}

export default function EnrichTrailersPage() {
  const router = useRouter();
  const [authorized, setAuthorized] = useState(false);
  // Pre-fill with the TMDb API key provided by the user
  const [apiKey, setApiKey] = useState('e3d09f93ae63545fe155c5bde68ca970');
  const [updateMode, setUpdateMode] = useState<'missing' | 'all'>('missing');
  const [status, setStatus] = useState<ProgressState | null>(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

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

  // Poll for progress updates if running
  useEffect(() => {
    if (!authorized) return;
    async function checkStatus() {
      try {
        const res = await fetch('/api/enrich-trailers');
        const data = await res.json();
        setStatus(data);
      } catch (err) {
        console.error('Failed to get trailer enrich status:', err);
      }
    }

    checkStatus();

    const interval = setInterval(() => {
      checkStatus();
    }, 1500);

    return () => clearInterval(interval);
  }, []);

  const handleStart = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('');
    setError('');

    if (!apiKey.trim()) {
      setError('Lütfen bir TMDb API Anahtarı veya Jetonu girin.');
      return;
    }

    try {
      const res = await fetch('/api/enrich-trailers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey, forceUpdate: updateMode === 'all' }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'İşlem başlatılamadı.');
      }
      setMessage('Fragman indirme ve tarama işlemi arka planda başarıyla başlatıldı!');
    } catch (err: any) {
      setError(err.message || 'Bir hata oluştu.');
    }
  };

  const percentage = status && status.total > 0
    ? Math.round((status.processed / status.total) * 100)
    : 0;

  if (!authorized) return null;

  return (
    <div className="max-w-3xl mx-auto py-8">
      {/* Back button */}
      <Link
        href="/movies"
        className="inline-flex items-center gap-2 text-zinc-400 hover:text-white mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Filmlerime Geri Dön
      </Link>

      <div className="glass-card p-8 rounded-2xl relative overflow-hidden border border-card-border/50">
        <div className="absolute top-0 right-0 w-96 h-96 bg-red-600/10 rounded-full blur-[100px] -z-10" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-brand-accent/5 rounded-full blur-[100px] -z-10" />

        <div className="flex items-center gap-4 mb-6">
          <div className="p-3 bg-red-500/20 rounded-xl text-red-500">
            <Video className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white via-zinc-200 to-zinc-400">
              Fragman Sihirbazı
            </h1>
            <p className="text-zinc-400 text-sm mt-1">
              Sinema kitaplığınızdaki yapımların fragmanlarını TMDb API üzerinden arayıp otomatik bulun ve kaydedin.
            </p>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-950/30 border border-red-500/20 text-red-200 rounded-xl flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
            <p className="text-sm">{error}</p>
          </div>
        )}

        {message && (
          <div className="mb-6 p-4 bg-emerald-950/30 border border-emerald-500/20 text-emerald-200 rounded-xl flex items-start gap-3">
            <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
            <p className="text-sm">{message}</p>
          </div>
        )}

        {status && status.isRunning ? (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-zinc-300 font-medium">
                <RefreshCw className="w-4 h-4 text-red-500 animate-spin" />
                Fragmanlar Aranıyor ve İşleniyor...
              </span>
              <span className="text-sm text-zinc-400">
                {status.processed} / {status.total} Yapım
              </span>
            </div>

            {/* Progress bar */}
            <div className="h-4 bg-zinc-900 rounded-full overflow-hidden border border-zinc-800">
              <div
                className="h-full bg-gradient-to-r from-red-600 via-rose-500 to-orange-500 rounded-full transition-all duration-500 ease-out"
                style={{ width: `${percentage}%` }}
              />
            </div>

            {/* Stats grid */}
            <div className="grid grid-cols-3 gap-4 pt-4 border-t border-card-border/30">
              <div className="bg-zinc-900/40 p-4 rounded-xl text-center border border-zinc-800/50">
                <span className="block text-zinc-500 text-xs font-semibold uppercase tracking-wider">İlerleme</span>
                <span className="block text-2xl font-bold text-white mt-1">%{percentage}</span>
              </div>
              <div className="bg-zinc-900/40 p-4 rounded-xl text-center border border-zinc-800/50">
                <span className="block text-zinc-500 text-xs font-semibold uppercase tracking-wider">Fragman Bulunan</span>
                <span className="block text-2xl font-bold text-emerald-400 mt-1">{status.updated}</span>
              </div>
              <div className="bg-zinc-900/40 p-4 rounded-xl text-center border border-zinc-800/50">
                <span className="block text-zinc-500 text-xs font-semibold uppercase tracking-wider font-sans">Eksik/Bulunamayan</span>
                <span className="block text-2xl font-bold text-zinc-400 mt-1">{status.failed}</span>
              </div>
            </div>

            <p className="text-zinc-500 text-center text-xs">
              Bu işlem arka planda çalışmaya devam eder. Sayfayı kapatabilir veya kitaplığınızda dolaşmaya devam edebilirsiniz.
            </p>
          </div>
        ) : (
          <form onSubmit={handleStart} className="space-y-6">
            <div className="space-y-2">
              <label htmlFor="apiKey" className="block text-sm font-medium text-zinc-300">
                TMDb API Anahtarı veya Okuma Erişim Jetonu (JWT)
              </label>
              <textarea
                id="apiKey"
                rows={4}
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="TMDb API anahtarını veya JWT Jetonunu buraya yapıştırın..."
                className="w-full bg-zinc-900/50 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-red-500/50 transition-all font-mono text-sm leading-relaxed"
              />
              <p className="text-zinc-500 text-xs">
                Sizin için girdiğimiz TMDb API key ile hemen başlatabilirsiniz. Sistemimiz hem kısa API Key formatını hem de uzun JWT Jetonunu otomatik tanır.
              </p>
            </div>

            {/* Update Mode Selection */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-zinc-300">
                Güncelleme Kapsamı
              </label>
              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => setUpdateMode('missing')}
                  className={`px-4 py-3 rounded-xl border text-sm font-semibold transition-all text-center cursor-pointer ${
                    updateMode === 'missing'
                      ? 'bg-red-500/10 border-red-500 text-white shadow-sm'
                      : 'bg-zinc-900/50 border-zinc-800 text-zinc-400 hover:text-white'
                  }`}
                >
                  Sadece Eksik Olanlar
                </button>
                <button
                  type="button"
                  onClick={() => setUpdateMode('all')}
                  className={`px-4 py-3 rounded-xl border text-sm font-semibold transition-all text-center cursor-pointer ${
                    updateMode === 'all'
                      ? 'bg-red-500/10 border-red-500 text-white shadow-sm'
                      : 'bg-zinc-900/50 border-zinc-800 text-zinc-400 hover:text-white'
                  }`}
                >
                  Tüm Kitaplık (Yeniden Tara)
                </button>
              </div>
            </div>

            {status && status.status === 'Tamamlandı' && (
              <div className="p-4 bg-emerald-950/20 border border-emerald-500/10 rounded-xl text-center">
                <p className="text-emerald-400 text-sm font-medium flex items-center justify-center gap-2">
                  <CheckCircle className="w-5 h-5" /> Son fragman taraması tamamlandı!
                </p>
                <p className="text-zinc-400 text-xs mt-1">
                  Toplam {status.total} taranmamış yapım incelendi. {status.updated} adet fragman başarıyla sisteme kazandırıldı.
                </p>
              </div>
            )}

            <button
              type="submit"
              className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-600/90 hover:to-rose-600/90 text-white font-semibold py-3 px-6 rounded-xl shadow-[0_0_20px_rgba(220,38,38,0.25)] transition-all cursor-pointer"
            >
              <Play className="w-5 h-5 fill-current" /> Fragman Aramasını Başlat
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
