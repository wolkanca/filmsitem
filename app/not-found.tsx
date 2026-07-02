import Link from 'next/link';
import { Film, Home, ArrowLeft, Shuffle } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center text-center px-4 relative overflow-hidden">
      {/* Background ambient glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-brand-primary/10 rounded-full blur-[120px] -z-10 animate-pulse-subtle" />
      
      <div className="glass-card max-w-lg p-8 sm:p-12 rounded-3xl border border-card-border/50 relative">
        {/* Floating icon */}
        <div className="w-20 h-20 bg-zinc-900 border border-brand-primary/30 rounded-2xl flex items-center justify-center mx-auto mb-6 text-brand-primary shadow-[0_0_30px_rgba(255,0,0,0.15)] animate-shuffle">
          <Film className="w-10 h-10" />
        </div>

        <h1 className="text-7xl font-black text-white tracking-tighter mb-2">404</h1>
        <h2 className="text-xl sm:text-2xl font-bold text-zinc-200 mb-4">
          Sayfa Bulunamadı
        </h2>
        <p className="text-zinc-500 text-sm sm:text-base mb-8 leading-relaxed">
          Karanlık bir sinema salonunda kaybolmuş gibisiniz. Aradığınız film, oyuncu, yönetmen ya da sayfa kütüphanemizde bulunmuyor.
        </p>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
          <Link
            href="/"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-white text-zinc-950 hover:bg-zinc-200 transition-colors px-6 py-3 rounded-xl font-bold text-sm"
          >
            <Home className="w-4 h-4" />
            Ana Sayfa
          </Link>
          
          <Link
            href="/movies"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-zinc-900 hover:bg-zinc-800 text-white border border-white/10 transition-colors px-6 py-3 rounded-xl font-bold text-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            Filmlerime Dön
          </Link>

          <Link
            href="/random"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-brand-secondary/20 hover:bg-brand-secondary/30 text-brand-rose border border-brand-secondary/30 transition-colors px-6 py-3 rounded-xl font-bold text-sm"
          >
            <Shuffle className="w-4 h-4" />
            Rastgele Film
          </Link>
        </div>
      </div>
    </div>
  );
}
