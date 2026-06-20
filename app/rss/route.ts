import { NextResponse } from 'next/server';
import { getMovies } from '@/lib/db';

export async function GET() {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://film-gunlugum.vercel.app';
  
  try {
    const movies = await getMovies();
    const sortedMovies = [...movies]
      .sort((a, b) => new Date(b.watchDate).getTime() - new Date(a.watchDate).getTime())
      .slice(0, 30); // Top 30 items

    const rssItemsXml = sortedMovies
      .map((m) => {
        const ratingText = m.myRating > 0 ? `Puanım: ${m.myRating}/10.` : '';
        const descriptionText = `${m.year} yapımı, yönetmeni ${m.director || 'Bilinmiyor'}. ${ratingText} ${m.overview || ''}`;
        return `
    <item>
      <title><![CDATA[${m.title} (${m.year}) - İzledim]]></title>
      <link>${baseUrl}/movie/${m.imdbId}</link>
      <guid isPermaLink="true">${baseUrl}/movie/${m.imdbId}</guid>
      <pubDate>${m.watchDate ? new Date(m.watchDate).toUTCString() : new Date().toUTCString()}</pubDate>
      <description><![CDATA[${descriptionText}]]></description>
    </item>`;
      })
      .join('');

    const rssXml = `<?xml version="1.0" encoding="UTF-8" ?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>Film Günlüğüm</title>
    <link>${baseUrl}</link>
    <description>Kişisel film izleme geçmişi ve günlük arşivim.</description>
    <language>tr</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link href="${baseUrl}/rss.xml" rel="self" type="application/rss+xml" />
    ${rssItemsXml}
  </channel>
</rss>`;

    return new Response(rssXml, {
      headers: {
        'Content-Type': 'application/xml; charset=utf-8',
        'Cache-Control': 's-maxage=3600, stale-while-revalidate',
      },
    });
  } catch (err) {
    console.error('RSS generate error:', err);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
