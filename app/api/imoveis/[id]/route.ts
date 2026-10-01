import { NextResponse } from 'next/server'
import { buscarImovelPublico } from '@/lib/imovel-publico'

type Params = { params: Promise<{ id: string }> }

export async function GET(_req: Request, { params }: Params) {
  const { id } = await params

  try {
    const imovel = await buscarImovelPublico(id)
    if (!imovel) return NextResponse.json({ error: 'Imóvel não encontrado' }, { status: 404 })
    return NextResponse.json(imovel)
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}
