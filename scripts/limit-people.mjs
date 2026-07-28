import fs from 'node:fs/promises';
import path from 'node:path';

const args = process.argv.slice(2);

const inputPath = path.resolve(args[0] || './data/movies.json');
const MAX_PEOPLE = 4;

async function main() {
    let rawData;

    try {
        rawData = await fs.readFile(inputPath, 'utf8');
    } catch (error) {
        console.error(`Dosya okunamadı: ${inputPath}`);
        console.error(error.message);
        process.exit(1);
    }

    let movies;

    try {
        movies = JSON.parse(rawData);
    } catch (error) {
        console.error('JSON dosyası geçerli değil.');
        console.error(error.message);
        process.exit(1);
    }

    if (!Array.isArray(movies)) {
        console.error('JSON dosyasının ana yapısı bir dizi olmalıdır.');
        process.exit(1);
    }

    let changedMovies = 0;
    let removedCastCount = 0;
    let removedWritersCount = 0;

    const updatedMovies = movies.map((movie) => {
        let changed = false;
        const updatedMovie = { ...movie };

        if (Array.isArray(movie.cast) && movie.cast.length > MAX_PEOPLE) {
            removedCastCount += movie.cast.length - MAX_PEOPLE;
            updatedMovie.cast = movie.cast.slice(0, MAX_PEOPLE);
            changed = true;
        }

        if (Array.isArray(movie.writers) && movie.writers.length > MAX_PEOPLE) {
            removedWritersCount += movie.writers.length - MAX_PEOPLE;
            updatedMovie.writers = movie.writers.slice(0, MAX_PEOPLE);
            changed = true;
        }

        if (changed) {
            changedMovies++;
            console.log(
                `Düzenlendi: ${movie.title || movie.imdbId || 'Bilinmeyen yapım'}`
            );
        }

        return updatedMovie;
    });

    const backupPath = `${inputPath}.backup`;

    try {
        await fs.copyFile(inputPath, backupPath);
        await fs.writeFile(
            inputPath,
            `${JSON.stringify(updatedMovies, null, 2)}\n`,
            'utf8'
        );
    } catch (error) {
        console.error('Dosya yazılırken hata oluştu.');
        console.error(error.message);
        process.exit(1);
    }

    console.log('\nİşlem tamamlandı.');
    console.log(`Düzenlenen yapım: ${changedMovies}`);
    console.log(`Kaldırılan oyuncu: ${removedCastCount}`);
    console.log(`Kaldırılan senarist: ${removedWritersCount}`);
    console.log(`Yedek dosya: ${backupPath}`);
    console.log(`Güncellenen dosya: ${inputPath}`);
}

main();