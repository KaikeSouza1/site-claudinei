import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne, updateById } from '@/lib/db';

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  const { id } = await params;

  try {
    const data = await queryOne(
      `SELECT c.*,
              COALESCE((SELECT json_agg(p ORDER BY p.numero) FROM parcelas p WHERE p.contrato_id = c.id), '[]'::json) AS parcelas
       FROM contratos c WHERE c.id = $1`,
      [id],
    );
    if (!data) return NextResponse.json({ error: 'Contrato não encontrado' }, { status: 404 });
    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 404 });
  }
}

export async function PUT(request: NextRequest, { params }: Params) {
  const { id } = await params;
  const body   = await request.json();

  const permitidos = [
    'cliente_nome', 'cliente_email', 'cliente_telefone', 'cliente_cpf',
    'proprietario_nome', 'tipo', 'status', 'valor_total', 'valor_parcela',
    'valor_entrada', 'total_parcelas', 'dia_vencimento', 'data_inicio',
    'data_fim', 'data_assinatura', 'imovel_titulo', 'imovel_endereco',
    'anotacoes', 'nfse_ativo', 'fintech_dados', 'nfse_dados',
  ];

  try {
    const data = await updateById('contratos', id, body, permitidos);
    if (!data) return NextResponse.json({ error: 'Contrato não encontrado' }, { status: 404 });

    // Se mudou valor_parcela ou total_parcelas, regenera parcelas pendentes
    if (body.regenerar_parcelas) {
      await query('SELECT gerar_parcelas($1)', [Number(id)]);
    }

    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const { id } = await params;

  try {
    await query('DELETE FROM contratos WHERE id = $1', [id]);
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
