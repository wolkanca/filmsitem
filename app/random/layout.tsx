import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Bu Akşam Ne İzlesem? - Rastgele Film Önerisi',
  description:
    'Film koleksiyonunuzdan rastgele seçimler yapan akıllı şans çarkı. Tür ve puan filtrelerini kullanarak size özel film önerileri alın.',
};

export default function RandomLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
