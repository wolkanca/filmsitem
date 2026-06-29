import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Admin Paneli',
  description: 'Film veritabanı yönetim paneli.',
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
