import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Fonksiyon adının 'proxy' olması zorunludur
export function proxy(request: NextRequest) {
  const url = request.nextUrl

  // 1. Eğer istekte _rsc parametresi varsa
  // 2. VE Next.js'in kendi iç sayfa geçiş başlığı (next-router-state-tree) YOKSA
  if (url.searchParams.has('_rsc') && !request.headers.has('next-router-state-tree')) {

    // Parametreyi URL'den tamamen temizliyoruz
    url.searchParams.delete('_rsc')

    // Temizlenmiş URL'e kalıcı (301) yönlendirme yapıyoruz
    return NextResponse.redirect(url, { status: 301 })
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Statik dosyalar, API rotaları ve Next.js dahili yolları hariç
     * tüm sayfa isteklerinde çalışır.
     */
    '/((?!api|_next/static|_next/image|favicon.ico|images|robots.txt|sitemap.xml|sitemaps|rss).*)',
  ],
}
