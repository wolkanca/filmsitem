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
          <div className="flex items-center gap-2 text-sm text-zinc-500">
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
          </div>
        </div>
      </div>
    </footer>
  );
}
