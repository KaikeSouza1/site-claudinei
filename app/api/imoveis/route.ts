import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

const isRent = (value: string) => /loca/i.test(value)
const isSale = (value: string) => /vend/i.test(value)

function sanitizeTerm(value: string) {
  return value
    .trim()
    .replace(/[%_,'"]/g, '')
    .replace(/\s+/g, ' ')
}

export async function GET(req: Request) {
  const url = new URL(req.url)
  const finalidade = url.searchParams.get('finalidade') ?? ''
  const tipo = url.searchParams.get('tipo') ?? ''
  const localizacao = url.searchParams.get('localizacao') ?? ''
  const busca = url.searchParams.get('busca') ?? ''
  const minPreco = Number(url.searchParams.get('minPreco') ?? '')
  const maxPreco = Number(url.searchParams.get('maxPreco') ?? '')

  let query = supabase
    .from('imoveis')
    .select('*')
    .eq('ativo', true)
    .not('status', 'in', '(vendido,alugado)')

  if (finalidade) {
    const finalidadeSanitizada = sanitizeTerm(finalidade)
    query = query.ilike('finalidade', `%${finalidadeSanitizada}%`)
  }

  if (tipo) {
    query = query.ilike('tipo', `%${sanitizeTerm(tipo)}%`)
  }

  const searchText = sanitizeTerm([busca, localizacao].filter(Boolean).join(' '))
  if (searchText) {
    const encoded = `%${searchText}%`
    const searchColumns = ['titulo', 'descricao', 'endereco', 'bairro', 'cidade']
    query = query.or(searchColumns.map(column => `${column}.ilike.${encoded}`).join(','))
  }

  if (!Number.isNaN(minPreco)) {
    query = query.gte('preco', minPreco)
  }

  if (!Number.isNaN(maxPreco)) {
    query = query.lte('preco', maxPreco)
  }

  const { data, error } = await query.order('preco', { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data ?? [])
}
