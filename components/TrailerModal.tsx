'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Film, ExternalLink, Pencil, Check, Loader2 } from 'lucide-react';

interface TrailerModalProps {
  isOpen: boolean;
  onClose: () => void;
  trailerYoutubeId?: string | null;
  title: string;
  year?: number | string;
  isAdmin?: boolean;
  onSaveTrailer?: (newYoutubeIdOrUrl: string) => Promise<void>;
}

export default function TrailerModal({
  isOpen,
  onClose,
  trailerYoutubeId,
  title,
  year,
  isAdmin,
  onSaveTrailer,
}: TrailerModalProps) {
  const [mounted, setMounted] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [trailerInput, setTrailerInput] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isOpen) {
      setTrailerInput(trailerYoutubeId || '');
      setIsEditing(false);
      setError('');
    }
  }, [isOpen, trailerYoutubeId]);

  // ESC keyboard listener & body scroll lock
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen || !mounted) return null;

  const handleSave = async () => {
    if (!onSaveTrailer) return;
    setSaving(true);
    setError('');
    try {
      await onSaveTrailer(trailerInput);
      setIsEditing(false);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Kaydedilirken bir hata oluştu.');
    } finally {
      setSaving(false);
    }
  };

  const youtubeSearchUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(
    `${title} ${year || ''} fragman`
  )}`;

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 sm:p-6 transition-all duration-300 animate-fade-in"
      onClick={onClose}
    >
      {/* Modal Container */}
      <div
        className="relative max-w-6xl w-full flex flex-col bg-zinc-950/95 rounded-3xl border border-white/10 overflow-hidden shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-zinc-900/50">
          <div className="flex items-center gap-2">
            <Film className="w-5 h-5 text-brand-primary" />
            <h3 className="text-lg font-bold text-white tracking-tight line-clamp-1">
              {title} {year ? <span className="text-zinc-400 font-normal text-sm">({year})</span> : null}
            </h3>
          </div>

          <div className="flex items-center gap-3">
            {isAdmin && !isEditing && (
              <button
                type="button"
                onClick={() => {
                  setTrailerInput(trailerYoutubeId || '');
                  setError('');
                  setIsEditing(true);
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-900 border border-brand-primary/40 text-brand-primary text-xs font-bold hover:bg-brand-primary/10 transition-all cursor-pointer"
              >
                <Pencil className="w-3.5 h-3.5" /> Fragman Düzenle
              </button>
            )}

            <button
              onClick={onClose}
              className="p-2 rounded-full bg-zinc-800/80 text-zinc-400 hover:text-white hover:bg-zinc-700 transition-colors cursor-pointer"
              aria-label="Kapat"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="space-y-3">
          {/* Admin Edit Form Bar */}
          {isAdmin && isEditing && (
            <div className="p-3 bg-zinc-900/90 rounded-2xl border border-brand-primary/30 flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={trailerInput}
                  onChange={(e) => setTrailerInput(e.target.value)}
                  placeholder="YouTube ID veya URL yapıştırın (ör: dQw4w9WgXcQ)"
                  className="flex-1 rounded-xl bg-zinc-950 border border-white/10 text-zinc-200 text-sm px-3 py-2 outline-none focus:border-brand-primary/60 transition-colors"
                />
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={saving}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-brand-primary/20 border border-brand-primary/40 text-brand-primary text-xs font-bold hover:bg-brand-primary/30 transition-all cursor-pointer disabled:opacity-50 whitespace-nowrap"
                >
                  {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />} Kaydet
                </button>
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-zinc-800 border border-white/10 text-zinc-400 text-xs font-bold hover:bg-zinc-700 transition-all cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
              {error && <p className="text-xs text-red-400 px-1">{error}</p>}
            </div>
          )}

          {trailerYoutubeId ? (
            <div className="relative aspect-video w-full overflow-hidden bg-black shadow-inner">
              <iframe
                key={trailerYoutubeId}
                src={`https://www.youtube.com/embed/${trailerYoutubeId}?autoplay=1&rel=0`}
                title={`${title} Fragman`}
                className="absolute inset-0 h-full w-full border-0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
              />
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 px-6 text-center space-y-4 bg-zinc-900/30 rounded-2xl border border-dashed border-white/10">
              <div className="w-16 h-16 rounded-full bg-brand-primary/10 flex items-center justify-center border border-brand-primary/20 text-brand-primary">
                <Film className="w-8 h-8" />
              </div>
              <div>
                <h4 className="text-lg font-bold text-white">Fragman bulunamadı</h4>
                <p className="text-sm text-zinc-400 mt-1 max-w-md">
                  Bu film için eklenmiş doğrudan bir fragman videosu mevcut değil.
                </p>
              </div>
              <div className="flex flex-wrap items-center justify-center gap-3">
                {isAdmin && !isEditing && (
                  <button
                    type="button"
                    onClick={() => {
                      setTrailerInput('');
                      setError('');
                      setIsEditing(true);
                    }}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand-primary/20 border border-brand-primary/40 text-brand-primary font-bold text-sm hover:bg-brand-primary/30 transition-all cursor-pointer"
                  >
                    <Pencil className="w-4 h-4" /> Fragman Ekle
                  </button>
                )}
                <a
                  href={youtubeSearchUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-sm transition-all shadow-lg shadow-red-900/30"
                >
                  <ExternalLink className="w-4 h-4" /> YouTube'da Ara
                </a>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
