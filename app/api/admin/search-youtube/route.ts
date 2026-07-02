import { NextResponse } from 'next/server';
import https from 'https';

function fetchWithHttps(url: string, options: https.RequestOptions = {}): Promise<string> {
  return new Promise((resolve, reject) => {
    const req = https.get(url, options, (res) => {
      let data = '';
      
      // Handle redirect
      if (res.statusCode && res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return resolve(fetchWithHttps(res.headers.location, options));
      }

      if (res.statusCode !== 200) {
        return reject(new Error(`YouTube arama hatası (HTTP ${res.statusCode}): ${res.statusMessage}`));
      }

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        resolve(data);
      });
    });

    req.on('error', (err) => {
      reject(err);
    });

    req.end();
  });
}

// GET /api/admin/search-youtube?q=SEARCH_QUERY — search YouTube for videos and return metadata
export async function GET(req: Request) {
  try {
    // Verify admin cookie
    const cookieHeader = req.headers.get('cookie') || '';
    const isAdmin = cookieHeader.split(';').some((c) => c.trim().startsWith('is_admin=true'));
    if (!isAdmin) {
      return NextResponse.json({ error: 'Yetkisiz erişim.' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const query = searchParams.get('q');

    if (!query) {
      return NextResponse.json({ error: 'Arama sorgusu (q) gerekli.' }, { status: 400 });
    }

    // Filter results to videos only with &sp=EgIQAQ%253D%253D
    const url = `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}&sp=EgIQAQ%253D%253D`;
    
    let html: string;
    try {
      html = await fetchWithHttps(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept-Language': 'tr-TR,tr;q=0.9,en-US;q=0.8,en;q=0.7',
        }
      });
    } catch (err: any) {
      console.error('YouTube search request failed:', err);
      return NextResponse.json({ error: `YouTube bağlantısı başarısız oldu: ${err.message}` }, { status: 502 });
    }

    const regex = /var ytInitialData = ({[\s\S]*?});<\/script>/;
    const match = html.match(regex);
    if (!match) {
      return NextResponse.json({ error: 'YouTube arama sonuçları ayrıştırılamadı.' }, { status: 500 });
    }

    const data = JSON.parse(match[1]);
    const sectionList = data.contents?.twoColumnSearchResultsRenderer?.primaryContents?.sectionListRenderer?.contents;
    if (!sectionList) {
      return NextResponse.json({ results: [] });
    }

    const itemSection = sectionList.find((c: any) => c.itemSectionRenderer);
    if (!itemSection) {
      return NextResponse.json({ results: [] });
    }

    const items = itemSection.itemSectionRenderer.contents;
    const results = [];

    for (const item of items) {
      if (item.videoRenderer) {
        const vr = item.videoRenderer;
        const videoId = vr.videoId;
        const title = vr.title?.runs?.[0]?.text || vr.title?.accessibility?.accessibilityData?.label || '';
        const owner = vr.ownerText?.runs?.[0]?.text || '';
        const length = vr.lengthText?.simpleText || '';
        const viewCount = vr.viewCountText?.simpleText || '';
        const thumbnail = vr.thumbnail?.thumbnails?.[0]?.url || '';

        results.push({ videoId, title, owner, length, viewCount, thumbnail });
      }
    }

    return NextResponse.json({ results: results.slice(0, 10) });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Bilinmeyen hata';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
