import { NextResponse } from 'next/server';

// GET /api/admin/suggest-trailer?imdbId=ttXXXXXX&apiKey=... — Search TMDb for a movie's trailer by IMDb ID
export async function GET(req: Request) {
  try {
    // Verify admin cookie
    const cookieHeader = req.headers.get('cookie') || '';
    const isAdmin = cookieHeader.split(';').some((c) => c.trim().startsWith('is_admin=true'));
    if (!isAdmin) {
      return NextResponse.json({ error: 'Yetkisiz erişim.' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const imdbId = searchParams.get('imdbId');
    const clientApiKey = searchParams.get('apiKey');

    if (!imdbId) {
      return NextResponse.json({ error: 'IMDb ID (imdbId) gerekli.' }, { status: 400 });
    }

    // Default API key if not provided
    const apiKey = (clientApiKey && clientApiKey.trim()) || 'e3d09f93ae63545fe155c5bde68ca970';
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

    // Find movie/show on TMDB by IMDb ID
    const findData = await fetchTmdb(`/find/${imdbId}`, {
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

    if (!tmdbId) {
      return NextResponse.json({ error: 'TMDb üzerinde bu IMDb ID bulunamadı.' }, { status: 404 });
    }

    const route = isTv ? `/tv/${tmdbId}/videos` : `/movie/${tmdbId}/videos`;
    let trailerId: string | null = null;

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
      return NextResponse.json({ success: true, trailerYoutubeId: trailerId });
    } else {
      return NextResponse.json({ error: 'TMDb üzerinde bu yapım için YouTube fragmanı bulunamadı.' }, { status: 404 });
    }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Bilinmeyen hata';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
