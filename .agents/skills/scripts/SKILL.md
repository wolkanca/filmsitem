# Scripts Skill

`scripts/` klasörü veri import, zenginleştirme ve bakım araçlarını içerir.

Mevcut scriptler arasında:

- `import.js`
- `enrich-posters.js`
- `check-broken-images.mjs`
- `clean-duplicate-credits.mjs`
- `download-movie-images.mjs`
- `fill-missing-credits.mjs`
- `fill-missing-plot.mjs`
- `find-missing-people-fields.mjs`
- `fix-watch-dates.mjs`
- `limit-people.mjs`
- `list-missing-admin-fields.mjs`
- `normalize-plot-quotes.mjs`
- `translate-plots-gemini.mjs`

## Güvenli Script İlkeleri

- Varsayılan olarak mevcut veriyi koru.
- Yalnızca hedeflenen alanları güncelle.
- API hatasında mevcut değeri boşaltma.
- Rate limit'e uy.
- Büyük veri setlerinde kontrollü concurrency kullan.
- Script tekrar çalıştırıldığında mümkün olduğunca idempotent davran.
- Loglarda IMDb ID ve film başlığını kullanarak hangi kayıtların değiştiğini anlaşılır biçimde göster.

## movies.json Yazımı

Script doğrudan `data/movies.json` yazıyorsa:

- JSON geçerli kalmalı.
- UTF-8 korunmalı.
- Gereksiz format değişikliği yapma.
- Alan sırasını sebepsiz yere değiştirme.
- Toplu değişiklik öncesinde hedef sayısını hesapla.

## API Key

API anahtarlarını source code'a yazma.

`.env.local` / environment variable kullan.

Gemini, OMDb veya TMDB scriptlerinde anahtarların client-side koda taşınmadığından emin ol.

## Görsel Scriptleri

Poster/görsel scriptleri mevcut görsel CDN, local `/images/movies/` yapısı ve Cloudflare cache yaklaşımıyla uyumlu olmalıdır.

Kırık görsel kontrolünde HEAD başarısızsa mevcut uygulamadaki fallback yaklaşımı korunabilir; ancak başarısız bir HTTP isteğini otomatik olarak doğru görsel kabul etme.
