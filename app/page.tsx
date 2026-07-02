import Link from 'next/link';
import { getMovies, getStats } from '@/lib/db';
import { getBlogPosts } from '@/lib/blog';
import MovieCard from '@/components/MovieCard';
import { Star, Film, Clock, Award, Sparkles, ArrowRight, ExternalLink, Newspaper } from 'lucide-react';
import Image from 'next/image';
import { formatDate } from '@/lib/utils';
import FeaturedSlider from '@/components/FeaturedSlider';

export const revalidate = 3600; // Revalidate every hour (ISR)

export default async function HomePage() {
  const movies = await getMovies();
  const stats = await getStats();
  const blogPosts = await getBlogPosts(4);

  // Sorting movies for sections
  const recentlyAdded = [...movies]
    .sort((a, b) => new Date(b.watchDate).getTime() - new Date(a.watchDate).getTime())
    .slice(0, 5);

  const PLACEHOLDER_PATTERNS = ['images.unsplash.com', 'unsplash.com/photo', 'via.placeholder.com', 'placehold.co', 'placeholder.com', 'dummyimage.com'];
  const hasRealPoster = (url?: string) => !!url && !PLACEHOLDER_PATTERNS.some(p => url.includes(p));

  // Başyapıtlar havuzu: puan >= 8 ve gerçek posteri olan filmler
  const masterpieces = [...movies].filter(m => m.myRating >= 8 && hasRealPoster(m.poster));
  // Fisher-Yates shuffle → rastgele 5 seç
  for (let i = masterpieces.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [masterpieces[i], masterpieces[j]] = [masterpieces[j], masterpieces[i]];
  }
  const highestRated = masterpieces.slice(0, 5);

  // Keşfedilmemiş Hazineler: Benim yüksek puan verip IMDb'de düşük kalan filmler
  const hiddenGemsPool = [...movies].filter(
    m => m.myRating >= 7 && m.imdbRating > 0 && m.imdbRating <= 6.5 && (m.myRating - m.imdbRating) >= 2 && hasRealPoster(m.poster)
  );
  // Havuz küçükse kriterleri biraz gevşet
  const hiddenGemsPoolFallback = hiddenGemsPool.length >= 5
    ? hiddenGemsPool
    : [...movies].filter(
        m => m.myRating > 0 && m.imdbRating > 0 && (m.myRating - m.imdbRating) >= 1.5 && hasRealPoster(m.poster)
      );
  const gemsSource = hiddenGemsPoolFallback.length >= 5 ? hiddenGemsPoolFallback : hiddenGemsPool;
  // Fisher-Yates shuffle → rastgele 5 seç
  for (let i = gemsSource.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [gemsSource[i], gemsSource[j]] = [gemsSource[j], gemsSource[i]];
  }
  const hiddenGems = gemsSource.slice(0, 5);

  // Pick a single featured banner movie from high-rated ones (preferring those with trailers)

  // 1. Öne çıkan film için bir havuz oluştur
  // Kesin kriter: Hem gerçek posteri hem de fragmanı olan filmler
  // Öncelik sırası: Puanı >= 8 + poster + fragman → Puanı >= 7 + poster + fragman → poster + fragman olan herhangi bir film → tüm filmler
  const withPosterAndTrailer = (m: typeof movies[number]) => hasRealPoster(m.poster) && !!m.trailerYoutubeId;
  const highRatedWithBoth = movies.filter(m => m.myRating >= 8 && withPosterAndTrailer(m));
  const midRatedWithBoth = movies.filter(m => m.myRating >= 7 && withPosterAndTrailer(m));
  const anyWithBoth = movies.filter(m => withPosterAndTrailer(m));
  const featuredPool = highRatedWithBoth.length > 0
    ? highRatedWithBoth
    : midRatedWithBoth.length > 0
      ? midRatedWithBoth
      : anyWithBoth.length > 0
        ? anyWithBoth
        : movies;

  // 2. Bugünün benzersiz gün numarasını hesapla (1 Ocak 1970'ten bu yana geçen toplam gün)
  const currentDay = Math.floor(Date.now() / (1000 * 60 * 60 * 24));

  // 3. Havuzdaki film sayısına göre modulo (%) alarak bugünün filmini seç
  // Bu sayede indeks her gün 1 artar ve liste bitince başa döner.
  const featuredMovie = featuredPool[currentDay % featuredPool.length];

  // 4. Günün rastgele film önerileri için 5 benzersiz film seç
  const featuredMovies = [];
  if (featuredPool.length > 0) {
    const uniqueIndices = new Set<number>();
    const countToPick = Math.min(5, featuredPool.length);
    let offset = 0;
    while (uniqueIndices.size < countToPick) {
      const idx = (currentDay + offset) % featuredPool.length;
      uniqueIndices.add(idx);
      offset++;
    }
    for (const idx of uniqueIndices) {
      featuredMovies.push(featuredPool[idx]);
    }
  }


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
              🎬 <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-zinc-200 to-zinc-400">İzlediklerim</span>
            </h1>
            <p className="text-base sm:text-lg text-zinc-400 max-w-xl leading-relaxed">
              Yıllardır izlediğim filmler, verdiğim puanlar ve kişisel sinema arşivim. Hoş geldiniz, benimle birlikte sinema yolculuğumu keşfedin. <br />Volkan Yılmaz
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

      {/* Featured Recommendation Widget (Random Suggestion Card Slider) */}
      <section className="glass rounded-3xl border border-white/5 p-6 sm:p-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-6">
          <div className="space-y-2">
            <h2 className="text-xl sm:text-2xl font-extrabold text-zinc-100 flex items-center gap-2">
              <Sparkles className="w-5.5 h-5.5 text-brand-accent" /> Günün Rastgele Film Önerileri
            </h2>
            <p className="text-sm text-zinc-400 max-w-xl">
              Kararsız mısınız? Kütüphanenizden özenle seçilen bu yapımlar sinema gecenizi renklendirebilir.
            </p>
          </div>
          <Link
            href="/random"
            className="flex-shrink-0 bg-brand-primary/10 hover:bg-brand-primary/20 border border-brand-primary/20 text-brand-primary font-bold px-5 py-2.5 rounded-xl transition-all text-sm"
          >
            Çarkı Döndür 🎰
          </Link>
        </div>

        <FeaturedSlider movies={featuredMovies} />
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

      {/* Keşfedilmemiş Hazineler */}
      {hiddenGems.length > 0 && (
        <section className="space-y-6">
          <div className="flex justify-between items-center border-b border-zinc-800 pb-3">
            <div>
              <h2 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
                <span>🌟</span> Keşfedilmemiş Hazineler
              </h2>
              <p className="text-xs text-zinc-500 mt-1">IMDb&apos;de düşük puanlı ama benim favorilerim olan sürpriz yapımlar</p>
            </div>
            <Link href="/movies?sort=rating" className="text-xs text-zinc-400 hover:text-white flex items-center gap-1 font-bold">
              Tümünü Gör <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-6">
            {hiddenGems.map((movie) => (
              <MovieCard key={movie.imdbId} movie={movie} />
            ))}
          </div>
        </section>
      )}

      {/* Blog Yazıları */}
      {blogPosts.length > 0 && (
        <section className="space-y-6">
          <div className="flex justify-between items-center border-b border-zinc-800 pb-3">
            <h2 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
              <Newspaper className="w-6 h-6 text-brand-primary" /> Blogumdan Son Yazılar
            </h2>
            <a
              href="https://wolkanca.com/kategori/eglence"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-zinc-400 hover:text-white flex items-center gap-1 font-bold transition-colors"
            >
              Tümünü Gör <ExternalLink className="w-3 h-3" />
            </a>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {blogPosts.map((post) => (
              <a
                key={post.link}
                href={post.link}
                target="_blank"
                rel="noopener noreferrer"
                className="group glass rounded-2xl border border-white/5 overflow-hidden hover:border-brand-primary/30 transition-all duration-500 hover:shadow-[0_8px_30px_rgba(239,68,68,0.12)] flex flex-col"
              >
                {/* Thumbnail */}
                <div className="relative aspect-square w-full overflow-hidden bg-zinc-900">
                  {post.thumbnail ? (
                    <Image
                      src={post.thumbnail}
                      alt={post.title}
                      fill
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                      className="object-cover group-hover:scale-105 transition-transform duration-700"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-4xl">📝</div>
                  )}
                  {/* Gradient overlay at bottom */}
                  <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-zinc-950/80 to-transparent" />
                </div>

                {/* Content */}
                <div className="p-4 sm:p-5 flex flex-col flex-grow space-y-2.5">
                  <h3 className="text-sm font-extrabold text-zinc-200 group-hover:text-white transition-colors leading-snug line-clamp-2">
                    {post.title}
                  </h3>
                  <p className="text-xs text-zinc-500 leading-relaxed line-clamp-3 flex-grow">
                    {post.description}
                  </p>
                  <div className="flex items-center justify-between pt-2 border-t border-white/5">
                    <span className="text-[10px] font-bold text-zinc-500">
                      {formatDate(post.pubDate)}
                    </span>
                    <span className="text-[10px] font-bold text-brand-primary flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      Oku <ArrowRight className="w-3 h-3" />
                    </span>
                  </div>
                </div>
              </a>
            ))}
          </div>
        </section>
      )}

    </div>
  );
}
