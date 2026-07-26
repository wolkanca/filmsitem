import fs from 'node:fs/promises';
import path from 'node:path';

const args = process.argv.slice(2);

const noBackup = args.includes('--no-backup');
const inputPath =
    args.find((arg) => !arg.startsWith('--')) || './data/movies.json';

const resolvedInputPath = path.resolve(inputPath);

function normalizeQuotes(text) {
    if (typeof text !== 'string' || !text.trim()) {
        return text;
    }

    return text
        // "örnek metin" → “örnek metin”
        .replace(/"([^"\r\n]+)"/g, '“$1”')

        // kelime içindeki veya metindeki düz apostrof → kıvrımlı apostrof
        .replace(/'/g, '’');
}

async function main() {
    try {
        const rawData = await fs.readFile(resolvedInputPath, 'utf8');
        const movies = JSON.parse(rawData);

        if (!Array.isArray(movies)) {
            throw new Error('JSON dosyasının ana yapısı bir dizi olmalıdır.');
        }

        let changedMovies = 0;
        let changedFields = 0;

        const updatedMovies = movies.map((movie) => {
            let movieChanged = false;
            const updatedMovie = { ...movie };

            for (const field of ['plot', 'plotTr']) {
                if (typeof movie[field] !== 'string') {
                    continue;
                }

                const normalizedValue = normalizeQuotes(movie[field]);

                if (normalizedValue !== movie[field]) {
                    updatedMovie[field] = normalizedValue;
                    changedFields++;
                    movieChanged = true;
                }
            }

            if (movieChanged) {
                changedMovies++;
            }

            return updatedMovie;
        });

        if (changedFields === 0) {
            console.log('Değiştirilecek düz tırnak veya apostrof bulunamadı.');
            return;
        }

        if (!noBackup) {
            const backupPath = `${resolvedInputPath}.backup`;
            await fs.copyFile(resolvedInputPath, backupPath);
            console.log(`Yedek oluşturuldu: ${backupPath}`);
        }

        await fs.writeFile(
            resolvedInputPath,
            `${JSON.stringify(updatedMovies, null, 2)}\n`,
            'utf8'
        );

        console.log(`Güncellenen film sayısı: ${changedMovies}`);
        console.log(`Güncellenen alan sayısı: ${changedFields}`);
        console.log(`Dosya güncellendi: ${resolvedInputPath}`);
    } catch (error) {
        console.error('Hata:', error.message);
        process.exitCode = 1;
    }
}

main();