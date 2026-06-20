/**
 * enrich-posters.js
 * ------------------
 * movies.json içindeki filmlerin posterlerini OMDB API'si üzerinden günceller.
 * Sadece poster/backdrop eksik olan kayıtları güncelleştirir.
 *
 * Kullanım:
 *   node scripts/enrich-posters.js <OMDB_API_KEY>
 *
 * OMDB API key almak için: https://www.omdbapi.com/apikey.aspx (ücretsiz)
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

// ─── Config ────────────────────────────────────────────────────────────────
const OMDB_API_KEY = 'c5444d0b';
const MOVIE_DATA_FILE = path.join(__dirname, '..', 'data', 'movies.json');
const PLACEHOLDER = 'images.unsplash.com/photo-1489599849927-2ee91cede3ba';
const DELAY_MS = 200; // OMDB rate limit için bekleme süresi (ms)

// ─── Helpers ───────────────────────────────────────────────────────────────
const delay = (ms) => new Promise((res) => setTimeout(res, ms));

function fetchJSON(url) {
  return new Promise((resolve, reject) => {
    https
      .get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
        let data = '';
        res.on('data', (chunk) => { data += chunk; });
        res.on('end', () => {
          try {
            resolve(JSON.parse(data));
          } catch (e) {
            reject(new Error(`JSON parse error: ${e.message}`));
          }
        });
      })
      .on('error', reject);
  });
}

/**
 * OMDB'den poster URL'si alır.
 * OMDB Poster URL formatı: https://img.omdbapi.com/?apikey=...&i=ttXXXXXXX
 * veya doğrudan "Poster" alanı (yüksek kaliteli HTTPS URL).
 */
async function fetchOMDBPoster(imdbId) {
  const url = `https://www.omdbapi.com/?i=${imdbId}&apikey=${OMDB_API_KEY}`;
  try {
    const data = await fetchJSON(url);
    if (data.Response === 'False') {
      return null;
    }
    let poster = data.Poster && data.Poster !== 'N/A' ? data.Poster : null;

    // Eğer bölüm posteri N/A ise ve üst dizi ID'si (seriesID) varsa, genel dizi posterini çek
    if (!poster && data.seriesID && data.seriesID !== 'N/A') {
      try {
        const seriesUrl = `https://www.omdbapi.com/?i=${data.seriesID}&apikey=${OMDB_API_KEY}`;
        const seriesData = await fetchJSON(seriesUrl);
        if (seriesData.Poster && seriesData.Poster !== 'N/A') {
          poster = seriesData.Poster;
        }
      } catch (seriesErr) {
        // ignore
      }
    }
    const plot = data.Plot && data.Plot !== 'N/A' ? data.Plot : null;
    const director = data.Director && data.Director !== 'N/A' ? data.Director : null;
    const actors = data.Actors && data.Actors !== 'N/A'
      ? data.Actors.split(',').map((a) => a.trim())
      : [];
    const writer = data.Writer && data.Writer !== 'N/A'
      ? data.Writer.split(',').map((w) => w.trim().replace(/\s*\(.*?\)/g, ''))
      : [];
    const imdbRating = data.imdbRating && data.imdbRating !== 'N/A'
      ? parseFloat(data.imdbRating)
      : null;

    return { poster, plot, director, actors, writer, imdbRating };
  } catch (err) {
    return null;
  }
}

/**
 * Bir poster URL'sinin placeholder olup olmadığını kontrol eder.
 */
function isPlaceholder(url) {
  if (!url) return true;
  return url.includes(PLACEHOLDER);
}

// ─── Main ──────────────────────────────────────────────────────────────────
async function main() {
  if (!OMDB_API_KEY) {
    console.error('\n❌  OMDB API anahtarı bulunamadı!');
    console.error('\nKullanım: node scripts/enrich-posters.js <API_KEY>');
    console.error('API key almak için: https://www.omdbapi.com/apikey.aspx (ücretsiz)');
    process.exit(1);
  }

  if (!fs.existsSync(MOVIE_DATA_FILE)) {
    console.error('❌  data/movies.json bulunamadı! Önce: npm run import');
    process.exit(1);
  }

  const movies = JSON.parse(fs.readFileSync(MOVIE_DATA_FILE, 'utf8'));
  const toEnrich = movies.filter((m) => isPlaceholder(m.poster));

  console.log(`\n🎬  Film Günlüğü — Poster Zenginleştirici`);
  console.log(`────────────────────────────────────────`);
  console.log(`📂  Toplam kayıt    : ${movies.length}`);
  console.log(`🔍  Poster eksik    : ${toEnrich.length}`);
  console.log(`🔑  OMDB API Key    : ${OMDB_API_KEY.substring(0, 4)}****\n`);

  let updated = 0;
  let failed = 0;

  for (let i = 0; i < toEnrich.length; i++) {
    const movie = toEnrich[i];
    const prefix = `[${String(i + 1).padStart(4, ' ')}/${toEnrich.length}]`;
    process.stdout.write(`${prefix} ${movie.title} (${movie.year}) ... `);

    const result = await fetchOMDBPoster(movie.imdbId);

    // Poster veya youtube fragmanından herhangi biri varsa güncelle
    let posterUrl = result && result.poster ? result.poster : null;
    if (!posterUrl && movie.trailerYoutubeId) {
      posterUrl = `https://img.youtube.com/vi/${movie.trailerYoutubeId}/hqdefault.jpg`;
    }

    if (posterUrl) {
      // Filmi movies dizisinde bul ve güncelle
      const idx = movies.findIndex((m) => m.imdbId === movie.imdbId);
      if (idx !== -1) {
        movies[idx].poster = posterUrl;

        if (isPlaceholder(movies[idx].backdrop)) {
          movies[idx].backdrop = posterUrl;
        }

        // Diğer alanları da güncelle (varsa)
        if (result) {
          if (result.plot && movies[idx].overview.includes('yükleniyor')) {
            movies[idx].overview = result.plot;
          }
          if (result.director && !movies[idx].director) {
            movies[idx].director = result.director;
          }
          if (result.actors && result.actors.length > 0 && movies[idx].cast.length === 0) {
            movies[idx].cast = result.actors;
          }
          if (result.writer && result.writer.length > 0 && movies[idx].writers.length === 0) {
            movies[idx].writers = result.writer;
          }
          if (result.imdbRating) {
            movies[idx].imdbRating = result.imdbRating;
            movies[idx].tmdbRating = result.imdbRating;
          }
        }
      }
      console.log('✅');
      updated++;
    } else {
      console.log('⚠️  poster bulunamadı');
      failed++;
    }

    // Her 10 filmde bir ara kaydet (çökme koruması)
    if ((i + 1) % 10 === 0) {
      fs.writeFileSync(MOVIE_DATA_FILE, JSON.stringify(movies, null, 2), 'utf8');
      process.stdout.write(`    💾  ${i + 1} kayıt ara kaydedildi\n`);
    }

    await delay(DELAY_MS);
  }

  // Son kayıt
  fs.writeFileSync(MOVIE_DATA_FILE, JSON.stringify(movies, null, 2), 'utf8');

  console.log('\n────────────────────────────────────────');
  console.log(`✅  Güncellenen : ${updated}`);
  console.log(`⚠️   Bulunamayan : ${failed}`);
  console.log(`💾  Kaydedildi  : ${MOVIE_DATA_FILE}`);
  console.log('\n🚀  Posterler hazır! Sayfayı yenileyin.\n');
}

main().catch((err) => {
  console.error('\n❌  Hata:', err.message);
  process.exit(1);
});
