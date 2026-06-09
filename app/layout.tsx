import type { Metadata } from 'next';
import '@/styles/globals.css';
import '@/styles/fonts.css';

export const metadata: Metadata = {
  title: 'GFI Platform - Gamification SaaS',
  description: 'GFI Platform - Nền tảng Gamification SaaS',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-background">{children}</body>
    </html>
  );
}
