import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { put } from '@vercel/blob';

const CONFIG_FILE = path.join(process.cwd(), 'data', 'blob-config.json');

export interface BlobConfig {
  enabled: boolean;
  blobUrl: string;
  lastSync: string | null;
  lastSyncDirection: 'local_to_blob' | 'blob_to_local' | null;
}

function readConfig(): BlobConfig {
  const envUrl = process.env.BLOB_MOVIES_URL || '';
  const defaults: BlobConfig = {
    enabled: !!envUrl,
    blobUrl: envUrl,
    lastSync: null,
    lastSyncDirection: null,
  };

  try {
    if (fs.existsSync(CONFIG_FILE)) {
      const raw = fs.readFileSync(CONFIG_FILE, 'utf8');
      return { ...defaults, ...JSON.parse(raw) };
    }
  } catch {
    // ignore
  }
  return defaults;
}

function writeConfig(config: BlobConfig): void {
  const dir = path.dirname(CONFIG_FILE);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2), 'utf8');
}

// GET — Mevcut blob ayarlarını döner
export async function GET() {
  const config = readConfig();

  // Blob'un gerçekten erişilebilir olup olmadığını kontrol et
  let blobReachable = false;
  if (config.blobUrl) {
    try {
      const res = await fetch(config.blobUrl, {
        method: 'HEAD',
        cache: 'no-store',
        signal: AbortSignal.timeout(5000),
      });
      blobReachable = res.ok;
    } catch {
      blobReachable = false;
    }
  }

  // Local data/movies.json var mı?
  const moviesFile = path.join(process.cwd(), 'data', 'movies.json');
  const localExists = fs.existsSync(moviesFile);
  let localCount = 0;
  if (localExists) {
    try {
      const raw = fs.readFileSync(moviesFile, 'utf8');
      const arr = JSON.parse(raw);
      localCount = Array.isArray(arr) ? arr.length : 0;
    } catch { /* ignore */ }
  }

  return NextResponse.json({
    ...config,
    blobReachable,
    localExists,
    localCount,
  });
}

// POST — Ayarları güncelle
export async function POST(req: NextRequest) {
  const body = await req.json();
  const config = readConfig();

  if (typeof body.enabled === 'boolean') config.enabled = body.enabled;
  if (typeof body.blobUrl === 'string') config.blobUrl = body.blobUrl;

  writeConfig(config);

  return NextResponse.json({ success: true, config });
}

// PUT — Blob URL'yi put() yaparak otomatik keşfet
export async function PUT() {
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return NextResponse.json({ error: 'BLOB_READ_WRITE_TOKEN eksik' }, { status: 400 });
  }

  const moviesFile = path.join(process.cwd(), 'data', 'movies.json');
  if (!fs.existsSync(moviesFile)) {
    return NextResponse.json({ error: 'Local movies.json bulunamadı' }, { status: 404 });
  }

  const content = fs.readFileSync(moviesFile, 'utf8');

  try {
    const blob = await put('movies.json', content, {
      access: 'public',
      addRandomSuffix: false,
    });

    const config = readConfig();
    config.blobUrl = blob.url;
    config.enabled = true;
    config.lastSync = new Date().toISOString();
    config.lastSyncDirection = 'local_to_blob';
    writeConfig(config);

    return NextResponse.json({ success: true, url: blob.url, config });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
