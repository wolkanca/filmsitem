# SEO Skill

İzlediklerim'in SEO yaklaşımı film detay sayfaları ve kişisel arşiv keşif sayfaları üzerine kuruludur.

## Metadata

Her indexlenebilir sayfa için:

- anlamlı `title`
- doğal `description`
- canonical URL
- uygun Open Graph metadata
- mümkünse Twitter/X card metadata

kullanılmalıdır.

Film detaylarında temel kaynak `Movie` verisidir.

## Canonical

Canonical URL'ler:

- `https://izlediklerim.com` origin'iyle
- mevcut route yapısıyla
- gereksiz query parametrelerinden arındırılmış

olmalıdır.

## Open Graph

Film sayfalarında mümkünse:

- film başlığı
- açıklama
- poster/backdrop
- canonical URL
- uygun `og:type`

tutarlı biçimde kullanılmalıdır.

## JSON-LD

Film detay sayfalarında `Movie` schema kullanılabilir.

Yalnızca gerçekten bilinen verileri ekle. Özellikle:

- `name`
- `image`
- `datePublished`
- `url`
- rating bilgileri
- yönetmen/oyuncu bilgileri

kaynak veride mevcutsa kullanılmalıdır.

Uydurma review, aggregate rating, release date veya kişi bilgisi oluşturma.

## Sitemap

Ana sitemap ve parçalı sitemap yapısı korunmalıdır.

Film URL'leri sitemap'e eklenirken:

- canonical absolute URL
- benzersiz URL
- geçerli XML escaping

sağlanmalıdır.

## Image Sitemap

Film sitemap'lerinde görseller kullanılıyorsa `<image:loc>` değeri tam absolute URL olmalıdır.

Örnek:

`https://izlediklerim.com/images/movies/tt1234567-poster.webp`

Sadece `/images/...` gibi relative path kullanma.

Görsel sitemap'e yalnızca gerçekten sayfayla ilişkili görselleri ekle.

## robots.txt / RSS

`robots.txt`, sitemap adresleri ve RSS route'u birbiriyle tutarlı tutulmalıdır.

## İçerik

SEO metinleri doğal Türkçe olmalıdır. Anahtar kelime doldurma yapılmamalıdır.

Film özetleri kelime ortasından kesilmemelidir. Truncation gerekiyorsa son tamamlanan kelimede dur.
