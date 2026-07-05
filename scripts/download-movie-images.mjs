import fs from "fs/promises";
import path from "path";

const INPUT_PATH = "./data/movies.json";
const OUTPUT_DIR = "./public/images/movies";
const DELAY_MS = 300;

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function isRemoteUrl(value) {
    return typeof value === "string" && /^https?:\/\//i.test(value);
}

function getExtFromUrl(url) {
    const cleanUrl = url.split("?")[0].toLowerCase();

    if (cleanUrl.includes(".png")) return ".png";
    if (cleanUrl.includes(".webp")) return ".webp";
    if (cleanUrl.includes(".jpeg")) return ".jpg";
    if (cleanUrl.includes(".jpg")) return ".jpg";

    return ".jpg";
}

function safeName(text) {
    return String(text || "")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "")
        .slice(0, 80);
}

async function downloadImage(url, filePath) {
    const res = await fetch(url, {
        headers: {
            "User-Agent": "Mozilla/5.0",
        },
    });

    if (!res.ok) {
        throw new Error(`HTTP ${res.status} - ${url}`);
    }

    const arrayBuffer = await res.arrayBuffer();
    await fs.writeFile(filePath, Buffer.from(arrayBuffer));
}

async function processImage(movie, field) {
    const url = movie[field];

    if (!isRemoteUrl(url)) return false;

    const ext = getExtFromUrl(url);
    const id = movie.imdbId || safeName(movie.title);
    const fileName = `${id}-${field}${ext}`;
    const filePath = path.join(OUTPUT_DIR, fileName);
    const publicPath = `/images/movies/${fileName}`;

    try {
        await fs.access(filePath);
        movie[field] = publicPath;
        console.log(`Zaten var: ${fileName}`);
        return true;
    } catch {
        console.log(`İndiriliyor: ${movie.title} - ${field}`);
    }

    await downloadImage(url, filePath);

    movie[field] = publicPath;
    console.log(`Kaydedildi: ${fileName}`);

    await wait(DELAY_MS);
    return true;
}

async function main() {
    await fs.mkdir(OUTPUT_DIR, { recursive: true });

    const raw = await fs.readFile(INPUT_PATH, "utf8");
    const movies = JSON.parse(raw);

    let changedCount = 0;

    for (const movie of movies) {
        try {
            const posterChanged = await processImage(movie, "poster");
            const backdropChanged = await processImage(movie, "backdrop");

            if (posterChanged || backdropChanged) {
                changedCount++;
                await fs.writeFile(INPUT_PATH, JSON.stringify(movies, null, 2), "utf8");
            }
        } catch (error) {
            console.error(`Hata: ${movie.title} (${movie.imdbId})`);
            console.error(error.message);
        }
    }

    await fs.writeFile(INPUT_PATH, JSON.stringify(movies, null, 2), "utf8");

    console.log(`Bitti. Güncellenen film sayısı: ${changedCount}`);
}

main();