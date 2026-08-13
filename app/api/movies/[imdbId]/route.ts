import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { getMovies, saveMovies } from '@/lib/db';

// PATCH /api/movies/:imdbId — update poster, backdrop, trailerYoutubeId
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ imdbId: string }> }
) {
  try {
    // Verify admin cookie
    const cookieHeader = req.headers.get('cookie') || '';
    const isAdmin = cookieHeader.split(';').some((c) => c.trim().startsWith('is_admin=true'));
    if (!isAdmin) {
      return NextResponse.json({ error: 'Yetkisiz erişim.' }, { status: 401 });
    }

    const { imdbId } = await params;
    const body = await req.json();

    const stringFields = [
      'title', 'originalTitle', 'type', 'watchDate', 'poster', 'backdrop',
      'overview', 'plot', 'plotTr', 'country', 'omdbType', 'boxOffice',
      'director', 'releaseDate', 'trailerYoutubeId'
    ];
    const numberFields = [
      'year', 'myRating', 'runtime', 'imdbRating', 'tmdbRating'
    ];
    const booleanFields = [
      'isFeatured'
    ];
    const stringArrayFields = [
      'listName', 'genres', 'cast', 'writers'
    ];

    const updates: Record<string, any> = {};

    for (const field of stringFields) {
      if (field in body) {
        updates[field] = typeof body[field] === 'string' ? body[field] : String(body[field] || '');
      }
    }

    for (const field of numberFields) {
      if (field in body) {
        const num = Number(body[field]);
        updates[field] = isNaN(num) ? 0 : num;
      }
    }

    for (const field of booleanFields) {
      if (field in body) {
        updates[field] = Boolean(body[field]);
      }
    }

    for (const field of stringArrayFields) {
      if (field in body) {
        if (Array.isArray(body[field])) {
          updates[field] = body[field].map((val: any) => String(val).trim());
        } else if (typeof body[field] === 'string') {
          updates[field] = body[field].split(',').map((val: string) => val.trim()).filter((val: string) => val.length > 0);
        } else {
          updates[field] = [];
        }
      }
    }

    if ('seasons' in body && Array.isArray(body.seasons)) {
      updates.seasons = body.seasons;
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'Güncellenecek geçerli alan bulunamadı.' }, { status: 400 });
    }

    const movies = await getMovies();
    const idx = movies.findIndex((m: { imdbId: string }) => m.imdbId === imdbId);

    if (idx === -1) {
      return NextResponse.json({ error: 'Film bulunamadı.' }, { status: 404 });
    }

    // Apply updates
    for (const [key, value] of Object.entries(updates)) {
      (movies[idx] as any)[key] = value;
    }

    await saveMovies(movies);

    // On-demand cache revalidation
    revalidatePath(`/movie/${imdbId}`);
    revalidatePath('/movies');
    revalidatePath('/');

    return NextResponse.json({ success: true, movie: movies[idx] });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Bilinmeyen hata';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
