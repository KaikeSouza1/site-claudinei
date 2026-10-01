import type { MetadataRoute } from 'next';
import { query } from '@/lib/db';
import { SITE_URL } from '@/lib/site';

// /sitemap.xml — lista as páginas fixas e cada imóvel ativo, para o Google achar todos.
export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const fixas: MetadataRoute.Sitemap = [
    { url: `${SITE_URL}/`, changeFrequency: 'daily', priority: 1 },
    { url: `${SITE_URL}/imoveis`, changeFrequency: 'daily', priority: 0.9 },
    { url: `${SITE_URL}/imoveis/venda`, changeFrequency: 'daily', priority: 0.9 },
    { url: `${SITE_URL}/imoveis/aluguel`, changeFrequency: 'daily', priority: 0.9 },
  ];

  try {
    const imoveis = await query<{ id: number; criado_em: string | null }>(
      `SELECT id, criado_em FROM imoveis
       WHERE ativo = true AND (status IS NULL OR status IN ('disponivel', 'reservado'))
       ORDER BY id DESC`,
    );
    return [
      ...fixas,
      ...imoveis.map((i) => ({
        url: `${SITE_URL}/imovel/${i.id}`,
        lastModified: i.criado_em ? new Date(i.criado_em) : undefined,
        changeFrequency: 'weekly' as const,
        priority: 0.8,
      })),
    ];
  } catch {
    return fixas; // banco indisponível: ao menos as páginas fixas
  }
}
