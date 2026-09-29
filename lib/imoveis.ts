// lib/imoveis.ts
// Regras compartilhadas pelas rotas de imóveis (uso no servidor).
import type { PoolClient } from 'pg';

export const CAMPOS_IMOVEL = [
  'codigo', 'titulo', 'descricao', 'preco', 'tipo', 'finalidade',
  'cep', 'estado', 'cidade', 'bairro', 'endereco', 'numero', 'complemento', 'latitude', 'longitude',
  'area_construida', 'area_terreno', 'quartos', 'suites', 'banheiros', 'vagas', 'pavimentos',
  'caracteristicas', 'imagem_url', 'video_url',
  'aceita_financiamento', 'aceita_fgts', 'aceita_permuta', 'aceita_negociacao',
  'documentacao_regular', 'ocupacao', 'disponibilidade_visitas',
  'destaque', 'ativo', 'status',
] as const;

// Colunas que o site público pode ver. Dados internos (proprietário, matrícula,
// comissão...) ficam em imovel_interno e nunca devem entrar aqui.
export const COLUNAS_PUBLICAS = [
  'id', 'codigo', 'titulo', 'descricao', 'preco', 'tipo', 'finalidade',
  'cep', 'estado', 'cidade', 'bairro', 'endereco', 'numero', 'complemento', 'latitude', 'longitude',
  'area', 'area_construida', 'area_terreno', 'quartos', 'suites', 'banheiros', 'vagas', 'pavimentos',
  'caracteristicas', 'imagem_url', 'video_url',
  'aceita_financiamento', 'aceita_fgts', 'aceita_permuta', 'aceita_negociacao',
  'documentacao_regular', 'ocupacao', 'disponibilidade_visitas',
  'destaque', 'ativo', 'status', 'criado_em',
].join(', ');

export const CAMPOS_INTERNOS = [
  'matricula', 'inscricao_imobiliaria',
  'proprietario_nome', 'proprietario_telefone', 'proprietario_email', 'proprietario_cpf',
  'area_registrada', 'area_averbada', 'iptu_valor', 'iptu_situacao',
  'possui_financiamento', 'onus', 'financiamento_bancario',
  'comissao_percentual', 'comissao_valor',
  'autorizacao_venda', 'autorizacao_validade', 'observacoes',
] as const;

const INTEIROS = ['quartos', 'suites', 'banheiros', 'vagas', 'pavimentos'];
const NUMERICOS_OPCIONAIS = [
  'latitude', 'longitude', 'area_construida', 'area_terreno',
  'area_registrada', 'area_averbada', 'iptu_valor', 'comissao_percentual', 'comissao_valor',
];
const BOOLEANOS = [
  'aceita_financiamento', 'aceita_fgts', 'aceita_permuta', 'aceita_negociacao',
  'documentacao_regular', 'destaque', 'ativo',
  'possui_financiamento', 'financiamento_bancario', 'autorizacao_venda',
];

function normalizarValor(campo: string, v: unknown) {
  if (campo === 'preco') return Number(v);
  if (INTEIROS.includes(campo)) return v === '' || v == null ? 0 : Math.trunc(Number(v));
  if (NUMERICOS_OPCIONAIS.includes(campo)) return v === '' || v == null ? null : Number(v);
  if (BOOLEANOS.includes(campo)) return v === true || v === 'true';
  if (campo === 'caracteristicas') return Array.isArray(v) ? v.map(String) : [];
  if (typeof v === 'string') return v.trim() === '' ? null : v.trim();
  return v ?? null;
}

/** Converte os valores vindos do formulário (strings) para o tipo das colunas. */
export function normalizarImovel(body: Record<string, unknown>) {
  const dados: Record<string, unknown> = {};
  for (const campo of CAMPOS_IMOVEL) {
    if (campo in body) dados[campo] = normalizarValor(campo, body[campo]);
  }
  // Colunas obrigatórias continuam string vazia em vez de null
  for (const campo of ['titulo', 'tipo', 'finalidade', 'cidade']) {
    if (campo in dados && dados[campo] == null) dados[campo] = '';
  }
  // Código vazio: o banco gera automaticamente no INSERT (trigger imovel_codigo_auto)
  if ('codigo' in dados && dados.codigo == null) delete dados.codigo;
  // "area" antiga continua preenchida para os cards e filtros que já a usam
  if ('area_construida' in dados || 'area_terreno' in dados) {
    const a = (dados.area_construida ?? dados.area_terreno) as number | null;
    dados.area = a == null ? null : Math.round(a);
  }
  return dados;
}

export function normalizarInterno(body: Record<string, unknown>) {
  const dados: Record<string, unknown> = {};
  for (const campo of CAMPOS_INTERNOS) {
    if (campo in body) dados[campo] = normalizarValor(campo, body[campo]);
  }
  return dados;
}

/** Cria ou atualiza os dados internos do imóvel. */
export async function salvarInterno(client: PoolClient, imovelId: number | string, interno: Record<string, unknown>) {
  const dados = normalizarInterno(interno);
  const cols = Object.keys(dados);
  if (cols.length === 0) return;

  await client.query(
    `INSERT INTO imovel_interno (imovel_id, ${cols.join(', ')})
     VALUES ($1, ${cols.map((_, i) => `$${i + 2}`).join(', ')})
     ON CONFLICT (imovel_id) DO UPDATE SET
       ${cols.map((c) => `${c} = EXCLUDED.${c}`).join(', ')}, atualizado_em = now()`,
    [imovelId, ...cols.map((c) => dados[c])],
  );
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
