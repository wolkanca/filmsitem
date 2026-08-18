# 🎬 İzlediklerim - Kişisel Sinema Günlüğü (Proje Detayları)

## Proje Tanımı

**İzlediklerim**, IMDb export dosyalarından (CSV/XML) beslenen kişisel film arşivinizi, izleme geçmişinizi, puanlamalarınızı ve detaylı sinema istatistiklerinizi estetik, hızlı ve SEO dostu bir arayüzle sunan modern bir web uygulamasıdır.

Bu proje bir IMDb veya Letterboxd alternatifi değildir. Temel amaç, kullanıcının yıllar boyunca izlediği filmleri, sinema zevkini ve izleme istatistiklerini yansıtan premium bir **dijital sinema günlüğü** oluşturmaktır. Ziyaretçiler bu platformu yeni filmler keşfetmekten ziyade, kullanıcının kişisel sinema yolculuğunu ve tercihlerini incelemek için ziyaret eder.

---

## 🛠️ Teknoloji Yığını

* **Framework:** Next.js 15 (App Router & React 19)
* **Programlama Dili:** TypeScript (Strict Mode)
* **Stil Yönetimi:** Tailwind CSS & Vanilla CSS (Cam efekti / Glassmorphism)
* **İkon Kütüphanesi:** Lucide React
* **Veri Depolama:** `data/movies.json` (Local)
* **Yapay Zeka & Veri Zenginleştirme:** Gemini API (`@google/genai`), OMDb API, TMDB API
* **Dağıtım (Deployment):** Vercel & Netlify uyumlu statik/dinamik hibrit mimari

---

## 🎯 Temel Özellikler

Sistem, kişisel film arşiviniz üzerinden şu özellikleri dinamik olarak sunar:

* **Kapsamlı Film & Dizi Listeleme:** Arama, gelişmiş filtreleme (tür, yıl, puan, yönetmen) ve sıralama seçenekleri.
* **Gelişmiş İstatistikler ve Grafikler:** Yıllık izleme sayıları, puan dağılımları, favori tür/yönetmen/oyuncular ve interaktif grafikler.
* **Özel Arama Motoru (CMD+K / Ctrl+K):** Hızlı ve anlık sonuç veren küresel arama bileşeni.
* **Sezon ve Bölüm Desteği:** TV dizilerinin sezon ve bölümlerini ayrıştırıp kişisel puan ve izleme tarihleriyle listeleme.
* **Admin Yönetim Paneli (`/admin`):** Tarayıcı üzerinden IMDb verisi yükleme, eksik posterleri/fragmanları bulma, Gemini ile özet çevirisi yapma ve metadata yönetimi.
* **Zenginleştirilmiş Medya:** YouTube fragman entegrasyonu, yüksek çözünürlüklü poster ve arka plan (backdrop) görselleri.
* **Tam SEO Uyumluluğu:** Dinamik Open Graph görselleri, meta etiketleri, robots.txt, sitemap.xml ve JSON-LD şema yapıları.

---

## 🗄️ Veri Modeli

