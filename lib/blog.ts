const FEED_URL = 'https://wolkanca.com/kategori/eglence/feed';

export interface BlogPost {
  title: string;
  link: string;
  pubDate: string;
  description: string;
  thumbnail: string;
  categories: string[];
  author: string;
}

export async function getBlogPosts(limit = 6): Promise<BlogPost[]> {
  try {
    const res = await fetch(FEED_URL, {
      next: { revalidate: 3600 }, // cache for 1 hour
    });

    if (!res.ok) {
      console.error('Failed to fetch RSS feed:', res.status);
      return [];
    }

    const xml = await res.text();
    const posts: BlogPost[] = [];

    // Extract all <item> blocks
    const itemRegex = /<item>([\s\S]*?)<\/item>/g;
    let match: RegExpExecArray | null;

    while ((match = itemRegex.exec(xml)) !== null && posts.length < limit) {
      const item = match[1];

      const title = extractTag(item, 'title');
      const link = extractTag(item, 'link');
      const pubDate = extractTag(item, 'pubDate');
      const description = extractCDATA(item, 'description');
      const author = extractCDATA(item, 'dc:creator');

      // Extract thumbnail from media:thumbnail
      const thumbMatch = item.match(/media:thumbnail\s+url="([^"]+)"/);
      const thumbnail = thumbMatch ? thumbMatch[1] : '';

      // Extract categories
      const categories: string[] = [];
      const catRegex = /<category><!\[CDATA\[(.*?)\]\]><\/category>/g;
      let catMatch: RegExpExecArray | null;
      while ((catMatch = catRegex.exec(item)) !== null) {
        categories.push(catMatch[1]);
      }

      // Clean description: strip HTML tags and hashtags, limit length
      const cleanDesc = description
        .replace(/<[^>]*>/g, '')
        .replace(/#\S+/g, '')
        .replace(/\s+/g, ' ')
        .trim();

      // Take first ~160 characters as excerpt
      const excerpt = cleanDesc.length > 160
        ? cleanDesc.substring(0, 160).replace(/\s+\S*$/, '') + '…'
        : cleanDesc;

      posts.push({
        title,
        link,
        pubDate,
        description: excerpt,
        thumbnail: thumbnail.replace('resize=300,300', 'resize=400,400'),
        categories,
        author,
      });
    }

    return posts;
  } catch (err) {
    console.error('RSS parse error:', err);
    return [];
  }
}

function extractTag(xml: string, tag: string): string {
  const regex = new RegExp(`<${tag}>([\\s\\S]*?)<\\/${tag}>`);
  const match = xml.match(regex);
  return match ? match[1].trim() : '';
}

function extractCDATA(xml: string, tag: string): string {
  const regex = new RegExp(`<${tag}><!\\[CDATA\\[([\\s\\S]*?)\\]\\]><\\/${tag}>`);
  const match = xml.match(regex);
  return match ? match[1].trim() : extractTag(xml, tag);
}
