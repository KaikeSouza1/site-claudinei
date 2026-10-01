import type { Metadata } from 'next';
import { buscarImovelPublico } from '@/lib/imovel-publico';
import { SITE_URL } from '@/lib/site';

type Props = { params: Promise<{ id: string }>; children: React.ReactNode };

const brl = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

// Título, descrição e imagem próprios de cada imóvel: é o que aparece no Google
// e na prévia do link no WhatsApp.
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const imovel = await buscarImovelPublico(id).catch(() => null);
  if (!imovel) return { title: 'Imóvel não encontrado', robots: { index: false } };

  const titulo = imovel.titulo.trim();
  const local = [imovel.bairro, [imovel.cidade, imovel.estado].filter(Boolean).join('/')].filter(Boolean).join(', ');
  const acao = /loca|alug/i.test(imovel.finalidade ?? '') ? 'para alugar' : 'à venda';
  const resumo = `${imovel.tipo} ${acao} em ${local} por ${brl(Number(imovel.preco))}.`;
  const descricao = `${resumo} ${(imovel.descricao ?? '').replace(/\s+/g, ' ').trim()}`.slice(0, 300);
  const url = `${SITE_URL}/imovel/${id}`;

  return {
    title: `${titulo} | Claudiney W. Otto Junior`,
    description: descricao,
    alternates: { canonical: url },
    openGraph: {
      type: 'website',
      url,
      title: titulo,
      description: descricao,
      locale: 'pt_BR',
      siteName: 'Claudiney W. Otto Junior Imóveis',
      images: imovel.imagem_url ? [{ url: imovel.imagem_url }] : undefined,
    },
  };
}

export default function ImovelLayout({ children }: Props) {
  return children;
}
