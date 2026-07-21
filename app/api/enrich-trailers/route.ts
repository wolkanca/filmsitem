import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { getMovies, saveMovies } from '@/lib/db';

const state = {
  isRunning: false,
  total: 0,
  processed: 0,
  updated: 0,
  failed: 0,
  status: 'Boşta',
  changes: [] as string[],
};

export async function GET() {
  return NextResponse.json(state);
}

export async function POST(req: Request) {
  if (state.isRunning) {
    return NextResponse.json(
      { message: 'Script zaten çalışıyor.', ...state },
      { status: 400 }
    );
  }

  try {
    const { apiKey, forceUpdate } = await req.json();

    if (!apiKey) {
      return NextResponse.json(
        { error: 'API anahtarı veya jeton gerekli.' },
        { status: 400 }
      );
    }

    const movies = await getMovies();

    const toEnrich = forceUpdate
      ? movies
      : movies.filter((m: any) => !m.trailerYoutubeId);

    if (toEnrich.length === 0) {
      return NextResponse.json({
        message: 'Tüm filmlerin fragmanları zaten güncel.',
        ...state,
      });
    }

    state.isRunning = true;
    state.total = toEnrich.length;
    state.processed = 0;
    state.updated = 0;
    state.failed = 0;
    state.status = 'Çalışıyor';
    state.changes = [];

    const isToken = apiKey.startsWith('eyJ');

    const fetchTmdb = async (
      urlPath: string,
      queryParams: Record<string, string> = {}
    ) => {
      const url = new URL(`https://api.themoviedb.org/3${urlPath}`);

      if (!isToken) {
        url.searchParams.append('api_key', apiKey);
      }

      Object.entries(queryParams).forEach(([key, val]) => {
        url.searchParams.append(key, val);
      });

      const headers: Record<string, string> = {
        Accept: 'application/json',
        'User-Agent': 'Mozilla/5.0',
      };

      if (isToken) {
        headers.Authorization = `Bearer ${apiKey}`;
      }

      const res = await fetch(url.toString(), { headers });

      if (!res.ok) {
        throw new Error(`TMDB error ${res.status}: ${res.statusText}`);
      }

      return res.json();
    };

    const getBestYoutubeId = (results: any[]): string | null => {
      if (!Array.isArray(results) || results.length === 0) return null;

      const youtubeVideos = results.filter((v: any) => v.site === 'YouTube' && v.key);
      if (youtubeVideos.length === 0) return null;

      const trailerOfficial = youtubeVideos.find((v: any) => v.type === 'Trailer' && v.official);
      if (trailerOfficial) return trailerOfficial.key;

      const trailerAny = youtubeVideos.find((v: any) => v.type === 'Trailer');
      if (trailerAny) return trailerAny.key;

      const teaserOfficial = youtubeVideos.find((v: any) => v.type === 'Teaser' && v.official);
      if (teaserOfficial) return teaserOfficial.key;

      const teaserAny = youtubeVideos.find((v: any) => v.type === 'Teaser');
      if (teaserAny) return teaserAny.key;

      const officialAny = youtubeVideos.find((v: any) => v.official);
      if (officialAny) return officialAny.key;

      return youtubeVideos[0].key;
    };

    (async () => {
      for (const movie of toEnrich) {
        if (!state.isRunning) break;

        let trailerId: string | null = null;
        let found = false;

        try {
          if (movie.imdbId && movie.imdbId.startsWith('tt')) {
            const findData = await fetchTmdb(`/find/${movie.imdbId}`, {
              external_source: 'imdb_id',
            });

            let tmdbId: number | null = null;
            let isTv = false;

            if (findData.movie_results?.length > 0) {
              tmdbId = findData.movie_results[0].id;
              isTv = false;
            } else if (findData.tv_results?.length > 0) {
              tmdbId = findData.tv_results[0].id;
              isTv = true;
            }

            if (tmdbId) {
              const route = isTv ? `/tv/${tmdbId}/videos` : `/movie/${tmdbId}/videos`;

              try {
                const videosData = await fetchTmdb(route, { language: 'tr-TR' });
                trailerId = getBestYoutubeId(videosData.results);
              } catch (e) {
                console.error(`Turkish videos fetch failed for TMDB ${tmdbId}`, e);
              }

              if (!trailerId) {
                const videosData = await fetchTmdb(route, { language: 'en-US' });
                trailerId = getBestYoutubeId(videosData.results);
              }

              if (trailerId) {
                found = true;
              }
            }
          }
        } catch (err) {
          console.error(`TMDB fetch error for ${movie.title} (${movie.imdbId}):`, err);
        }

        const idx = movies.findIndex((m: any) => m.imdbId === movie.imdbId);

        if (idx !== -1) {
          movies[idx].trailerYoutubeId = trailerId || '';

          if (found && trailerId) {
            state.updated++;
            state.changes.unshift(`${movies[idx].title}: fragman eklendi (${trailerId})`);
          } else {
            state.failed++;
            state.changes.unshift(`${movies[idx].title}: fragman bulunamadı`);
          }
        } else {
          state.failed++;
          state.changes.unshift(`${movie.title || movie.imdbId}: veri içinde eşleşme bulunamadı`);
        }

        state.processed++;
        state.changes = state.changes.slice(0, 100);

        if (state.processed % 10 === 0 || state.processed === state.total) {
          await saveMovies(movies);
        }

        await new Promise((resolve) => setTimeout(resolve, 150));
      }

      state.isRunning = false;
      state.status = 'Tamamlandı';

      try {
        revalidatePath('/', 'layout');
      } catch (e) {
        console.error('Revalidation error:', e);
      }
    })().catch((err) => {
      console.error('Background trailer enrichment crashed:', err);
      state.isRunning = false;
      state.status = 'Hata Verildi';
      state.changes.unshift('Fragman sihirbazı hata verdi.');

      try {
        revalidatePath('/', 'layout');
      } catch (e) { }
    });

    return NextResponse.json({ message: 'Enrichment başlatıldı.', ...state });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}