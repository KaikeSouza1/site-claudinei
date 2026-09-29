// lib/geocode.ts
// Endereço → coordenadas pelo Nominatim (OpenStreetMap), gratuito e sem chave.
// Política de uso: no máximo 1 requisição/s e User-Agent identificando o site.

const USER_AGENT = `site-claudinei/1.0 (+${process.env.NEXT_PUBLIC_BASE_URL || 'https://site-claudinei.vercel.app'})`;

export type EnderecoGeo = {
  endereco?: string | null;
  numero?: string | null;
  bairro?: string | null;
  cidade?: string | null;
  estado?: string | null;
  cep?: string | null;
};

async function buscar(q: string): Promise<{ lat: number; lng: number } | null> {
  const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&countrycodes=br&q=${encodeURIComponent(q)}`;
  const res = await fetch(url, {
    headers: { 'User-Agent': USER_AGENT, 'Accept-Language': 'pt-BR' },
    signal: AbortSignal.timeout(8000),
  });
  if (!res.ok) {
    console.error('[geocode] Nominatim respondeu', res.status, 'para', q);
    return null;
  }
  const [r] = (await res.json()) as { lat: string; lon: string }[];
  return r ? { lat: Number(r.lat), lng: Number(r.lon) } : null;
}

/**
 * Tenta do mais preciso ao mais genérico: rua + número, rua, bairro, cidade.
 * Retorna null se nem a cidade for encontrada.
 */
export async function geocodificar(e: EnderecoGeo): Promise<{ lat: number; lng: number; precisao: string } | null> {
  if (!e.cidade) return null;
  const local = [e.cidade, e.estado].filter(Boolean).join(', ');
  const tentativas: [string, string | null][] = [
    ['endereço', e.endereco ? [[e.endereco, e.numero].filter(Boolean).join(' '), e.bairro, local].filter(Boolean).join(', ') : null],
    ['rua', e.endereco && e.numero ? [e.endereco, local].join(', ') : null],
    ['bairro', e.bairro ? `${e.bairro}, ${local}` : null],
    ['cidade', local],
  ];

  for (const [precisao, q] of tentativas) {
    if (!q) continue;
    try {
      const r = await buscar(q);
      if (r) return { ...r, precisao };
    } catch (err) {
      console.error('[geocode] falha ao consultar Nominatim:', err);
      return null; // serviço fora do ar: não trava o salvamento
    }
    await new Promise((ok) => setTimeout(ok, 1000)); // respeita 1 req/s
  }
  return null;
}
