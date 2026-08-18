# 🎬 İzlediklerim - Kişisel Sinema Günlüğü

Bu proje, IMDb export dosyasından (CSV/XML) alınan film izleme geçmişinizi, puanlarınızı ve oluşturduğunuz listeleri; afişler, fragmanlar, Türkçe özetler ve gelişmiş istatistiksel grafiklerle zenginleştirip yayınlayan modern, hızlı ve SEO dostu bir **Next.js 15 (App Router)** uygulamasıdır.

Kişisel bir sinema günlüğü konseptiyle tasarlanmıştır.

---

## ✨ Özellikler

* **Dinamik Veri Akışı:** Local JSON (`data/movies.json`) veritabanı.
* **Gelişmiş Arama (Ctrl+K / Cmd+K):** Hızlı, anlık sonuç veren küresel arama.
* **İnteraktif Grafik ve İstatistikler:** Puan dağılımları, yıllık izleme adetleri, tür analizleri, en çok izlenen yönetmen ve oyuncu grafikleri (interaktif bileşenlerle).
* **Dizi / Bölüm Desteği:** TV şovlarının sezon ve bölümlerini ayıklayıp, kişisel puanlama ve izleme tarihi bilgileriyle birlikte listeleme.
* **Yapay Zeka (Gemini API):** Orijinal İngilizce film özetlerini Gemini ile otomatik olarak Türkçe'ye çevirme.
* **Veri Zenginleştirme (OMDb & TMDB):** IMDb ID'leri ile otomatik afiş, arka plan resmi (backdrop), detaylı künye ve fragman çekme.
* **Admin Paneli (`/admin`):**
  * IMDb CSV dosyalarını tarayıcıdan yükleme.
  * YouTube fragmanlarını bulup güncelleme.
  * Türkçe çeviri, afiş ve metadata kontrolleri yapma.
* **SEO Dostu & Performans:** Hızlı statik sayfa üretimi (SSG/ISR), dinamik Open Graph kartları, JSON-LD Movie Schema, otomatik `sitemap.xml`, `robots.txt` ve `rss.xml`.

---

## 🚀 Hızlı Başlangıç

### 1. Projeyi Klonlayın ve Bağımlılıkları Yükleyin

```bash
git clone <depo-adresi>
cd filmsitem
npm install
```

### 2. Çevre Değişkenlerini Ayarlayın

Kök dizinde `.env.local` adında bir dosya oluşturun ve aşağıdaki değişkenleri tanımlayın:

```env
# Gemini API Key (Çeviriler için birden fazla anahtar virgülle ayrılabilir)
GEMINI_API_KEYS=kendi_gemini_api_keyleriniz

# Gemini Çeviri Modeli
GEMINI_MODEL=gemini-3.5-flash-lite

# OMDb API Anahtarı (Film detayları için birden fazla anahtar virgülle ayrılabilir)
OMDB_API_KEY=kendi_omdb_api_keyleriniz

# Yönetici Paneli Giriş E-postası
ADMIN_EMAIL=yonetici_epostasi@gmail.com
```

### 3. Uygulamayı Başlatın

```bash
# Yerel geliştirme sunucusu
npm run dev

# Üretim sürümünü derleme
npm run build

# Derlenen üretim sürümünü çalıştırma
npm run start
```

---

## 🛠️ CLI Komutları ve Scriptler

Veritabanını işlemek ve zenginleştirmek için `scripts/` klasöründe yer alan yardımcı Node.js/MJS scriptlerini kullanabilirsiniz:

### Temel NPM Komutları

* **`npm run import <imdb-csv-dosyası>`:** IMDb'den indirdiğiniz CSV formatındaki film/dizi listenizi içe aktararak `data/movies.json` dosyasını oluşturur.
* **`npm run enrich-posters`:** `movies.json` dosyasındaki filmleri tarayarak OMDb API üzerinden eksik poster, yönetmen, yazar, oyuncu ve puan bilgilerini indirir.

### Diğer Yardımcı Scriptler

Yardımcı araçları çalıştırmak için `node scripts/<script_adi>.mjs` komutunu kullanabilirsiniz:

* **`translate-plots-gemini.mjs`:** Gemini API'yi kullanarak film özetlerini otomatik olarak Türkçe'ye çevirir ve `plotTr` alanına yazar.
* **`download-movie-images.mjs`:** Projeyi tamamen statik ve harici kaynaklardan bağımsız kılmak için film afişlerini yerel disk/sunucu klasörüne indirir.
* **`check-broken-images.mjs`:** Kırık veya yüklenmeyen film afiş linklerini tespit eder.
* **`clean-duplicate-credits.mjs`:** Yönetmen veya oyuncu isimlerindeki tekrarlayan ya da hatalı yazılmış verileri temizler.
* **`fill-missing-credits.mjs`:** IMDb ID'lerini kullanarak OMDb/TMDB üzerinden eksik oyuncu, yönetmen ve yazar bilgilerini tamamlar.
* **`fill-missing-plot.mjs`:** Açıklaması boş olan filmlerin özetlerini API'ler üzerinden çeker.
* **`fix-watch-dates.mjs`:** İzleme tarihlerini (Watch Date) standart `YYYY-MM-DD` biçiminde düzenler ve normalleştirir.

---

## 📂 Klasör Yapısı

* **`app/`**: Next.js 15 App Router sayfaları.
  * **`admin/`**: İçe aktarma, fragman ve metadata yönetim araçlarını barındıran yönetim paneli.
  * **`movie/[imdbId]/`**: Detaylı film/dizi sunumu, fragmanlar ve benzer film önerileri.
  * **`stats/`**: Detaylı grafikler ve istatistik sayfası.
  * **`lists/`**: Özel listelerin ve koleksiyonların bulunduğu sayfalar.
  * **`director/`**, **`actor/`**, **`genre/`**, **`writer/`**, **`year/`**: Keşif ve kategorilendirme sayfaları.
  * **`api/`**: Küresel arama, statik verileri çekme ve admin işlemleri için API uç noktaları.
* **`components/`**: Yeniden kullanılabilir React bileşenleri (`Navbar`, `Footer`, `MovieCard`, `ArchiveGrid`, `StatsCharts` vb.).
* **`data/`**: Yerel veritabanı dosyaları (`movies.json`).
* **`lib/`**: Veritabanı okuma/yazma işlemleri ve yardımcı fonksiyonlar.
* **`scripts/`**: Veriyi zenginleştirme, optimize etme ve bakım işleri için yazılmış CLI scriptleri.
* **`types/`**: TypeScript arayüz tanımlamaları.
* **`public/`**: Favicon, logo ve statik medya dosyaları.
