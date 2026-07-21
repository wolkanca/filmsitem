'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Shield, Lock, User, LogOut, ArrowRight, Sparkles, Video,
  Loader2, Film, FileSpreadsheet, Mail, Database, RefreshCw,
  ToggleLeft, ToggleRight, ArrowUpFromLine, ArrowDownToLine,
  CheckCircle2, XCircle, AlertCircle, Wifi, WifiOff
} from 'lucide-react';

export default function AdminPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // Login form states
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  // Poster enrich wizard status state
  const [enrichStatus, setEnrichStatus] = useState<{
    isRunning: boolean;
    total: number;
    processed: number;
    updated: number;
    failed: number;
    status: string;
    changes?: string[];
  } | null>(null);

  // Blob management state
  const [blobStatus, setBlobStatus] = useState<{
    enabled: boolean;
    blobUrl: string;
    blobReachable: boolean;
    localExists: boolean;
    localCount: number;
    lastSync: string | null;
    lastSyncDirection: string | null;
  } | null>(null);
  const [blobLoading, setBlobLoading] = useState(false);
  const [blobSyncing, setBlobSyncing] = useState<'local_to_blob' | 'blob_to_local' | null>(null);
  const [blobMessage, setBlobMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Check login cookie on mount
  useEffect(() => {
    setMounted(true);
    const cookies = document.cookie.split(';');
    const isAlreadyAdmin = cookies.some((c) => c.trim().startsWith('is_admin=true'));
    setIsLoggedIn(isAlreadyAdmin);
  }, []);

  // Fetch blob status
  const fetchBlobStatus = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/blob-settings');
      if (res.ok) setBlobStatus(await res.json());
    } catch { /* ignore */ }
  }, []);

  // Poll enrich wizard status when logged in
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

    fetchBlobStatus();

    return () => clearInterval(interval);
  }, [isLoggedIn, fetchBlobStatus]);

  // Blob toggle
  const handleBlobToggle = async () => {
    if (!blobStatus) return;
    setBlobLoading(true);
    setBlobMessage(null);
    try {
      const res = await fetch('/api/admin/blob-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled: !blobStatus.enabled }),
      });
      if (res.ok) {
        await fetchBlobStatus();
        setBlobMessage({
          type: 'success',
          text: !blobStatus.enabled ? 'Blob veritabanı etkinleştirildi.' : 'Blob veritabanı devre dışı bırakıldı. Veriler local dosyadan okunacak.',
        });
      }
    } catch {
      setBlobMessage({ type: 'error', text: 'Ayar kaydedilemedi.' });
    } finally {
      setBlobLoading(false);
    }
  };

  // Blob sync
  const handleBlobSync = async (direction: 'local_to_blob' | 'blob_to_local') => {
    setBlobSyncing(direction);
    setBlobMessage(null);
    try {
      const res = await fetch('/api/admin/blob-sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ direction }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setBlobMessage({ type: 'success', text: data.message });
        await fetchBlobStatus();
      } else {
        setBlobMessage({ type: 'error', text: data.error || 'Senkronizasyon başarısız.' });
      }
    } catch {
      setBlobMessage({ type: 'error', text: 'Senkronizasyon sırasında bir hata oluştu.' });
    } finally {
      setBlobSyncing(null);
    }
  };

  // Auto-detect blob URL
  const handleDetectBlobUrl = async () => {
    setBlobLoading(true);
    setBlobMessage(null);
    try {
      const res = await fetch('/api/admin/blob-settings', { method: 'PUT' });
      const data = await res.json();
      if (res.ok && data.success) {
        setBlobMessage({ type: 'success', text: `Blob URL tespit edildi: ${data.url}` });
        await fetchBlobStatus();
      } else {
        setBlobMessage({ type: 'error', text: data.error || 'URL tespit edilemedi.' });
      }
    } catch {
      setBlobMessage({ type: 'error', text: 'Bağlantı hatası.' });
    } finally {
      setBlobLoading(false);
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

  if (!mounted) return null;

  return (
    <div className="max-w-5xl mx-auto py-12 px-4 sm:px-6">
      {isLoggedIn ? (
        // ADMIN DASHBOARD MENU
        <div className="space-y-10 animate-fade-in">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800 pb-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-brand-primary/10 rounded-2xl text-brand-primary border border-brand-primary/20">
                <Shield className="w-8 h-8" />
              </div>
              <div>
                <h1 className="text-3xl font-black text-white tracking-tight">Yönetici Kontrol Paneli</h1>
                <p className="text-zinc-500 text-sm mt-1">Hoş geldiniz, Volkan Yılmaz. Kitaplığınızı yönetin ve zenginleştirin.</p>
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

          {/* Navigation Menu Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Movie Editor Card */}
            <Link href="/admin/movies" className="group">
              <div className="glass-card p-8 rounded-3xl border border-white/5 bg-gradient-to-br from-zinc-950/40 to-violet-950/10 hover:border-violet-500/30 hover:to-violet-950/20 transition-all duration-300 h-full flex flex-col justify-between relative overflow-hidden group shadow-lg hover:shadow-[0_15px_40px_rgba(139,92,246,0.08)]">
                <div className="absolute top-0 right-0 w-32 h-32 bg-violet-500/10 rounded-full blur-3xl -z-10 group-hover:bg-violet-500/20 transition-colors" />
                <div>
                  <div className="p-3 bg-violet-500/10 rounded-2xl text-violet-400 border border-violet-500/20 w-fit mb-6">
                    <Film className="w-7 h-7" />
                  </div>
                  <h2 className="text-xl font-black text-white group-hover:text-violet-400 transition-colors">Film Düzenleyici</h2>
                  <p className="text-zinc-400 text-xs mt-3 leading-relaxed">
                    Kitaplığınızdaki tüm filmlerin afiş, fragman, yapım yılı, puanlama, listeler gibi tüm detaylarını arayarak, sıralayarak detaylıca elle düzenleyin.
                  </p>
                </div>
                <div className="flex items-center gap-2 text-violet-400 font-bold text-xs mt-8 group-hover:translate-x-1 transition-transform">
                  Düzenleyiciye Git <ArrowRight className="w-4 h-4" />
                </div>
              </div>
            </Link>

            {/* Poster Wizard Card */}
            <Link href="/enrich" className="group">
              <div className="glass-card p-8 rounded-3xl border border-white/5 bg-gradient-to-br from-zinc-950/40 to-red-950/10 hover:border-brand-primary/30 hover:to-red-950/20 transition-all duration-300 h-full flex flex-col justify-between relative overflow-hidden group shadow-lg hover:shadow-[0_15px_40px_rgba(239,68,68,0.08)]">
                <div className="absolute top-0 right-0 w-32 h-32 bg-brand-primary/10 rounded-full blur-3xl -z-10 group-hover:bg-brand-primary/20 transition-colors" />
                <div>
                  <div className="p-3 bg-brand-primary/10 rounded-2xl text-brand-primary border border-brand-primary/20 w-fit mb-6">
                    <Sparkles className="w-7 h-7" />
                  </div>
                  <h2 className="text-xl font-black text-white group-hover:text-brand-primary transition-colors">Poster Sihirbazı</h2>
                  <p className="text-zinc-400 text-xs mt-3 leading-relaxed">
                    Afişi olmayan veya görseli eksik olan filmlerin afişlerini ve genel bilgilerini OMDB API üzerinden otomatik olarak güncelleyin.
                  </p>
                </div>
                <div className="flex items-center gap-2 text-brand-primary font-bold text-xs mt-8 group-hover:translate-x-1 transition-transform">
                  Sihirbaza Git <ArrowRight className="w-4 h-4" />
                </div>
              </div>
            </Link>

            {/* Trailer Wizard Card */}
            <Link href="/enrich-trailers" className="group">
              <div className="glass-card p-8 rounded-3xl border border-white/5 bg-gradient-to-br from-zinc-950/40 to-red-950/10 hover:border-red-500/30 hover:to-red-950/20 transition-all duration-300 h-full flex flex-col justify-between relative overflow-hidden group shadow-lg hover:shadow-[0_15px_40px_rgba(239,68,68,0.08)]">
                <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/10 rounded-full blur-3xl -z-10 group-hover:bg-red-500/20 transition-colors" />
                <div>
                  <div className="p-3 bg-red-500/10 rounded-2xl text-red-500 border border-red-500/20 w-fit mb-6">
                    <Video className="w-7 h-7" />
                  </div>
                  <h2 className="text-xl font-black text-white group-hover:text-red-500 transition-colors">Fragman Sihirbazı</h2>
                  <p className="text-zinc-400 text-xs mt-3 leading-relaxed">
                    Yapımların resmi YouTube fragman linklerini TMDb API ile otomatik olarak sorgulayarak veritabanınıza eşleyin.
                  </p>
                </div>
                <div className="flex items-center gap-2 text-red-500 font-bold text-xs mt-8 group-hover:translate-x-1 transition-transform">
                  Sihirbaza Git <ArrowRight className="w-4 h-4" />
                </div>
              </div>
            </Link>

            {/* Broken Trailer Checker Card */}
            <Link href="/admin/check-trailers" className="group">
              <div className="glass-card p-8 rounded-3xl border border-white/5 bg-gradient-to-br from-zinc-950/40 to-red-950/10 hover:border-red-500/30 hover:to-red-950/20 transition-all duration-300 h-full flex flex-col justify-between relative overflow-hidden group shadow-lg hover:shadow-[0_15px_40px_rgba(239,68,68,0.08)]">
                <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/10 rounded-full blur-3xl -z-10 group-hover:bg-red-500/20 transition-colors" />
                <div>
                  <div className="p-3 bg-red-500/10 rounded-2xl text-red-500 border border-red-500/20 w-fit mb-6">
                    <Video className="w-7 h-7" />
                  </div>
                  <h2 className="text-xl font-black text-white group-hover:text-red-500 transition-colors">Bozuk Fragman Kontrolcü</h2>
                  <p className="text-zinc-400 text-xs mt-3 leading-relaxed">
                    YouTube fragmanlarını otomatik doğrulayarak silinmiş, özel veya ulaşılamayan videoları saptayın ve düzeltin.
                  </p>
                </div>
                <div className="flex items-center gap-2 text-red-500 font-bold text-xs mt-8 group-hover:translate-x-1 transition-transform">
                  Kontrolcüye Git <ArrowRight className="w-4 h-4" />
                </div>
              </div>
            </Link>

            {/* IMDb CSV Import Card */}
            <Link href="/admin/import" className="group">
              <div className="glass-card p-8 rounded-3xl border border-white/5 bg-gradient-to-br from-zinc-950/40 to-emerald-950/10 hover:border-emerald-500/30 hover:to-emerald-950/20 transition-all duration-300 h-full flex flex-col justify-between relative overflow-hidden group shadow-lg hover:shadow-[0_15px_40px_rgba(16,185,129,0.08)]">
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

          {/* Blob Database Management Panel */}
          <div className="glass-card p-6 rounded-3xl border border-white/5 bg-gradient-to-br from-zinc-950/40 to-cyan-950/10 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-40 h-40 bg-cyan-500/5 rounded-full blur-3xl -z-10" />

            <div className="flex items-center gap-3 mb-5">
              <div className="p-2.5 bg-cyan-500/10 rounded-xl text-cyan-400 border border-cyan-500/20">
                <Database className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-black text-white">Blob Veritabanı Yöneticisi</h2>
                <p className="text-zinc-500 text-[11px] mt-0.5">Vercel Blob ↔ Local dosya senkronizasyonu ve erişim kontrolü</p>
              </div>
              <button
                onClick={fetchBlobStatus}
                className="ml-auto p-2 text-zinc-500 hover:text-cyan-400 transition-colors cursor-pointer rounded-lg hover:bg-cyan-500/10"
                title="Yenile"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>

            {!blobStatus ? (
              <div className="flex items-center gap-2 text-zinc-500 text-sm py-4">
                <Loader2 className="w-4 h-4 animate-spin" />
                Blob durumu kontrol ediliyor...
              </div>
            ) : (
              <div className="space-y-4">
                {/* Status row */}
                <div className="grid grid-cols-3 gap-3">
                  {/* Blob toggle */}
                  <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-3">
                    <span className="block text-[10px] text-zinc-500 font-bold uppercase mb-2">Blob Durumu</span>
                    <button
                      onClick={handleBlobToggle}
                      disabled={blobLoading}
                      className={`flex items-center gap-2 text-sm font-bold transition-colors cursor-pointer ${
                        blobStatus.enabled ? 'text-emerald-400 hover:text-emerald-300' : 'text-zinc-500 hover:text-zinc-300'
                      }`}
                    >
                      {blobLoading ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : blobStatus.enabled ? (
                        <ToggleRight className="w-6 h-6" />
                      ) : (
                        <ToggleLeft className="w-6 h-6" />
                      )}
                      {blobStatus.enabled ? 'Açık' : 'Kapalı'}
                    </button>
                  </div>

                  {/* Blob reachability */}
                  <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-3">
                    <span className="block text-[10px] text-zinc-500 font-bold uppercase mb-2">Blob Erişimi</span>
                    <div className={`flex items-center gap-1.5 text-sm font-bold ${
                      !blobStatus.blobUrl ? 'text-zinc-600' :
                      blobStatus.blobReachable ? 'text-emerald-400' : 'text-red-400'
                    }`}>
                      {!blobStatus.blobUrl ? (
                        <><AlertCircle className="w-4 h-4" /> URL Yok</>
                      ) : blobStatus.blobReachable ? (
                        <><Wifi className="w-4 h-4" /> Erişilebilir</>
                      ) : (
                        <><WifiOff className="w-4 h-4" /> Ulaşılamıyor</>
                      )}
                    </div>
                  </div>

                  {/* Local file status */}
                  <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-3">
                    <span className="block text-[10px] text-zinc-500 font-bold uppercase mb-2">Local Dosya</span>
                    <div className={`flex items-center gap-1.5 text-sm font-bold ${
                      blobStatus.localExists ? 'text-emerald-400' : 'text-red-400'
                    }`}>
                      {blobStatus.localExists ? (
                        <><CheckCircle2 className="w-4 h-4" /> {blobStatus.localCount} Film</>
                      ) : (
                        <><XCircle className="w-4 h-4" /> Bulunamadı</>
                      )}
                    </div>
                  </div>
                </div>

                {/* Last sync info */}
                {blobStatus.lastSync && (
                  <div className="text-[11px] text-zinc-600 flex items-center gap-1.5">
                    <RefreshCw className="w-3 h-3" />
                    Son senkronizasyon: <span className="text-zinc-400">
                      {new Date(blobStatus.lastSync).toLocaleString('tr-TR')} &mdash;
                      {blobStatus.lastSyncDirection === 'local_to_blob' ? ' Local → Blob' : ' Blob → Local'}
                    </span>
                  </div>
                )}

                {/* Blob URL */}
                {blobStatus.blobUrl && (
                  <div className="text-[10px] text-zinc-700 truncate font-mono bg-zinc-900/40 px-3 py-1.5 rounded-lg border border-zinc-800">
                    {blobStatus.blobUrl}
                  </div>
                )}

                {/* Alert message */}
                {blobMessage && (
                  <div className={`flex items-start gap-2 p-3 rounded-xl text-xs font-medium ${
                    blobMessage.type === 'success'
                      ? 'bg-emerald-950/30 border border-emerald-500/20 text-emerald-300'
                      : 'bg-red-950/30 border border-red-500/20 text-red-300'
                  }`}>
                    {blobMessage.type === 'success' ? <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5" /> : <XCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />}
                    {blobMessage.text}
                  </div>
                )}

                {/* Action buttons */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                  {/* Local → Blob */}
                  <button
                    onClick={() => handleBlobSync('local_to_blob')}
                    disabled={!!blobSyncing || blobLoading}
                    className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 hover:bg-cyan-500/20 text-xs font-bold transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    {blobSyncing === 'local_to_blob' ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <ArrowUpFromLine className="w-4 h-4" />
                    )}
                    Local → Blob
                  </button>

                  {/* Blob → Local */}
                  <button
                    onClick={() => handleBlobSync('blob_to_local')}
                    disabled={!!blobSyncing || blobLoading || !blobStatus.blobUrl}
                    className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-violet-500/10 border border-violet-500/20 text-violet-400 hover:bg-violet-500/20 text-xs font-bold transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    {blobSyncing === 'blob_to_local' ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <ArrowDownToLine className="w-4 h-4" />
                    )}
                    Blob → Local
                  </button>

                  {/* Auto-detect URL */}
                  <button
                    onClick={handleDetectBlobUrl}
                    disabled={!!blobSyncing || blobLoading}
                    className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 hover:bg-amber-500/20 text-xs font-bold transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    {blobLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <RefreshCw className="w-4 h-4" />
                    )}
                    URL Tespit Et
                  </button>
                </div>

                {/* Info note */}
                <p className="text-[10px] text-zinc-700 leading-relaxed">
                  <strong className="text-zinc-600">Blob Kapalı:</strong> Veriler yalnızca local dosyadan okunur, Blob API kotası harcanmaz. &nbsp;
                  <strong className="text-zinc-600">Blob Açık:</strong> Veriler önce Blob&#39;dan çekilir, erişilemezse local dosyaya fallback yapılır.
                </p>
              </div>
            )}
          </div>

          {/* Enrich status summary (wizard details) */}
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
    </div>
  );
}
