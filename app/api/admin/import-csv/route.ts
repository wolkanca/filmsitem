import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { revalidatePath } from 'next/cache';
import { Movie } from '@/types';

const DATA_FILE = path.join(process.cwd(), 'data', 'movies.json');

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

// Parse episode title to extract parent show name, season, and episode numbers
function parseEpisodeTitle(title: string): { parentTitle: string; seasonNumber: number; episodeNumber: number } {
  let match = title.match(/^(.*?):\s*#(\d+)\.(\d+)$/);
  if (match) {
    return {
      parentTitle: match[1].trim(),
      seasonNumber: parseInt(match[2], 10),
      episodeNumber: parseInt(match[3], 10)
    };
  }

  match = title.match(/^(.*?):\s*(?:Season|Sezon|S)\s*(\d+)\s*(?:Episode|Bölüm|B|E)\s*(\d+)$/i);
  if (match) {
    return {
      parentTitle: match[1].trim(),
      seasonNumber: parseInt(match[2], 10),
      episodeNumber: parseInt(match[3], 10)
    };
  }

  match = title.match(/^(.*?):\s*(?:Avsnitt|Episode|Bölüm|B|E|Ep)\s*(\d+)$/i);
  if (match) {
    return {
      parentTitle: match[1].trim(),
      seasonNumber: 1,
      episodeNumber: parseInt(match[2], 10)
    };
  }

  const colonIndex = title.indexOf(':');
  if (colonIndex > 0) {
    const parentTitle = title.substring(0, colonIndex).trim();
    const episodeTitle = title.substring(colonIndex + 1).trim();
    const numMatch = episodeTitle.match(/\d+/);
    const episodeNumber = numMatch ? parseInt(numMatch[0], 10) : 1;
    return {
      parentTitle,
      seasonNumber: 1,
      episodeNumber
    };
  }

  return {
    parentTitle: title,
    seasonNumber: 1,
    episodeNumber: 1
  };
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
    if (!fs.existsSync(DATA_FILE)) {
      return NextResponse.json({ error: 'movies.json bulunamadı.' }, { status: 404 });
    }

    const moviesContent = fs.readFileSync(DATA_FILE, 'utf8');
    const currentMovies: Movie[] = JSON.parse(moviesContent);

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
    const newEpisodes: any[] = [];
    let duplicateCount = 0;

    // 5. Process CSV rows
    for (let i = 1; i < lines.length; i++) {
      const row = parseCSVLine(lines[i]);
      if (row.length < headers.length) continue;

      const imdbId = row[indexMap['Const']];
      if (!imdbId || !imdbId.startsWith('tt')) continue;

      // Duplicate check
      if (existingIds.has(imdbId)) {
        duplicateCount++;
        continue;
      }

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
        newEpisodes.push({
          imdbId,
          title,
          originalTitle,
          year,
          type: titleType,
          myRating,
          watchDate,
          genres,
          runtime,
          imdbRating,
          releaseDate,
          director: csvDirector
        });
      } else {
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
          backdrop?: string; // bunu opsiyonel yap
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
    }

    // If no new titles to add
    if (newStandalone.length === 0 && newEpisodes.length === 0) {
      return NextResponse.json({
        success: true,
        addedCount: 0,
        duplicateCount,
        addedTitles: [],
        message: `Yüklenecek yeni film/dizi bulunamadı. (${duplicateCount} film zaten veritabanında mevcut)`
      });
    }

    // 6. Merge new standalone items into database
    newStandalone.forEach(m => {
      currentMovies.push(m);
    });

    const addedTitles: string[] = newStandalone.map(m => `${m.title} (${m.year})`);

    // 7. Group and merge TV Episodes
    newEpisodes.forEach(ep => {
      const { parentTitle, seasonNumber, episodeNumber } = parseEpisodeTitle(ep.title);
      const parentTitleLower = parentTitle.toLowerCase();

      // Find parent TV series in database (which now includes new standalone items)
      let parentSeries = currentMovies.find(m =>
        (m.type === 'TV Series' || m.type === 'TV Mini Series') &&
        (m.title.toLowerCase() === parentTitleLower || m.originalTitle?.toLowerCase() === parentTitleLower)
      );

      if (!parentSeries) {
        parentSeries = currentMovies.find(m =>
          (m.type === 'TV Series' || m.type === 'TV Mini Series') &&
          (m.title.toLowerCase().includes(parentTitleLower) || parentTitleLower.includes(m.title.toLowerCase()))
        );
      }

      // Create a mock parent series if it doesn't exist
      if (!parentSeries) {
        const parentId = 'parent_' + parentTitleLower.replace(/[^a-z0-9]/g, '');
        parentSeries = {
          imdbId: parentId,
          title: parentTitle,
          originalTitle: parentTitle,
          year: ep.year,
          type: 'TV Series',
          myRating: 0,
          watchDate: ep.watchDate,
          listName: [],
          poster: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?q=80&w=500&auto=format&fit=crop',
          backdrop?: string; // bunu opsiyonel yap
          overview: `Bu dizi "${ep.director || 'Bilinmeyen Yönetmen'}" tarafından yönetilmiş/oluşturulmuş ${ep.year} yapımı bir dizi eseridir.`,
          genres: ep.genres || [],
          runtime: ep.runtime || 0,
          cast: [],
          director: ep.director || '',
          writers: [],
          imdbRating: ep.imdbRating || 0,
          tmdbRating: ep.imdbRating || 0,
          releaseDate: ep.releaseDate || '',
          plot: '',
          country: '',
          omdbType: 'series',
          boxOffice: '',
          seasons: []
        };
        currentMovies.push(parentSeries);
        addedTitles.push(`${parentTitle} (Dizi - Yeni Kayıt)`);
      }

      if (!parentSeries.seasons) {
        parentSeries.seasons = [];
      }

      let season = parentSeries.seasons.find(s => s.seasonNumber === seasonNumber);
      if (!season) {
        season = {
          seasonNumber,
          episodes: []
        };
        parentSeries.seasons.push(season);
      }

      const epExists = season.episodes.some(e => e.imdbId === ep.imdbId);
      if (!epExists) {
        season.episodes.push({
          imdbId: ep.imdbId,
          title: ep.title,
          episodeNumber,
          seasonNumber,
          myRating: ep.myRating,
          watchDate: ep.watchDate,
          runtime: ep.runtime || 0,
          imdbRating: ep.imdbRating || 0,
          overview: `Bu bölüm "${ep.director || 'Bilinmeyen Yönetmen'}" tarafından yönetilmiş ${ep.year} yapımı bir dizi bölümüdür.`
        });
        addedTitles.push(`${parentTitle} - Sezon ${seasonNumber} Bölüm ${episodeNumber}`);
      }
    });

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
    fs.writeFileSync(DATA_FILE, JSON.stringify(currentMovies, null, 2), 'utf8');

    // 10. Revalidate paths
    try {
      revalidatePath('/');
      revalidatePath('/movies');
      revalidatePath('/stats');
    } catch (e) {
      console.error('Revalidation error:', e);
    }

    const totalAdded = newStandalone.length + newEpisodes.length;

    return NextResponse.json({
      success: true,
      addedCount: totalAdded,
      duplicateCount,
      addedTitles,
      message: `${totalAdded} yeni yapım veritabanına başarıyla eklendi, ${duplicateCount} mevcut yapım atlandı.`
    });
  } catch (error: any) {
    console.error('Import API error:', error);
    return NextResponse.json({ error: error.message || 'Sunucu hatası oluştu.' }, { status: 500 });
  }
}
