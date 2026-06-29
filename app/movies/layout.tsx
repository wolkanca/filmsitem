import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Film Arşivi - Tüm İzlediğim Filmler',
  description:
    'İzlediğim tüm filmleri puan, tür, yıl ve yönetmene göre filtreleyerek keşfedin. Kişisel sinema arşivim.',
};

export default function MoviesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
