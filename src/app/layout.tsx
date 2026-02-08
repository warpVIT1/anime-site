import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import ClientLayout from '@/components/layout/ClientLayout';
import { SITE_CONFIG } from '@/config';

const inter = Inter({ 
  subsets: ['latin'],
  display: 'swap',
  preload: true,
});

export const metadata: Metadata = {
  title: `${SITE_CONFIG.NAME} - Watch Anime Online`,
  description: SITE_CONFIG.DESCRIPTION,
  keywords: ['anime', 'watch anime', 'anihub', 'anime streaming', 'anime online'],
  creator: 'ANIHUB Team',
  openGraph: {
    title: `${SITE_CONFIG.NAME} - Watch Anime Online`,
    description: SITE_CONFIG.DESCRIPTION,
    type: 'website',
    url: SITE_CONFIG.URL,
  },
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang={SITE_CONFIG.LANGUAGE} suppressHydrationWarning>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5" />
        <link rel="icon" href="/favicon.ico" />
      </head>
      <body className={`${inter.className} bg-[#111827] text-white antialiased`}>
        <ClientLayout>{children}</ClientLayout>
      </body>
    </html>
  );
}
