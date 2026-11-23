import type { MetadataRoute } from 'next';
import { siteUrl } from '@/lib/site';

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  return [
    { url: `${siteUrl}/`, lastModified: now, changeFrequency: 'weekly', priority: 1 },
    { url: `${siteUrl}/assinatura`, lastModified: now, changeFrequency: 'weekly', priority: 0.9 },
    { url: `${siteUrl}/newsletter`, lastModified: now, changeFrequency: 'weekly', priority: 0.8 },
    { url: `${siteUrl}/sobre`, lastModified: now, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${siteUrl}/jogos`, lastModified: now, changeFrequency: 'monthly', priority: 0.5 },
  ];
}
