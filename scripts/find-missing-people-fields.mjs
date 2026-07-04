import fs from 'fs/promises';
import path from 'path';

const args = process.argv.slice(2);

const inputPathArg = args.find((arg) => !arg.startsWith('--')) || './data/movies.json';
const outputPathArg = args.find((arg) => arg.startsWith('--out='))?.replace('--out=', '') || './data/missing-people-fields-ids.txt';

const inputPath = path.resolve(process.cwd(), inputPathArg);
const outputPath = path.resolve(process.cwd(), outputPathArg);

function isEmptyValue(value) {
    if (value === undefined || value === null) return true;

    if (Array.isArray(value)) {
        return value.length === 0;
    }

    if (typeof value === 'string') {
        return value.trim() === '' || value.trim().toUpperCase() === 'N/A';
    }

    return false;
}

function getMissingFields(movie) {
    const fields = ['cast', 'director', 'writers'];

    return fields.filter((field) => isEmptyValue(movie[field]));
}

const raw = await fs.readFile(inputPath, 'utf8');
const movies = JSON.parse(raw);

const result = [];

for (const movie of movies) {
    const missingFields = getMissingFields(movie);

    if (missingFields.length > 0) {
        result.push(`${movie.id || movie.imdbId || 'ID_YOK'} | ${movie.title || 'Başlıksız'} | eksik: ${missingFields.join(', ')}`);
    }
}

await fs.writeFile(outputPath, result.join('\n'), 'utf8');

console.log('Bitti');
console.log('Okunan dosya:', inputPath);
console.log('Çıktı dosyası:', outputPath);
console.log('Eksik alanlı film sayısı:', result.length);