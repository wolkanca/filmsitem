const fs = require('fs');
const path = require('path');
const http = require('https');

// Configuration
const TMDB_API_KEY = process.env.TMDB_API_KEY || ''; // Optional: set in env or edit here
const DATA_DIR = path.join(__dirname, '..', 'data');
const MOVIE_DATA_FILE = path.join(DATA_DIR, 'movies.json');

// Make sure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Function to fetch helper
function fetchJSON(url) {
  return new Promise((resolve, reject) => {
    http.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0'
      }
    }, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(e);
        }
      });
    }).on('error', (err) => {
      reject(err);
    });
  });
}

// Custom CSV Parser Line Splitter
function parseCSVLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++; // skip next quote
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
}

// Find a CSV file in the parent directory if not provided
function findCSVFile() {
  const files = fs.readdirSync(path.join(__dirname, '..'));
  const csvFiles = files.filter(f => f.endsWith('.csv'));
  if (csvFiles.length > 0) {
    return path.join(__dirname, '..', csvFiles[0]);
  }
  return null;
}

// Delay helper for API rate limits
const delay = ms => new Promise(res => setTimeout(res, ms));

async function enrichFromTMDB(imdbId, titleType) {
  if (!TMDB_API_KEY) return null;

  try {
    const findUrl = `https://api.themoviedb.org/3/find/${imdbId}?api_key=${TMDB_API_KEY}&external_source=imdb_id`;
    const findResult = await fetchJSON(findUrl);

    let tmdbItem = null;
    let type = 'movie';

    if (findResult.movie_results && findResult.movie_results.length > 0) {
      tmdbItem = findResult.movie_results[0];
      type = 'movie';
    } else if (findResult.tv_results && findResult.tv_results.length > 0) {
      tmdbItem = findResult.tv_results[0];
      type = 'tv';
    } else if (findResult.tv_episode_results && findResult.tv_episode_results.length > 0) {
      tmdbItem = findResult.tv_episode_results[0];
      type = 'tv_episode';
    }

    if (!tmdbItem) return null;

    const tmdbId = tmdbItem.id;
    const overview = tmdbItem.overview || '';
    const poster = tmdbItem.poster_path ? `https://image.tmdb.org/t/p/w500${tmdbItem.poster_path}` : '';
    const backdrop = tmdbItem.backdrop_path ? `https://image.tmdb.org/t/p/original${tmdbItem.backdrop_path}` : '';
    const tmdbRating = tmdbItem.vote_average || 0;

    // Fetch credits for cast and crew
    let cast = [];
    let director = '';
    let writers = [];

    const creditsUrl = `https://api.themoviedb.org/3/${type === 'movie' ? 'movie' : 'tv'}/${tmdbId}/credits?api_key=${TMDB_API_KEY}`;
    try {
      const credits = await fetchJSON(creditsUrl);
      if (credits.cast) {
        cast = credits.cast.slice(0, 10).map(c => c.name);
      }
      if (credits.crew) {
        const directors = credits.crew.filter(c => c.job === 'Director').map(c => c.name);
        director = directors.join(', ');
        writers = credits.crew.filter(c => c.job === 'Writer' || c.job === 'Screenplay' || c.job === 'Writing').map(c => c.name);
      }
    } catch (creditsErr) {
      console.warn(`Credits not found for ${imdbId}`);
    }

    return {
      poster,
      backdrop,
      overview,
      cast,
      director: director || undefined,
      writers,
      tmdbRating
    };
  } catch (err) {
    console.error(`TMDb enrichment failed for ${imdbId}:`, err.message);
    return null;
  }
}

