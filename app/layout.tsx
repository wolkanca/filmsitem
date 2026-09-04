import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { GoogleAnalytics } from '@next/third-parties/google';
import GlobalSearch from '@/components/GlobalSearch';
import '@/app/global.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
});

export const metadata: Metadata = {
  metadataBase: new URL('https://izlediklerim.com'),
  title: {
    default: 'İzlediklerim',
    template: '%s - İzlediklerim',
  },
  description: 'İzlediklerim - Kişisel Sinema Arşivim. Yıllardır izlediğim filmler, verdiğim puanlar, oluşturduğum listeler ve kişisel sinema istatistiklerimi barındıran modern film günlüğü.',
  authors: [{ name: 'Volkan Yılmaz' }],
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
    <html lang="tr" className="dark scroll-smooth" data-scroll-behavior="smooth">
      <body className={`${inter.variable} font-sans min-h-screen bg-background text-foreground flex flex-col antialiased min-w-[320px]`}>
        {/* Navbar */}
        <Navbar />

        {/* Main Content Area */}
        <main className="flex-grow max-w-7xl w-full mx-auto px-2 sm:px-4 lg:px-6 py-8 animate-fade-in">
          {children}
        </main>

        {/* Footer */}
        <Footer />

        {/* Global Search Dialog */}
        <GlobalSearch />
        <GoogleAnalytics gaId="G-W94XTXVMTQ" />
      </body>
    </html>
  );
}
