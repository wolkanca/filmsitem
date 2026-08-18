import { NextResponse } from 'next/server';
import https from 'https';

export const dynamic = 'force-static';


function fetchWithHttps(url: string, options: https.RequestOptions = {}): Promise<{ status: number; text: string }> {
  return new Promise((resolve, reject) => {
    const req = https.get(url, options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        resolve({
          status: res.statusCode || 500,
          text: data
        });
      });
    });

    req.on('error', (err) => {
      reject(err);
    });

    req.end();
  });
}

// GET /api/admin/check-trailer?id=VIDEO_ID — verify if a YouTube video exists and is public
export async function GET(req: Request) {
  try {
    // Verify admin cookie
    const cookieHeader = req.headers.get('cookie') || '';
    const isAdmin = cookieHeader.split(';').some((c) => c.trim().startsWith('is_admin=true'));
    if (!isAdmin) {
      return NextResponse.json({ error: 'Yetkisiz erişim.' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const videoId = searchParams.get('id');

    if (!videoId) {
      return NextResponse.json({ error: 'Video ID gerekli.' }, { status: 400 });
    }

    const ytUrl = `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`;
    
    let result;
    try {
      result = await fetchWithHttps(ytUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        }
      });
    } catch (err: any) {
      return NextResponse.json({ valid: false, status: 502, error: `YouTube bağlantı hatası: ${err.message}` });
    }
    
    if (result.status === 200) {
      try {
        const data = JSON.parse(result.text);
        return NextResponse.json({ valid: true, status: 200, title: data.title });
      } catch (e) {
        return NextResponse.json({ valid: false, status: 200, error: 'JSON ayrıştırma hatası (Video özel veya erişilemez olabilir)' });
      }
    }
    
    return NextResponse.json({ valid: false, status: result.status, error: `YouTube durum kodu: ${result.status}` });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Bilinmeyen hata';
    return NextResponse.json({ valid: false, status: 500, error: message }, { status: 500 });
  }
}
