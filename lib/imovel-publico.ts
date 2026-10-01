// lib/imovel-publico.ts
// Busca de um imóvel para o site público (servidor). Só colunas públicas.
import { cache } from 'react';
import { query, queryOne } from '@/lib/db';
import { COLUNAS_PUBLICAS } from '@/lib/imoveis';
import { CORRETOR, SITE_URL } from '@/lib/site';

export type ImovelPublico = Record<string, any> & { id: number; titulo: string; fotos: string[] };

// cache(): metadata e página da mesma requisição reaproveitam a consulta
export const buscarImovelPublico = cache(async (id: string): Promise<ImovelPublico | null> => {
  if (!/^\d+$/.test(id)) return null;
  const imovel = await queryOne(`SELECT ${COLUNAS_PUBLICAS} FROM imoveis WHERE id = $1 AND ativo = true`, [id]);
  if (!imovel) return null;
  const fotos = await query<{ url: string }>('SELECT url FROM imovel_fotos WHERE imovel_id = $1 ORDER BY ordem', [id]);
  return { ...imovel, fotos: fotos.map((f) => f.url) } as ImovelPublico;
});

const isLocacao = (finalidade: string | null) => /loca|alug/i.test(finalidade ?? '');

/** Anúncio no formato schema.org (RealEstateListing + Offer) para o Google entender preço, local e fotos. */
export function jsonLdImovel(imovel: ImovelPublico) {
  const url = `${SITE_URL}/imovel/${imovel.id}`;
  const imagens = Array.from(new Set([imovel.imagem_url, ...imovel.fotos].filter(Boolean))).slice(0, 10);
  const area = Number(imovel.area_construida) || Number(imovel.area) || Number(imovel.area_terreno) || undefined;
  const tipoSchema = /apart|kitnet/i.test(imovel.tipo) ? 'Apartment'
    : /casa|sobrado/i.test(imovel.tipo) ? 'House'
    : /terreno|ch[aá]cara|s[ií]tio|fazenda/i.test(imovel.tipo) ? 'Place'
    : 'Accommodation';

  return {
    '@context': 'https://schema.org',
    '@type': 'RealEstateListing',
    '@id': url,
    url,
    name: imovel.titulo.trim(),
    description: (imovel.descricao ?? '').slice(0, 5000) || undefined,
    image: imagens,
    datePosted: imovel.criado_em ? String(imovel.criado_em).slice(0, 10) : undefined,
    offers: {
      '@type': 'Offer',
      ...(imovel.preco_sob_consulta ? {} : { price: Number(imovel.preco), priceCurrency: 'BRL' }),
      availability: imovel.status === 'reservado' ? 'https://schema.org/LimitedAvailability' : 'https://schema.org/InStock',
      businessFunction: isLocacao(imovel.finalidade) ? 'https://purl.org/goodrelations/v1#LeaseOut' : 'https://purl.org/goodrelations/v1#Sell',
      seller: { '@id': `${SITE_URL}/#corretor`, '@type': 'RealEstateAgent', name: CORRETOR.nome, telephone: CORRETOR.telefone },
    },
    about: {
      '@type': tipoSchema,
      name: imovel.titulo.trim(),
      address: {
        '@type': 'PostalAddress',
        streetAddress: [imovel.endereco, imovel.numero].filter(Boolean).join(', ') || undefined,
        addressLocality: imovel.cidade,
        addressRegion: imovel.estado || undefined,
        postalCode: imovel.cep || undefined,
        addressCountry: 'BR',
      },
      ...(imovel.latitude != null && imovel.longitude != null
        ? { geo: { '@type': 'GeoCoordinates', latitude: Number(imovel.latitude), longitude: Number(imovel.longitude) } }
        : {}),
      ...(tipoSchema !== 'Place' ? {
        numberOfRooms: imovel.quartos || undefined,
        numberOfBathroomsTotal: imovel.banheiros || undefined,
        floorSize: area ? { '@type': 'QuantitativeValue', value: area, unitCode: 'MTK' } : undefined,
        amenityFeature: (imovel.caracteristicas ?? []).map((c: string) => ({ '@type': 'LocationFeatureSpecification', name: c, value: true })),
      } : {}),
    },
  };
}
