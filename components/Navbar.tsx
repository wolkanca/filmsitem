'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Film, List, Heart, BarChart2, Sparkles, Search } from 'lucide-react';

export default function Navbar() {
  const pathname = usePathname();

  const navItems = [
    { name: 'Ana Sayfa', href: '/', icon: Film },
    { name: 'Tüm Filmler', href: '/movies', icon: Search },
    { name: 'Listeler', href: '/lists', icon: List },
    { name: 'Favoriler', href: '/favorites', icon: Heart },
    { name: 'İstatistikler', href: '/stats', icon: BarChart2 },
    { name: 'Rastgele', href: '/random', icon: Sparkles },
  ];

  return (
    <nav className="sticky top-0 z-50 w-full glass border-b border-card-border backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex-shrink-0">
            <Link href="/" className="flex items-center gap-2 group">
              <span className="text-2xl animate-pulse-subtle">🎬</span>
              <span className="font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-brand-primary via-brand-secondary to-brand-accent tracking-wider text-xl group-hover:opacity-90 transition-opacity">
                FILM GÜNLÜĞÜM
              </span>
            </Link>
          </div>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center space-x-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
              
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${
                    isActive
                      ? 'bg-gradient-to-r from-red-950/40 to-rose-950/40 border border-brand-primary/30 text-white shadow-[0_0_15px_rgba(239,68,68,0.15)]'
                      : 'text-zinc-400 hover:text-white hover:bg-white/5 border border-transparent'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-brand-primary animate-pulse' : 'text-zinc-500'}`} />
                  {item.name}
                </Link>
              );
            })}
          </div>

          {/* Mobile Menu Icon / Indicator */}
          <div className="md:hidden flex items-center space-x-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
              
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-label={item.name}
                  className={`p-2 rounded-lg transition-all duration-300 ${
                    isActive
                      ? 'bg-gradient-to-r from-red-950/40 to-rose-950/40 border border-brand-primary/30 text-white'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </nav>
  );
}
