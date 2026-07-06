import movies from '@/data/movies.json';

export const runtime = 'nodejs';
export const dynamic = 'force-static';
export const revalidate = 86400;

const SITE_URL = 'https://izlediklerim.wolkanca.com';
const SITEMAP_LIMIT = 45000;

type Movie = {
    imdbId?: string;
    title?: string;
    year?: string | number;
    genres?: string[] | string;
    genre?: string[] | string;
    director?: string | string[];
    writers?: string | string[];
    writer?: string | string[];
    cast?: string | string[];
    actors?: string | string[];
    lists?: string | string[];
};

type SitemapItem = {
    loc: string;
    lastmod?: string;
    changefreq?: string;
    priority?: number;
};

function escapeXml(value: string) {
    return value
        .replaceAll('&', '&amp;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&apos;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;');
}

function slugify(value: string) {
    return value
        .toString()
        .trim()
        .toLowerCase()
        .replace(/ğ/g, 'g')
        .replace(/ü/g, 'u')
        .replace(/ş/g, 's')
        .replace(/ı/g, 'i')
        .replace(/ö/g, 'o')
        .replace(/ç/g, 'c')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
}

function getArray(value: unknown): string[] {
    if (Array.isArray(value)) {
        return value.map(String).map((item) => item.trim()).filter(Boolean);
    }

    if (typeof value === 'string') {
        return value
            .split(',')
            .map((item) => item.trim())
            .filter(Boolean);
    }

    return [];
}

function uniqueValues(values: Array<string | undefined | null>) {
    return Array.from(
        new Set(
            values
                .filter(Boolean)
                .map((value) => String(value).trim())
                .filter(Boolean)
        )
    );
}

function renderUrl(item: SitemapItem) {
    return `  <url>
    <loc>${escapeXml(item.loc)}</loc>
    ${item.lastmod ? `<lastmod>${escapeXml(item.lastmod)}</lastmod>` : ''}
    ${item.changefreq ? `<changefreq>${item.changefreq}</changefreq>` : ''}
    ${typeof item.priority === 'number' ? `<priority>${item.priority.toFixed(1)}</priority>` : ''}
  </url>`;
}

function renderSitemap(items: SitemapItem[]) {
    return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${items.map(renderUrl).join('\n')}
</urlset>`;
}

function paginateItems(items: SitemapItem[], page: number) {
    const start = (page - 1) * SITEMAP_LIMIT;
    const end = start + SITEMAP_LIMIT;

    return items.slice(start, end);
}

function getStaticPages(): SitemapItem[] {
    return [
        '',
        '/movies',
        '/lists',
        '/stats',
        '/random',
        '/about',
    ].map((path) => ({
        loc: `${SITE_URL}${path}`,
        changefreq: path === '' ? 'daily' : 'weekly',
        priority: path === '' ? 1.0 : 0.8,
    }));
}

function getMoviePages(): SitemapItem[] {
    return (movies as Movie[])
        .filter((movie) => movie.imdbId)
        .map((movie) => ({
            loc: `${SITE_URL}/movie/${movie.imdbId}`,
            changefreq: 'monthly',
            priority: 0.7,
        }));
}

function getListPages(): SitemapItem[] {
    const collectionNames = [
        'Video Game',
        'TV Mini Series',
        'TV Series',
        'Türk Filmleri',
        'Animasyon',
        'Belgeseller',
        'Korku ve Gerilim',
        'Aksiyon',
        '2020 Sonrası',
        '90lar',
        '80ler',
        'Kısa Yapımlar',
    ];

    return collectionNames.map((name) => ({
        loc: `${SITE_URL}/list/${slugify(name)}`,
        changefreq: 'weekly',
        priority: 0.7,
    }));
}

function getGenrePages(): SitemapItem[] {
    const genres = uniqueValues(
        (movies as Movie[]).flatMap((movie) => [
            ...getArray(movie.genres),
            ...getArray(movie.genre),
        ])
    );

    return genres.map((genre) => ({
        loc: `${SITE_URL}/movies?genre=${encodeURIComponent(genre)}`,
        changefreq: 'weekly',
        priority: 0.5,
    }));
}

function getYearPages(): SitemapItem[] {
    const years = uniqueValues(
        (movies as Movie[]).map((movie) => movie.year?.toString())
    );

    return years.map((year) => ({
        loc: `${SITE_URL}/movies?year=${encodeURIComponent(year)}`,
        changefreq: 'weekly',
        priority: 0.5,
    }));
}

function getDirectorPages(): SitemapItem[] {
    const directors = uniqueValues(
        (movies as Movie[]).flatMap((movie) => getArray(movie.director))
    );

    return directors.map((director) => ({
        loc: `${SITE_URL}/movies?director=${encodeURIComponent(director)}`,
        changefreq: 'weekly',
        priority: 0.5,
    }));
}

function getWriterPages(): SitemapItem[] {
    const writers = uniqueValues(
        (movies as Movie[]).flatMap((movie) => [
            ...getArray(movie.writers),
            ...getArray(movie.writer),
        ])
    );

    return writers.map((writer) => ({
        loc: `${SITE_URL}/movies?writer=${encodeURIComponent(writer)}`,
        changefreq: 'weekly',
        priority: 0.5,
    }));
}

function getActorPages(): SitemapItem[] {
    const actors = uniqueValues(
        (movies as Movie[]).flatMap((movie) => [
            ...getArray(movie.cast),
            ...getArray(movie.actors),
        ])
    );

    return actors.map((actor) => ({
        loc: `${SITE_URL}/movies?actor=${encodeURIComponent(actor)}`,
        changefreq: 'weekly',
        priority: 0.5,
    }));
}

function getItemsBySection(section: string) {
    switch (section) {
        case 'pages':
            return getStaticPages();
        case 'movies':
            return getMoviePages();
        case 'lists':
            return getListPages();
        case 'genres':
            return getGenrePages();
        case 'years':
            return getYearPages();
        case 'directors':
            return getDirectorPages();
        case 'writers':
            return getWriterPages();
        case 'actors':
            return getActorPages();
        default:
            return null;
    }
}

export async function GET(
    request: Request,
    { params }: { params: Promise<{ slug: string }> }
) {
    const { slug } = await params;

    const rawSlug = slug.replace(/\.xml$/, '');
    const lastDashIndex = rawSlug.lastIndexOf('-');

    if (lastDashIndex === -1) {
        return new Response('Invalid sitemap slug', { status: 404 });
    }

    const section = rawSlug.slice(0, lastDashIndex);
    const page = Number(rawSlug.slice(lastDashIndex + 1));

    if (!section || !Number.isFinite(page) || page < 1) {
        return new Response('Invalid sitemap page', { status: 404 });
    }

    const items = getItemsBySection(section);

    if (!items) {
        return new Response('Sitemap section not found', { status: 404 });
    }

    const paginatedItems = paginateItems(items, page);

    if (paginatedItems.length === 0) {
        return new Response('Sitemap page not found', { status: 404 });
    }

    return new Response(renderSitemap(paginatedItems), {
        headers: {
            'Content-Type': 'application/xml; charset=utf-8',
            'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=604800',
        },
    });
}