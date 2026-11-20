import type { Metadata, Viewport } from 'next';
import publication from '@/lib/publication.json';
import './globals.css';
import { Analytics } from '@vercel/analytics/next';

import { siteUrl } from '@/lib/site';
const launch = process.env.LAUNCH_READY === 'true';
const title = `${publication.name} · A banca`;
const description = `${publication.description} Todas as edições, numa banca de revistas.`;

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title,
  description,
  alternates: { canonical: '/' },
  robots: launch ? { index: true, follow: true } : { index: false, follow: false },
  openGraph: { title, description, url: '/', siteName: publication.name, locale: 'pt_BR', type: 'website' },
  twitter: { card: 'summary_large_image', title, description },
};

export const viewport: Viewport = { themeColor: '#FAF8F3' };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;1,400;1,500&family=Pinyon+Script&family=Caveat:wght@400;500&family=DM+Sans:opsz,wght@9..40,400;9..40,500&display=swap"
        />
      </head>
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  );
}
