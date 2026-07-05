import fs from 'fs/promises';
import path from 'path';

const args = process.argv.slice(2);

const inputPath =
    args.find((arg) => !arg.startsWith('--')) || './data/movies.json';

const adminBaseArg = args
    .find((arg) => arg.startsWith('--admin-base='))
    ?.replace('--admin-base=', '');

const adminBase = adminBaseArg || '/admin/movies';

const outputDir = './scripts';
const txtOutputPath = path.join(outputDir, 'missing-admin-fields.txt');
const jsonOutputPath = path.join(outputDir, 'missing-admin-fields.json');

const FIELDS_TO_CHECK = ['poster', 'genres', 'plot', 'country'];

function isEmptyValue(value) {
    if (value === undefined || value === null) return true;

    if (typeof value === 'string') {
        const trimmed = value.trim();
        return trimmed === '' || trimmed.toUpperCase() === 'N/A';
    }

    if (Array.isArray(value)) {
        return value.length === 0 || value.every((item) => isEmptyValue(item));
    }

    return false;
}

function getMissingFields(movie) {
    return FIELDS_TO_CHECK.filter((field) => isEmptyValue(movie[field]));
}

async function main() {
    const raw = await fs.readFile(inputPath, 'utf8');
    const movies = JSON.parse(raw);

    if (!Array.isArray(movies)) {
        throw new Error('Database dosyası JSON array formatında olmalı.');
    }

    const missingMovies = movies
        .map((movie) => {
            const missingFields = getMissingFields(movie);

            return {
                imdbId: movie.imdbId || '',
                title: movie.title || '',
                year: movie.year || '',
                type: movie.type || '',
                missingFields,
                adminUrl: `${adminBase}/${movie.imdbId || ''}`,
            };
        })
        .filter((movie) => movie.missingFields.length > 0);

    await fs.mkdir(outputDir, { recursive: true });

    const txtLines = [
        `Toplam film: ${movies.length}`,
        `Eksik alanı olan film: ${missingMovies.length}`,
        `Kontrol edilen alanlar: ${FIELDS_TO_CHECK.join(', ')}`,
        '',
        ...missingMovies.map((movie, index) => {
            return [
                `${index + 1}. ${movie.title} (${movie.year})`,
                `   IMDb ID: ${movie.imdbId}`,
                `   Tür: ${movie.type}`,
                `   Eksik alanlar: ${movie.missingFields.join(', ')}`,
                `   Admin: ${movie.adminUrl}`,
            ].join('\n');
        }),
    ];

    await fs.writeFile(txtOutputPath, txtLines.join('\n\n'), 'utf8');
    await fs.writeFile(
        jsonOutputPath,
        JSON.stringify(missingMovies, null, 2),
        'utf8'
    );

    console.log(`Toplam film: ${movies.length}`);
    console.log(`Eksik alanı olan film: ${missingMovies.length}`);
    console.log(`TXT çıktı: ${txtOutputPath}`);
    console.log(`JSON çıktı: ${jsonOutputPath}`);
}

main().catch((error) => {
    console.error('Hata:', error.message);
    process.exit(1);
});