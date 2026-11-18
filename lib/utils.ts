export function formatDate(dateString: string): string {
  if (!dateString) return 'N/A';
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;
    // timeZone: 'UTC' kullanılarak server (Vercel/UTC) ile client (farklı timezone)
    // arasındaki hydration uyumsuzluğu önlenir.
    return new Intl.DateTimeFormat('tr-TR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      timeZone: 'UTC',
    }).format(date);
  } catch {
    return dateString;
  }
}

export function slugify(text: string): string {
  const map: Record<string, string> = {
    'ç': 'c', 'Ç': 'c',
    'ğ': 'g', 'Ğ': 'g',
    'ı': 'i', 'I': 'i',
    'İ': 'i',
    'ö': 'o', 'Ö': 'o',
    'ş': 's', 'Ş': 's',
    'ü': 'u', 'Ü': 'u',
    ' ': '-',
  };
  
  return text
    .toString()
    .toLowerCase()
    .split('')
    .map(c => map[c] || c)
    .join('')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function getRatingColor(rating: number): string {
  if (rating >= 8) return 'text-emerald-400';
  if (rating >= 6) return 'text-amber-400';
  if (rating >= 4) return 'text-orange-400';
  return 'text-rose-500';
}

export function normalizeSearchString(text: string): string {
  if (!text) return '';
  const map: Record<string, string> = {
    'Ç': 'c', 'ç': 'c',
    'Ğ': 'g', 'ğ': 'g',
    'I': 'i', 'ı': 'i',
    'İ': 'i', 'i': 'i',
    'Ö': 'o', 'ö': 'o',
    'Ş': 's', 'ş': 's',
    'Ü': 'u', 'ü': 'u'
  };
  
  return text
    .toString()
    .split('')
    .map(c => map[c] || c.toLowerCase())
    .join('');
}

/**
 * Film poster URL'sini gösterim için hazırlar.
 * Yerel veya izlediklerim.com kaynaklı poster yollarını alsetek.com CDN'ine yönlendirir.
 */
export function getMoviePosterUrl(url?: string | null): string {
  if (!url) return '';
  const trimmed = url.trim();
  if (trimmed.startsWith('/images/')) {
    return `https://alsetek.com/izlediklerim${trimmed}`;
  }
  if (trimmed.startsWith('https://izlediklerim.com/images/')) {
    return trimmed.replace('https://izlediklerim.com/images/', 'https://alsetek.com/izlediklerim/images/');
  }
  if (trimmed.startsWith('http://izlediklerim.com/images/')) {
    return trimmed.replace('http://izlediklerim.com/images/', 'https://alsetek.com/izlediklerim/images/');
  }
  return trimmed;
}

