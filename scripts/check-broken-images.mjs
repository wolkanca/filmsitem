import fs from 'fs/promises';
import path from 'path';

const args = process.argv.slice(2);

const inputPathArg = args.find((arg) => !arg.startsWith('--')) || './data/movies.json';
const checkBackdrop = args.includes('--backdrop');
const fixWithYoutube = args.includes('--fix-youtube');

const inputPath = path.resolve(process.cwd(), inputPathArg);
const outputPath = inputPath;

const logPath = path.resolve(process.cwd(), 'broken-images-log.txt');
const jsonLogPath = path.resolve(process.cwd(), 'broken-images-log.json');

console.log('Okunacak dosya:', inputPath);
console.log('Log dosyası:', logPath);
console.log('JSON log dosyası:', jsonLogPath);
console.log('Backdrop kontrolü:', checkBackdrop ? 'Açık' : 'Kapalı');
console.log('YouTube thumbnail ile düzeltme:', fixWithYoutube ? 'Açık' : 'Kapalı');

const raw = await fs.readFile(inputPath, 'utf8');
const movies = JSON.parse(raw);

function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

function isHttpUrl(value) {
    return typeof value === 'string' && /^https?:\/\//i.test(value);
}

function isYoutubeThumbnail(url) {
    return typeof url === 'string' && (
        url.includes('img.youtube.com') ||
        url.includes('i.ytimg.com')
    );
}

function getYoutubeThumbnail(movie) {
    if (!movie.trailerYoutubeId) return '';

    return `https://img.youtube.com/vi/${movie.trailerYoutubeId}/hqdefault.jpg`;
}

async function checkImageUrl(url) {
    if (!isHttpUrl(url)) {
        return {
            ok: false,
            status: 0,
            reason: 'Geçerli URL değil',
        };
    }

    try {
        let res = await fetch(url, {
            method: 'HEAD',
            redirect: 'follow',
            signal: AbortSignal.timeout(10000),
        });

        if (res.status === 405 || res.status === 403) {
            res = await fetch(url, {
                method: 'GET',
                redirect: 'follow',
                signal: AbortSignal.timeout(15000),
            });
        }

        const contentType = res.headers.get('content-type') || '';

        if (!res.ok) {
            return {
                ok: false,
                status: res.status,
                reason: `HTTP ${res.status}`,
            };
        }

        if (!contentType.toLowerCase().startsWith('image/')) {
            return {
                ok: false,
                status: res.status,
                reason: `Görsel değil: ${contentType || 'content-type yok'}`,
            };
        }

        return {
            ok: true,
            status: res.status,
            reason: 'OK',
        };
    } catch (error) {
        return {
            ok: false,
            status: 0,
            reason: error.message,
        };
    }
}

const brokenItems = [];
const youtubeFallbackItems = [];
let checkedCount = 0;
let fixedCount = 0;

for (const movie of movies) {
    const fieldsToCheck = ['poster'];

    if (checkBackdrop) {
        fieldsToCheck.push('backdrop');
    }

    for (const field of fieldsToCheck) {
        const imageUrl = movie[field];

        if (!imageUrl) {
            brokenItems.push({
                imdbId: movie.imdbId,
                title: movie.title,
                year: movie.year,
                field,
                url: imageUrl || '',
                reason: `${field} boş`,
                hasTrailerYoutubeId: Boolean(movie.trailerYoutubeId),
                trailerYoutubeId: movie.trailerYoutubeId || '',
                youtubeThumbnail: getYoutubeThumbnail(movie),
            });

            console.log(`Kırık/boş: ${movie.title} (${movie.imdbId}) - ${field} boş`);
            continue;
        }

        if (isYoutubeThumbnail(imageUrl)) {
            youtubeFallbackItems.push({
                imdbId: movie.imdbId,
                title: movie.title,
                year: movie.year,
                field,
                url: imageUrl,
                reason: 'YouTube thumbnail kullanıyor',
                trailerYoutubeId: movie.trailerYoutubeId || '',
            });

            console.log(`YouTube fallback poster: ${movie.title} (${movie.imdbId}) - ${imageUrl}`);
        }

        checkedCount++;

        const result = await checkImageUrl(imageUrl);

        if (!result.ok) {
            const youtubeThumbnail = getYoutubeThumbnail(movie);

            brokenItems.push({
                imdbId: movie.imdbId,
                title: movie.title,
                year: movie.year,
                field,
                url: imageUrl,
                status: result.status,
                reason: result.reason,
                hasTrailerYoutubeId: Boolean(movie.trailerYoutubeId),
                trailerYoutubeId: movie.trailerYoutubeId || '',
                youtubeThumbnail,
            });

            console.log(`Kırık görsel: ${movie.title} (${movie.imdbId}) - ${field} - ${result.reason}`);

            if (fixWithYoutube && field === 'poster' && youtubeThumbnail) {
                movie.poster = youtubeThumbnail;
                fixedCount++;

                console.log(`Poster YouTube thumbnail ile değiştirildi: ${movie.title} (${movie.imdbId}) -> ${youtubeThumbnail}`);
            }
        } else {
            console.log(`OK: ${movie.title} (${movie.imdbId}) - ${field}`);
        }

        await sleep(150);
    }
}

