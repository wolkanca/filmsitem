import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Film Zenginleştirme',
  description: 'Film verilerini zenginleştirme aracı.',
};

export default function EnrichLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
