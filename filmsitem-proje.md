# 🎬 Film Günlüğüm

## Proje Tanımı

**Film Günlüğüm**, IMDb export dosyalarından oluşturulan kişisel film arşivini yayınlamak için geliştirilecek modern, hızlı ve SEO dostu bir web uygulamasıdır.

Bu proje bir IMDb alternatifi değildir.

Amaç; kullanıcının yıllar boyunca izlediği filmleri, verdiği puanları, oluşturduğu listeleri ve kişisel sinema istatistiklerini estetik bir arayüzle sunmaktır.

Tasarım ve içerik mimarisi mümkün olduğunca bir **kişisel sinema günlüğü** hissi vermelidir.

---

# Teknoloji

* Next.js 15 (App Router)
* TypeScript
* Tailwind CSS
* Static Site Generation (SSG)
* Responsive Tasarım
* Dark Mode (varsayılan)
* JSON veya SQLite veri kaynağı
* Vercel uyumlu deployment
* TypeScript Strict Mode
* ESLint
* Prettier

---

# Temel Amaçlar

Sistem aşağıdaki içerikleri yayınlayabilmelidir:

* İzlediğim filmler
* Verdiğim puanlar
* Favorilerim
* IMDb listelerim
* Film istatistiklerim
* İzleme geçmişim

---

# Veri Kaynağı

## 1. IMDb Export

Sistem IMDb'den alınan XML veya CSV dosyalarını desteklemelidir.

Örnek alanlar:

```json
{
  "imdbId": "tt0133093",
  "title": "The Matrix",
  "year": 1999,
  "myRating": 10,
  "watchDate": "2025-03-10",
  "listName": "Favoriler"
}
```

---

## 2. Film Verisi Zenginleştirme

IMDb ID kullanılarak TMDb veya OMDb API üzerinden aşağıdaki bilgiler çekilmelidir:

* poster
* backdrop
* overview
* genres
* runtime
* cast
* director
* writers
* imdbRating
* tmdbRating

---

## Import Sistemi

Komut:

```bash
npm run import imdb-export.xml
```

İşlem sonucunda:

```text
/data/movies.json
```

oluşturulmalıdır.

---

# Veri Modeli

Örnek:

```ts
export interface Movie {
  imdbId: string;
  title: string;
  year: number;

  myRating: number;
  watchDate: string;
  listName: string[];

  poster: string;
  backdrop: string;

  overview: string;

  genres: string[];

  runtime: number;

  cast: string[];

  director: string;

  writers: string[];

  imdbRating: number;
  tmdbRating: number;
}
```

---

# Ana Sayfa

## URL

```text
/
```

---

## Hero Alanı

```text
🎬 Film Günlüğüm

Yıllardır izlediğim filmler,
verdiğim puanlar ve kişisel sinema arşivim.

Toplam Film: XXXX
Ortalama Puan: X.X
Toplam İzleme Süresi: XXXX Saat
```

---

## Bölümler

### Son Eklenen Filmler

Poster grid görünümü.

---

### En Yüksek Puan Verdiklerim

Kullanıcının verdiği puana göre sıralanmış filmler.

---

### Son İzlediklerim

İzleme tarihine göre sıralama.

---

### Rastgele Film Önerisi

Her sayfa yenilendiğinde farklı bir film öner.

---

### Bu Akşam Ne İzlesem?

Rastgele seçim ekranına yönlendirme.

---

# Film Listeleme

## URL

```text
/movies
```

---

## Özellikler

### Arama

* Film adı
* Yönetmen
* Oyuncu

---

### Filtreler

* Tür
* Yıl
* Yönetmen
* Oyuncu
* IMDb Puanı
* Benim Puanım

---

### Sıralama

* Ad
* Yıl
* IMDb Puanı
* Benim Puanım
* İzleme Tarihi

---

### Görünümler

* Poster Grid
* Liste Görünümü

---

# Film Detay Sayfası

## URL

```text
/movie/[imdbId]
```

---

## İçerik

### Hero

* Backdrop
* Poster
* Film Adı
* Yıl

---

### Bilgiler

* Süre
* Türler
* Yönetmen
* Senaristler
* Oyuncular

---

### Açıklama

Film özeti.

---

### Kişisel Bilgiler

```text
Benim Puanım: 9/10

İzleme Tarihi:
2025-03-10
```

---

### Benzer Filmler

TMDb benzer filmler API'si kullanılabilir.

---

# İstatistikler

## URL

```text
/stats
```

---

## Kartlar

* Toplam Film
* Ortalama Puan
* Toplam İzleme Süresi
* En Çok İzlenen Tür
* En Sevdiğim Yönetmen
* En Sık İzlediğim Oyuncu

---

## Grafikler

### Yıllara Göre İzlenen Film Sayısı

Bar Chart

---

### Puan Dağılımı

Histogram

---

### Tür Dağılımı

Pie Chart

---

### En Çok İzlenen Yönetmenler

Bar Chart

---

### En Çok İzlenen Oyuncular

Bar Chart

---

# Listeler

## URL

```text
/lists
```

IMDb listeleri otomatik oluşturulmalıdır.

Örnek:

* Favoriler
* Bilim Kurgu
* Kült Filmler
* Tekrar İzlenecekler

---

## Liste Detayı

```text
/list/[slug]
```

Listeye ait filmler görüntülenmelidir.

---

# Favoriler

## URL

```text
/favorites
```

Kullanıcının en yüksek puan verdiği filmler.

---

# Rastgele Film

## URL

```text
/random
```

Kütüphaneden rastgele bir film seçip göstermelidir.

---

# Tasarım

## İlham Kaynakları

* Letterboxd
* IMDb
* Netflix

---

## Tasarım Hedefleri

* Büyük poster kullanımı
* Sinematik görünüm
* Cam efektleri (glassmorphism)
* Akıcı animasyonlar
* Mobil öncelikli yaklaşım
* Minimal ama premium görünüm

---

# SEO

Her film sayfası için:

* Dynamic Title
* Meta Description
* Open Graph
* Twitter Card
* Canonical URL
* JSON-LD Movie Schema

oluşturulmalıdır.

---

# Performans

Hedefler:

* Lighthouse 95+
* Tam statik üretim
* Lazy Loading
* Görsel optimizasyonu
* Route prefetching
* ISR desteği

---

# Ekstra Özellikler

### Poster Önizleme

Poster tıklanınca büyük görünüm açılmalı.

---

### Klavye Desteği

* ← Önceki film
* → Sonraki film
* ESC Kapat

---

### RSS Feed

```text
/rss.xml
```

---

### Sitemap

```text
/sitemap.xml
```

---

### Robots

```text
/robots.txt
```

---

# Klasör Yapısı

```text
app/
components/
lib/
scripts/
data/
public/
types/
```

---

# Kod Kalitesi

* Production Ready
* Reusable Component Architecture
* Strong Type Safety
* Server Components öncelikli kullanım
* Accessibility desteği
* Clean Code prensipleri
* Maintainable yapı

---

# Ürün Vizyonu

Bu proje bir film veritabanı değildir.

Bu proje, bir sinemaseverin yıllar boyunca oluşturduğu kişisel film arşivini, puanlarını, izleme geçmişini ve sinema zevkini estetik bir şekilde sergileyen dijital bir film günlüğüdür.

Ziyaretçi filmleri keşfetmek için değil, kullanıcının sinema yolculuğunu keşfetmek için siteye gelmelidir.
