import { NextResponse } from 'next/server';
import { getMovies } from '@/lib/db';

export async function GET() {
  const movies = await getMovies();
  return NextResponse.json(movies);
}
