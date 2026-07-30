interface ImportResponse {
  success: boolean;
  addedCount: number;
  duplicateCount: number;
  updatedCount?: number;
  addedTitles: string[];
  updatedTitles?: string[];
  message: string;
  error?: string;
}


import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { Movie } from '@/types';
import { getMovies, saveMovies } from '@/lib/db';

// Custom CSV Parser Line Splitter
function parseCSVLine(line: string): string[] {
  const result: string[] = [];
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

// Helper: check if a field is empty/missing
function isFieldEmpty(value: any): boolean {
  if (value === undefined || value === null) return true;
  if (typeof value === 'string') return value.trim().length === 0;
  if (typeof value === 'number') return value === 0;
  if (Array.isArray(value)) return value.length === 0;
  return false;
}


export async function POST(req: Request) {
  try {
    // 1. Verify admin session
    const cookieHeader = req.headers.get('cookie') || '';
    const isAdmin = cookieHeader.split(';').some((c) => c.trim().startsWith('is_admin=true'));
    if (!isAdmin) {
      return NextResponse.json({ error: 'Yetkisiz erişim.' }, { status: 401 });
    }

    // 2. Parse form data file
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const fillEmptyOnly = formData.get('fillEmptyOnly') === 'true';
    if (!file) {
      return NextResponse.json({ error: 'Dosya yüklenmedi.' }, { status: 400 });
    }

    const csvText = await file.text();
    const lines = csvText.split(/\r?\n/).filter(line => line.trim().length > 0);

    if (lines.length <= 1) {
      return NextResponse.json({ error: 'CSV dosyası boş veya geçersiz.' }, { status: 400 });
    }

    // 3. Map headers
    const headers = parseCSVLine(lines[0]);
    const indexMap: Record<string, number> = {};
    headers.forEach((h, idx) => {
      const normalized = h.replace(/^\uFEFF/, '').trim();
      indexMap[normalized] = idx;
    });

    // Check minimum required headers
    const requiredHeaders = ['Const', 'Title', 'Title Type', 'Your Rating'];
    const missingHeaders = requiredHeaders.filter(rh => !(rh in indexMap));
    if (missingHeaders.length > 0) {
      return NextResponse.json({
        error: `CSV dosyasında gerekli sütunlar eksik: ${missingHeaders.join(', ')}. Lütfen geçerli bir IMDb dışa aktarım dosyası yükleyin.`
      }, { status: 400 });
    }

    // 4. Load current movies to check for duplicates
    const currentMovies: Movie[] = await getMovies();

    // Build database of existing imdbIds
    const existingIds = new Set<string>();
    currentMovies.forEach(m => {
      existingIds.add(m.imdbId);
      if (m.seasons) {
        m.seasons.forEach(s => {
          s.episodes.forEach(ep => {
            existingIds.add(ep.imdbId);
          });
        });
      }
    });

    const newStandalone: Movie[] = [];
    const updatedMovies: { imdbId: string; title: string; year: number }[] = [];
    let duplicateCount = 0;

    // 5. Process CSV rows
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

      if (titleType === 'TV Episode') {
        continue;
      }

      // Duplicate check
      if (existingIds.has(imdbId)) {
        if (fillEmptyOnly) {
          // Find existing movie and fill empty fields
          const existingMovie = currentMovies.find(m => m.imdbId === imdbId);
          if (existingMovie) {
            let wasUpdated = false;

            if (isFieldEmpty(existingMovie.originalTitle) && originalTitle) {
              existingMovie.originalTitle = originalTitle;
              wasUpdated = true;
            }
            if (isFieldEmpty(existingMovie.year) && year) {
              existingMovie.year = year;
              wasUpdated = true;
            }
            if (isFieldEmpty(existingMovie.myRating) && myRating) {
              existingMovie.myRating = myRating;
              wasUpdated = true;
            }
            if (isFieldEmpty(existingMovie.watchDate) && watchDate) {
              existingMovie.watchDate = watchDate;
              wasUpdated = true;
            }
            if (isFieldEmpty(existingMovie.imdbRating) && imdbRating) {
              existingMovie.imdbRating = imdbRating;
              wasUpdated = true;
            }
            if (isFieldEmpty(existingMovie.runtime) && runtime) {
              existingMovie.runtime = runtime;
              wasUpdated = true;
            }
            if (isFieldEmpty(existingMovie.genres) && genres.length > 0) {
              existingMovie.genres = genres;
              wasUpdated = true;
            }
            if (isFieldEmpty(existingMovie.releaseDate) && releaseDate) {
              existingMovie.releaseDate = releaseDate;
              wasUpdated = true;
            }
            if (isFieldEmpty(existingMovie.director) && csvDirector) {
              existingMovie.director = csvDirector;
              wasUpdated = true;
            }

            if (wasUpdated) {
              updatedMovies.push({ imdbId, title: existingMovie.title, year: existingMovie.year });
            }
          }
        }
        duplicateCount++;
        continue;
      }

      const listNames: string[] = [];
      if (myRating >= 9) listNames.push('Favoriler');
      if (myRating === 10) listNames.push('10 Puanlık Başyapıtlar');
      if (genres.includes('Sci-Fi')) listNames.push('Bilim Kurgu');
      if (genres.includes('Comedy')) listNames.push('Komedi Günlükleri');
      if (year < 1980) listNames.push('Sinema Klasikleri');
      if (imdbRating >= 8.5) listNames.push('Kült Eserler');
      if (runtime >= 150) listNames.push('Uzun Metraj Maratonu');

      newStandalone.push({
        imdbId,
        title,
        originalTitle,
        year,
        type: titleType,
        myRating,
        watchDate,
        listName: listNames,
        poster: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?q=80&w=500&auto=format&fit=crop',
        overview: `Bu yapım "${csvDirector || 'Bilinmeyen Yönetmen'}" tarafından yönetilmiş ${year} yapımı bir ${genres.join(', ') || 'sinema'} eseridir. IMDb puanı ${imdbRating} olarak kaydedilmiştir.`,
        genres,
        runtime,
        cast: [],
        director: csvDirector,
        writers: [],
        imdbRating,
        tmdbRating: imdbRating,
        releaseDate,
        plot: '',
        country: '',
        omdbType: '',
        boxOffice: ''
      });
    }

    // If no new titles to add and no updates
    if (newStandalone.length === 0 && updatedMovies.length === 0) {
      return NextResponse.json({
        success: true,
        addedCount: 0,
        duplicateCount,
        updatedCount: 0,
        addedTitles: [],
        updatedTitles: [],
        message: fillEmptyOnly
          ? `Güncellenecek boş alan bulunamadı. (${duplicateCount} film zaten veritabanında mevcut)`
          : `Yüklenecek yeni film/dizi bulunamadı. (${duplicateCount} film zaten veritabanında mevcut)`
      });
    }

    // 6. Merge new standalone items into database
    newStandalone.forEach(m => {
      currentMovies.push(m);
    });

    const addedTitles: string[] = newStandalone.map(m => `${m.title} (${m.year})`);
    const updatedTitles: string[] = updatedMovies.map(m => `${m.title} (${m.year})`);



    // 8. Sort seasons and episodes inside TV Series
    currentMovies.forEach(m => {
      if (m.seasons) {
        m.seasons.sort((a, b) => a.seasonNumber - b.seasonNumber);
        m.seasons.forEach(s => {
          s.episodes.sort((a, b) => a.episodeNumber - b.episodeNumber);
        });
      }
    });

    // 9. Save database
    await saveMovies(currentMovies);

    // 10. Revalidate paths
    try {
      revalidatePath('/');
      revalidatePath('/movies');
      revalidatePath('/stats');
    } catch (e) {
      console.error('Revalidation error:', e);
    }

    const totalAdded = newStandalone.length;
    const totalUpdated = updatedMovies.length;

    const messageParts: string[] = [];
    if (totalAdded > 0) messageParts.push(`${totalAdded} yeni yapım eklendi`);
    if (totalUpdated > 0) messageParts.push(`${totalUpdated} mevcut yapımın boş alanları dolduruldu`);
    if (duplicateCount > 0 && !fillEmptyOnly) messageParts.push(`${duplicateCount} mevcut yapım atlandı`);
    if (duplicateCount > 0 && fillEmptyOnly) messageParts.push(`${duplicateCount - totalUpdated} yapımda değişiklik gerekmedi`);

    return NextResponse.json({
      success: true,
      addedCount: totalAdded,
      duplicateCount,
      updatedCount: totalUpdated,
      addedTitles,
      updatedTitles,
      message: messageParts.join(', ') + '.'
    });
  } catch (error: any) {
    console.error('Import API error:', error);
    return NextResponse.json({ error: error.message || 'Sunucu hatası oluştu.' }, { status: 500 });
  }
}
