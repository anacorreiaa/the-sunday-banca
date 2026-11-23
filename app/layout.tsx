import type { Metadata, Viewport } from 'next';
import publication from '@/lib/publication.json';
import './globals.css';
import { Analytics } from '@vercel/analytics/next';

import { siteUrl } from '@/lib/site';
const launch = process.env.LAUNCH_READY === 'true';
const title = 'The Sunday Magazine · Revista e newsletter para mulheres curiosas';
const description = 'The Sunday é uma revista impressa e uma newsletter de domingo para mulheres curiosas: histórias, ciência do dia a dia, arte, viagens e os costumes por trás das coisas. Assine a revista ou receba a newsletter grátis.';

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: { default: title, template: '%s · The Sunday Magazine' },
  description,
  applicationName: 'The Sunday Magazine',
  keywords: ['The Sunday', 'The Sunday Magazine', 'revista', 'revista impressa', 'newsletter', 'mulheres curiosas', 'assinatura de revista'],
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
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@graph': [
              { '@type': 'Organization', '@id': `${siteUrl}/#org`, name: 'The Sunday Magazine', alternateName: ['The Sunday', 'The Sunday Revista'], url: siteUrl, logo: `${siteUrl}/icon.svg`, description, sameAs: [publication.substackUrl, publication.contact.instagramUrl] },
              { '@type': 'WebSite', '@id': `${siteUrl}/#site`, name: 'The Sunday Magazine', alternateName: 'The Sunday', url: siteUrl, inLanguage: 'pt-BR', publisher: { '@id': `${siteUrl}/#org` } },
            ],
          }) }}
        />
        {children}
        <Analytics />
      </body>
    </html>
  );
}
