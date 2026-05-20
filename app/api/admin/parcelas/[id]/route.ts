import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

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

  const campos: Record<string, unknown> = {};
  for (const campo of permitidos) {
    if (campo in body) campos[campo] = body[campo];
  }

  // Baixa automática: se não passou data_pagamento, usa hoje
  if (body.status === 'pago' && !body.data_pagamento) {
    campos.data_pagamento = new Date().toISOString().split('T')[0];
  }

  const { data, error } = await supabase
    .from('parcelas')
    .update(campos)
    .eq('id', id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json(data);
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const { id } = await params;

  const { error } = await supabase.from('parcelas').delete().eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ success: true });
}
