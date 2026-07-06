import { NextResponse } from 'next/server';
import { getMovies } from '@/lib/db';

export const revalidate = 604800; // 7 gün (saniye)

export async function GET() {
  const movies = await getMovies();

  return NextResponse.json(movies, {
    headers: {
      'Cache-Control': 'public, s-maxage=604800, stale-while-revalidate=86400',
    },
  });
}