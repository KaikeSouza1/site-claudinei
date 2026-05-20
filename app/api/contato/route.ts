import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  const body = await request.json();

  if (!body.nome || !body.telefone) {
    return NextResponse.json({ error: 'Nome e telefone são obrigatórios' }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('leads')
    .insert({
      nome:                    body.nome.trim(),
      email:                   body.email?.trim()    || null,
      telefone:                body.telefone.trim(),
      mensagem:                body.mensagem?.trim() || null,
      origem:                  body.origem           || 'site',
      status:                  'novo',
      prioridade:              'media',
      imovel_interesse_id:     body.imovel_id        || null,
      imovel_interesse_titulo: body.imovel_titulo    || null,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ success: true, id: data.id }, { status: 201 });
}
