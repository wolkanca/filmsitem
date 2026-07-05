import fs from "fs/promises";
import { GoogleGenAI } from "@google/genai";

//const GEMINI_API_KEY = "AIzaSyA5l8T30OSXofhdUumnpkUOZIKTbuOp7QM";
//const GEMINI_API_KEY = "AIzaSyBK9NRprrNK3KfSH1urtg82qSKiEmAZCTc";
const GEMINI_API_KEY = "AIzaSyBTtm65n_qwuVXllkfwxnfInCCVpBhdDYg";
const INPUT_PATH = "./data/movies.json";
const BATCH_SIZE = 20;
const DELAY_MS = 5000;

if (!GEMINI_API_KEY) {
    console.error("GEMINI_API_KEY eksik.");
    process.exit(1);
}

const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function isProbablyTurkish(text = "") {
    return /[çğıöşüÇĞİÖŞÜ]/.test(text);
}

function cleanJsonText(text) {
    return text
        .replace(/```json/g, "")
        .replace(/```/g, "")
        .trim();
}

async function translateBatch(batch) {
    const prompt = `
Aşağıdaki film plotlarını doğal Türkçeye çevir.

Kurallar:
- Sadece geçerli JSON döndür.
- Açıklama, markdown, kod bloğu yazma.
- Her item şu formatta olsun: {"imdbId":"...", "plot":"..."}
- Film adlarını, kişi adlarını, şehir/ülke adlarını bozma.
- Anlamı koru, birebir mekanik çeviri yapma.
- Boş plot varsa boş bırak.
- "United States" gibi hatalı yer değiştirmeleri düzelt; örn. "thoUnited Statesnd" => "thousand" anlamına göre çevir.

Veriler:
${JSON.stringify(
        batch.map((movie) => ({
            imdbId: movie.imdbId,
            title: movie.title,
            year: movie.year,
            plot: movie.plot || "",
        })),
        null,
        2
    )}
`;

    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            temperature: 0.2,
        },
    });

    const text = cleanJsonText(response.text || "");
    return JSON.parse(text);
}

async function main() {
    const raw = await fs.readFile(INPUT_PATH, "utf8");
    const movies = JSON.parse(raw);

    const targets = movies.filter((movie) => {
        if (!movie.plot || !movie.plot.trim()) return false;
        if (movie.plotTr && movie.plotTr.trim()) return false;
        if (isProbablyTurkish(movie.plot)) return false;
        return true;
    });

    console.log(`Çevrilecek plot sayısı: ${targets.length}`);

    for (let i = 0; i < targets.length; i += BATCH_SIZE) {
        const batch = targets.slice(i, i + BATCH_SIZE);

        console.log(
            `Çevriliyor: ${i + 1}-${Math.min(i + BATCH_SIZE, targets.length)} / ${targets.length}`
        );

        try {
            const translatedItems = await translateBatch(batch);

            for (const item of translatedItems) {
                const movie = movies.find((m) => m.imdbId === item.imdbId);

                if (!movie) continue;
                if (!item.plot || !item.plot.trim()) continue;

                movie.plotTr = item.plot.trim();
            }

            await fs.writeFile(INPUT_PATH, JSON.stringify(movies, null, 2), "utf8");

            console.log("Kaydedildi.");
            await wait(DELAY_MS);
        } catch (error) {
            console.error("Batch hata verdi:");
            console.error(batch.map((m) => `${m.imdbId} - ${m.title}`).join("\n"));
            console.error(error.message);
            await wait(5000);
        }
    }

    console.log("Bitti.");
}

main();