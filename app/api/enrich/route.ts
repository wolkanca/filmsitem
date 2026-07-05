import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { revalidatePath } from 'next/cache';

const state = {
  isRunning: false,
  total: 0,
  processed: 0,
  updated: 0,
  failed: 0,
  status: 'Boşta',
  changes: [] as string[],
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
    return NextResponse.json(
      { message: 'Script zaten çalışıyor.', ...state },
      { status: 400 }
    );
  }

  try {
    const { apiKey, forceUpdate } = await req.json();

    if (!apiKey) {
      return NextResponse.json({ error: 'API anahtarı gerekli.' }, { status: 400 });
    }

    if (!fs.existsSync(DATA_FILE)) {
      return NextResponse.json({ error: 'movies.json bulunamadı.' }, { status: 404 });
    }

    const moviesContent = fs.readFileSync(DATA_FILE, 'utf8');
    const movies = JSON.parse(moviesContent);

    const toEnrich = forceUpdate
      ? movies
      : movies.filter((m: any) =>
        !m.poster ||
        m.poster.includes(PLACEHOLDER) ||
        !m.director ||
        !m.cast?.length ||
        !m.writers?.length ||
        !m.overview ||
        m.overview.includes('yükleniyor') ||
        !m.imdbRating
      );

    if (toEnrich.length === 0) {
      return NextResponse.json({
        message: 'Güncellenecek eksik alan bulunamadı.',
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

    (async () => {
      for (const movie of toEnrich) {
        if (!state.isRunning) break;

        try {
          const url = `https://www.omdbapi.com/?i=${movie.imdbId}&apikey=${apiKey}`;
          const data = await fetchJSON(url);

          if (data.Response !== 'False') {
            const idx = movies.findIndex((m: any) => m.imdbId === movie.imdbId);

            if (idx !== -1) {
              let changed = false;
              let posterUrl = data.Poster && data.Poster !== 'N/A' ? data.Poster : null;

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

              if (!posterUrl && movies[idx].trailerYoutubeId) {
                posterUrl = `https://img.youtube.com/vi/${movies[idx].trailerYoutubeId}/hqdefault.jpg`;
              }

              if (
                posterUrl &&
                (!movies[idx].poster || movies[idx].poster.includes(PLACEHOLDER))
              ) {
                movies[idx].poster = posterUrl;
                state.changes.unshift(`${movies[idx].title}: poster güncellendi`);
                changed = true;
              }

              if (
                data.Plot &&
                data.Plot !== 'N/A' &&
                (!movies[idx].overview || movies[idx].overview.includes('yükleniyor'))
              ) {
                movies[idx].overview = data.Plot;
                state.changes.unshift(`${movies[idx].title}: overview güncellendi`);
                changed = true;
              }

              if (data.Director && data.Director !== 'N/A' && !movies[idx].director) {
                movies[idx].director = data.Director;
                state.changes.unshift(`${movies[idx].title}: director eklendi`);
                changed = true;
              }

              if (
                data.Actors &&
                data.Actors !== 'N/A' &&
                (!Array.isArray(movies[idx].cast) || movies[idx].cast.length === 0)
              ) {
                movies[idx].cast = data.Actors.split(',').map((a: string) => a.trim());
                state.changes.unshift(`${movies[idx].title}: cast eklendi`);
                changed = true;
              }

              if (
                data.Writer &&
                data.Writer !== 'N/A' &&
                (!Array.isArray(movies[idx].writers) || movies[idx].writers.length === 0)
              ) {
                movies[idx].writers = data.Writer
                  .split(',')
                  .map((w: string) => w.trim().replace(/\s*\(.*?\)/g, ''));

                state.changes.unshift(`${movies[idx].title}: writers eklendi`);
                changed = true;
              }

              if (data.imdbRating && data.imdbRating !== 'N/A' && !movies[idx].imdbRating) {
                const r = parseFloat(data.imdbRating);

                if (!Number.isNaN(r)) {
                  movies[idx].imdbRating = r;
                  movies[idx].tmdbRating = r;
                  state.changes.unshift(`${movies[idx].title}: IMDb puanı eklendi`);
                  changed = true;
                }
              }

              if (changed) {
                state.updated++;
              } else {
                state.failed++;
                state.changes.unshift(`${movies[idx].title}: değiştirilecek eksik alan bulunamadı`);
              }
            } else {
              state.failed++;
              state.changes.unshift(`${movie.title}: veri içinde eşleşme bulunamadı`);
            }
          } else {
            state.failed++;
            state.changes.unshift(`${movie.title}: OMDB sonucu bulunamadı`);
          }
        } catch (err) {
          console.error(`OMDB fetch error for ${movie.title}:`, err);
          state.failed++;
          state.changes.unshift(`${movie.title}: hata oluştu`);
        }

        state.processed++;
        state.changes = state.changes.slice(0, 100);

        if (state.processed % 10 === 0 || state.processed === state.total) {
          fs.writeFileSync(DATA_FILE, JSON.stringify(movies, null, 2), 'utf8');
        }

        await new Promise((resolve) => setTimeout(resolve, 200));
      }

      state.isRunning = false;
      state.status = 'Tamamlandı';

      try {
        revalidatePath('/', 'layout');
      } catch (e) {
        console.error('Revalidation error:', e);
      }
    })().catch((err) => {
      console.error('Background enrichment crashed:', err);
      state.isRunning = false;
      state.status = 'Hata Verildi';

      try {
        revalidatePath('/', 'layout');
      } catch (e) { }
    });

    return NextResponse.json({ message: 'Enrichment başlatıldı.', ...state });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}