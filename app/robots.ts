import type { MetadataRoute } from 'next';
import { SITE_URL } from '@/lib/site';

// /robots.txt — libera o site para os buscadores; só o painel e a API ficam de fora.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: '*', allow: '/', disallow: ['/admin', '/login', '/api/'] }],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
