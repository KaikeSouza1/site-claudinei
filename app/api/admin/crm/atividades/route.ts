import { NextRequest, NextResponse } from 'next/server';
import { query, insertRow } from '@/lib/db';

export async function GET(request: NextRequest) {
  const leadId = new URL(request.url).searchParams.get('lead_id');

  try {
    const data = leadId
      ? await query('SELECT * FROM atividades WHERE lead_id = $1 ORDER BY data_atividade DESC', [leadId])
      : await query('SELECT * FROM atividades ORDER BY data_atividade DESC');
    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const body = await request.json();

  if (!body.lead_id || !body.tipo || !body.descricao) {
    return NextResponse.json({ error: 'lead_id, tipo e descricao são obrigatórios' }, { status: 400 });
  }

  try {
    const data = await insertRow('atividades', {
      lead_id:        body.lead_id,
      tipo:           body.tipo,
      descricao:      body.descricao,
      data_atividade: body.data_atividade || new Date().toISOString(),
    });
    return NextResponse.json(data, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const id = new URL(request.url).searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'id é obrigatório' }, { status: 400 });

  try {
    await query('DELETE FROM atividades WHERE id = $1', [id]);
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
