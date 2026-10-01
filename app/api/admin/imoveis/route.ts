import { NextRequest, NextResponse } from 'next/server';
import { query, withTransaction } from '@/lib/db';
import { revalidarImovel } from '@/lib/revalidar';
import { completarCoordenadas, normalizarImovel, salvarGaleria, salvarInterno } from '@/lib/imoveis';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const busca  = searchParams.get('busca') ?? '';
  const ativos = searchParams.get('ativos'); // '1' só ativos, '0' só inativos, ausente = todos

  const where: string[] = [];
  const params: unknown[] = [];

  if (ativos === '1') where.push('ativo = true');
  if (ativos === '0') where.push('ativo = false');
  if (busca.trim()) {
    params.push(`%${busca.trim()}%`);
    where.push(`(titulo ILIKE $1 OR endereco ILIKE $1 OR bairro ILIKE $1)`);
  }

  try {
    const data = await query(
      `SELECT * FROM imoveis ${where.length ? 'WHERE ' + where.join(' AND ') : ''} ORDER BY criado_em DESC`,
      params,
    );
    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const dados = normalizarImovel(body);
  await completarCoordenadas(dados);

  if (!dados.titulo || !dados.cidade || Number.isNaN(dados.preco)) {
    return NextResponse.json({ error: 'titulo, cidade e preco são obrigatórios' }, { status: 400 });
  }

  try {
    const imovel = await withTransaction(async (client) => {
      const cols = Object.keys(dados);
      const { rows } = await client.query(
        `INSERT INTO imoveis (${cols.join(', ')}) VALUES (${cols.map((_, i) => `$${i + 1}`).join(', ')}) RETURNING *`,
        cols.map((c) => dados[c]),
      );
      const criado = rows[0];
      await salvarGaleria(client, criado.id, Array.isArray(body.galeria) ? body.galeria : [], criado.imagem_url ?? '');
      if (body.interno && typeof body.interno === 'object') await salvarInterno(client, criado.id, body.interno);
      return criado;
    });
    revalidarImovel(imovel.id);
    return NextResponse.json(imovel, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
