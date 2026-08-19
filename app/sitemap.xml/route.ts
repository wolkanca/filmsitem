export const runtime = 'nodejs';
export const dynamic = 'force-static';
export const revalidate = 2592000;

const SITE_URL = 'https://izlediklerim.com';

const SITEMAP_SECTIONS = [
    'pages',
    'movies',
    'lists',
    'genres',
    'years',
    'directors',
    'writers',
    'actors',
];

function escapeXml(value: string) {
    return value
        .replaceAll('&', '&amp;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&apos;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;');
}

function renderSitemapIndex() {
    const today = new Date().toISOString();

    return `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${SITEMAP_SECTIONS.map(
        (section) => `  <sitemap>
    <loc>${escapeXml(`${SITE_URL}/sitemaps/${section}-1.xml`)}</loc>
    <lastmod>${today}</lastmod>
  </sitemap>`
    ).join('\n')}
</sitemapindex>`;
}

export async function GET() {
    return new Response(renderSitemapIndex(), {
        headers: {
            'Content-Type': 'application/xml; charset=utf-8',
            'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=604800',
        },
    });
}