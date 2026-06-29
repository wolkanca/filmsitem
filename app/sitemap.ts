import { MetadataRoute } from 'next';
import { getMovies } from '@/lib/db';
import { slugify } from '@/lib/utils';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://izlediklerim.wolkanca.com';

  // Base routes
  const routes = ['', '/movies', '/lists', '/favorites', '/stats', '/random'].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: 'daily' as const,
    priority: route === '' ? 1.0 : 0.8,
  }));

  try {
    const movies = await getMovies();

    // Movie routes
    const movieRoutes = movies.map((m) => ({
      url: `${baseUrl}/movie/${m.imdbId}`,
      lastModified: m.watchDate ? new Date(m.watchDate) : new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.6,
    }));

    // Lists routes
    const listNames = new Set<string>();
    const genres = new Set<string>();
    const years = new Set<number>();
    const directors = new Set<string>();
    const actors = new Set<string>();

    movies.forEach((m) => {
      (m.listName || []).forEach((ln) => listNames.add(ln));
      (m.genres || []).forEach((g) => genres.add(g));
      if (m.year) years.add(m.year);
      if (m.director) {
        m.director.split(',').map((d) => d.trim()).filter(Boolean).forEach((d) => directors.add(d));
      }
      (m.cast || []).forEach((act) => actors.add(act));
    });

    const listRoutes = Array.from(listNames).map((ln) => ({
      url: `${baseUrl}/list/${slugify(ln)}`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.5,
    }));

    const genreRoutes = Array.from(genres).map((g) => ({
      url: `${baseUrl}/genre/${encodeURIComponent(g)}`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.5,
    }));

    const yearRoutes = Array.from(years).map((y) => ({
      url: `${baseUrl}/year/${y}`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.5,
    }));

    const directorRoutes = Array.from(directors).map((d) => ({
      url: `${baseUrl}/director/${encodeURIComponent(d)}`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.5,
    }));

    const actorRoutes = Array.from(actors).map((act) => ({
      url: `${baseUrl}/actor/${encodeURIComponent(act)}`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.5,
    }));

    return [
      ...routes,
      ...movieRoutes,
      ...listRoutes,
      ...genreRoutes,
      ...yearRoutes,
      ...directorRoutes,
      ...actorRoutes,
    ];
  } catch {
    return routes;
  }
}

