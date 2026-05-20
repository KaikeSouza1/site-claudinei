import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const status     = searchParams.get('status');
  const origem     = searchParams.get('origem');
  const prioridade = searchParams.get('prioridade');
  const busca      = searchParams.get('busca');

  let query = supabase
    .from('leads')
    .select('*, atividades(id, tipo, criado_em)')
    .order('criado_em', { ascending: false });

  if (status    && status    !== 'todos') query = query.eq('status',    status);
  if (origem    && origem    !== 'todos') query = query.eq('origem',    origem);
  if (prioridade && prioridade !== 'todos') query = query.eq('prioridade', prioridade);
  if (busca) {
    query = query.or(`nome.ilike.%${busca}%,email.ilike.%${busca}%,telefone.ilike.%${busca}%`);
  }

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json(data);
}

export async function POST(request: NextRequest) {
  const body = await request.json();

  if (!body.nome) {
    return NextResponse.json({ error: 'Nome é obrigatório' }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('leads')
    .insert({
      nome:                    body.nome,
      email:                   body.email                   || null,
      telefone:                body.telefone                || null,
      mensagem:                body.mensagem                || null,
      origem:                  body.origem                  || 'site',
      status:                  body.status                  || 'novo',
      prioridade:              body.prioridade              || 'media',
      imovel_interesse_id:     body.imovel_interesse_id     || null,
      imovel_interesse_titulo: body.imovel_interesse_titulo || null,
      anotacoes:               body.anotacoes               || null,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json(data, { status: 201 });
}
