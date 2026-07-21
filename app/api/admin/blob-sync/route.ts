import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { put } from '@vercel/blob';

const CONFIG_FILE = path.join(process.cwd(), 'data', 'blob-config.json');
const MOVIES_FILE = path.join(process.cwd(), 'data', 'movies.json');

function readConfig() {
  try {
    if (fs.existsSync(CONFIG_FILE)) {
      return JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8'));
    }
  } catch { /* ignore */ }
  return { blobUrl: process.env.BLOB_MOVIES_URL || '' };
}

function writeConfig(config: object) {
  const dir = path.dirname(CONFIG_FILE);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2), 'utf8');
}

// POST — Senkronizasyon işlemi
// body: { direction: 'local_to_blob' | 'blob_to_local' }
export async function POST(req: NextRequest) {
  const body = await req.json();
  const direction: 'local_to_blob' | 'blob_to_local' = body.direction || 'local_to_blob';

  if (direction === 'local_to_blob') {
    // Local → Blob: local dosyayı blob'a yükle
    if (!process.env.BLOB_READ_WRITE_TOKEN) {
      return NextResponse.json({ error: 'BLOB_READ_WRITE_TOKEN eksik — Vercel env değişkenlerini kontrol edin.' }, { status: 400 });
    }
    if (!fs.existsSync(MOVIES_FILE)) {
      return NextResponse.json({ error: 'Local data/movies.json bulunamadı.' }, { status: 404 });
    }

    const content = fs.readFileSync(MOVIES_FILE, 'utf8');
    const parsed = JSON.parse(content);
    const count = Array.isArray(parsed) ? parsed.length : 0;

    try {
      const blob = await put('movies.json', content, {
        access: 'public',
        addRandomSuffix: false,
      });

      // Config'e URL'yi kaydet
      const config = readConfig();
      config.blobUrl = blob.url;
      config.enabled = true;
      config.lastSync = new Date().toISOString();
      config.lastSyncDirection = 'local_to_blob';
      writeConfig(config);

      return NextResponse.json({
        success: true,
        direction,
        url: blob.url,
        movieCount: count,
        message: `${count} film başarıyla Blob'a yüklendi.`,
      });
    } catch (error) {
      return NextResponse.json({ error: `Blob yükleme hatası: ${String(error)}` }, { status: 500 });
    }

  } else {
    // Blob → Local: blob'dan çek, local'e yaz
    const config = readConfig();
    const blobUrl = config.blobUrl || process.env.BLOB_MOVIES_URL;

    if (!blobUrl) {
      return NextResponse.json({ error: 'Blob URL tanımlı değil. Önce Local → Blob senkronizasyonu yapın.' }, { status: 400 });
    }

    try {
      const res = await fetch(blobUrl, {
        cache: 'no-store',
        signal: AbortSignal.timeout(15000),
      });

      if (!res.ok) {
        return NextResponse.json({ error: `Blob erişim hatası: HTTP ${res.status}` }, { status: 502 });
      }

      const data = await res.json();
      if (!Array.isArray(data)) {
        return NextResponse.json({ error: 'Blob verisi geçersiz format.' }, { status: 400 });
      }

      // Local dosyaya yaz
      const dir = path.dirname(MOVIES_FILE);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(MOVIES_FILE, JSON.stringify(data, null, 2), 'utf8');

      config.lastSync = new Date().toISOString();
      config.lastSyncDirection = 'blob_to_local';
      writeConfig(config);

      return NextResponse.json({
        success: true,
        direction,
        movieCount: data.length,
        message: `${data.length} film Blob'dan Local'e indirildi.`,
      });
    } catch (error) {
      return NextResponse.json({ error: `Blob indirme hatası: ${String(error)}` }, { status: 500 });
    }
  }
}
