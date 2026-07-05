import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import fs from 'fs/promises';
import path from 'path';

const OMDB_API_KEYS = String(process.env.OMDB_API_KEY || '')
    .split(',')
    .map((key) => key.trim())
    .filter(Boolean);

if (OMDB_API_KEYS.length === 0) {
    console.error('OMDB_API_KEY eksik. .env.local içine virgülle ayrılmış şekilde ekleyin.');
    process.exit(1);
}

const BATCH_SIZE = 50;
const BATCH_DELAY = 5000;
const REQUEST_DELAY = 500;

const args = process.argv.slice(2);

const forceUpdate = args.includes('--force');
const debugId = args.find((arg) => arg.startsWith('--id='))?.replace('--id=', '');

const inputPathArg = args.find((arg) => !arg.startsWith('--')) || './data/movies.json';

const inputPath = path.resolve(process.cwd(), inputPathArg);
const outputPath = inputPath;

console.log('Okunacak dosya:', inputPath);
console.log('Güncellenecek dosya:', outputPath);
console.log('Force update:', forceUpdate ? 'Açık - hedef alanlar yeniden sorgulanır' : 'Kapalı - sadece eksik hedef alanlar sorgulanır');
console.log('Debug ID:', debugId || 'Yok');
console.log('İşleme sırası: Dosyanın sonundan başa doğru');
console.log('Hedef alanlar: plot, country, omdbType, boxOffice');

const raw = await fs.readFile(inputPath, 'utf8');
const movies = JSON.parse(raw);

async function writeOutput() {
    await fs.writeFile(outputPath, JSON.stringify(movies, null, 2), 'utf8');
}

function isTargetFieldMissing(movie, field) {
    return (
        !Object.prototype.hasOwnProperty.call(movie, field) ||
        movie[field] === undefined ||
        movie[field] === null ||
        movie[field] === 'N/A'
    );
}

function isOldTargetFieldMissing(movie, field) {
    const value = movie[field];

    return (
        !Object.prototype.hasOwnProperty.call(movie, field) ||
        value === undefined ||
        value === null ||
        String(value).trim() === '' ||
        String(value).trim().toUpperCase() === 'N/A'
    );
}

function cleanOmdbValue(value) {
    if (!value || value === 'N/A') return '';
    return String(value).trim();
}

function getMissingTargetFields(movie) {
    const targetFields = ['plot', 'country', 'omdbType', 'boxOffice'];

    if (forceUpdate) {
        return targetFields;
    }

    return targetFields.filter((field) => isTargetFieldMissing(movie, field));
}

function normalizeText(value) {
    return String(value || '')
        .toLowerCase()
        .replace(/&/g, 'and')
        .replace(/[^a-z0-9]+/g, '')
        .trim();
}

function isValidImdbId(imdbId) {
    return /^tt\d+$/.test(String(imdbId || ''));
}

function isParentImdbId(imdbId) {
    return String(imdbId || '').startsWith('parent_');
}

function findRealImdbIdForParentMovie(parentMovie, allMovies) {
    if (!isParentImdbId(parentMovie.imdbId)) {
        return null;
    }

    const parentSlug = normalizeText(parentMovie.imdbId.replace(/^parent_/, ''));
    const parentTitle = normalizeText(parentMovie.title);

    const match = allMovies.find((candidate) => {
        if (candidate === parentMovie) return false;
        if (!isValidImdbId(candidate.imdbId)) return false;

        const candidateTitle = normalizeText(candidate.title);
        const candidateSlug = normalizeText(candidate.slug || candidate.id || candidate.key || '');

        return (
            candidateTitle === parentTitle ||
            candidateTitle === parentSlug ||
            candidateSlug === parentSlug ||
            candidateSlug === parentTitle
        );
    });

    return match?.imdbId || null;
}

let currentApiKeyIndex = 0;
let requestCount = 0;

async function fetchOmdb(imdbId) {
    let lastError;

    for (let i = 0; i < OMDB_API_KEYS.length; i++) {
        const apiKey = OMDB_API_KEYS[currentApiKeyIndex];

        try {
            console.log(
                `[API ${currentApiKeyIndex + 1}/${OMDB_API_KEYS.length}] ${apiKey.slice(0, 4)}**** -> ${imdbId}`
            );

            const url = `https://www.omdbapi.com/?i=${encodeURIComponent(imdbId)}&plot=full&apikey=${apiKey}`;

            const res = await fetch(url);
            const text = await res.text();

            let data;

            try {
                data = JSON.parse(text);
            } catch {
                throw new Error(`OMDb JSON dönmedi: ${text}`);
            }

            if (!res.ok) {
                throw new Error(`OMDb hata: ${res.status} - ${data?.Error || text}`);
            }

            // API limiti dolmuşsa sonraki key'e geç
            if (
                data.Response === 'False' &&
                (
                    /limit/i.test(data.Error || '') ||
                    /request/i.test(data.Error || '') ||
                    /too many/i.test(data.Error || '')
                )
            ) {
                console.log(`⚠️ API limiti doldu. Sonraki key'e geçiliyor...`);

                currentApiKeyIndex = (currentApiKeyIndex + 1) % OMDB_API_KEYS.length;
                lastError = new Error(data.Error);
                continue;
            }

            if (data.Response === 'False') {
                throw new Error(data.Error || 'OMDb kayıt bulamadı');
            }

            requestCount++;

            if (requestCount % BATCH_SIZE === 0) {
                console.log(
                    `⏳ ${requestCount} istek tamamlandı. ${BATCH_DELAY / 1000} saniye bekleniyor...`
                );

                await new Promise((resolve) => setTimeout(resolve, BATCH_DELAY));
            } else {
                await new Promise((resolve) => setTimeout(resolve, REQUEST_DELAY));
            }

            return data;
        } catch (err) {
            lastError = err;

            console.log(
                `❌ API ${currentApiKeyIndex + 1} başarısız: ${err.message}`
            );

            currentApiKeyIndex = (currentApiKeyIndex + 1) % OMDB_API_KEYS.length;
        }
    }

    throw lastError || new Error('Hiçbir OMDb API anahtarı çalışmadı.');
}

