'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { ArrowRight, MapPin, Bed, Bath, Car, Maximize, Search, SlidersHorizontal, Home } from 'lucide-react'

const tipos = ['Casa', 'Apartamento', 'Terreno', 'Comercial', 'Cobertura', 'Loja']

function formatMoney(value: number) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value)
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

export default function ImoveisCatalog({ defaultFinalidade = '', pageTitle, pageSubtitle, activeSlug }: ImoveisCatalogProps) {
  const searchParams = useSearchParams()
  const router = useRouter()

  const parseParams = () => {
    const params = {
      finalidade: searchParams.get('finalidade') ?? defaultFinalidade,
      tipo: searchParams.get('tipo') ?? '',
      localizacao: searchParams.get('localizacao') ?? '',
      busca: searchParams.get('busca') ?? '',
      minPreco: searchParams.get('minPreco') ?? '',
      maxPreco: searchParams.get('maxPreco') ?? ''
    }
    return params
  }

  const [filters, setFilters] = useState(parseParams())
  const [imoveis, setImoveis] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const routeBase = activeSlug ? `/imoveis/${activeSlug}` : '/imoveis'

  useEffect(() => {
    setFilters(parseParams())
  }, [searchParams, defaultFinalidade])

  const searchLabel = useMemo(() => {
    if (filters.finalidade) {
      return filters.finalidade.toLowerCase().includes('loc') ? 'Aluguel' : 'Venda'
    }
    return 'Todos'
  }, [filters.finalidade])

  const loadImoveis = async (queryFilters: typeof filters) => {
    setLoading(true)
    setError('')

    const params = {
      ...queryFilters,
      finalidade: queryFilters.finalidade || defaultFinalidade
    }
    const queryString = buildQueryString(params)

    try {
      const res = await fetch(`/api/imoveis?${queryString}`)
      if (!res.ok) throw new Error('Não foi possível carregar os imóveis.')
      const data = await res.json()
      setImoveis(Array.isArray(data) ? data : [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao buscar imóveis.')
      setImoveis([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadImoveis(parseParams())
  }, [searchParams, defaultFinalidade])

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const next = {
      ...filters,
      finalidade: filters.finalidade || defaultFinalidade
    }
    const queryString = buildQueryString(next)
    router.replace(`${routeBase}${queryString ? `?${queryString}` : ''}`)
  }

  const handleReset = () => {
    const baseFilters = {
      finalidade: defaultFinalidade,
      tipo: '',
      localizacao: '',
      busca: '',
      minPreco: '',
      maxPreco: ''
    }
    setFilters(baseFilters)
    router.replace(routeBase)
  }

  return (
    <main className="flex-1 bg-[#020b18] text-slate-100">
      <div className="absolute inset-x-0 top-0 h-[520px] bg-luxury-gradient opacity-80 -z-10"></div>
      <div className="max-w-7xl mx-auto px-6 md:px-10 pt-32 pb-24">

        <div className="flex flex-col gap-5 md:gap-8">
          <div className="rounded-[36px] border border-slate-700/60 bg-[#04122b]/50 backdrop-blur-2xl p-8 md:p-10 shadow-[0_20px_70px_rgba(0,0,0,0.35)]">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="max-w-2xl">
                <span className="text-[10px] uppercase tracking-[0.35em] text-gold">{pageSubtitle}</span>
                <h1 className="mt-4 text-4xl md:text-5xl font-serif text-white leading-tight">{pageTitle}</h1>
                <p className="mt-4 text-slate-300 max-w-2xl leading-relaxed">Navegue pelos imóveis mais desejados do mercado, com filtros inteligentes para encontrar a casa ideal para comprar ou alugar.</p>
              </div>

              <div className="flex flex-wrap gap-3">
                <Link href="/imoveis/venda" className={`px-6 py-3 rounded-full text-xs font-semibold tracking-widest uppercase transition ${activeSlug === 'venda' ? 'bg-gold text-[#04122b]' : 'border border-slate-700 text-slate-300 hover:border-gold hover:text-gold'}`}>
                  Imóveis à Venda
                </Link>
                <Link href="/imoveis/aluguel" className={`px-6 py-3 rounded-full text-xs font-semibold tracking-widest uppercase transition ${activeSlug === 'aluguel' ? 'bg-gold text-[#04122b]' : 'border border-slate-700 text-slate-300 hover:border-gold hover:text-gold'}`}>
                  Imóveis para Alugar
                </Link>
              </div>
            </div>
          </div>

          <section className="rounded-[32px] border border-slate-700/60 bg-[#020b18]/90 p-6 md:p-8 shadow-[0_24px_80px_rgba(0,0,0,0.35)]">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-6">
              <div>
                <p className="text-[10px] uppercase tracking-[0.35em] text-gold mb-2">Busca inteligente</p>
                <h2 className="text-2xl font-serif text-white">Encontre o imóvel ideal</h2>
              </div>
              <button type="button" onClick={handleReset} className="inline-flex items-center justify-center rounded-full border border-slate-700 px-4 py-3 text-xs uppercase tracking-[0.35em] text-slate-300 hover:border-gold hover:text-gold transition">
                Limpar filtros
              </button>
            </div>

            <form onSubmit={handleSubmit} className="grid gap-4 lg:grid-cols-[1.8fr_1fr]">
              <div className="grid gap-4">
                <div className="grid gap-4 md:grid-cols-2">
                  {defaultFinalidade === '' && (
                    <select
                      value={filters.finalidade}
                      onChange={(e) => setFilters({ ...filters, finalidade: e.target.value })}
                      className="w-full bg-[#020b18]/70 border border-slate-700 text-slate-200 text-sm px-4 py-4 rounded-2xl focus:outline-none focus:border-gold appearance-none"
                    >
                      <option value="">Finalidade</option>
                      <option value="Venda">Venda</option>
                      <option value="Locação">Locação</option>
                      <option value="Locacao">Locação</option>
                    </select>
                  )}

                  <input
                    type="text"
                    value={filters.busca}
                    onChange={(e) => setFilters({ ...filters, busca: e.target.value })}
                    placeholder="Busca por título, bairro ou cidade"
                    className="w-full bg-[#020b18]/70 border border-slate-700 text-white text-sm px-4 py-4 rounded-2xl focus:outline-none focus:border-gold"
                  />
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                  <input
                    type="text"
                    value={filters.localizacao}
                    onChange={(e) => setFilters({ ...filters, localizacao: e.target.value })}
                    placeholder="Localização"
                    className="w-full bg-[#020b18]/70 border border-slate-700 text-white text-sm px-4 py-4 rounded-2xl focus:outline-none focus:border-gold"
                  />
                  <select
                    value={filters.tipo}
                    onChange={(e) => setFilters({ ...filters, tipo: e.target.value })}
                    className="w-full bg-[#020b18]/70 border border-slate-700 text-slate-200 text-sm px-4 py-4 rounded-2xl focus:outline-none focus:border-gold appearance-none"
                  >
                    <option value="">Tipo de imóvel</option>
                    {tipos.map((tipo) => (
                      <option key={tipo} value={tipo}>{tipo}</option>
                    ))}
                  </select>
                  <div className="grid grid-cols-2 gap-4">
                    <input
                      type="number"
                      value={filters.minPreco}
                      onChange={(e) => setFilters({ ...filters, minPreco: e.target.value })}
                      placeholder="Mínimo"
                      className="w-full bg-[#020b18]/70 border border-slate-700 text-white text-sm px-4 py-4 rounded-2xl focus:outline-none focus:border-gold"
                    />
                    <input
                      type="number"
                      value={filters.maxPreco}
                      onChange={(e) => setFilters({ ...filters, maxPreco: e.target.value })}
                      placeholder="Máximo"
                      className="w-full bg-[#020b18]/70 border border-slate-700 text-white text-sm px-4 py-4 rounded-2xl focus:outline-none focus:border-gold"
                    />
                  </div>
                </div>
              </div>

              <div className="flex flex-col justify-between gap-4">
                <div className="rounded-3xl border border-slate-700/50 bg-slate-950/50 p-5 text-slate-300 text-sm">
                  <p className="font-semibold text-white mb-3">Filtros rápidos</p>
                  <p className="leading-relaxed">Filtre por finalidade, tipo, localização e faixa de preço, sem sobrecarregar a página.</p>
                </div>
                <button type="submit" className="w-full bg-gold text-[#04122b] uppercase tracking-[0.35em] font-bold rounded-2xl px-6 py-4 hover:bg-gold-light transition">
                  Buscar Imóveis
                </button>
              </div>
            </form>
          </section>

          <section className="rounded-[32px] border border-slate-700/60 bg-[#020b18]/90 p-6 md:p-8 shadow-[0_24px_80px_rgba(0,0,0,0.35)]">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-6">
              <div>
                <p className="text-[10px] uppercase tracking-[0.35em] text-gold mb-2">Resultados</p>
                <h2 className="text-3xl font-serif text-white">{loading ? 'Carregando imóveis...' : `${imoveis.length} resultados`}</h2>
              </div>
              <div className="text-slate-400 text-sm">Filtrando por {searchLabel.toLowerCase()}</div>
            </div>

            {loading ? (
              <div className="rounded-[28px] border border-slate-700/40 bg-[#020b18]/90 py-16 flex items-center justify-center">
                <p className="uppercase text-slate-400 tracking-[0.35em] text-xs">Aguarde enquanto encontrarmos as melhores opções.</p>
              </div>
            ) : error ? (
              <div className="rounded-[28px] border border-rose-500/30 bg-[#2b1010]/80 p-8 text-rose-200">
                <p className="font-semibold">Erro</p>
                <p className="mt-2 text-sm text-slate-300">{error}</p>
              </div>
            ) : imoveis.length === 0 ? (
              <div className="rounded-[28px] border border-slate-700/40 bg-[#020b18]/90 py-16 flex flex-col items-center justify-center gap-4">
                <p className="text-slate-400 uppercase tracking-[0.35em] text-xs">Sem resultados</p>
                <p className="text-white text-lg max-w-xl text-center">Nenhum imóvel encontrado com os filtros atuais. Ajuste a pesquisa ou apague algum filtro para ver mais opções.</p>
              </div>
            ) : (
              <div className="grid gap-6 lg:grid-cols-2">
                {imoveis.map((imovel) => (
                  <Link
                    key={imovel.id}
                    href={`/imovel/${imovel.id}`}
                    className="group block overflow-hidden rounded-[24px] border border-slate-700/40 bg-slate-900/80 shadow-[0_24px_60px_rgba(0,0,0,0.25)] transition hover:-translate-y-1"
                  >
                    <div className="relative h-72 overflow-hidden bg-slate-950">
                      {imovel.imagem_url ? (
                        <img
                          src={imovel.imagem_url}
                          alt={imovel.titulo}
                          className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center bg-slate-800 text-slate-500">Sem imagem disponível</div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-[#020b18] via-[#020b18]/50 to-transparent" />
                      <span className="absolute left-4 top-4 rounded-full bg-gold px-3 py-1 text-[10px] font-bold uppercase tracking-[0.35em] text-[#04122b]">
                        {imovel.finalidade?.toString().toLowerCase().includes('loc') ? 'Aluguel' : 'Venda'}
                      </span>
                    </div>
                    <div className="p-6">
                      <div className="flex items-center justify-between gap-4 mb-3">
                        <span className="text-[10px] uppercase tracking-[0.35em] text-gold">{imovel.tipo}</span>
                        <span className="text-sm text-slate-400">{imovel.cidade}</span>
                      </div>
                      <h3 className="font-serif text-2xl text-white leading-tight mb-3">{imovel.titulo}</h3>
                      <p className="text-sm leading-relaxed text-slate-300 line-clamp-3 mb-5">{imovel.descricao || 'Descrição não disponível para este imóvel.'}</p>
                      <div className="flex flex-wrap gap-3 text-slate-400 text-xs uppercase tracking-[0.3em]">
                        {imovel.quartos > 0 && <span className="flex items-center gap-1"><Bed size={14} />{imovel.quartos} quartos</span>}
                        {imovel.banheiros > 0 && <span className="flex items-center gap-1"><Bath size={14} />{imovel.banheiros} banheiros</span>}
                        {imovel.vagas > 0 && <span className="flex items-center gap-1"><Car size={14} />{imovel.vagas} vagas</span>}
                        {imovel.area > 0 && <span className="flex items-center gap-1"><Maximize size={14} />{imovel.area} m²</span>}
                      </div>
                      <div className="mt-6 flex items-center justify-between gap-4">
                        <span className="font-serif text-2xl text-gold">{formatMoney(imovel.preco)}</span>
                        <span className="text-xs text-slate-400 uppercase tracking-[0.35em]">Ver detalhes</span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </main>
  )
}
