import { NextResponse } from 'next/server'
import { query, queryOne } from '@/lib/db'
import { COLUNAS_PUBLICAS } from '@/lib/imoveis'

type Params = { params: Promise<{ id: string }> }

export async function GET(_req: Request, { params }: Params) {
  const { id } = await params
  if (!/^\d+$/.test(id)) return NextResponse.json({ error: 'Imóvel não encontrado' }, { status: 404 })

  try {
    const imovel = await queryOne(`SELECT ${COLUNAS_PUBLICAS} FROM imoveis WHERE id = $1 AND ativo = true`, [id])
    if (!imovel) return NextResponse.json({ error: 'Imóvel não encontrado' }, { status: 404 })

    const fotos = await query<{ url: string }>(
      'SELECT url FROM imovel_fotos WHERE imovel_id = $1 ORDER BY ordem', [id],
    )
    return NextResponse.json({ ...imovel, fotos: fotos.map((f) => f.url) })
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}
