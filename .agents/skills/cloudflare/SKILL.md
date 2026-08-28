# Cloudflare / Cache Skill

İzlediklerim Cloudflare CDN/cache arkasında çalışabilir. Amaç yüksek cache hit, düşük origin yükü ve hızlı statik film sayfalarıdır.

## Genel İlke

Statik veya uzun süre değişmeyen içeriklerde cache avantajını bozacak gereksiz dinamik davranış oluşturma.

## RSC

Next.js App Router RSC istekleri uygulamanın doğal çalışma biçiminin parçasıdır.

RSC response'larını cache'lemek mümkünse mevcut Cloudflare kuralları korunmalıdır; ancak kullanıcı deneyimini veya veri güncelliğini bozacak agresif cache kuralı ekleme.

## Görseller

Film poster/backdrop görsellerinde:

- mümkünse uzun ömürlü cache
- stabil URL
- gereksiz query string değişikliklerinden kaçınma
- mevcut image CDN yaklaşımını koruma

tercih edilir.

## Cache Warmer

Sitemap tabanlı görsel cache warmer kullanılabilir.

Kurallar:

- Sitemap'ten gerçek görsel URL'lerini al.
- Duplicate URL'leri kaldır.
- Origin'i gereksiz zorlayacak eşzamanlı istek patlaması oluşturma.
- Rate limit / hata durumlarında kontrollü davran.
- Cache warmer script'i yalnızca local/deployment ortamında kullanılıyorsa Git'e dahil edilmemesi gerektiğini açıkça değerlendir.

## Cloudflare Kural Değişiklikleri

Cache rule, page rule, worker veya header değişikliği yapmadan önce route'un:

1. HTML
2. RSC
3. API
4. sitemap
5. image

olup olmadığını belirle.

Her şeyi tek bir cache kuralıyla cache'lemeye çalışma.
