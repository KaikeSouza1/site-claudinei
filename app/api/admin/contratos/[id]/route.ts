import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  const { id } = await params;

  const { data, error } = await supabase
    .from('contratos')
    .select('*, parcelas(*)')
    .eq('id', id)
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 404 });

  if (data.parcelas) {
    data.parcelas.sort((a: any, b: any) => a.numero - b.numero);
  }

  return NextResponse.json(data);
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

  const campos: Record<string, unknown> = {};
  for (const campo of permitidos) {
    if (campo in body) campos[campo] = body[campo];
  }

  const { data, error } = await supabase
    .from('contratos')
    .update(campos)
    .eq('id', id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Se mudou valor_parcela ou total_parcelas, regenera parcelas pendentes
  if (body.regenerar_parcelas) {
    await supabase.rpc('gerar_parcelas', { p_contrato_id: Number(id) });
  }

  return NextResponse.json(data);
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const { id } = await params;

  const { error } = await supabase.from('contratos').delete().eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ success: true });
}
