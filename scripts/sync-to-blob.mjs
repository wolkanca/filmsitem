import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { put } from '@vercel/blob';

dotenv.config({ path: '.env.local' });

async function syncMoviesToBlob() {
  const token = process.env.BLOB_READ_WRITE_TOKEN;

  if (!token) {
    console.error('Hata: BLOB_READ_WRITE_TOKEN bulunamadı (.env.local dosyasını kontrol edin).');
    process.exit(1);
  }

  const moviesPath = path.join(process.cwd(), 'data', 'movies.json');
  if (!fs.existsSync(moviesPath)) {
    console.error('Hata: data/movies.json dosyası bulunamadı.');
    process.exit(1);
  }

  const moviesData = fs.readFileSync(moviesPath, 'utf8');
  console.log('movies.json okunuyor... Toplam karakter:', moviesData.length);

  console.log('Vercel Blob deposuna yükleniyor...');
  const blob = await put('movies.json', moviesData, {
    access: 'public',
    addRandomSuffix: false,
    token,
  });

  console.log('Başarıyla Vercel Blob deposuna yüklendi!');
  console.log('Blob URL:', blob.url);
}

syncMoviesToBlob().catch((err) => {
  console.error('Yükleme hatası:', err);
  process.exit(1);
});
