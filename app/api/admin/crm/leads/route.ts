import { NextRequest, NextResponse } from 'next/server';
import { query, insertRow } from '@/lib/db';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const status     = searchParams.get('status');
  const origem     = searchParams.get('origem');
  const prioridade = searchParams.get('prioridade');
  const busca      = searchParams.get('busca');

  const where: string[] = [];
  const params: unknown[] = [];

  if (status     && status     !== 'todos') { params.push(status);     where.push(`l.status = $${params.length}`); }
  if (origem     && origem     !== 'todos') { params.push(origem);     where.push(`l.origem = $${params.length}`); }
  if (prioridade && prioridade !== 'todos') { params.push(prioridade); where.push(`l.prioridade = $${params.length}`); }
  if (busca) {
    params.push(`%${busca}%`);
    const p = `$${params.length}`;
    where.push(`(l.nome ILIKE ${p} OR l.email ILIKE ${p} OR l.telefone ILIKE ${p})`);
  }

  try {
    const data = await query(
      `SELECT l.*,
              COALESCE((
                SELECT json_agg(json_build_object('id', a.id, 'tipo', a.tipo, 'criado_em', a.criado_em))
                FROM atividades a WHERE a.lead_id = l.id
              ), '[]'::json) AS atividades
       FROM leads l
       ${where.length ? 'WHERE ' + where.join(' AND ') : ''}
       ORDER BY l.criado_em DESC`,
      params,
    );
    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const body = await request.json();

  if (!body.nome) {
    return NextResponse.json({ error: 'Nome é obrigatório' }, { status: 400 });
  }

  try {
    const data = await insertRow('leads', {
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
    });
    return NextResponse.json(data, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
