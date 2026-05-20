import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  const leadId = new URL(request.url).searchParams.get('lead_id');

  let query = supabase
    .from('atividades')
    .select('*')
    .order('data_atividade', { ascending: false });

  if (leadId) query = query.eq('lead_id', leadId);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json(data);
}

export async function POST(request: NextRequest) {
  const body = await request.json();

  if (!body.lead_id || !body.tipo || !body.descricao) {
    return NextResponse.json({ error: 'lead_id, tipo e descricao são obrigatórios' }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('atividades')
    .insert({
      lead_id:        body.lead_id,
      tipo:           body.tipo,
      descricao:      body.descricao,
      data_atividade: body.data_atividade || new Date().toISOString(),
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json(data, { status: 201 });
}

export async function DELETE(request: NextRequest) {
  const id = new URL(request.url).searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'id é obrigatório' }, { status: 400 });

  const { error } = await supabase.from('atividades').delete().eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ success: true });
}
