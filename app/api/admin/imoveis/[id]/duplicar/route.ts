import { NextRequest, NextResponse } from 'next/server';
import { withTransaction } from '@/lib/db';

type Params = { params: Promise<{ id: string }> };

// Colunas que NÃO são copiadas: identificação e histórico do anúncio original.
// O código novo é gerado pelo trigger imovel_codigo_auto.
const NAO_COPIAR = ['id', 'codigo', 'criado_em', 'created_at', 'visualizacoes'];

// Dados internos que são próprios de cada unidade (ex.: 4 aptos no mesmo prédio).
const INTERNO_NAO_COPIAR = ['imovel_id', 'matricula', 'inscricao_imobiliaria', 'atualizado_em'];

// POST — cria uma cópia do anúncio (fotos, características e dados internos gerais).
// Documentos anexados não são copiados: matrícula e afins mudam de uma unidade para outra.
export async function POST(_req: NextRequest, { params }: Params) {
  const { id } = await params;

  try {
    const copia = await withTransaction(async (client) => {
      const colunas = async (tabela: string, excluir: string[]) => {
        const { rows } = await client.query<{ column_name: string }>(
          `SELECT column_name FROM information_schema.columns
           WHERE table_schema = 'public' AND table_name = $1 ORDER BY ordinal_position`,
          [tabela],
        );
        return rows.map((r) => r.column_name).filter((c) => !excluir.includes(c));
      };

      const cols = (await colunas('imoveis', NAO_COPIAR)).join(', ');
      const { rows } = await client.query(
        `INSERT INTO imoveis (${cols}) SELECT ${cols} FROM imoveis WHERE id = $1 RETURNING *`,
        [id],
      );
      const nova = rows[0];
      if (!nova) return null;

      await client.query(
        `INSERT INTO imovel_fotos (imovel_id, url, ordem)
         SELECT $2, url, ordem FROM imovel_fotos WHERE imovel_id = $1`,
        [id, nova.id],
      );

      const colsInterno = (await colunas('imovel_interno', INTERNO_NAO_COPIAR)).join(', ');
      await client.query(
        `INSERT INTO imovel_interno (imovel_id, ${colsInterno})
         SELECT $2, ${colsInterno} FROM imovel_interno WHERE imovel_id = $1`,
        [id, nova.id],
      );

      return nova;
    });

    if (!copia) return NextResponse.json({ error: 'Imóvel não encontrado' }, { status: 404 });
    return NextResponse.json(copia, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
