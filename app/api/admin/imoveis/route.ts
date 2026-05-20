import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  const busca = new URL(request.url).searchParams.get('busca') ?? '';

  let query = supabase
    .from('imoveis')
    .select('id, titulo, endereco, bairro, cidade, preco, tipo, finalidade, status, imagem_url, quartos, area')
    .order('criado_em', { ascending: false });

  if (busca.trim()) {
    query = query.or(`titulo.ilike.%${busca}%,endereco.ilike.%${busca}%,bairro.ilike.%${busca}%`);
  }

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json(data ?? []);
}
