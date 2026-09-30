// lib/imovel-opcoes.ts
// Listas usadas no formulário do painel e na página pública (seguro no navegador).

export const TIPOS_IMOVEL = [
  'Casa', 'Sobrado', 'Apartamento', 'Kitnet', 'Terreno',
  'Comercial', 'Chácara', 'Sítio', 'Fazenda',
] as const;

export const CARACTERISTICAS = [
  'Quarto', 'Sala de estar', 'Sala de jantar', 'Cozinha', 'Suíte', 'Banheiro social', 'Sacada',
  'Churrasqueira', 'Lavanderia', 'Quintal', 'Jardim', 'Portão eletrônico',
  'Aquecimento', 'Lareira', 'Área gourmet', 'Depósito',
  'Piscina', 'Closet', 'Escritório', 'Ar-condicionado', 'Mobiliado',
  'Elevador', 'Garagem coberta', 'Energia solar', 'Poço artesiano',
] as const;

export const CATEGORIAS_DOCUMENTO = [
  { value: 'matricula',   label: 'Matrícula' },
  { value: 'autorizacao', label: 'Autorização de venda' },
  { value: 'iptu',        label: 'IPTU' },
  { value: 'escritura',   label: 'Escritura' },
  { value: 'planta',      label: 'Planta / Projeto' },
  { value: 'outro',       label: 'Outro' },
] as const;

/** Converte links do YouTube/Vimeo em URL de player embutido. */
export function videoEmbedUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  const yt = url.match(/(?:youtube\.com\/(?:watch\?v=|shorts\/|embed\/)|youtu\.be\/)([\w-]{11})/);
  if (yt) return `https://www.youtube-nocookie.com/embed/${yt[1]}`;
  const vimeo = url.match(/vimeo\.com\/(?:video\/)?(\d+)/);
  if (vimeo) return `https://player.vimeo.com/video/${vimeo[1]}`;
  return null;
}