let updatedCount = 0;
let checkedCount = 0;
let failedCount = 0;
let skippedCount = 0;
let apiRequestCount = 0;
let parentFixedCount = 0;

const moviesToProcess = [...movies].reverse();

for (const movie of moviesToProcess) {
    if (debugId && movie.imdbId !== debugId) {
        continue;
    }

    if (!movie.imdbId) {
        skippedCount++;
        console.log(`Atlandı: ${movie.title || 'Başlıksız kayıt'} - imdbId yok`);
        continue;
    }

    if (!isValidImdbId(movie.imdbId)) {
        const realImdbId = findRealImdbIdForParentMovie(movie, movies);

        if (realImdbId) {
            const oldImdbId = movie.imdbId;
            movie.imdbId = realImdbId;
            parentFixedCount++;

            await writeOutput();

            console.log(`Parent IMDb ID düzeltildi: ${movie.title || 'Başlıksız kayıt'} (${oldImdbId}) -> ${realImdbId}`);
        } else {
            skippedCount++;
            console.log(`Atlandı: ${movie.title || 'Başlıksız kayıt'} (${movie.imdbId}) - geçerli IMDb ID değil ve eşleşen gerçek IMDb ID bulunamadı`);
            continue;
        }
    }

    const missingFields = getMissingTargetFields(movie);

    if (missingFields.length === 0) {
        skippedCount++;
        console.log(`API çağrısı yapılmadı, hedef alanlar dolu: ${movie.title} (${movie.imdbId})`);
        continue;
    }

    checkedCount++;

    try {
        console.log(`API çağrısı yapılacak: ${movie.title} (${movie.imdbId}) -> eksik: ${missingFields.join(', ')}`);

        apiRequestCount++;
        const omdb = await fetchOmdb(movie.imdbId);

        const changedFields = [];

        if (missingFields.includes('plot')) {
            movie.plot = cleanOmdbValue(omdb.Plot);
            changedFields.push('plot');
        }

        if (missingFields.includes('country')) {
            movie.country = cleanOmdbValue(omdb.Country);
            changedFields.push('country');
        }

        if (missingFields.includes('omdbType')) {
            movie.omdbType = cleanOmdbValue(omdb.Type);
            changedFields.push('omdbType');
        }

        if (missingFields.includes('boxOffice')) {
            movie.boxOffice = cleanOmdbValue(omdb.BoxOffice);
            changedFields.push('boxOffice');
        }

        if (movie.omdbError) {
            delete movie.omdbError;
            changedFields.push('omdbError temizlendi');
        }

        updatedCount++;
        await writeOutput();

        console.log(`Güncellendi ve dosyaya yazıldı: ${movie.title} (${movie.imdbId}) -> ${changedFields.join(', ')}`);

        console.log({
            plot: movie.plot,
            country: movie.country,
            omdbType: movie.omdbType,
            boxOffice: movie.boxOffice,
        });

        await new Promise((resolve) => setTimeout(resolve, 250));
    } catch (error) {
        failedCount++;

        movie.omdbError = error.message;
        await writeOutput();

        console.log(`Atlandı ve hata kaydedildi: ${movie.title} (${movie.imdbId}) - ${error.message}`);
    }
}

await writeOutput();

const writtenRaw = await fs.readFile(outputPath, 'utf8');
const writtenMovies = JSON.parse(writtenRaw);

const testMovie = debugId
    ? writtenMovies.find((movie) => movie.imdbId === debugId)
    : writtenMovies.find((movie) => movie.imdbId === 'tt0337579');

if (testMovie) {
    console.log('Dosya yazma kontrolü:', {
        imdbId: testMovie.imdbId,
        title: testMovie.title,
        plot: testMovie.plot,
        country: testMovie.country,
        omdbType: testMovie.omdbType,
        boxOffice: testMovie.boxOffice,
        omdbError: testMovie.omdbError,
    });
}

const moviesWithOmdbError = writtenMovies.filter((movie) => movie.omdbError);

console.log('Dosya güncellendi:', outputPath);
console.log('Bitti');
console.log(`Toplam kayıt: ${movies.length}`);
console.log(`Kontrol edilen/API için uygun bulunan: ${checkedCount}`);
console.log(`Güncellenen: ${updatedCount}`);
console.log(`Parent IMDb ID düzeltilen: ${parentFixedCount}`);
console.log(`Hedef alanları dolu/geçersiz olduğu için atlanan: ${skippedCount}`);
console.log(`OMDb API çağrısı yapılan: ${apiRequestCount}`);
console.log(`Hatalı/atlanmış: ${failedCount}`);
console.log(`OMDb hatası kayıtlı kayıt sayısı: ${moviesWithOmdbError.length}`);