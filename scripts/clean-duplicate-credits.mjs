import fs from 'fs/promises';
import path from 'path';

const inputArg = process.argv[2];

if (!inputArg) {
    console.error('Dosya yolu vermedin.');
    console.error('Örnek: node .\\scripts\\clean-duplicate-credits.mjs .\\data\\movies.json');
    process.exit(1);
}

const inputPath = path.resolve(process.cwd(), inputArg);

console.log('Çalışılan klasör:', process.cwd());
console.log('Okunan/Yazılan dosya:', inputPath);

const raw = await fs.readFile(inputPath, 'utf8');
const movies = JSON.parse(raw);

function normalizeName(name) {
    return String(name)
        .trim()
        .replace(/\s+/g, ' ')
        .toLocaleLowerCase('tr-TR');
}

function cleanName(name) {
    return String(name).trim().replace(/\s+/g, ' ');
}

function uniqueNames(names) {
    const seen = new Set();
    const result = [];

    for (const name of names) {
        const cleaned = cleanName(name);
        if (!cleaned) continue;

        const key = normalizeName(cleaned);

        if (!seen.has(key)) {
            seen.add(key);
            result.push(cleaned);
        }
    }

    return result;
}

function cleanDirector(value) {
    if (!value || typeof value !== 'string') return '';

    const names = value
        .split(',')
        .map(cleanName)
        .filter(Boolean);

    const unique = uniqueNames(names);

    // Sadece ilk yönetmen kalsın
    return unique[0] || '';
}

function cleanWriters(value) {
    if (!Array.isArray(value)) return [];

    // Senaristler kendi içinde tekilleştirilsin
    return uniqueNames(value);
}

function cleanItem(item, label) {
    let changed = false;

    if (typeof item.director === 'string') {
        const oldDirector = item.director;
        const newDirector = cleanDirector(oldDirector);

        if (oldDirector !== newDirector) {
            item.director = newDirector;
            changed = true;

            console.log('');
            console.log(`Yönetmen temizlendi: ${label}`);
            console.log(`Eski: ${oldDirector}`);
            console.log(`Yeni: ${newDirector}`);
        }
    }

    if (Array.isArray(item.writers)) {
        const oldWriters = item.writers;
        const newWriters = cleanWriters(oldWriters);

        if (JSON.stringify(oldWriters) !== JSON.stringify(newWriters)) {
            item.writers = newWriters;
            changed = true;

            console.log('');
            console.log(`Senaristler temizlendi: ${label}`);
            console.log(`Eski: ${oldWriters.join(', ')}`);
            console.log(`Yeni: ${newWriters.join(', ')}`);
        }
    }

    return changed;
}

let changedCount = 0;

for (const movie of movies) {
    if (cleanItem(movie, movie.title || movie.imdbId || 'Film')) {
        changedCount++;
    }

    if (Array.isArray(movie.seasons)) {
        for (const season of movie.seasons) {
            if (!Array.isArray(season.episodes)) continue;

            for (const episode of season.episodes) {
                const label = `${movie.title || movie.imdbId} / ${episode.title || episode.imdbId}`;

                if (cleanItem(episode, label)) {
                    changedCount++;
                }
            }
        }
    }
}

if (changedCount === 0) {
    console.log('');
    console.log('Temizlenecek kayıt bulunamadı. Dosya aynı kaldı.');
    process.exit(0);
}

const output = JSON.stringify(movies, null, 2);
await fs.writeFile(inputPath, output, 'utf8');

console.log('');
console.log('Dosya başarıyla yazıldı:', inputPath);
console.log('Değişen kayıt sayısı:', changedCount);