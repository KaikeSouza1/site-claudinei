import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne, updateById } from '@/lib/db';

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  const { id } = await params;

  try {
    const data = await queryOne(
      `SELECT l.*,
              COALESCE((SELECT json_agg(a ORDER BY a.data_atividade DESC) FROM atividades a WHERE a.lead_id = l.id), '[]'::json) AS atividades
       FROM leads l WHERE l.id = $1`,
      [id],
    );
    if (!data) return NextResponse.json({ error: 'Lead não encontrado' }, { status: 404 });
    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 404 });
  }
}

export async function PUT(request: NextRequest, { params }: Params) {
  const { id } = await params;
  const body   = await request.json();

  const permitidos = [
    'nome', 'email', 'telefone', 'mensagem', 'origem',
    'status', 'prioridade', 'imovel_interesse_id',
    'imovel_interesse_titulo', 'anotacoes',
  ];

  try {
    const data = await updateById('leads', id, body, permitidos);
    if (!data) return NextResponse.json({ error: 'Lead não encontrado' }, { status: 404 });
    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const { id } = await params;

  try {
    await query('DELETE FROM leads WHERE id = $1', [id]);
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
