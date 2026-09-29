import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne, insertRow } from '@/lib/db';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const status  = searchParams.get('status');
  const tipo    = searchParams.get('tipo');
  const busca   = searchParams.get('busca');

  const where: string[] = [];
  const params: unknown[] = [];

  if (status && status !== 'todos') { params.push(status); where.push(`c.status = $${params.length}`); }
  if (tipo   && tipo   !== 'todos') { params.push(tipo);   where.push(`c.tipo = $${params.length}`); }
  if (busca) {
    params.push(`%${busca}%`);
    const p = `$${params.length}`;
    where.push(`(c.cliente_nome ILIKE ${p} OR c.imovel_titulo ILIKE ${p} OR c.cliente_cpf ILIKE ${p})`);
  }

  try {
    const data = await query(
      `SELECT c.*,
              COALESCE((
                SELECT json_agg(json_build_object('id', p.id, 'status', p.status,
                                                  'data_vencimento', p.data_vencimento, 'valor', p.valor))
                FROM parcelas p WHERE p.contrato_id = c.id
              ), '[]'::json) AS parcelas
       FROM contratos c
       ${where.length ? 'WHERE ' + where.join(' AND ') : ''}
       ORDER BY c.criado_em DESC`,
      params,
    );
    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const body = await request.json();

  if (!body.cliente_nome || !body.tipo || !body.valor_parcela || !body.data_inicio) {
    return NextResponse.json(
      { error: 'cliente_nome, tipo, valor_parcela e data_inicio são obrigatórios' },
      { status: 400 }
    );
  }

  try {
    const data = await insertRow('contratos', {
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
    });

    // Gera parcelas automaticamente via função SQL
    await query('SELECT gerar_parcelas($1)', [data.id]);

    const contrato = await queryOne(
      `SELECT c.*,
              COALESCE((SELECT json_agg(p ORDER BY p.numero) FROM parcelas p WHERE p.contrato_id = c.id), '[]'::json) AS parcelas
       FROM contratos c WHERE c.id = $1`,
      [data.id],
    );

    return NextResponse.json(contrato, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
