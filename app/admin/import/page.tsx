'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  FileSpreadsheet, ArrowLeft, Upload, Loader2, CheckCircle2,
  AlertCircle, HelpCircle, RefreshCw, DatabaseZap
} from 'lucide-react';

interface ImportResponse {
  success: boolean;
  addedCount: number;
  duplicateCount: number;
  updatedCount?: number;
  addedTitles: string[];
  updatedTitles?: string[];
  message: string;
  error?: string;
}

export default function ImportCsvPage() {
  const router = useRouter();
  const [authorized, setAuthorized] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ImportResponse | null>(null);
  const [error, setError] = useState('');
  const [fillEmptyOnly, setFillEmptyOnly] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      if (droppedFile.name.endsWith('.csv')) {
        setFile(droppedFile);
        setError('');
        setResult(null);
      } else {
        setError('Lütfen yalnızca .csv formatında bir dosya yükleyin.');
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      if (selectedFile.name.endsWith('.csv')) {
        setFile(selectedFile);
        setError('');
        setResult(null);
      } else {
        setError('Lütfen yalnızca .csv formatında bir dosya yükleyin.');
      }
    }
  };

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  const handleUpload = async () => {
    if (!file) return;

    setLoading(true);
    setError('');
    setResult(null);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('fillEmptyOnly', fillEmptyOnly ? 'true' : 'false');

    try {
      const res = await fetch('/api/admin/import-csv', {
        method: 'POST',
        body: formData,
      });

      const data: ImportResponse = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Dosya yükleme ve işleme hatası oluştu.');
      }

      setResult(data);
      setFile(null); // Reset file selection after successful import
    } catch (err: any) {
      setError(err.message || 'Beklenmeyen bir hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setFile(null);
    setResult(null);
    setError('');
    setFillEmptyOnly(false);
  };

  if (!authorized) return null;

  return (
    <div className="max-w-3xl mx-auto py-12 px-4 sm:px-6">
      {/* Back to Admin Dashboard */}
      <Link
        href="/admin"
        className="inline-flex items-center gap-2 text-zinc-400 hover:text-white mb-6 text-sm font-semibold transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Yönetici Paneline Dön
      </Link>

      <div className="glass-card p-8 rounded-3xl relative overflow-hidden border border-white/5 bg-gradient-to-br from-zinc-950/60 to-zinc-900/40 shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/5 rounded-full blur-[120px] -z-10" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-brand-primary/5 rounded-full blur-[120px] -z-10" />

        {/* Title */}
        <div className="flex items-center gap-4 mb-8">
          <div className="p-3 bg-emerald-500/10 rounded-2xl text-emerald-400 border border-emerald-500/20">
            <FileSpreadsheet className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-3xl font-black bg-clip-text text-transparent bg-gradient-to-r from-white via-zinc-200 to-zinc-400 tracking-tight">
              IMDb CSV Yükleyici
            </h1>
            <p className="text-zinc-500 text-sm mt-1">
              Dışa aktardığınız IMDb listenizi yükleyin, veritabanınızı yalnızca yeni yapımlarla güncelleyin.
            </p>
          </div>
        </div>

        {/* Informative instructions */}
        <div className="mb-8 p-4 bg-zinc-950/40 border border-zinc-800 rounded-2xl text-xs text-zinc-400 space-y-2">
          <div className="flex items-center gap-2 text-zinc-300 font-bold mb-1">
            <HelpCircle className="w-4 h-4 text-emerald-400" />
            <span>Yükleme Kuralları & Şablon Gereksinimleri</span>
          </div>
          <p>
            • IMDb web sitesinden (Your Ratings veya özel listelerden) dışa aktarılan standart CSV formatı desteklenir.
          </p>
          <p>
            • Dosyada en az şu sütun başlıkları bulunmalıdır: <code className="text-emerald-400 font-mono">Const</code> (IMDb ID), <code className="text-emerald-400 font-mono">Title</code>, <code className="text-emerald-400 font-mono">Title Type</code>, <code className="text-emerald-400 font-mono">Your Rating</code>.
          </p>
          <p>
            • <strong>Tekilleştirme Güvencesi:</strong> Veritabanında zaten kayıtlı olan yapımlar otomatik olarak taranır ve atlanır. Sadece yeni eklenen yapımlar kaydedilir.
          </p>
          <p>
            • <strong>Dizi Bölümleri:</strong> Dizi bölümleri (TV Episode) içe aktarılmaz; sadece dizilerin veya filmlerin kendi sayfaları eklenir.
          </p>
        </div>

        {/* Error panel */}
        {error && (
          <div className="mb-6 p-4 bg-red-950/30 border border-red-500/20 text-red-200 rounded-2xl flex items-start gap-3 animate-fade-in">
            <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-bold">Hata Oluştu</p>
              <p className="text-xs text-red-300/90 mt-0.5">{error}</p>
            </div>
          </div>
        )}

        {/* Result view */}
        {result && (
          <div className="space-y-6 animate-fade-in">
            {/* Header info */}
            <div className="p-6 bg-zinc-950/50 border border-zinc-800 rounded-3xl flex items-start gap-4">
              <div className="p-3 bg-emerald-500/10 rounded-2xl text-emerald-400 border border-emerald-500/20 shrink-0">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-black text-white">İçe Aktarım Başarıyla Tamamlandı</h3>
                <p className="text-zinc-400 text-sm mt-1">{result.message}</p>
              </div>
            </div>

            {/* Stats row */}
            <div className={`grid gap-4 ${(result.updatedCount ?? 0) > 0 ? 'grid-cols-3' : 'grid-cols-2'}`}>
              <div className="bg-zinc-950/30 p-5 rounded-2xl border border-zinc-800/80 text-center">
                <span className="block text-zinc-500 text-xs font-bold uppercase tracking-wider">Eklenen Yapımlar</span>
                <span className="block text-3xl font-black text-emerald-400 mt-1">{result.addedCount}</span>
              </div>
              {(result.updatedCount ?? 0) > 0 && (
                <div className="bg-zinc-950/30 p-5 rounded-2xl border border-violet-500/20 text-center">
                  <span className="block text-zinc-500 text-xs font-bold uppercase tracking-wider">Güncellenen Yapımlar</span>
                  <span className="block text-3xl font-black text-violet-400 mt-1">{result.updatedCount}</span>
                </div>
              )}
              <div className="bg-zinc-950/30 p-5 rounded-2xl border border-zinc-800/80 text-center">
                <span className="block text-zinc-500 text-xs font-bold uppercase tracking-wider">Mevcut (Atlanan) Yapımlar</span>
                <span className="block text-3xl font-black text-zinc-400 mt-1">{result.duplicateCount}</span>
              </div>
            </div>

            {/* Added titles scroll area */}
            {result.addedTitles.length > 0 && (
              <div className="space-y-3">
                <h4 className="text-xs font-black text-zinc-400 uppercase tracking-wider">Eklenen Yapımların Listesi ({result.addedTitles.length})</h4>
                <div className="max-h-48 overflow-y-auto bg-zinc-950/80 rounded-2xl border border-zinc-900 p-4 font-mono text-[11px] text-zinc-300 space-y-1.5 scrollbar-thin scrollbar-thumb-zinc-800 scrollbar-track-transparent">
                  {result.addedTitles.map((title, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <span className="text-emerald-500 font-bold shrink-0">+</span>
                      <span className="truncate">{title}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Updated titles scroll area */}
            {result.updatedTitles && result.updatedTitles.length > 0 && (
              <div className="space-y-3">
                <h4 className="text-xs font-black text-violet-400 uppercase tracking-wider">Boş Alanları Doldurulan Yapımlar ({result.updatedTitles.length})</h4>
                <div className="max-h-48 overflow-y-auto bg-zinc-950/80 rounded-2xl border border-violet-500/10 p-4 font-mono text-[11px] text-zinc-300 space-y-1.5 scrollbar-thin scrollbar-thumb-zinc-800 scrollbar-track-transparent">
                  {result.updatedTitles.map((title, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <span className="text-violet-400 font-bold shrink-0">↻</span>
                      <span className="truncate">{title}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Post-import actions suggestion */}
            {result.addedCount > 0 && (
              <div className="p-4 bg-brand-primary/5 border border-brand-primary/20 rounded-2xl text-xs text-zinc-400 leading-relaxed">
                <p className="text-zinc-300 font-bold mb-1">💡 Sıradaki Adım: Detayları Zenginleştirme</p>
                Eklenen filmlerin afişlerini ve fragmanlarını otomatik olarak güncellemek için yönetici panelindeki{' '}
                <Link href="/enrich" className="text-brand-primary hover:underline font-bold">Poster Sihirbazı&apos;nı</Link> ve{' '}
                <Link href="/enrich-trailers" className="text-brand-primary hover:underline font-bold">Fragman Sihirbazı&apos;nı</Link>{' '}
                kullanabilirsiniz.
              </div>
            )}

            {/* Back options */}
            <div className="flex gap-4 pt-2">
              <button
                onClick={handleReset}
                className="flex-1 bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-white font-bold py-3.5 px-6 rounded-xl transition-all cursor-pointer text-center text-sm"
              >
                Yeni Dosya Yükle
              </button>
              <Link
                href="/admin"
                className="flex-1 bg-gradient-to-r from-brand-primary to-brand-secondary hover:opacity-95 text-white font-bold py-3.5 px-6 rounded-xl shadow-lg shadow-brand-primary/20 transition-all text-center text-sm"
              >
                Paneli Yönet
              </Link>
            </div>
          </div>
        )}

        {/* Upload form */}
        {!result && (
          <div className="space-y-6">
            {/* Drag & Drop Area */}
            <div
              onDragEnter={handleDrag}
              onDragOver={handleDrag}
              onDragLeave={handleDrag}
              onDrop={handleDrop}
              onClick={handleButtonClick}
              className={`border-2 border-dashed rounded-3xl p-10 flex flex-col items-center justify-center gap-4 transition-all duration-300 cursor-pointer ${
                dragActive
                  ? 'border-emerald-500 bg-emerald-500/5 shadow-[0_0_15px_rgba(16,185,129,0.05)]'
                  : 'border-zinc-800 hover:border-zinc-700 bg-zinc-950/20 hover:bg-zinc-950/40'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                onChange={handleFileChange}
                className="hidden"
                disabled={loading}
              />
              
              <div className="p-4 bg-zinc-900/60 rounded-full border border-white/5 text-zinc-400 group-hover:text-white transition-colors">
                {loading ? (
                  <Loader2 className="w-8 h-8 text-emerald-400 animate-spin" />
                ) : (
                  <Upload className="w-8 h-8" />
                )}
              </div>

              <div className="text-center">
                {file ? (
                  <div className="space-y-1">
                    <p className="text-sm font-extrabold text-white">{file.name}</p>
                    <p className="text-xs text-zinc-500 font-mono">{(file.size / 1024).toFixed(1)} KB</p>
                  </div>
                ) : (
                  <div className="space-y-1">
                    <p className="text-sm font-extrabold text-zinc-200">
                      Dosyayı buraya sürükleyin veya tıklayarak seçin
                    </p>
                    <p className="text-xs text-zinc-500">IMDb listenizin .csv formatındaki dosyası</p>
                  </div>
                )}
              </div>
            </div>

            {/* Import Mode Toggle */}
            <div className="p-4 bg-zinc-950/40 border border-zinc-800 rounded-2xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-xl border transition-all ${
                    fillEmptyOnly
                      ? 'bg-violet-500/10 text-violet-400 border-violet-500/20'
                      : 'bg-zinc-900/60 text-zinc-500 border-zinc-800'
                  }`}>
                    <DatabaseZap className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-zinc-200">Boş Alanları Doldur</p>
                    <p className="text-[11px] text-zinc-500 mt-0.5">Mevcut filmlerin eksik alanlarını CSV verisinden tamamla (var olan veriler korunur)</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setFillEmptyOnly(prev => !prev)}
                  className={`relative w-12 h-6 rounded-full transition-all duration-300 cursor-pointer flex-shrink-0 ${
                    fillEmptyOnly
                      ? 'bg-violet-600 shadow-lg shadow-violet-600/20'
                      : 'bg-zinc-800'
                  }`}
                >
                  <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all duration-300 ${
                    fillEmptyOnly ? 'left-[26px]' : 'left-0.5'
                  }`} />
                </button>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex gap-4">
              <Link
                href="/admin"
                className="flex-1 bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-zinc-400 hover:text-white font-bold py-3.5 px-6 rounded-xl transition-all text-center text-sm"
              >
                Vazgeç
              </Link>
              <button
                onClick={handleUpload}
                disabled={!file || loading}
                className={`flex-1 flex items-center justify-center gap-2 hover:opacity-95 text-white font-bold py-3.5 px-6 rounded-xl shadow-lg disabled:opacity-40 disabled:pointer-events-none transition-all cursor-pointer text-sm ${
                  fillEmptyOnly
                    ? 'bg-gradient-to-r from-violet-600 to-indigo-600 shadow-violet-500/20'
                    : 'bg-gradient-to-r from-emerald-600 to-teal-600 shadow-emerald-500/20'
                }`}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    İşleniyor...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    {fillEmptyOnly ? 'Yükle ve Boş Alanları Doldur' : 'Yükle ve Ekle'}
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
