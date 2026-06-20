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
const PLACEHOLDER = 'images.unsplash.com/photo-1489599849927-2ee91cede3ba';

async function fetchJSON(url: string): Promise<any> {
  const res = await fetch(url, {
    headers: { 'User-Agent': 'Mozilla/5.0' },
  });
  if (!res.ok) {
    throw new Error(`HTTP error ${res.status}`);
  }
  return res.json();
}

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
      return NextResponse.json({ error: 'API anahtarı gerekli.' }, { status: 400 });
    }

    if (!fs.existsSync(DATA_FILE)) {
      return NextResponse.json({ error: 'movies.json bulunamadı.' }, { status: 404 });
    }

    // Read movies
    const moviesContent = fs.readFileSync(DATA_FILE, 'utf8');
    const movies = JSON.parse(moviesContent);

    // Filter placeholder posters (or all if forceUpdate is true)
    const toEnrich = forceUpdate
      ? movies
      : movies.filter((m: any) => !m.poster || m.poster.includes(PLACEHOLDER));

    if (toEnrich.length === 0) {
      return NextResponse.json({ message: 'Tüm filmlerin posterleri zaten güncel.', ...state });
    }

    // Initialize state
    state.isRunning = true;
    state.total = toEnrich.length;
    state.processed = 0;
    state.updated = 0;
    state.failed = 0;
    state.status = 'Çalışıyor';

    // Start background enrichment process
    (async () => {
      for (const movie of toEnrich) {
        if (!state.isRunning) break; // Allow cancellation

        try {
          const url = `https://www.omdbapi.com/?i=${movie.imdbId}&apikey=${apiKey}`;
          const data = await fetchJSON(url);

          if (data.Response !== 'False') {
            const idx = movies.findIndex((m: any) => m.imdbId === movie.imdbId);
            if (idx !== -1) {
              let posterUrl = (data.Poster && data.Poster !== 'N/A') ? data.Poster : null;

              // Eğer bölüm posteri N/A ise ve üst dizi ID'si (seriesID) varsa, genel dizi posterini çek
              if (!posterUrl && data.seriesID && data.seriesID !== 'N/A') {
                try {
                  const seriesUrl = `https://www.omdbapi.com/?i=${data.seriesID}&apikey=${apiKey}`;
                  const seriesData = await fetchJSON(seriesUrl);
                  if (seriesData.Poster && seriesData.Poster !== 'N/A') {
                    posterUrl = seriesData.Poster;
                  }
                } catch (seriesErr) {
                  console.error(`OMDB series fetch error for parent ID ${data.seriesID}:`, seriesErr);
                }
              }

              // Eğer hala poster bulunamadıysa ama filmde kayıtlı bir youtube fragmanı varsa, fragman görselini koy
              if (!posterUrl && movies[idx].trailerYoutubeId) {
                posterUrl = `https://img.youtube.com/vi/${movies[idx].trailerYoutubeId}/hqdefault.jpg`;
              }

              if (posterUrl) {
                movies[idx].poster = posterUrl;
                if (!movies[idx].backdrop || movies[idx].backdrop.includes(PLACEHOLDER)) {
                  movies[idx].backdrop = posterUrl;
                }
                state.updated++;
              } else {
                state.failed++;
              }

              // Also enrich details if they are defaults
              if (data.Plot && data.Plot !== 'N/A' && movies[idx].overview.includes('yükleniyor')) {
                movies[idx].overview = data.Plot;
              }
              if (data.Director && data.Director !== 'N/A' && !movies[idx].director) {
                movies[idx].director = data.Director;
              }
              if (data.Actors && data.Actors !== 'N/A' && movies[idx].cast.length === 0) {
                movies[idx].cast = data.Actors.split(',').map((a: string) => a.trim());
              }
              if (data.Writer && data.Writer !== 'N/A' && movies[idx].writers.length === 0) {
                movies[idx].writers = data.Writer.split(',').map((w: string) => w.trim().replace(/\s*\(.*?\)/g, ''));
              }
              if (data.imdbRating && data.imdbRating !== 'N/A') {
                const r = parseFloat(data.imdbRating);
                movies[idx].imdbRating = r;
                movies[idx].tmdbRating = r;
              }
            } else {
              state.failed++;
            }
          } else {
            state.failed++;
          }
        } catch (err) {
          console.error(`OMDB fetch error for ${movie.title}:`, err);
          state.failed++;
        }

        state.processed++;

        // Save progress to disk every 10 movies or when complete
        if (state.processed % 10 === 0 || state.processed === state.total) {
          fs.writeFileSync(DATA_FILE, JSON.stringify(movies, null, 2), 'utf8');
        }

        // Wait to avoid hitting OMDB rate limit
        await new Promise((resolve) => setTimeout(resolve, 200));
      }

      state.isRunning = false;
      state.status = 'Tamamlandı';
    })().catch((err) => {
      console.error('Background enrichment crashed:', err);
      state.isRunning = false;
      state.status = 'Hata Verildi';
    });

    return NextResponse.json({ message: 'Enrichment başlatıldı.', ...state });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
