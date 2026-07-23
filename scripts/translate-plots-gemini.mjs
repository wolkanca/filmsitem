import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import fs from "fs/promises";
import { GoogleGenAI } from "@google/genai";

/**
 * Önerilen kullanım:
 *
 * PowerShell:
 * $env:GEMINI_API_KEYS="KEY_1,KEY_2,KEY_3"
 * node scripts/translate-plots-gemini.mjs
 *
 * İstersen aşağıdaki HARDCODED_GEMINI_API_KEYS içine de key yazabilirsin,
 * ama güvenlik için env kullanmak daha doğru.
 */
const HARDCODED_GEMINI_API_KEYS = [];

const ENV_GEMINI_API_KEYS = (process.env.GEMINI_API_KEYS || "")
    .split(",")
    .map((key) => key.trim())
    .filter(Boolean);

const GEMINI_API_KEYS = [
    ...ENV_GEMINI_API_KEYS,
    ...HARDCODED_GEMINI_API_KEYS,
].filter(Boolean);

const INPUT_PATH = "./data/movies.json";

// Limit yememek için daha güvenli ayarlar
const BATCH_SIZE = 5;
const DELAY_MS = 10000;

// Key rate limit'e takılırsa bu kadar dinlenir
const KEY_COOLDOWN_MS = 60_000;

// Tek batch için aynı key ile tekrar deneme sayısı
const MAX_RETRIES_PER_KEY = 2;

// Modeli istersen terminalden değiştirebilirsin:
// $env:GEMINI_MODEL="gemini-3.5-flash-lite"
const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-3.5-flash-lite";

if (!GEMINI_API_KEYS.length) {
    console.error("GEMINI_API_KEYS eksik.");
    console.error('PowerShell örnek: $env:GEMINI_API_KEYS="KEY_1,KEY_2,KEY_3"');
    process.exit(1);
}

const keyStates = GEMINI_API_KEYS.map((apiKey, index) => ({
    apiKey,
    index,
    cooldownUntil: 0,
    consecutiveErrors: 0,
}));

let currentKeyIndex = 0;

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

function getErrorMessage(error) {
    return error?.message || String(error);
}

function isRateLimitError(error) {
    const message = getErrorMessage(error).toLowerCase();

    return (
        message.includes("429") ||
        message.includes("resource_exhausted") ||
        message.includes("quota") ||
        message.includes("rate limit") ||
        message.includes("too many requests")
    );
}

function getAiClient(keyState) {
    return new GoogleGenAI({
        apiKey: keyState.apiKey,
    });
}

function getAvailableKeyIndex() {
    const now = Date.now();

    for (let offset = 0; offset < keyStates.length; offset++) {
        const index = (currentKeyIndex + offset) % keyStates.length;
        const keyState = keyStates[index];

        if (keyState.cooldownUntil <= now) {
            return index;
        }
    }

    return -1;
}

async function waitUntilAnyKeyAvailable() {
    const now = Date.now();
    const soonestCooldownUntil = Math.min(...keyStates.map((key) => key.cooldownUntil));
    const waitMs = Math.max(1000, soonestCooldownUntil - now);

    console.log(`Tüm Gemini API keyleri geçici limitte. ${Math.ceil(waitMs / 1000)} sn bekleniyor...`);
    await wait(waitMs);
}

function putKeyOnCooldown(keyState, cooldownMs = KEY_COOLDOWN_MS) {
    keyState.cooldownUntil = Date.now() + cooldownMs;
    keyState.consecutiveErrors += 1;

    console.log(
        `Gemini key ${keyState.index + 1}/${keyStates.length} ${Math.ceil(cooldownMs / 1000)} sn dinlendiriliyor.`
    );
}

function markKeySuccess(keyState) {
    keyState.consecutiveErrors = 0;
    keyState.cooldownUntil = 0;
}

async function callGeminiWithKey(keyState, prompt) {
    const ai = getAiClient(keyState);

    const response = await ai.models.generateContent({
        model: GEMINI_MODEL,
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            temperature: 0.2,
        },
    });

    const text = cleanJsonText(response.text || "");
    return JSON.parse(text);
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

    while (true) {
        const availableKeyIndex = getAvailableKeyIndex();

        if (availableKeyIndex === -1) {
            await waitUntilAnyKeyAvailable();
            continue;
        }

        currentKeyIndex = availableKeyIndex;
        const keyState = keyStates[currentKeyIndex];

        console.log(`Gemini key kullanılıyor: ${keyState.index + 1}/${keyStates.length} | Model: ${GEMINI_MODEL}`);

        for (let attempt = 1; attempt <= MAX_RETRIES_PER_KEY; attempt++) {
            try {
                const translatedItems = await callGeminiWithKey(keyState, prompt);

                markKeySuccess(keyState);

                currentKeyIndex = (currentKeyIndex + 1) % keyStates.length;

                return translatedItems;
            } catch (error) {
                const message = getErrorMessage(error);

                console.error(
                    `Gemini key ${keyState.index + 1}/${keyStates.length} hata verdi. Deneme: ${attempt}/${MAX_RETRIES_PER_KEY}`
                );
                console.error(message);

                if (isRateLimitError(error)) {
                    putKeyOnCooldown(keyState, KEY_COOLDOWN_MS);
                    currentKeyIndex = (currentKeyIndex + 1) % keyStates.length;
                    break;
                }

                if (attempt < MAX_RETRIES_PER_KEY) {
                    await wait(3000);
                    continue;
                }

                putKeyOnCooldown(keyState, 30_000);
                currentKeyIndex = (currentKeyIndex + 1) % keyStates.length;
            }
        }
    }
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
    console.log(`Batch size: ${BATCH_SIZE}`);
    console.log(`Batch delay: ${DELAY_MS / 1000} sn`);
    console.log(`Gemini model: ${GEMINI_MODEL}`);
    console.log(`API key sayısı: ${GEMINI_API_KEYS.length}`);

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
            console.error(getErrorMessage(error));
            await wait(10000);
        }
    }

    console.log("Bitti.");
}

main();