Projede kullanılan temel TypeScript veri modelleri [types/index.ts](file:///c:/filmsitem/types/index.ts) dosyasında tanımlanmıştır:

```typescript
export interface Episode {
  imdbId: string;
  title: string;
  episodeNumber: number;
  seasonNumber: number;
  myRating: number;
  watchDate: string;
  runtime: number;
  imdbRating: number;
  overview?: string;
}

export interface Season {
  seasonNumber: number;
  episodes: Episode[];
}

export interface Movie {
  imdbId: string;
  title: string;
  originalTitle: string;
  year: number;
  type: string; // Movie, TV Series, TV Episode, TV Special, TV Mini Series

  myRating: number;
  watchDate: string;
  listName: string[];

  poster: string;
  backdrop?: string;

  overview: string; // Orijinal özet
  plot: string;      // Detaylı özet
  plotTr?: string;   // Türkçe özet (Gemini ile çevrilmiş)
  country: string;
  omdbType: string;
  boxOffice: string;

  genres: string[];
  runtime: number;

  cast: string[];
  director: string;
  writers: string[];

  imdbRating: number;
  tmdbRating: number;
  releaseDate?: string;
  trailerYoutubeId?: string;
  seasons?: Season[];

  // Film serisi bilgileri (Franchise)
  franchiseId?: string;
  franchiseName?: string;
  franchiseOrder?: number;
}
```

---

## 🗂️ Sayfa ve URL Mimarisi

### Kullanıcı Sayfaları

1. **Ana Sayfa (`/`):**
   * Toplam film sayısı, izleme süresi ve ortalama puanı gösteren özet sayaç.
   * Son eklenen filmler, en yüksek puan verilenler ve rastgele film önerisi kartları.
2. **Filmler Sayfası (`/movies`):**
   * Grid (Afiş) veya Liste formatında gösterim.
   * Tür, Yıl, Yönetmen, Oyuncu ve Puan filtreleri.
3. **Film Detay Sayfası (`/movie/[imdbId]`):**
   * Geniş arka plan görseli (backdrop), afiş, film künyesi (süre, türler, yönetmen, oyuncular).
   * Kişisel puan ve izleme tarihi.
   * Varsa Türkçe film özeti (Gemini çevirisi) ve YouTube fragmanı.
   * Benzer film önerileri.
4. **Listeler Sayfası (`/lists` & `/list/[slug]`):**
   * Kullanıcının IMDb'de oluşturduğu özel listelerin (Favoriler, İzlenecekler vb.) gösterimi.
5. **İstatistikler Sayfası (`/stats`):**
   * [StatsCharts.tsx](file:///c:/filmsitem/components/StatsCharts.tsx) bileşeniyle desteklenen interaktif grafikler (Bar, Histogram, Pasta Grafiği).
6. **Yönetmen / Oyuncu / Tür / Yazar / Yıl Sayfaları:**
   * `/director/[name]`, `/actor/[name]`, `/genre/[name]`, `/writer/[name]`, `/year/[year]` url yapıları ile tıklanan kişiye veya türe ait tüm filmlerin listelenmesi.
7. **Rastgele Film Önerici (`/random`):**
   * Kütüphaneden rastgele bir film seçer ve detay sayfasına yönlendirir.

### Yönetici Sayfaları

* **Yönetici Paneli (`/admin`):** Sadece belirlenen yönetici e-postası (`ADMIN_EMAIL`) ile erişilebilen veri güncelleme ekranı.
* **İçe Aktarma Paneli (`/admin/import`):** IMDb CSV dosyasını sürükle-bırak yöntemiyle sisteme yükler.
* **Fragman Yönetimi (`/admin/check-trailers`):** Eksik YouTube fragmanlarını bulup ekleme.
* **Film Yönetimi (`/admin/movies`):** Tüm filmlerin detaylarını düzenleme.

---

## 🎨 Tasarım Standartları

* **Sinematik ve Premium Arayüz:** Koyu tema öncelikli, görsel odaklı premium tasarım.
* **Glassmorphic Arayüz:** Modern "cam" efekti (`backdrop-blur`) ve yumuşak kenarlık geçişleri.
* **Mikro Animasyonlar:** Kartların üzerine gelindiğinde (hover) uygulanan yumuşak büyüme efektleri ve parlama animasyonları.
* **Responsive Tasarım:** Telefon, tablet ve masaüstü bilgisayarlarda kusursuz çalışan esnek ızgara (grid) yerleşimi.

---

## 🚀 Performans ve SEO

* **Statik Üretim (SSG):** Hızlı sayfa yükleme süreleri için statik sayfa üretimi ve ISR (Incremental Static Regeneration) desteği.
* **Görsel Optimizasyonu:** Next.js `<Image>` bileşeni ve lazy loading ile minimum bant genişliği kullanımı.
* **SEO Dostu Yapı:** Her film için dinamik `sitemap.xml`, `robots.txt`, `rss.xml` beslemesi ve JSON-LD Movie Schema şemaları.
