import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import '@/app/global.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
});

export const metadata: Metadata = {
  title: {
    default: 'Film Günlüğüm - Kişisel Sinema Arşivim',
    template: '%s | Film Günlüğüm',
  },
  description: 'Yıllardır izlediğim filmler, verdiğim puanlar, oluşturduğum listeler ve kişisel sinema istatistiklerimi barındıran modern film günlüğü.',
  keywords: ['film günlüğü', 'sinema arşivi', 'izleme geçmişi', 'film puanları', 'IMDb', 'sinefil'],
  authors: [{ name: 'Sinefil' }],
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/favicon.svg', type: 'image/svg+xml' },
      { url: '/favicon-96x96.png', sizes: '96x96', type: 'image/png' },
    ],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
  },
  manifest: '/site.webmanifest',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr" className="dark scroll-smooth">
      <body className={`${inter.variable} font-sans min-h-screen bg-background text-foreground flex flex-col antialiased`}>
        {/* Navbar */}
        <Navbar />

        {/* Main Content Area */}
        <main className="flex-grow max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">
          {children}
        </main>

        {/* Footer */}
        <Footer />
      </body>
    </html>
  );
}
