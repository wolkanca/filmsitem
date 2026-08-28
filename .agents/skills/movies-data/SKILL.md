# Movies Data Skill

## Kaynak

Ana veri dosyası: `data/movies.json`

TypeScript model: `types/index.ts`

## Movie Modeli

Temel alanlar:

- `imdbId`
- `title`
- `originalTitle`
- `year`
- `type`
- `myRating`
- `watchDate`
- `poster`
- `backdrop?`
- `overview`
- `plot`
- `plotTr?`
- `country`
- `omdbType`
- `boxOffice`
- `genres`
- `runtime`
- `cast`
- `director`
- `writers`
- `imdbRating`
- `tmdbRating`
- `releaseDate?`
- `trailerYoutubeId?`
- `seasons?`
- `franchiseId?`
- `franchiseName?`
- `franchiseOrder?`
- `isFeatured?`

Dizi kayıtlarında `seasons` altında `Season[]`, sezon içinde `Episode[]` bulunabilir.

## Veri Değiştirme Kuralları

- IMDb ID (`imdbId`) birincil kimliktir; değiştirilmemelidir.
- Kullanıcı puanı (`myRating`) harici puanlarla karıştırılmamalıdır.
- `imdbRating` ve `tmdbRating` ayrı tutulmalıdır.
- `watchDate`, mevcut standartla uyumlu tutulmalıdır; proje genelinde ISO/`YYYY-MM-DD` yaklaşımı tercih edilir.
- `poster` ve `backdrop` alanlarına geçersiz/uydurma URL yazma.
- `cast`, `writers` ve `genres` dizilerinde gereksiz duplicate oluşturma.
- Yönetmen tekil alan (`director`) olarak mevcut modele uyulmalıdır.

## Franchise

Bir yapım açıkça bir film serisinin parçasıysa:

- `franchiseId`
- `franchiseName`
- `franchiseOrder`

alanları birlikte ve tutarlı doldurulmalıdır.

Seriye ait olmadığı kesin olmayan bir filme franchise bilgisi ekleme.

`franchiseOrder`, serideki kronolojik/izleme sırasını temsil eder ve yalnızca güvenilir biçimde belirlenebiliyorsa yazılır.

## Gereksiz Alanlar

Kullanıcı tarafından kaldırılması istenmiş alanlar tekrar eklenmemelidir.

Özellikle proje veri temizliği kapsamında `listName` gibi alanların kaldırılması istenmişse, eski README/model örneğini körü körüne referans alma; repository'deki güncel `types/index.ts` ve gerçek `movies.json` yapısını esas al.

Aynı şekilde `isFeatured` alanı artık kullanılmıyorsa yeni kayıtlar için yeniden eklenmemelidir.

## Toplu Güncelleme

Toplu veri değişikliğinde:

1. Önce toplam kayıt sayısını belirle.
2. Hedef kayıtları IMDb ID ile seç.
3. Yalnızca istenen alanları değiştir.
4. Hedef dışındaki alanlara dokunma.
5. Sonuçta hangi IMDb ID'lerin değiştiğini raporla.

## API Zenginleştirme

OMDb/TMDB/Gemini'den veri çekerken mevcut doğru kullanıcı verisini ezme.

Öncelik:

1. Eksik alanı doldur.
2. Açıkça hatalı alanı düzelt.
3. Kullanıcı tarafından verilen doğru alanı koru.

API başarısızlığında boş veriyle mevcut değerin üzerine yazma.
