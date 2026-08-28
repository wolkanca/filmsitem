# İzlediklerim — Agent Instructions

## 1. Proje Özeti

Bu repository, IMDb export verilerinden beslenen kişisel sinema günlüğü **İzlediklerim** projesidir.

- Framework: Next.js 15 + App Router
- React: 19
- Dil: TypeScript, strict mode
- Stil: Tailwind CSS + Vanilla CSS
- İkonlar: Lucide React
- Ana veri kaynağı: `data/movies.json`
- Harici veri kaynakları: OMDb, TMDB, Gemini
- Dağıtım: Vercel / Netlify uyumlu
- CDN / cache: Cloudflare ile birlikte çalışır

Proje bir IMDb/Letterboxd klonu değildir. Öncelik kişisel izleme arşivini hızlı, premium, sinematik ve SEO dostu biçimde sunmaktır.

## 2. Temel Çalışma Kuralları

- Önce mevcut dosyayı ve mevcut mimariyi oku; aynı işi yapan yeni bir yapı oluşturma.
- Kullanıcının açıkça istemediği büyük ölçekli refactor yapma.
- Mevcut davranışı koruyarak mümkün olan en küçük değişikliği tercih et.
- TypeScript strict kurallarını bozma.
- Alias olarak proje mevcutsa `@/*` kullanımını tercih et.
- Gereksiz dependency ekleme.
- Server Component / Client Component ayrımını koru. Client Component yalnızca gerçekten browser state/event/API gerektiğinde kullanılsın.
- Statik veya nadiren değişen veri için gereksiz runtime API çağrıları oluşturma.
- `data/movies.json` proje için ana veri kaynağıdır; veri kaybına yol açabilecek toplu değişikliklerde ekstra dikkat göster.
- Kullanıcı istemedikçe `movies.json` içindeki mevcut kayıtları silme veya alanları topluca yeniden biçimlendirme.
- Yeni alan eklemeden önce mevcut TypeScript modelini ve kullanım yerlerini kontrol et.
- Çıktı üretirken mevcut isimlendirme, URL yapısı ve veri formatını koru.

## 3. Film Verisi

Film veri modeli ve veri üzerinde güvenli değişiklik kuralları için:

- `skills/movies-data/SKILL.md`

Özellikle franchise alanları, `isFeatured`, `listName`, sezon/bölüm yapısı ve `plotTr` alanları bu skill'deki kurallara göre ele alınmalıdır.

## 4. SEO

SEO ile ilgili değişikliklerde:

- `skills/seo/SKILL.md`

Canonical, metadata, Open Graph, JSON-LD, sitemap, image sitemap, robots ve RSS birlikte değerlendirilmelidir.

## 5. Cloudflare / Cache

Cloudflare cache, RSC, görsel CDN veya cache warmer ile ilgili değişikliklerde:

- `skills/cloudflare/SKILL.md`

Cache davranışını bozabilecek header, route veya URL değişiklikleri rastgele yapılmamalıdır.

## 6. Scriptler

`scripts/` altındaki veri işleme araçlarında:

- `skills/scripts/SKILL.md`

Kurallarına uy.

Özellikle API kullanan scriptlerde rate limit, retry, mevcut veriyi koruma ve yalnızca eksik/hatalı alanları güncelleme yaklaşımı tercih edilir.

## 7. Sayfa ve URL Mimarisi

Mevcut ana rotalar korunmalıdır:

- `/`
- `/movies`
- `/movie/[imdbId]`
- `/lists`
- `/list/[slug]`
- `/stats`
- `/director/[name]`
- `/actor/[name]`
- `/genre/[name]`
- `/writer/[name]`
- `/year/[year]`
- `/random`
- `/sitemap.xml`
- `/sitemaps/[slug]`
- `/robots.txt`
- `/rss`

Admin rotaları veri yönetimi için özeldir ve kullanıcıya açık sayfa mimarisiyle karıştırılmamalıdır.

## 8. Görseller

- Film görselleri mümkün olduğunca mevcut yerel `/images/movies/...` yapısıyla uyumlu tutulmalıdır.
- Sitemap içindeki image URL'leri tam canonical URL olmalıdır.
- Harici görsel kaynağı eklemeden önce mevcut CDN/cache yaklaşımını kontrol et.
- Poster, backdrop ve YouTube thumbnail fallback mantığını bozma.
- `next/image` kullanılırken mevcut `next.config.ts` remote pattern ve `unoptimized` yaklaşımını dikkate al.

## 9. SEO ve İçerik Kuralları

- Film detay sayfalarında title, description, canonical, OG ve JSON-LD birbiriyle tutarlı olmalıdır.
- JSON-LD Movie şeması yalnızca gerçekten bilinen alanlarla doldurulmalıdır; uydurma veri eklenmemelidir.
- Film özetlerinde kelimeyi ortadan kesen truncation yapılmamalıdır.
- Türkçe özet varsa `plotTr` kullanılmalı; yoksa mevcut fallback mantığı korunmalıdır.
- Film, yönetmen, oyuncu, tür, yazar ve yıl URL'leri mevcut slug/encoding mantığını bozmayacak şekilde oluşturulmalıdır.

## 10. Performans

- Öncelik: hızlı ilk yükleme, düşük JS maliyeti ve güçlü cache hit oranı.
- Gereksiz client-side fetch kullanma.
- Büyük `movies.json` verisini client'a gereksiz yere taşımama.
- Arama ve filtreleme için mevcut mimariyi koruyarak performans iyileştirmesi yap.
- Görsellerde lazy loading ve mevcut poster bileşenlerini tercih et.
- Statik içerik için gereksiz API endpoint oluşturma.

## 11. Güvenlik

- API key, token, parola veya `.env` içeriğini source code içine yazma.
- Admin endpointlerinde mevcut yetkilendirme mantığını gevşetme.
- Kullanıcı girdisini doğrudan HTML olarak render etme.
- API anahtarlarını client bundle'a göndermeme.

## 12. Git

- Geçici/local dosyaları repository'ye ekleme.
- `.env*`, build çıktıları, `.next`, `out`, kullanıcı CSV'leri ve local admin araçları mevcut `.gitignore` kurallarına göre ele alınmalıdır.
- Yeni bir local-only script veya cache aracı ekleniyorsa Git'e gönderilmemesi gerekiyorsa ilgili klasör/file `.gitignore` ile açıkça korunmalıdır.
- Kullanıcı özellikle istemedikçe lockfile veya dependency dosyalarını gereksiz yere değiştirme.

## 13. Değişiklik Sonrası Doğrulama

Bu projede kullanıcı tarafından belirlenen mevcut kural gereği, değişikliklerden sonra otomatik olarak `tsc`, `build` veya `test` çalıştırma.

Bunun yerine:

- Değişen dosyaları tekrar oku.
- Import/path/isim tutarlılığını kontrol et.
- Değişiklik veri dosyasına dokunuyorsa JSON yapısını mantıksal olarak kontrol et.
- Kullanıcı özellikle isterse build/test/typecheck çalıştır.

## 14. İletişim

Bir işlem tamamlandığında kısa ve net şekilde:

1. Ne değişti?
2. Hangi dosyalar değişti?
3. Veri üzerinde hangi kayıtlar etkilendi?
4. Varsa dikkat edilmesi gereken nokta ne?

bilgilerini ver.

Gereksiz uzun açıklama veya değişiklik özeti üretme.
