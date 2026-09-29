import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne, withTransaction } from '@/lib/db';
import { normalizarImovel, salvarGaleria } from '@/lib/imoveis';

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  const { id } = await params;

  try {
    const imovel = await queryOne('SELECT * FROM imoveis WHERE id = $1', [id]);
    if (!imovel) return NextResponse.json({ error: 'Imóvel não encontrado' }, { status: 404 });

    const fotos = await query<{ url: string }>(
      'SELECT url FROM imovel_fotos WHERE imovel_id = $1 ORDER BY ordem', [id],
    );
    return NextResponse.json({ ...imovel, fotos: fotos.map((f) => f.url) });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: Params) {
  const { id } = await params;
  const body = await request.json();
  const dados = normalizarImovel(body);

  try {
    const imovel = await withTransaction(async (client) => {
      const cols = Object.keys(dados);
      const { rows } = cols.length
        ? await client.query(
            `UPDATE imoveis SET ${cols.map((c, i) => `${c} = $${i + 2}`).join(', ')} WHERE id = $1 RETURNING *`,
            [id, ...cols.map((c) => dados[c])],
          )
        : await client.query('SELECT * FROM imoveis WHERE id = $1', [id]);

      const atualizado = rows[0];
      if (!atualizado) return null;

      if (Array.isArray(body.galeria)) {
        await salvarGaleria(client, id, body.galeria, atualizado.imagem_url ?? '');
      }
      return atualizado;
    });

    if (!imovel) return NextResponse.json({ error: 'Imóvel não encontrado' }, { status: 404 });
    return NextResponse.json(imovel);
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}

// Exclusão lógica: o anúncio sai do site mas pode ser reativado no painel.
export async function DELETE(_req: NextRequest, { params }: Params) {
  const { id } = await params;

  try {
    await query('UPDATE imoveis SET ativo = false WHERE id = $1', [id]);
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
