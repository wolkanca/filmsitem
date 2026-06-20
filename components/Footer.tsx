export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="w-full glass border-t border-card-border mt-16 py-8 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-zinc-500 text-sm">
            © {currentYear}{' '}
            <span className="text-zinc-300 font-semibold">Film Günlüğüm</span>
            {' '}— Kişisel Sinema Arşivi
          </p>
          <div className="flex items-center gap-3 text-sm text-zinc-500">
            <span>
              <a
                href="https://wolkanca.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-brand-primary hover:text-brand-secondary font-semibold transition-colors"
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