async function start() {
  const csvPath = process.argv[2] || findCSVFile();
  if (!csvPath || !fs.existsSync(csvPath)) {
    console.error('Error: CSV file not found! Please specify the file: npm run import <path-to-csv>');
    process.exit(1);
  }

  console.log(`Reading CSV file from: ${csvPath}`);
  const csvContent = fs.readFileSync(csvPath, 'utf8');
  const lines = csvContent.split(/\r?\n/).filter(line => line.trim().length > 0);

  if (lines.length === 0) {
    console.error('Error: CSV file is empty!');
    process.exit(1);
  }

  const headers = parseCSVLine(lines[0]);
  console.log(`Headers found: ${headers.join(', ')}`);

  // Map header indexes
  const indexMap = {};
  headers.forEach((h, idx) => {
    // Standardize header name (remove BOM or spaces)
    const normalized = h.replace(/^\uFEFF/, '').trim();
    indexMap[normalized] = idx;
  });

  const movies = [];
  console.log(`Parsing ${lines.length - 1} records...`);

  // Process rows
  for (let i = 1; i < lines.length; i++) {
    const row = parseCSVLine(lines[i]);
    if (row.length < headers.length) continue;

    const imdbId = row[indexMap['Const']];
    if (!imdbId || !imdbId.startsWith('tt')) continue;

    const title = row[indexMap['Title']];
    const originalTitle = row[indexMap['Original Title']] || title;
    const myRating = parseInt(row[indexMap['Your Rating']], 10) || 0;
    const watchDate = row[indexMap['Date Rated']] || '';
    const titleType = row[indexMap['Title Type']] || 'Movie';
    const imdbRating = parseFloat(row[indexMap['IMDb Rating']]) || 0;
    const runtime = parseInt(row[indexMap['Runtime (mins)']], 10) || 0;
    const year = parseInt(row[indexMap['Year']], 10) || 0;
    const genres = (row[indexMap['Genres']] || '').split(',').map(g => g.trim()).filter(g => g.length > 0);
    const releaseDate = row[indexMap['Release Date']] || '';
    const csvDirector = row[indexMap['Directors']] || '';

    // Generate dynamic lists membership based on metadata
    const listNames = [];
    if (myRating >= 9) listNames.push('Favoriler');
    if (myRating === 10) listNames.push('10 Puanlık Başyapıtlar');
    if (genres.includes('Sci-Fi')) listNames.push('Bilim Kurgu');
    if (genres.includes('Comedy')) listNames.push('Komedi Günlükleri');
    if (year < 1980) listNames.push('Sinema Klasikleri');
    if (imdbRating >= 8.5) listNames.push('Kült Eserler');
    if (runtime >= 150) listNames.push('Uzun Metraj Maratonu');

    // Create base movie object
    const movie = {
      imdbId,
      title,
      originalTitle,
      year,
      type: titleType,
      myRating,
      watchDate,
      listName: listNames,
      poster: '',
      backdrop: '',
      overview: 'Film detayları yükleniyor...',
      genres,
      runtime,
      cast: [],
      director: csvDirector,
      writers: [],
      imdbRating,
      tmdbRating: imdbRating,
      releaseDate
    };

    movies.push(movie);
  }

  console.log(`Parsed ${movies.length} valid entries.`);
  
  if (TMDB_API_KEY) {
    console.log(`Enriching data using TMDb API (Key: ${TMDB_API_KEY.substring(0, 4)}***)...`);
    for (let i = 0; i < movies.length; i++) {
      const m = movies[i];
      process.stdout.write(`Processing [${i + 1}/${movies.length}]: ${m.title}... `);
      
      const details = await enrichFromTMDB(m.imdbId, m.type);
      if (details) {
        m.poster = details.poster || m.poster;
        m.backdrop = details.backdrop || m.backdrop;
        m.overview = details.overview || m.overview;
        m.cast = details.cast || m.cast;
        m.director = details.director || m.director;
        m.writers = details.writers || m.writers;
        m.tmdbRating = details.tmdbRating || m.tmdbRating;
        console.log('✓ enriched');
      } else {
        console.log('✗ using fallback');
      }
      
      // Sleep to avoid rate-limiting (TMDb allows high rate but nice to be polite)
      await delay(150);
    }
  } else {
    console.log('No TMDB_API_KEY found. Generating intelligent fallback values...');
    // Fallback: create pretty visual posters and placeholders
    movies.forEach(m => {
      // Pick a beautiful topic-based random visual from Unsplash for fallback poster/backdrop
      const term = encodeURIComponent(m.genres[0] || 'cinema');
      // Use unsplash random with a specific seed to make it stable per movie
      const idSum = m.imdbId.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
      m.poster = `https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?q=80&w=500&auto=format&fit=crop`; // Cinema theme
      m.backdrop = `https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?q=80&w=1200&auto=format&fit=crop`;
      m.overview = `Bu yapım "${m.director || 'Bilinmeyen Yönetmen'}" tarafından yönetilmiş ${m.year} yapımı bir ${m.genres.join(', ') || 'sinema'} eseridir. IMDb puanı ${m.imdbRating} olarak kaydedilmiştir.`;
      m.cast = [];
      m.writers = [];
    });
  }

  // Save the result
  fs.writeFileSync(MOVIE_DATA_FILE, JSON.stringify(movies, null, 2), 'utf8');
  console.log(`\nImport complete! Saved ${movies.length} items to: ${MOVIE_DATA_FILE}`);
}

start().catch(err => {
  console.error('Import process failed:', err);
});
