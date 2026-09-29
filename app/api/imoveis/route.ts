import { NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { COLUNAS_PUBLICAS } from '@/lib/imoveis'

export async function GET(req: Request) {
  const url = new URL(req.url)
  const finalidade  = url.searchParams.get('finalidade')?.trim() ?? ''
  const tipo        = url.searchParams.get('tipo')?.trim() ?? ''
  const localizacao = url.searchParams.get('localizacao')?.trim() ?? ''
  const busca       = url.searchParams.get('busca')?.trim() ?? ''
  const minPreco    = parseFloat(url.searchParams.get('minPreco') ?? '')
  const maxPreco    = parseFloat(url.searchParams.get('maxPreco') ?? '')
  const destaque    = url.searchParams.get('destaque') === '1'
  const limite      = Math.min(Number(url.searchParams.get('limite')) || 500, 500)

  const where = [
    'ativo = true',
    "(status IS NULL OR status IN ('disponivel', 'reservado'))",
  ]
  const params: unknown[] = []
  const add = (value: unknown) => { params.push(value); return `$${params.length}` }

  if (destaque) where.push('destaque = true')

  // "Venda" / "Locação": casa pelo radical para aceitar variações já gravadas ("Aluguel/Locação" etc.)
  if (/vend/i.test(finalidade)) where.push(`finalidade ILIKE ${add('%vend%')}`)
  else if (/loca|alug/i.test(finalidade)) where.push(`(finalidade ILIKE ${add('%loca%')} OR finalidade ILIKE ${add('%alug%')})`)
  else if (finalidade) where.push(`finalidade ILIKE ${add(`%${finalidade}%`)}`)

  if (tipo) where.push(`tipo ILIKE ${add(tipo)}`)

  if (localizacao) {
    const p = add(`%${localizacao}%`)
    where.push(`(cidade ILIKE ${p} OR bairro ILIKE ${p})`)
  }

  if (busca) {
    const p = add(`%${busca}%`)
    where.push(`(titulo ILIKE ${p} OR descricao ILIKE ${p} OR endereco ILIKE ${p} OR bairro ILIKE ${p} OR cidade ILIKE ${p} OR codigo ILIKE ${p})`)
  }

  if (!Number.isNaN(minPreco)) where.push(`preco >= ${add(minPreco)}`)
  if (!Number.isNaN(maxPreco)) where.push(`preco <= ${add(maxPreco)}`)

  try {
    const data = await query(
      `SELECT ${COLUNAS_PUBLICAS} FROM imoveis WHERE ${where.join(' AND ')} ORDER BY id DESC LIMIT ${limite}`,
      params,
    )
    return NextResponse.json(data)
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}
