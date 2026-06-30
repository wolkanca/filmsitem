import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const DATA_FILE = path.join(process.cwd(), 'data', 'movies.json');

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

    const allowedFields = ['poster', 'backdrop', 'trailerYoutubeId'];
    const updates: Record<string, string> = {};
    for (const field of allowedFields) {
      if (field in body && typeof body[field] === 'string') {
        updates[field] = body[field];
      }
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'Güncellenecek geçerli alan bulunamadı.' }, { status: 400 });
    }

    if (!fs.existsSync(DATA_FILE)) {
      return NextResponse.json({ error: 'movies.json bulunamadı.' }, { status: 404 });
    }

    const movies = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
    const idx = movies.findIndex((m: { imdbId: string }) => m.imdbId === imdbId);

    if (idx === -1) {
      return NextResponse.json({ error: 'Film bulunamadı.' }, { status: 404 });
    }

    // Apply updates
    for (const [key, value] of Object.entries(updates)) {
      movies[idx][key] = value;
    }

    fs.writeFileSync(DATA_FILE, JSON.stringify(movies, null, 2), 'utf8');

    return NextResponse.json({ success: true, movie: movies[idx] });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Bilinmeyen hata';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
