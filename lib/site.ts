// lib/site.ts
// Dados oficiais do site: usados em canonical, sitemap, robots.txt e dados estruturados (schema.org).
export const SITE_URL = 'https://www.claudineyottojrimoveis.com.br';
export const SITE_NOME = 'Claudiney W. Otto Junior | Corretor e Avaliador de Imóveis';

export const CORRETOR = {
  nome: 'Claudiney W. Otto Junior',
  telefone: '+55-42-98415-6013',
  telefoneExibicao: '(42) 98415-6013',
  creci: 'CRECI 37016-PR',
  cnai: 'CNAI 45505',
  foto: '/foto_claudinei.png',
  cidades: [
    { cidade: 'União da Vitória', uf: 'PR' },
    { cidade: 'Porto União', uf: 'SC' },
  ],
  redes: [
    'https://www.facebook.com/Ottojrcorretor/',
    'https://www.instagram.com/claudineyotto_junior_corretor/',
  ],
};

/** Corretor como negócio local (RealEstateAgent) — ajuda a aparecer em buscas como "corretor em União da Vitória". */
export function jsonLdCorretor() {
  return {
    '@context': 'https://schema.org',
    '@type': 'RealEstateAgent',
    '@id': `${SITE_URL}/#corretor`,
    name: CORRETOR.nome,
    description: 'Corretor e avaliador de imóveis: imóveis urbanos, áreas rurais, ativos florestais e laudos de avaliação mercadológica.',
    url: SITE_URL,
    image: `${SITE_URL}${CORRETOR.foto}`,
    telephone: CORRETOR.telefone,
    address: { '@type': 'PostalAddress', addressLocality: 'União da Vitória', addressRegion: 'PR', addressCountry: 'BR' },
    areaServed: CORRETOR.cidades.map((c) => ({ '@type': 'City', name: `${c.cidade} - ${c.uf}` })),
    identifier: [CORRETOR.creci, CORRETOR.cnai],
    sameAs: CORRETOR.redes,
  };
}

/** Serializa JSON-LD para <script>, sem permitir fechar a tag pelo conteúdo. */
export function jsonLdScript(dados: unknown) {
  return { __html: JSON.stringify(dados).replace(/</g, '\\u003c') };
}
