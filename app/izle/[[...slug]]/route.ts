import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ slug?: string[] }> }
) {
  const { slug } = await context.params;
  const qParam = request.nextUrl.searchParams.get('q');

  let rawQuery = '';
  if (slug && slug.length > 0) {
    rawQuery = slug.map((segment) => decodeURIComponent(segment)).join(' ');
  } else if (qParam) {
    rawQuery = qParam;
  }

  const query = rawQuery.trim();

  if (!query) {
    return NextResponse.redirect(new URL('/', request.url), 307);
  }

  const targetUrl = `https://www.google.com/search?q=${encodeURIComponent(query)}`;
  return NextResponse.redirect(targetUrl, 307);
}
