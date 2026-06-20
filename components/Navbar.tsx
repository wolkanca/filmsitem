'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Film, List, Heart, BarChart2, Sparkles, Search, Menu, X } from 'lucide-react';
import { useState, useEffect } from 'react';

export default function Navbar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  // Sayfa değişince menüyü kapat
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  // Scroll kilidi
  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [mobileOpen]);

  const navItems = [
    { name: 'Ana Sayfa', href: '/', icon: Film },
    { name: 'Filmler', href: '/movies', icon: Search },
    { name: 'Listeler', href: '/lists', icon: List },
    { name: 'Favoriler', href: '/favorites', icon: Heart },
    { name: 'İstatistik', href: '/stats', icon: BarChart2 },
    { name: 'Rastgele', href: '/random', icon: Sparkles },
  ];

  return (
    <>
      <nav className="sticky top-0 z-50 w-full glass border-b border-card-border backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">

            {/* Logo */}
            <div className="flex-shrink-0">
              <Link href="/" className="flex items-center gap-2 group">
                <img src="/favicon.svg" alt="logo" className="w-7 h-7 drop-shadow-[0_0_6px_rgba(239,68,68,0.5)] group-hover:scale-110 transition-transform duration-200" />
                <span className="font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-brand-primary via-brand-secondary to-brand-accent tracking-wider text-xl group-hover:opacity-90 transition-opacity">
                  İZLEDİKLERİM
                </span>
              </Link>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden lg:flex items-center space-x-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${isActive
                      ? 'bg-gradient-to-r from-red-950/40 to-rose-950/40 border border-brand-primary/30 text-white shadow-[0_0_15px_rgba(239,68,68,0.15)]'
                      : 'text-zinc-400 hover:text-white hover:bg-white/5 border border-transparent'
                      }`}
                  >
                    <Icon className={`w-4 h-4 ${isActive ? 'text-brand-primary animate-pulse' : 'text-zinc-500'}`} />
                    {item.name}
                  </Link>
                );
              })}
              <a
                href="https://www.imdb.com/user/p.jrcoverqguo4wfi652fsteuhpi"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium text-zinc-400 hover:text-white hover:bg-white/5 border border-transparent transition-all duration-300"
              >
                <span className="px-1.5 py-0.5 rounded bg-[#f5c518] text-black text-[10px] font-extrabold leading-none">IMDb</span>
              </a>
            </div>

            {/* Mobile: Hamburger Button */}
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label={mobileOpen ? 'Menüyü kapat' : 'Menüyü aç'}
              className="lg:hidden flex items-center justify-center w-10 h-10 rounded-lg border border-white/10 bg-white/5 text-zinc-300 hover:text-white hover:bg-white/10 transition-all duration-200 active:scale-95"
            >
              {mobileOpen
                ? <X className="w-5 h-5" />
                : <Menu className="w-5 h-5" />
              }
            </button>

          </div>
        </div>
      </nav>

      {/* Mobile Overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile Drawer */}
      <div
        className={`
          fixed top-0 right-0 z-50 h-full w-72 lg:hidden
          bg-zinc-950/95 border-l border-white/10 backdrop-blur-xl shadow-2xl
          transform transition-transform duration-300 ease-in-out
          ${mobileOpen ? 'translate-x-0' : 'translate-x-full'}
        `}
      >
        {/* Drawer Header */}
        <div className="flex items-center justify-between px-5 h-16 border-b border-white/10">
          <Link href="/" className="flex items-center gap-2" onClick={() => setMobileOpen(false)}>
            <img src="/favicon.svg" alt="logo" className="w-6 h-6" />
            <span className="font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-brand-primary via-brand-secondary to-brand-accent text-base tracking-wider">
              FILM GÜNLÜĞÜM
            </span>
          </Link>
          <button
            onClick={() => setMobileOpen(false)}
            aria-label="Menüyü kapat"
            className="flex items-center justify-center w-8 h-8 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 transition-all duration-200"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Drawer Links */}
        <div className="flex flex-col px-3 py-4 gap-1">
          {navItems.map((item, idx) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                style={{ transitionDelay: mobileOpen ? `${idx * 40}ms` : '0ms' }}
                className={`
                  flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium
                  transition-all duration-300
                  ${isActive
                    ? 'bg-gradient-to-r from-red-950/60 to-rose-950/60 border border-brand-primary/40 text-white shadow-[0_0_20px_rgba(239,68,68,0.12)]'
                    : 'text-zinc-400 hover:text-white hover:bg-white/5 border border-transparent'
                  }
                `}
              >
                <Icon className={`w-5 h-5 flex-shrink-0 ${isActive ? 'text-brand-primary' : 'text-zinc-500'}`} />
                <span>{item.name}</span>
                {isActive && (
                  <span className="ml-auto w-1.5 h-1.5 rounded-full bg-brand-primary shadow-[0_0_6px_rgba(239,68,68,0.8)]" />
                )}
              </Link>
            );
          })}

          {/* Divider */}
          <div className="my-2 border-t border-white/10" />

          {/* IMDb Link */}
          <a
            href="https://www.imdb.com/user/p.jrcoverqguo4wfi652fsteuhpi"
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => setMobileOpen(false)}
            className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-zinc-400 hover:text-white hover:bg-white/5 border border-transparent transition-all duration-300"
          >
            <span className="px-2 py-1 rounded bg-[#f5c518] text-black text-[11px] font-extrabold leading-none">IMDb</span>
            <span>IMDb Profilim</span>
          </a>
        </div>
      </div>
    </>
  );
}
