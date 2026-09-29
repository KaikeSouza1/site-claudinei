import { NextRequest, NextResponse } from 'next/server';
import { query, updateById } from '@/lib/db';

type Params = { params: Promise<{ id: string }> };

// Baixa manual (PUT) — registra pagamento de uma parcela
export async function PUT(request: NextRequest, { params }: Params) {
  const { id } = await params;
  const body   = await request.json();

  const permitidos = [
    'status', 'data_pagamento', 'valor_pago', 'forma_pagamento',
    'comprovante_url', 'anotacoes',
    // campos de integração futura (plugáveis sem refatorar UI)
    'boleto_id', 'boleto_url', 'boleto_dados',
    'nfse_numero', 'nfse_url', 'nfse_dados',
  ];

  const campos: Record<string, unknown> = { ...body };

  // Baixa automática: se não passou data_pagamento, usa hoje
  if (body.status === 'pago' && !body.data_pagamento) {
    campos.data_pagamento = new Date().toISOString().split('T')[0];
  }

  try {
    const data = await updateById('parcelas', id, campos, permitidos);
    if (!data) return NextResponse.json({ error: 'Parcela não encontrada' }, { status: 404 });
    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const { id } = await params;

  try {
    await query('DELETE FROM parcelas WHERE id = $1', [id]);
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
