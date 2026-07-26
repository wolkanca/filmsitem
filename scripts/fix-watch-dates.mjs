// scripts/fix-watch-dates.mjs

import fs from 'fs/promises';

const FILE = './data/movies.json';

const movies = JSON.parse(await fs.readFile(FILE, 'utf8'));

let fixed = 0;

for (const movie of movies) {
    if (!movie.watchDate || !movie.year) continue;

    const match = movie.watchDate.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (!match) continue;

    const watchYear = Number(match[1]);
    const month = match[2];
    const day = match[3];
    const movieYear = Number(movie.year);

    if (watchYear < movieYear) {
        const oldDate = movie.watchDate;
        movie.watchDate = `${movieYear}-${month}-${day}`;

        console.log(
            `${movie.imdbId} | ${movie.title}\n` +
            `  ${oldDate}  ->  ${movie.watchDate}`
        );

        fixed++;
    }
}

await fs.writeFile(FILE, JSON.stringify(movies, null, 2), 'utf8');

console.log(`\n✔ ${fixed} film düzeltildi.`);