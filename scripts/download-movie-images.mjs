import fs from "fs/promises";
import path from "path";

const INPUT_PATH = "./data/movies.json";
const OUTPUT_DIR = "./public/images/movies";
const DELAY_MS = 1300;

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

async function processPoster(movie) {
    const url = movie.poster;

    if (!isRemoteUrl(url)) return null;

    const ext = getExtFromUrl(url);
    const id = movie.imdbId || safeName(movie.title);
    const fileName = `${id}-poster${ext}`;
    const filePath = path.join(OUTPUT_DIR, fileName);
    const publicPath = `/images/movies/${fileName}`;

    try {
        await fs.access(filePath);
        console.log(`Zaten var: ${fileName}`);
        return publicPath;
    } catch {
        console.log(`İndiriliyor: ${movie.title} - poster`);
    }

    await downloadImage(url, filePath);

    console.log(`Kaydedildi: ${fileName}`);

    await wait(DELAY_MS);

    return publicPath;
}

async function main() {
    await fs.mkdir(OUTPUT_DIR, { recursive: true });

    const raw = await fs.readFile(INPUT_PATH, "utf8");
    const movies = JSON.parse(raw);

    const posterUpdates = new Map();

    for (const movie of movies) {
        try {
            const localPosterPath = await processPoster(movie);

            if (localPosterPath) {
                posterUpdates.set(movie.imdbId, localPosterPath);
            }
        } catch (error) {
            console.error(`Hata: ${movie.title} (${movie.imdbId})`);
            console.error(error.message);
        }
    }

    for (const movie of movies) {
        if (posterUpdates.has(movie.imdbId)) {
            movie.poster = posterUpdates.get(movie.imdbId);
        }
    }

    await fs.writeFile(INPUT_PATH, JSON.stringify(movies, null, 2), "utf8");

    console.log(`Bitti. Güncellenen poster sayısı: ${posterUpdates.size}`);
}

main();