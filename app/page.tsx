import Link from 'next/link';
import { getMovies, getStats } from '@/lib/db';
import { getBlogPosts } from '@/lib/blog';
import MovieCard from '@/components/MovieCard';
import { Star, Film, Clock, Sparkles, ArrowRight, ExternalLink, Newspaper, Shuffle, Info } from 'lucide-react';
import Image from 'next/image';
import { formatDate } from '@/lib/utils';
import FeaturedSlider from '@/components/FeaturedSlider';

export const revalidate = 2592000; // 30 gün (saniye)

export default async function HomePage() {
  const movies = await getMovies();
  const stats = await getStats();
  const blogPosts = await getBlogPosts(8);

  // Pick a single featured banner movie from high-rated ones
  const onlyCinema = (m: typeof movies[number]) => m.type === 'Movie';

  // Sorting movies for sections
  const recentlyAdded = movies.slice(-8);

  // Başyapıtlar havuzu
  const masterpieces = [...movies].filter(
    (m) => m.myRating >= 10 && m.myRating >= 9 && m.type === 'Movie'
  );

  // Fisher-Yates shuffle → rastgele 8 seç
  for (let i = masterpieces.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [masterpieces[i], masterpieces[j]] = [masterpieces[j], masterpieces[i]];
  }

  const highestRated = masterpieces.slice(0, 8);
  const highRatedWithBoth = movies.filter((m) => onlyCinema(m) && m.myRating >= 8);
  const midRatedWithBoth = movies.filter((m) => onlyCinema(m) && m.myRating >= 6);
  const anyWithBoth = movies.filter((m) => onlyCinema(m));
  const anyCinema = movies.filter((m) => onlyCinema(m));

  const featuredPool =
    highRatedWithBoth.length > 0
      ? highRatedWithBoth
      : midRatedWithBoth.length > 0
        ? midRatedWithBoth
        : anyWithBoth.length > 0
          ? anyWithBoth
          : anyCinema.length > 0
            ? anyCinema
            : movies;

  const currentDay = Math.floor(Date.now() / (1000 * 60 * 60 * 24)) + 125;

  const featuredMovie = featuredPool[currentDay % featuredPool.length];

  // Günün rastgele film önerileri için 7 benzersiz film seç
  const featuredMovies = [];

  if (featuredPool.length > 0) {
    const uniqueIndices = new Set<number>();
    const countToPick = Math.min(7, featuredPool.length);
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

  // Keşfedilmemiş Hazineler:
  // Bu bölümde, sayfadaki diğer film section'larında gösterilen filmler tekrar gösterilmez.
  const usedMovieIds = new Set<string>();

  recentlyAdded.forEach((movie) => {
    if (movie.imdbId) usedMovieIds.add(movie.imdbId);
  });

  highestRated.forEach((movie) => {
    if (movie.imdbId) usedMovieIds.add(movie.imdbId);
  });

  featuredMovies.forEach((movie) => {
    if (movie.imdbId) usedMovieIds.add(movie.imdbId);
  });

  const hiddenGemsPool = [...movies].filter(
    (m) =>
      m.myRating >= 6 &&
      m.imdbRating > 0 &&
      m.imdbRating <= 5.0 &&
      m.myRating - m.imdbRating >= 3 &&
      onlyCinema(m) &&
      !usedMovieIds.has(m.imdbId)
  );

  const hiddenGemsPoolFallback =
    hiddenGemsPool.length >= 5
      ? hiddenGemsPool
      : [...movies].filter(
        (m) =>
          m.myRating > 0 &&
          m.imdbRating > 0 &&
          m.myRating - m.imdbRating >= 1.5 &&
          onlyCinema(m) &&
          !usedMovieIds.has(m.imdbId)
      );

  const gemsSource =
    hiddenGemsPoolFallback.length >= 5 ? hiddenGemsPoolFallback : hiddenGemsPool;

  for (let i = gemsSource.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [gemsSource[i], gemsSource[j]] = [gemsSource[j], gemsSource[i]];
  }

  const hiddenGems = gemsSource.slice(0, 8);

  return (
    <div className="space-y-12">

      {/* Hero Section */}
      <section
        className="relative isolate overflow-hidden rounded-3xl border border-red-300/20 px-6 py-8 shadow-[0_24px_80px_rgba(127,29,29,0.35)] sm:px-10 sm:py-12"
        style={{
          background:
            'radial-gradient(circle at 18% 18%, rgba(239,68,68,0.82) 0%, rgba(185,28,28,0.50) 28%, transparent 46%), radial-gradient(circle at 76% 24%, rgba(248,113,113,0.34) 0%, transparent 32%), linear-gradient(135deg, #4c0505 0%, #991b1b 42%, #1f0505 72%, #050505 100%)',
        }}
      >
        {/* Cinematic red backdrop */}
        {featuredMovie?.backdrop && (
          <div className="absolute inset-0 -z-20 opacity-25 mix-blend-overlay">
            <Image
              src={featuredMovie.backdrop}
              alt="Backdrop blur"
              fill
              sizes="100vw"
              className="object-cover blur-sm scale-105"
              priority
            />
          </div>
        )}

        <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_50%_115%,rgba(239,68,68,0.45),transparent_42%)]" />
        <div className="absolute inset-0 -z-10 bg-gradient-to-br from-white/10 via-transparent to-black/[0.55]" />
        <div className="absolute inset-x-0 bottom-0 -z-10 h-1/2 bg-gradient-to-t from-black/[0.65] via-black/20 to-transparent" />
        <div className="absolute -left-24 top-24 -z-10 h-72 w-72 rounded-full bg-red-500/30 blur-3xl" />
        <div className="absolute right-10 top-8 -z-10 h-56 w-56 rounded-full bg-rose-400/20 blur-3xl" />

        {/* Film strip detail */}
        <div
          className="absolute -left-20 top-36 -z-10 h-28 w-[560px] -rotate-12 border-y border-black/30 opacity-25"
          style={{
            backgroundImage:
              'repeating-linear-gradient(90deg, rgba(0,0,0,0.42) 0 20px, transparent 20px 42px)',
          }}
        />

        {/* Soft particle texture */}
        <div className="absolute inset-0 -z-10 opacity-[0.08] [background-image:radial-gradient(circle_at_1px_1px,white_1px,transparent_0)] [background-size:22px_22px]" />
        <div className="pointer-events-none absolute inset-0 rounded-3xl ring-1 ring-inset ring-white/10" />

        <div className="relative z-10 grid grid-cols-1 items-center gap-8 lg:grid-cols-12 lg:gap-10">
          {/* Hero visual */}
          <div className="relative mx-auto flex h-56 w-full max-w-[320px] items-center justify-center lg:col-span-3 lg:h-72">
            <div className="absolute bottom-4 h-12 w-56 rounded-[50%] border border-red-300/25 bg-red-500/[0.15] blur-sm" />
            <div className="absolute bottom-6 h-8 w-64 rounded-[50%] border border-red-500/[0.45] bg-black/20 shadow-[0_0_38px_rgba(239,68,68,0.45)]" />

            <Image
              src="/izlediklerim.webp"
              alt="İzlediklerim Logo"
              width={258}
              height={258}
              className="relative z-10 h-auto w-258 drop-shadow-[0_24px_35px_rgba(0,0,0,0.55)] sm:w-64 lg:w-72"
              priority
            />
          </div>

          {/* Hero text */}
          <div className="min-w-0 space-y-6 text-center lg:col-span-5 lg:text-left">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-white/[0.15] bg-black/[0.35] px-4 py-1.5 text-xs font-bold text-red-100 shadow-[0_8px_24px_rgba(0,0,0,0.24)] backdrop-blur-md">
              <Sparkles className="h-3.5 w-3.5 text-red-100" />
              Kişisel Sinema Günlüğüm
            </span>

            <div className="space-y-4">
              <h1 className="text-4xl md:text-6xl font-black leading-none tracking-tight text-white [text-shadow:0_0_28px_rgba(255,255,255,0.28)]">
                İzlediklerim
              </h1>

              <p className="mx-auto max-w-2xl text-base leading-relaxed text-white/[0.78] sm:text-lg lg:mx-0">
                İzlediğim filmleri, verdiğim puanları, oluşturduğum listeleri ve kişisel sinema
                istatistiklerimi tek yerde buluşturan; anılarla, favorilerle ve keşiflerle büyüyen{' '}
                <strong className="text-white">modern bir film günlüğü</strong>.
              </p>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-wrap justify-center gap-4 pt-2 lg:justify-start">
              <Link href="/about" className="group inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-red-500 via-red-600 to-rose-600 px-7 py-3.5 font-extrabold text-white shadow-[0_0_0_1px_rgba(255,255,255,0.16),0_12px_32px_rgba(239,68,68,0.45)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_0_0_1px_rgba(255,255,255,0.24),0_18px_42px_rgba(239,68,68,0.6)]">
                <Info className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
                Hakkında
              </Link>
              <Link
                href="/movies"
                className="group inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-red-500 via-red-600 to-rose-600 px-7 py-3.5 font-extrabold text-white shadow-[0_0_0_1px_rgba(255,255,255,0.16),0_12px_32px_rgba(239,68,68,0.45)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_0_0_1px_rgba(255,255,255,0.24),0_18px_42px_rgba(239,68,68,0.6)]"
              >
                Arşiv
                <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
              </Link>
            </div>
          </div>

          {/* Quick Stats Grid */}
          <div className="grid grid-cols-2 gap-4 lg:col-span-4">
            <div className="group relative overflow-hidden rounded-2xl border border-white/20 bg-black/[0.35] p-5 text-center shadow-[inset_0_1px_0_rgba(255,255,255,0.12),0_20px_44px_rgba(0,0,0,0.28)] backdrop-blur-md transition-all duration-300 hover:-translate-y-1 hover:border-red-200/40">
              <div className="absolute inset-x-6 bottom-0 h-px bg-red-300 shadow-[0_0_22px_3px_rgba(248,113,113,0.8)]" />

              <div className="flex min-h-[112px] flex-col items-center justify-center">
                <Film className="mb-3 h-7 w-7 text-red-300 drop-shadow-[0_0_14px_rgba(248,113,113,0.55)]" />
                <span className="text-3xl font-black text-white [text-shadow:0_0_18px_rgba(255,255,255,0.22)]">
                  <Link href="/stats">{stats.totalCount}</Link>
                </span>
                <span className="mt-2 text-xs font-semibold text-white/[0.55]">
                  Toplam İzlenen
                </span>
              </div>
            </div>

            <div className="group relative overflow-hidden rounded-2xl border border-white/20 bg-black/[0.35] p-5 text-center shadow-[inset_0_1px_0_rgba(255,255,255,0.12),0_20px_44px_rgba(0,0,0,0.28)] backdrop-blur-md transition-all duration-300 hover:-translate-y-1 hover:border-yellow-200/40">
              <div className="absolute inset-x-6 bottom-0 h-px bg-yellow-300 shadow-[0_0_22px_3px_rgba(250,204,21,0.65)]" />

              <div className="flex min-h-[112px] flex-col items-center justify-center">
                <Star className="mb-3 h-7 w-7 text-brand-accent drop-shadow-[0_0_14px_rgba(250,204,21,0.45)]" />
                <span className="text-3xl font-black text-white [text-shadow:0_0_18px_rgba(255,255,255,0.22)]">
                  <Link href="/stats">{stats.averageRating}</Link>
                </span>
                <span className="mt-2 text-xs font-semibold text-white/[0.55]">
                  Ortalama Puanım
                </span>
              </div>
            </div>

            <div className="group relative col-span-2 overflow-hidden rounded-2xl border border-white/20 bg-black/[0.35] p-6 text-center shadow-[inset_0_1px_0_rgba(255,255,255,0.12),0_20px_44px_rgba(0,0,0,0.28)] backdrop-blur-md transition-all duration-300 hover:-translate-y-1 hover:border-rose-200/40">
              <div className="absolute inset-x-10 bottom-0 h-px bg-rose-300 shadow-[0_0_26px_4px_rgba(244,63,94,0.8)]" />

              <div className="flex min-h-[120px] flex-col items-center justify-center">
                <Clock className="mb-3 h-8 w-8 text-rose-300 drop-shadow-[0_0_16px_rgba(244,63,94,0.55)]" />
                <span className="text-4xl font-black text-white [text-shadow:0_0_18px_rgba(255,255,255,0.22)]">
                  <Link href="/stats">{stats.totalRuntimeHours} Saat</Link>
                </span>
                <span className="mt-2 text-xs font-semibold text-white/[0.55]">
                  Toplam İzleme Süresi
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Recommendation Widget */}
      <section className="glass rounded-3xl border border-white/5 p-6 sm:p-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-6">
          <div className="space-y-2">
            <h2 className="text-xl sm:text-2xl font-extrabold text-zinc-100 flex items-center gap-2">
              <Sparkles className="w-5.5 h-5.5 text-brand-accent" /> Günün Rastgele Film Önerileri
            </h2>
            <p className="text-sm text-zinc-400 max-w-3xl">
              Kararsız mısınız? Kütüphanenizden özenle seçilen bu yapımlar sinema gecenizi renklendirebilir.
            </p>
          </div>
          <Link
            href="/random"
            className="flex-shrink-0 bg-brand-primary/10 hover:bg-brand-primary/20 border border-brand-primary/20 text-brand-accent font-bold px-5 py-2.5 rounded-xl transition-all text-sm"
          >
            Çarkı Döndür <Shuffle className='h-4 w-4 inline-block' />
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
            Tümü <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-6">
          {recentlyAdded.map((movie, index) => (
            <MovieCard
              key={`recent-${movie.imdbId}-${index}`}
              movie={movie}
            />
          ))}
        </div>
      </section>

      {/* En Yüksek Puan Verdiklerim */}
      <section className="space-y-6">
        <div className="flex justify-between items-center border-b border-zinc-800 pb-3">
          <h2 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
            <span>👑</span> Başyapıtlarım
          </h2>
          <Link href="/list/favoriler" className="text-xs text-zinc-400 hover:text-white flex items-center gap-1 font-bold">
            Tümü <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-6">
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
              <p className="text-xs text-zinc-500 mt-1">
                IMDb&apos;de düşük puanlı ama benim favorilerim olan sürpriz yapımlar
              </p>
            </div>
            <Link href="/movies?sort=myRating-desc" className="text-xs text-zinc-400 hover:text-white flex items-center gap-1 font-bold">
              Tümü <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-6">
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
              Tümü <ExternalLink className="w-3 h-3" />
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
                  <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-zinc-950/80 to-transparent" />
                </div>

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