import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Fragman Zenginleştirme',
  description: 'Film fragmanlarını zenginleştirme aracı.',
};

export default function EnrichTrailersLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
