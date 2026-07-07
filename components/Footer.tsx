import Link from 'next/link';

const collectionLinks = [
  { name: 'Komedi Günlükleri', href: '/list/komedi-gunlukleri' },
  { name: 'Bilim Kurgu', href: '/list/bilim-kurgu' },
  { name: 'Favoriler', href: '/list/favoriler' },
  { name: 'Sinema Klasikleri', href: '/list/sinema-klasikleri' },
  { name: 'Kült Eserler', href: '/list/kult-eserler' },
  { name: 'Uzun Metraj Maratonu', href: '/list/uzun-metraj-maratonu' },
  { name: '10 Puanlık Başyapıtlar', href: '/list/10-puanlik-basyapitlar' },
  { name: 'Türk Filmleri', href: '/list/turk-filmleri' },
  { name: 'TV Series', href: '/list/tv-series' },
  { name: 'TV Mini Series', href: '/list/tv-mini-series' },
  { name: 'Video Game', href: '/list/video-game' },
  { name: 'Belgeseller', href: '/list/belgeseller' },
  { name: 'Animasyon', href: '/list/animasyon' },
  { name: 'Korku ve Gerilim', href: '/list/korku-ve-gerilim' },
  { name: 'Aksiyon', href: '/list/aksiyon' },
  { name: 'Dram', href: '/list/dram' },
  { name: '2020 Sonrası', href: '/list/2020-sonrasi' },
  { name: '90lar', href: '/list/90lar' },
  { name: '80ler', href: '/list/80ler' },
  { name: 'Kısa Yapımlar', href: '/list/kisa-yapimlar' },
];

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="w-full glass border-t border-card-border mt-8 py-10 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <section className="pb-8 mb-8 border-b border-zinc-800/80">
          <div className="flex flex-col lg:flex-row gap-8 lg:items-start lg:justify-between">
            <div className="flex-1 space-y-4">
              <div>
                <h2 className="text-sm font-black text-white uppercase tracking-wider">
                  Koleksiyonlar
                </h2>
                <p className="text-xs text-zinc-500 mt-2 leading-relaxed max-w-2xl">
                  İzlediğim yapımları tür, dönem, puan ve formatlarına göre otomatik oluşturulan{' '}
                  <a className="text-zinc-400 hover:text-brand-secondary font-semibold transition-colors" href="/lists">
                    akıllı listelerle
                  </a>{' '}
                  keşfet.
                </p>
              </div>

              <nav
                aria-label="Footer koleksiyon linkleri"
                className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2"
              >
                {collectionLinks.map((collection) => (
                  <Link
                    key={collection.href}
                    href={collection.href}
                    className="rounded-lg border border-white/5 bg-zinc-950/40 px-3 py-2 text-[11px] font-bold text-zinc-400 transition-all duration-200 hover:border-brand-primary/40 hover:bg-brand-primary/10 hover:text-white"
                  >
                    {collection.name}
                  </Link>
                ))}
              </nav>
            </div>
            <div className="max-w-sm">
              <h2 className="text-sm font-black text-white uppercase tracking-wider">
                Veri Kaynağı
              </h2>
              <p className="text-sm text-zinc-500 mt-2 mb-4 leading-relaxed">
                Sitedeki veriler Volkan Yılmaz’ın izlediği ve IMDb’de puanladığı filmleri içermektedir, verilerin çoğu{' '}
                <a className="text-zinc-400 hover:text-brand-secondary font-semibold transition-colors" href="https://www.themoviedb.org/" target="_blank" rel="noopener noreferrer">
                  TMDB API
                </a>
                ’den alınmıştır.<br />
                Afişler, fragmanlar, IMDB verileri ve puanlar TMDB’den, YouTube’dan ise fragmanlar eklenmektedir.
                <br /><br />
                Bu site wolkanca.com’un bir parçasıdır, her türlü görüş ve öneri için <a href="/about#iletisim" className="text-zinc-400 hover:text-brand-secondary font-semibold transition-colors" >İletişim</a> sayfasından bana ulaşabilirsiniz.
              </p>
            </div>
          </div>
        </section>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-center">
          <p className="text-zinc-500 text-sm">
            © {currentYear}{' '}
            <span className="text-zinc-300 font-semibold">İzlediklerim</span>
            {' '}— Kişisel Sinema Arşivi
          </p>
          <div className="flex items-center gap-3 text-sm text-zinc-500">
            <span>
              <a
                href="https://volkanyilmaz.tr"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-brand-secondary font-semibold transition-colors"
              >
                Volkan Yılmaz
              </a>
            </span>
            <span className="text-zinc-700">|</span>
            <a
              href="https://www.imdb.com/user/p.jrcoverqguo4wfi652fsteuhpi"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-[#f5c518] text-black font-extrabold hover:bg-[#e2b616] transition-colors text-xs animate-pulse-subtle"
            >
              IMDb Profili
            </a>
            <span className="text-zinc-700">|</span>
            <div className="flex items-center gap-2.5 ml-0.5">
              <a
                href="https://x.com/wolkanca/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-zinc-500 hover:text-white transition-colors"
                aria-label="X (Twitter) Profili"
              >
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
              </a>
              <a
                href="https://www.linkedin.com/in/wolkanca/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-zinc-500 hover:text-white transition-colors"
                aria-label="LinkedIn Profili"
              >
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24" aria-hidden="true">
                  <path fillRule="evenodd" d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.779-1.75-1.75s.784-1.75 1.75-1.75 1.75.779 1.75 1.75-.784 1.75-1.75 1.75zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" clipRule="evenodd" />
                </svg>
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
