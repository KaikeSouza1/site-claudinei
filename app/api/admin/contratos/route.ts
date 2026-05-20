import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const status  = searchParams.get('status');
  const tipo    = searchParams.get('tipo');
  const busca   = searchParams.get('busca');

  let query = supabase
    .from('contratos')
    .select('*, parcelas(id, status, data_vencimento, valor)')
    .order('criado_em', { ascending: false });

  if (status && status !== 'todos') query = query.eq('status', status);
  if (tipo   && tipo   !== 'todos') query = query.eq('tipo',   tipo);
  if (busca) {
    query = query.or(
      `cliente_nome.ilike.%${busca}%,imovel_titulo.ilike.%${busca}%,cliente_cpf.ilike.%${busca}%`
    );
  }

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json(data);
}

export async function POST(request: NextRequest) {
  const body = await request.json();

  if (!body.cliente_nome || !body.tipo || !body.valor_parcela || !body.data_inicio) {
    return NextResponse.json(
      { error: 'cliente_nome, tipo, valor_parcela e data_inicio são obrigatórios' },
      { status: 400 }
    );
  }

  const { data, error } = await supabase
    .from('contratos')
    .insert({
      lead_id:            body.lead_id             || null,
      imovel_id:          body.imovel_id            || null,
      cliente_nome:       body.cliente_nome.trim(),
      cliente_email:      body.cliente_email?.trim()    || null,
      cliente_telefone:   body.cliente_telefone?.trim() || null,
      cliente_cpf:        body.cliente_cpf?.trim()      || null,
      proprietario_nome:  body.proprietario_nome?.trim()|| null,
      tipo:               body.tipo,
      status:             body.status              || 'ativo',
      valor_total:        body.valor_total          || null,
      valor_parcela:      body.valor_parcela,
      valor_entrada:      body.valor_entrada        || 0,
      total_parcelas:     body.total_parcelas       || 1,
      dia_vencimento:     body.dia_vencimento       || 5,
      data_inicio:        body.data_inicio,
      data_fim:           body.data_fim             || null,
      data_assinatura:    body.data_assinatura      || null,
      imovel_titulo:      body.imovel_titulo        || null,
      imovel_endereco:    body.imovel_endereco      || null,
      anotacoes:          body.anotacoes            || null,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Gera parcelas automaticamente via função SQL
  await supabase.rpc('gerar_parcelas', { p_contrato_id: data.id });

  const { data: contrato } = await supabase
    .from('contratos')
    .select('*, parcelas(*)')
    .eq('id', data.id)
    .single();

  return NextResponse.json(contrato, { status: 201 });
}
