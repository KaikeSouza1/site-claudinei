import { notFound } from 'next/navigation';
import { buscarImovelPublico, jsonLdImovel } from '@/lib/imovel-publico';
import { jsonLdScript } from '@/lib/site';
import ImovelView from './ImovelView';

// Renderizada no servidor: título, descrição, características e preço já vêm no HTML.
export const revalidate = 300;

export default async function ImovelPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const imovel = await buscarImovelPublico(id);
  if (!imovel) notFound();

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={jsonLdScript(jsonLdImovel(imovel))} />
      <ImovelView imovel={imovel} />
    </>
  );
}
