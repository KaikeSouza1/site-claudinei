'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { MapPin, Bed, Bath, Car, Maximize, Search, SlidersHorizontal, X } from 'lucide-react'
import { supabase } from '@/lib/supabase'

const tipos = ['Casa', 'Apartamento', 'Terreno', 'Comercial', 'Cobertura', 'Loja', 'Chácara']

function formatMoney(value: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
}

function buildQueryString(filters: Record<string, string>) {
  const params = new URLSearchParams()
  Object.entries(filters).forEach(([key, value]) => {
    if (value) params.set(key, value)
  })
  return params.toString()
}

type ImoveisCatalogProps = {
  defaultFinalidade?: string
  pageTitle: string
  pageSubtitle: string
  activeSlug?: 'venda' | 'aluguel'
}

export default function ImoveisCatalog({
  defaultFinalidade = '',
  pageTitle,
  pageSubtitle,
  activeSlug,
}: ImoveisCatalogProps) {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [showFilters, setShowFilters] = useState(false)
  const [imoveis, setImoveis] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const currentQuery = useMemo(
    () => ({
      finalidade: searchParams.get('finalidade') ?? defaultFinalidade,
      tipo: searchParams.get('tipo') ?? '',
      localizacao: searchParams.get('localizacao') ?? '',
      busca: searchParams.get('busca') ?? '',
      minPreco: searchParams.get('minPreco') ?? '',
      maxPreco: searchParams.get('maxPreco') ?? '',
    }),
    [searchParams, defaultFinalidade]
  )

  const [filters, setFilters] = useState(currentQuery)
  const routeBase = activeSlug ? `/imoveis/${activeSlug}` : '/imoveis'

  useEffect(() => {
    setFilters(currentQuery)
  }, [currentQuery])

  const loadImoveis = async (queryFilters: typeof filters) => {
    setLoading(true)
    setError('')
    
    try {
      let query = supabase
        .from('imoveis')
        .select('*')
        .eq('ativo', true)
        .or('status.is.null,status.eq.disponivel,status.eq.reservado')

      if (queryFilters.finalidade) {
        query = query.ilike('finalidade', `%${queryFilters.finalidade.toLowerCase()}%`)
      }

      if (queryFilters.tipo) {
        query = query.eq('tipo', queryFilters.tipo)
      }

      if (queryFilters.localizacao) {
        query = query.or(`cidade.ilike.%${queryFilters.localizacao}%,bairro.ilike.%${queryFilters.localizacao}%`)
      }

      if (queryFilters.busca) {
        query = query.ilike('titulo', `%${queryFilters.busca}%`)
      }

      if (queryFilters.minPreco) {
        query = query.gte('preco', parseFloat(queryFilters.minPreco))
      }
      if (queryFilters.maxPreco) {
        query = query.lte('preco', parseFloat(queryFilters.maxPreco))
      }

      // CORREÇÃO: Alterado de 'created_at' para 'id' para evitar o erro de coluna inexistente
      const { data, error: supabaseError } = await query.order('id', { ascending: false })

      if (supabaseError) throw supabaseError

      setImoveis(data || [])
    } catch (err) {
      console.error('Erro ao buscar imóveis:', err)
      setError('Não foi possível carregar os imóveis.')
      setImoveis([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadImoveis(currentQuery)
  }, [currentQuery])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const qs = buildQueryString(filters)
    router.replace(`${routeBase}${qs ? `?${qs}` : ''}`)
    setShowFilters(false)
  }

  const handleReset = () => {
    const base = { finalidade: defaultFinalidade, tipo: '', localizacao: '', busca: '', minPreco: '', maxPreco: '' }
    setFilters(base)
    router.replace(routeBase)
  }

  const hasActiveFilters = !!(filters.tipo || filters.localizacao || filters.busca || filters.minPreco || filters.maxPreco)

  return (
    <main className="flex-1 bg-[#223a51] flex flex-col relative overflow-hidden text-slate-100 min-h-screen">
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-luxury-gradient opacity-95" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[#223a51]" />

        <div className="relative z-10 max-w-7xl mx-auto px-6 md:px-10 pt-36 pb-16">
          <div className="max-w-2xl">
            <div className="flex items-center gap-3 mb-5">
              <span className="w-8 h-px bg-gold block" />
              <span className="text-[10px] text-gold uppercase tracking-[0.3em]">{pageSubtitle}</span>
            </div>
            <h1 className="font-serif text-5xl md:text-6xl text-white leading-tight mb-4">
              {pageTitle}
            </h1>
            <p className="text-slate-300 text-sm leading-relaxed max-w-lg">
              Explore nossa seleção exclusiva para encontrar o imóvel ideal.
            </p>
          </div>
        </div>
      </div>

      <div className="sticky top-0 z-30 bg-[#223a51]/95 backdrop-blur-xl border-b border-slate-500/20">
        <div className="max-w-7xl mx-auto px-6 md:px-10 py-4">
          <form onSubmit={handleSubmit} className="flex items-center gap-3">
            <div className="flex-1 relative">
              <Search size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              <input
                type="text"
                value={filters.busca}
                onChange={e => setFilters({ ...filters, busca: e.target.value })}
                placeholder="Buscar por título, bairro ou cidade..."
                className="w-full bg-[#2f4968]/80 border border-slate-500/40 text-white text-sm pl-10 pr-4 py-3 rounded-xl focus:outline-none focus:border-gold/60 placeholder:text-slate-500 transition-colors"
              />
            </div>

            <button
              type="button"
              onClick={() => setShowFilters(v => !v)}
              className={`flex items-center gap-2 px-4 py-3 rounded-xl border text-xs font-bold uppercase tracking-wider transition-all ${
                showFilters || hasActiveFilters
                  ? 'bg-gold text-[#04122b] border-gold'
                  : 'border-slate-500/40 text-slate-300 hover:border-gold/40 hover:text-gold'
              }`}
            >
              <SlidersHorizontal size={14} />
              Filtros
              {hasActiveFilters && (
                <span className="bg-[#04122b] text-gold rounded-full w-4 h-4 flex items-center justify-center text-[9px] font-black">
                  {[filters.tipo, filters.localizacao, filters.minPreco, filters.maxPreco].filter(Boolean).length}
                </span>
              )}
            </button>

            <button
              type="submit"
              className="bg-gold text-[#04122b] px-6 py-3 rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-gold-light transition-colors"
            >
              Buscar
            </button>
          </form>

          {showFilters && (
            <div className="mt-3 pt-3 border-t border-slate-500/20">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <input
                  type="text"
                  value={filters.localizacao}
                  onChange={e => setFilters({ ...filters, localizacao: e.target.value })}
                  placeholder="Cidade ou bairro"
                  className="bg-[#2f4968]/80 border border-slate-500/40 text-white text-sm px-4 py-2.5 rounded-xl focus:outline-none focus:border-gold/60 placeholder:text-slate-500"
                />
                <select
                  value={filters.tipo}
                  onChange={e => setFilters({ ...filters, tipo: e.target.value })}
                  className="bg-[#2f4968]/80 border border-slate-500/40 text-slate-200 text-sm px-4 py-2.5 rounded-xl focus:outline-none focus:border-gold/60 appearance-none"
                >
                  <option value="">Tipo de imóvel</option>
                  {tipos.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
                <input
                  type="number"
                  value={filters.minPreco}
                  onChange={e => setFilters({ ...filters, minPreco: e.target.value })}
                  placeholder="Preço mínimo"
                  className="bg-[#2f4968]/80 border border-slate-500/40 text-white text-sm px-4 py-2.5 rounded-xl focus:outline-none focus:border-gold/60 placeholder:text-slate-500"
                />
                <input
                  type="number"
                  value={filters.maxPreco}
                  onChange={e => setFilters({ ...filters, maxPreco: e.target.value })}
                  placeholder="Preço máximo"
                  className="bg-[#2f4968]/80 border border-slate-500/40 text-white text-sm px-4 py-2.5 rounded-xl focus:outline-none focus:border-gold/60 placeholder:text-slate-500"
                />
              </div>
              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={handleReset}
                  className="mt-3 flex items-center gap-1.5 text-xs text-slate-400 hover:text-red-400 transition-colors"
                >
                  <X size={12} /> Limpar filtros
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 md:px-10 py-10">
        <div className="flex items-center justify-between mb-8">
          <div className="text-slate-500 text-sm">
            {loading ? (
              <span className="animate-pulse">Buscando imóveis...</span>
            ) : (
              <div>
                <span className="text-white font-semibold text-lg font-serif">{imoveis.length}</span>
                <span className="ml-2">{imoveis.length === 1 ? 'imóvel encontrado' : 'imóveis encontrados'}</span>
              </div>
            )}
          </div>

          <div className="hidden md:flex items-center gap-1 bg-[#2f4968]/60 border border-slate-500/30 rounded-full px-2 py-1.5">
            <Link
              href="/imoveis/venda"
              className={`px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all ${
                activeSlug === 'venda'
                  ? 'bg-gold text-[#04122b]'
                  : 'text-slate-300 hover:text-gold'
              }`}
            >
              Venda
            </Link>
            <Link
              href="/imoveis/aluguel"
              className={`px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all ${
                activeSlug === 'aluguel'
                  ? 'bg-gold text-[#04122b]'
                  : 'text-slate-300 hover:text-gold'
              }`}
            >
              Locação
            </Link>
          </div>
        </div>

        {error && (
          <div className="rounded-2xl border border-red-900/40 bg-red-950/20 p-8 text-red-400 text-sm text-center">
            {error}
          </div>
        )}

        {!loading && !error && imoveis.length === 0 && (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-16 h-16 rounded-full border border-slate-500/30 bg-[#2f4968]/40 flex items-center justify-center mb-6">
              <Search size={22} className="text-slate-500" />
            </div>
            <p className="text-white font-serif text-xl mb-2">Nenhum imóvel encontrado</p>
            <p className="text-slate-400 text-sm max-w-xs">
              Tente ajustar os filtros ou ampliar a busca para ver mais opções.
            </p>
            <button
              onClick={handleReset}
              className="mt-6 text-xs text-gold border border-gold/30 px-5 py-2.5 rounded-full hover:bg-gold/10 transition-colors uppercase tracking-wider font-bold"
            >
              Limpar filtros
            </button>
          </div>
        )}

        {!loading && imoveis.length > 0 && (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {imoveis.map((imovel) => (
              <Link
                key={imovel.id}
                href={`/imovel/${imovel.id}`}
                className="group flex flex-col rounded-2xl border border-slate-500/30 bg-[#2f4968]/40 overflow-hidden hover:-translate-y-1 transition-all duration-300 hover:border-gold/20 hover:shadow-[0_8px_40px_rgba(197,160,89,0.08)]"
              >
                <div className="relative h-52 bg-[#2f4968] overflow-hidden">
                  {imovel.imagem_url ? (
                    <img
                      src={imovel.imagem_url}
                      alt={imovel.titulo}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-500 text-xs uppercase tracking-widest">
                      Sem imagem
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-[#2f4968] via-transparent to-transparent opacity-60" />
                  <div className="absolute top-4 left-4 bg-[#223a51]/80 backdrop-blur-sm text-gold text-[9px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border border-gold/20">
                    {imovel.tipo}
                  </div>
                </div>

                <div className="flex flex-col flex-1 p-5">
                  <div className="flex items-center gap-1.5 text-slate-400 text-xs mb-2">
                    <MapPin size={11} className="text-gold flex-shrink-0" />
                    <span className="truncate">{imovel.bairro ? `${imovel.bairro}, ` : ''}{imovel.cidade}</span>
                  </div>

                  <h3 className="font-serif text-lg text-white leading-snug mb-3 line-clamp-2 group-hover:text-gold transition-colors">
                    {imovel.titulo}
                  </h3>

                  {(imovel.quartos > 0 || imovel.banheiros > 0 || imovel.vagas > 0 || imovel.area > 0) && (
                    <div className="flex flex-wrap gap-3 text-[11px] text-slate-400 mb-4 border-t border-slate-500/20 pt-3 mt-auto">
                      {imovel.quartos > 0 && (
                        <span className="flex items-center gap-1">
                          <Bed size={12} className="text-slate-500" />
                          {imovel.quartos} {imovel.quartos === 1 ? 'quarto' : 'quartos'}
                        </span>
                      )}
                      {imovel.banheiros > 0 && (
                        <span className="flex items-center gap-1">
                          <Bath size={12} className="text-slate-500" />
                          {imovel.banheiros} {imovel.banheiros === 1 ? 'banheiro' : 'banheiros'}
                        </span>
                      )}
                      {imovel.vagas > 0 && (
                        <span className="flex items-center gap-1">
                          <Car size={12} className="text-slate-500" />
                          {imovel.vagas} {imovel.vagas === 1 ? 'vaga' : 'vagas'}
                        </span>
                      )}
                      {imovel.area > 0 && (
                        <span className="flex items-center gap-1">
                          <Maximize size={12} className="text-slate-500" />
                          {imovel.area} m²
                        </span>
                      )}
                    </div>
                  )}

                  <div className="flex items-center justify-between mt-auto pt-3 border-t border-slate-500/20">
                    <span className="font-serif text-xl text-gold">{formatMoney(imovel.preco)}</span>
                    <span className="text-[10px] text-slate-500 group-hover:text-gold transition-colors uppercase tracking-wider font-bold">
                      Ver detalhes →
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        {loading && (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="rounded-2xl border border-slate-500/30 bg-[#2f4968]/40 overflow-hidden animate-pulse">
                <div className="h-52 bg-[#2f4968]" />
                <div className="p-5 space-y-3">
                  <div className="h-3 bg-slate-500/40 rounded w-1/3" />
                  <div className="h-5 bg-slate-500/40 rounded w-3/4" />
                  <div className="h-4 bg-slate-500/40 rounded w-1/2" />
                  <div className="h-6 bg-slate-500/40 rounded w-2/5 mt-4" />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  )
}