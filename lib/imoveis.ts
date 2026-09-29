// lib/imoveis.ts
// Regras compartilhadas pelas rotas de imóveis (uso no servidor).
import type { PoolClient } from 'pg';

export const CAMPOS_IMOVEL = [
  'codigo', 'titulo', 'descricao', 'preco', 'tipo', 'finalidade',
  'cidade', 'bairro', 'endereco', 'latitude', 'longitude',
  'quartos', 'banheiros', 'vagas', 'area', 'imagem_url',
  'destaque', 'ativo', 'status',
] as const;

// Colunas que o site público pode ver. Dados internos (proprietário, matrícula,
// comissão...) nunca devem entrar aqui.
export const COLUNAS_PUBLICAS = [
  'id', 'codigo', 'titulo', 'descricao', 'preco', 'tipo', 'finalidade',
  'cidade', 'bairro', 'endereco', 'latitude', 'longitude',
  'quartos', 'banheiros', 'vagas', 'area', 'imagem_url',
  'destaque', 'ativo', 'status', 'criado_em',
].join(', ');

const INTEIROS =['quartos', 'banheiros', 'vagas'];
const OPCIONAIS_NUMERICOS = ['latitude', 'longitude', 'area'];

/** Converte os valores vindos do formulário (strings) para o tipo das colunas. */
export function normalizarImovel(body: Record<string, unknown>) {
  const dados: Record<string, unknown> = {};
  for (const campo of CAMPOS_IMOVEL) {
    if (!(campo in body)) continue;
    const v = body[campo];
    if (campo === 'preco') dados[campo] = Number(v);
    else if (INTEIROS.includes(campo)) dados[campo] = v === '' || v == null ? 0 : Number(v);
    else if (OPCIONAIS_NUMERICOS.includes(campo)) dados[campo] = v === '' || v == null ? null : Number(v);
    else dados[campo] = v;
  }
  return dados;
}

/**
 * Regrava a galeria na ordem recebida. A capa (imagem_url) fica só na tabela
 * imoveis, então é filtrada daqui para não duplicar.
 */
export async function salvarGaleria(client: PoolClient, imovelId: number | string, galeria: string[], capa: string) {
  await client.query('DELETE FROM imovel_fotos WHERE imovel_id = $1', [imovelId]);

  const fotos = galeria
    .map((url, ordem) => ({ url, ordem }))
    .filter((f) => f.url !== capa);
  if (fotos.length === 0) return;

  await client.query(
    `INSERT INTO imovel_fotos (imovel_id, url, ordem)
     SELECT $1, f.url, f.ordem FROM unnest($2::text[], $3::int[]) AS f(url, ordem)`,
    [imovelId, fotos.map((f) => f.url), fotos.map((f) => f.ordem)],
  );
}