const logLines = [];

logLines.push('KIRIK GÖRSEL KONTROL RAPORU');
logLines.push('===========================');
logLines.push(`Tarih: ${new Date().toISOString()}`);
logLines.push(`Toplam kayıt: ${movies.length}`);
logLines.push(`Kontrol edilen görsel URL: ${checkedCount}`);
logLines.push(`Kırık/boş görsel sayısı: ${brokenItems.length}`);
logLines.push(`YouTube fallback kullanan poster sayısı: ${youtubeFallbackItems.length}`);
logLines.push(`YouTube thumbnail ile düzeltilen poster sayısı: ${fixedCount}`);
logLines.push('');

logLines.push('KIRIK / BOŞ GÖRSELLER');
logLines.push('---------------------');

for (const item of brokenItems) {
    logLines.push(`${item.title} (${item.imdbId})`);
    logLines.push(`  Yıl: ${item.year || ''}`);
    logLines.push(`  Alan: ${item.field}`);
    logLines.push(`  Sebep: ${item.reason}`);
    logLines.push(`  URL: ${item.url}`);
    logLines.push(`  Trailer YouTube ID: ${item.trailerYoutubeId || 'Yok'}`);
    logLines.push(`  Önerilen YouTube thumbnail: ${item.youtubeThumbnail || 'Yok'}`);
    logLines.push('');
}

logLines.push('');
logLines.push('YOUTUBE FALLBACK POSTER KULLANANLAR');
logLines.push('-----------------------------------');

for (const item of youtubeFallbackItems) {
    logLines.push(`${item.title} (${item.imdbId})`);
    logLines.push(`  Yıl: ${item.year || ''}`);
    logLines.push(`  Alan: ${item.field}`);
    logLines.push(`  URL: ${item.url}`);
    logLines.push(`  Trailer YouTube ID: ${item.trailerYoutubeId || 'Yok'}`);
    logLines.push('');
}

await fs.writeFile(logPath, logLines.join('\n'), 'utf8');

await fs.writeFile(
    jsonLogPath,
    JSON.stringify(
        {
            createdAt: new Date().toISOString(),
            totalMovies: movies.length,
            checkedImageUrls: checkedCount,
            brokenCount: brokenItems.length,
            youtubeFallbackCount: youtubeFallbackItems.length,
            fixedCount,
            brokenItems,
            youtubeFallbackItems,
        },
        null,
        2
    ),
    'utf8'
);

if (fixWithYoutube && fixedCount > 0) {
    await fs.writeFile(outputPath, JSON.stringify(movies, null, 2), 'utf8');
    console.log('movies.json güncellendi:', outputPath);
}

console.log('');
console.log('Bitti');
console.log(`Toplam kayıt: ${movies.length}`);
console.log(`Kontrol edilen görsel URL: ${checkedCount}`);
console.log(`Kırık/boş görsel sayısı: ${brokenItems.length}`);
console.log(`YouTube fallback kullanan poster sayısı: ${youtubeFallbackItems.length}`);
console.log(`YouTube thumbnail ile düzeltilen poster sayısı: ${fixedCount}`);
console.log('Log:', logPath);
console.log('JSON log:', jsonLogPath);