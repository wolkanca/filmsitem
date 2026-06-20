import Link from 'next/link';
import { getMovies, getStats } from '@/lib/db';
import MovieCard from '@/components/MovieCard';
import { Star, Film, Clock, Award, Sparkles, ArrowRight } from 'lucide-react';
import Image from 'next/image';

export const revalidate = 3600; // Revalidate every hour (ISR)

export default async function HomePage() {
  const movies = await getMovies();
  const stats = await getStats();

  // Sorting movies for sections
  const recentlyAdded = [...movies]
    .sort((a, b) => new Date(b.watchDate).getTime() - new Date(a.watchDate).getTime())
    .slice(0, 5);

  const PLACEHOLDER_PATTERNS = ['images.unsplash.com', 'unsplash.com/photo', 'via.placeholder.com', 'placehold.co', 'placeholder.com', 'dummyimage.com'];
  const hasRealPoster = (url?: string) => !!url && !PLACEHOLDER_PATTERNS.some(p => url.includes(p));

  const highestRated = [...movies]
    .filter(m => m.myRating > 0 && hasRealPoster(m.poster))
    .sort((a, b) => b.myRating - a.myRating || b.imdbRating - a.imdbRating)
    .slice(0, 5);

  const recentlyWatched = [...movies]
    .sort((a, b) => new Date(b.watchDate).getTime() - new Date(a.watchDate).getTime())
    .slice(0, 5);

  // Pick a single featured banner movie from high-rated ones
  const featuredMovie = movies.find(m => m.myRating >= 8) || movies[0];

  return (
    <div className="space-y-12">
      
      {/* Hero Section */}
      <section className="relative overflow-hidden rounded-3xl border border-white/10 bg-slate-950/40 p-8 sm:p-12 lg:p-16">
        {/* Backdrop glass blur effect */}
        {featuredMovie?.backdrop && (
          <div className="absolute inset-0 z-0 opacity-20">
            <Image
              src={featuredMovie.backdrop}
              alt="Backdrop blur"
              fill
              sizes="100vw"
              className="object-cover blur-xl"
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-transparent"></div>
          </div>
        )}

        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Hero text */}
          <div className="lg:col-span-8 space-y-6">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-red-500/10 text-red-300 border border-red-500/20">
              <Sparkles className="w-3.5 h-3.5" /> Kişisel Sinema Günlüğüm
            </span>
            <h1 className="text-4xl sm:text-5xl font-black tracking-tight leading-tight">
              🎬 <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-zinc-200 to-zinc-400">Film Günlüğüm</span>
            </h1>
            <p className="text-base sm:text-lg text-zinc-400 max-w-xl leading-relaxed">
              Yıllardır izlediğim filmler, verdiğim puanlar ve kişisel sinema arşivim. Hoş geldiniz, benimle birlikte sinema yolculuğumu keşfedin.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-wrap gap-4 pt-2">
              <Link
                href="/movies"
                className="inline-flex items-center gap-2 bg-gradient-to-r from-brand-primary to-brand-secondary hover:opacity-95 text-white font-bold px-6 py-3 rounded-xl transition-all duration-300 shadow-[0_4px_20px_rgba(239,68,68,0.3)] hover:shadow-[0_4px_25px_rgba(239,68,68,0.5)]"
              >
                Arşivi Keşfet
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/random"
                className="inline-flex items-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 text-zinc-200 hover:text-white font-bold px-6 py-3 rounded-xl transition-all duration-300"
              >
                <span>🎲</span> Bu Akşam Ne İzlesem?
              </Link>
            </div>
          </div>

          {/* Quick Stats Grid */}
          <div className="lg:col-span-4 grid grid-cols-2 gap-4">
            <div className="glass p-5 rounded-2xl border border-white/5 text-center flex flex-col justify-center items-center">
              <Film className="w-6 h-6 text-brand-primary mb-2" />
              <span className="text-3xl font-black text-white glow-text-red">{stats.totalCount}</span>
              <span className="text-xs text-zinc-500 font-semibold mt-1">Toplam İzlenen</span>
            </div>
            
            <div className="glass p-5 rounded-2xl border border-white/5 text-center flex flex-col justify-center items-center">
              <Star className="w-6 h-6 text-brand-accent mb-2 fill-brand-accent/10" />
              <span className="text-3xl font-black text-white">{stats.averageRating}</span>
              <span className="text-xs text-zinc-500 font-semibold mt-1">Ortalama Puanım</span>
            </div>

            <div className="glass p-5 rounded-2xl border border-white/5 text-center flex flex-col justify-center items-center col-span-2">
              <Clock className="w-6 h-6 text-brand-rose mb-2" />
              <span className="text-3xl font-black text-white glow-text-rose">{stats.totalRuntimeHours} Saat</span>
              <span className="text-xs text-zinc-500 font-semibold mt-1">Toplam İzleme Süresi</span>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Recommendation Widget (Random Suggestion Card) */}
      <section className="glass rounded-3xl border border-white/5 p-6 sm:p-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-2">
            <h2 className="text-xl sm:text-2xl font-extrabold text-zinc-100 flex items-center gap-2">
              <Sparkles className="w-5.5 h-5.5 text-brand-accent" /> Günün Rastgele Film Önerisi
            </h2>
            <p className="text-sm text-zinc-400 max-w-xl">
              Kararsız mısınız? Kütüphanenizden özenle seçilen bu yapım sinema gecenizi renklendirebilir.
            </p>
          </div>
          <Link
            href="/random"
            className="flex-shrink-0 bg-brand-primary/10 hover:bg-brand-primary/20 border border-brand-primary/20 text-brand-primary font-bold px-5 py-2.5 rounded-xl transition-all text-sm"
          >
            Çarkı Döndür 🎰
          </Link>
        </div>
        
        {/* Recommended Movie Preview */}
        {featuredMovie && (
          <div className="mt-6 flex flex-col md:flex-row gap-6 bg-zinc-950/40 border border-white/5 rounded-2xl p-4 sm:p-6 items-center">
            <div className="relative aspect-[2/3] w-36 sm:w-44 flex-shrink-0 overflow-hidden rounded-xl bg-zinc-900 border border-zinc-800">
              {featuredMovie.poster ? (
                <Image
                  src={featuredMovie.poster}
                  alt={featuredMovie.title}
                  fill
                  sizes="(max-width: 640px) 150px, 200px"
                  className="object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center">🎬</div>
              )}
            </div>
            <div className="flex-grow space-y-4 text-center md:text-left">
              <div>
                <span className="text-[10px] bg-brand-primary/10 text-brand-primary border border-brand-primary/20 px-2 py-0.5 rounded-md font-semibold">
                  TAVSİYE EDİLEN
                </span>
                <h3 className="text-xl sm:text-2xl font-black text-white mt-1">
                  {featuredMovie.title}{' '}
                  <span className="text-zinc-500 font-normal text-lg">({featuredMovie.year})</span>
                </h3>
                <p className="text-xs text-zinc-400 mt-1">
                  Yönetmen: {featuredMovie.director} • Tür: {featuredMovie.genres.join(', ')}
                </p>
              </div>
              <p className="text-sm text-zinc-400 line-clamp-3 leading-relaxed max-w-3xl">
                {featuredMovie.overview}
              </p>
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-4">
                <div className="flex items-center gap-1">
                  <span className="text-xs text-zinc-500">Benim Puanım:</span>
                  <Star className="w-4 h-4 text-brand-accent fill-brand-accent" />
                  <span className="text-sm font-bold text-white">{featuredMovie.myRating}/10</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-xs text-zinc-500">IMDb Puanı:</span>
                  <span className="text-sm font-bold text-zinc-300">{featuredMovie.imdbRating}</span>
                </div>
                <Link
                  href={`/movie/${featuredMovie.imdbId}`}
                  className="text-xs text-brand-primary font-bold hover:underline inline-flex items-center gap-1"
                >
                  Detayları Gör <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* Son Eklenen Filmler */}
      <section className="space-y-6">
        <div className="flex justify-between items-center border-b border-zinc-800 pb-3">
          <h2 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
            <span>🔥</span> Son Eklenen Yapımlar
          </h2>
          <Link href="/movies?sort=watchDate" className="text-xs text-zinc-400 hover:text-white flex items-center gap-1 font-bold">
            Tümünü Gör <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-6">
          {recentlyAdded.map((movie) => (
            <MovieCard key={movie.imdbId} movie={movie} />
          ))}
        </div>
      </section>

      {/* En Yüksek Puan Verdiklerim */}
      <section className="space-y-6">
        <div className="flex justify-between items-center border-b border-zinc-800 pb-3">
          <h2 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
            <span>👑</span> Başyapıtlarım (En Yüksek Puanlılar)
          </h2>
          <Link href="/favorites" className="text-xs text-zinc-400 hover:text-white flex items-center gap-1 font-bold">
            Tümünü Gör <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-6">
          {highestRated.map((movie) => (
            <MovieCard key={movie.imdbId} movie={movie} />
          ))}
        </div>
      </section>

      {/* Son İzlediklerim Geçmişi */}
      <section className="space-y-6">
        <div className="flex justify-between items-center border-b border-zinc-800 pb-3">
          <h2 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
            <span>📅</span> Son İzleme Geçmişim
          </h2>
          <Link href="/movies" className="text-xs text-zinc-400 hover:text-white flex items-center gap-1 font-bold">
            İzleme Geçmişi <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-6">
          {recentlyWatched.map((movie) => (
            <MovieCard key={movie.imdbId} movie={movie} />
          ))}
        </div>
      </section>

    </div>
  );
}
