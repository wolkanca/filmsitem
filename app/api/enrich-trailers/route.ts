import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

// Global variable to maintain enrichment state across calls
const state = {
  isRunning: false,
  total: 0,
  processed: 0,
  updated: 0,
  failed: 0,
  status: 'Boşta',
};

const DATA_FILE = path.join(process.cwd(), 'data', 'movies.json');

export async function GET() {
  return NextResponse.json(state);
}

export async function POST(req: Request) {
  if (state.isRunning) {
    return NextResponse.json({ message: 'Script zaten çalışıyor.', ...state }, { status: 400 });
  }

  try {
    const { apiKey, forceUpdate } = await req.json();
    if (!apiKey) {
      return NextResponse.json({ error: 'API anahtarı veya jeton gerekli.' }, { status: 400 });
    }

    if (!fs.existsSync(DATA_FILE)) {
      return NextResponse.json({ error: 'movies.json bulunamadı.' }, { status: 404 });
    }

    // Read movies
    const moviesContent = fs.readFileSync(DATA_FILE, 'utf8');
    const movies = JSON.parse(moviesContent);

    // Filter movies that do not have trailerYoutubeId yet (or all if forceUpdate is true)
    const toEnrich = forceUpdate
      ? movies
      : movies.filter((m: any) => m.trailerYoutubeId === undefined);

    if (toEnrich.length === 0) {
      return NextResponse.json({ message: 'Tüm filmlerin fragmanları zaten güncel.', ...state });
    }

    // Initialize state
    state.isRunning = true;
    state.total = toEnrich.length;
    state.processed = 0;
    state.updated = 0;
    state.failed = 0;
    state.status = 'Çalışıyor';

    // helper function to request TMDB API
    const isToken = apiKey.startsWith('eyJ');

    const fetchTmdb = async (urlPath: string, queryParams: Record<string, string> = {}) => {
      const url = new URL(`https://api.themoviedb.org/3${urlPath}`);
      
      if (isToken) {
        Object.entries(queryParams).forEach(([key, val]) => url.searchParams.append(key, val));
      } else {
        url.searchParams.append('api_key', apiKey);
        Object.entries(queryParams).forEach(([key, val]) => url.searchParams.append(key, val));
      }
      
      const headers: Record<string, string> = {
        'Accept': 'application/json',
        'User-Agent': 'Mozilla/5.0',
      };
      
      if (isToken) {
        headers['Authorization'] = `Bearer ${apiKey}`;
      }
      
      const res = await fetch(url.toString(), { headers });
      if (!res.ok) {
        throw new Error(`TMDB error ${res.status}: ${res.statusText}`);
      }
      return res.json();
    };

    const getBestYoutubeId = (results: any[]): string | null => {
      if (!results || !Array.isArray(results) || results.length === 0) return null;
      
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

    // Start background enrichment process
    (async () => {
      for (const movie of toEnrich) {
        if (!state.isRunning) break; // Allow cancellation

        let trailerId: string | null = null;
        let found = false;

        try {
          if (movie.imdbId && movie.imdbId.startsWith('tt')) {
            // Find movie/show on TMDB by IMDb ID
            const findData = await fetchTmdb(`/find/${movie.imdbId}`, {
              external_source: 'imdb_id',
            });

            let tmdbId: number | null = null;
            let isTv = false;

            if (findData.movie_results && findData.movie_results.length > 0) {
              tmdbId = findData.movie_results[0].id;
              isTv = false;
            } else if (findData.tv_results && findData.tv_results.length > 0) {
              tmdbId = findData.tv_results[0].id;
              isTv = true;
            }

            if (tmdbId) {
              const route = isTv ? `/tv/${tmdbId}/videos` : `/movie/${tmdbId}/videos`;
              
              // First try Turkish videos
              try {
                const videosData = await fetchTmdb(route, { language: 'tr-TR' });
                trailerId = getBestYoutubeId(videosData.results);
              } catch (e) {
                console.error(`Turkish videos fetch failed for TMDB ${tmdbId}, trying English fallback.`, e);
              }

              // Fallback to English if not found
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
          movies[idx].trailerYoutubeId = trailerId || ''; // set to empty string if not found, marking as checked
          if (found) {
            state.updated++;

            // Eğer poster yoksa veya placeholder ise, youtube fragman görselini koy
            const PLACEHOLDER = 'images.unsplash.com/photo-1489599849927-2ee91cede3ba';
            if (trailerId && (!movies[idx].poster || movies[idx].poster.includes(PLACEHOLDER))) {
              const youtubeThumbUrl = `https://img.youtube.com/vi/${trailerId}/hqdefault.jpg`;
              movies[idx].poster = youtubeThumbUrl;
              if (!movies[idx].backdrop || movies[idx].backdrop.includes(PLACEHOLDER)) {
                movies[idx].backdrop = youtubeThumbUrl;
              }
            }
          } else {
            state.failed++;
          }
        } else {
          state.failed++;
        }

        state.processed++;

        // Save progress to disk every 10 movies or when complete
        if (state.processed % 10 === 0 || state.processed === state.total) {
          fs.writeFileSync(DATA_FILE, JSON.stringify(movies, null, 2), 'utf8');
        }

        // Wait to avoid aggressive TMDB API hitting
        await new Promise((resolve) => setTimeout(resolve, 150));
      }

      state.isRunning = false;
      state.status = 'Tamamlandı';
    })().catch((err) => {
      console.error('Background trailer enrichment crashed:', err);
      state.isRunning = false;
      state.status = 'Hata Verildi';
    });

    return NextResponse.json({ message: 'Enrichment başlatıldı.', ...state });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
