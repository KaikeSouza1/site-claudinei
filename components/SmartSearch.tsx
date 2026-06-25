'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, MapPin, Building2, Trees, Leaf, ChevronDown, Filter } from 'lucide-react'
import { useRouter } from 'next/navigation'

const tiposUrbano = ['Casa', 'Apartamento', 'Terreno', 'Comercial', 'Industrial']
const tiposRural = ['Fazenda', 'Sítio', 'Chácara', 'Área de Plantio', 'Pecuária']
const tiposAtivos = ['Reflorestamento', 'Reserva Legal', 'Crédito de Carbono']

export default function SmartSearch() {
  const router = useRouter()
  const [finalidade, setFinalidade] = useState<'Venda' | 'Locação'>('Venda')
  const [categoria, setCategoria] = useState<'urbano' | 'rural' | 'ativos'>('urbano')
  const [tipo, setTipo] = useState('')
  const [localizacao, setLocalizacao] = useState('')
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    const params = new URLSearchParams()
    if (tipo) params.append('tipo', tipo)
    if (localizacao) params.append('busca', localizacao)
    params.append('categoria', categoria)
    params.append('finalidade', finalidade)
    
    router.push(`/imoveis?${params.toString()}`)
  }

  return (
    <div className="w-full">
      {/* Seleção de Categoria (Tabs) */}
      <div className="flex gap-1 mb-0 ml-4">
        {[
          { id: 'urbano', label: 'Urbano', icon: Building2 },
          { id: 'rural', label: 'Rural', icon: Trees },
          { id: 'ativos', label: 'Ativos', icon: Leaf },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => {
              setCategoria(tab.id as any)
              setTipo('')
            }}
            className={`flex items-center gap-2 px-6 py-3 rounded-t-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all ${
              categoria === tab.id
                ? 'bg-[#173a57] text-gold border-t border-x border-slate-500/30'
                : 'bg-[#04122b]/50 text-slate-400 hover:text-slate-200'
            }`}
          >
            <tab.icon size={14} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Card Principal de Busca */}
      <div className="bg-[#173a57] backdrop-blur-xl border border-slate-500/30 rounded-3xl rounded-tl-none shadow-2xl p-4 md:p-2">
        <div className="flex flex-wrap gap-2 mb-4 justify-center md:justify-start">
          {['Venda', 'Locação'].map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => setFinalidade(option as 'Venda' | 'Locação')}
              className={`px-5 py-3 rounded-2xl text-xs font-bold uppercase tracking-widest transition-all ${finalidade === option ? 'bg-gold text-[#04122b]' : 'bg-[#04122b]/60 text-slate-300 hover:bg-[#0f2d4f]'}`}
            >
              {option}
            </button>
          ))}
        </div>

        <form onSubmit={handleSearch} className="flex flex-col md:flex-row items-center gap-2">
          
          {/* Filtro de Tipo (Dinâmico) */}
          <div className="relative w-full md:w-1/3 group">
            <div 
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="w-full flex items-center gap-3 px-6 py-4 bg-[#04122b]/40 border border-slate-600/30 rounded-2xl cursor-pointer hover:border-gold/50 transition-all"
            >
              <Filter size={18} className="text-gold" />
              <div className="flex-1 text-left">
                <p className="text-[9px] uppercase text-slate-400 font-bold tracking-widest">O que procura?</p>
                <p className="text-sm text-white font-medium truncate">
                  {tipo || `Todos os ${categoria}s`}
                </p>
              </div>
              <ChevronDown size={16} className={`text-slate-500 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
            </div>

            {/* Dropdown Customizado */}
            <AnimatePresence>
              {isDropdownOpen && (
                <>
                  <div className="fixed inset-0 z-30" onClick={() => setIsDropdownOpen(false)} />
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="absolute top-full left-0 w-full mt-2 bg-[#1a2d3d] border border-slate-500/30 rounded-2xl shadow-2xl z-40 overflow-hidden"
                  >
                    <div className="p-2 grid grid-cols-1 gap-1">
                      {(categoria === 'urbano' ? tiposUrbano : categoria === 'rural' ? tiposRural : tiposAtivos).map((t) => (
                        <button
                          key={t}
                          type="button"
                          onClick={() => {
                            setTipo(t)
                            setIsDropdownOpen(false)
                          }}
                          className="w-full text-left px-4 py-3 rounded-xl text-sm text-slate-300 hover:bg-gold hover:text-[#04122b] transition-all"
                        >
                          {t}
                        </button>
                      ))}
                      <button
                        type="button"
                        onClick={() => {
                          setTipo('')
                          setIsDropdownOpen(false)
                        }}
                        className="w-full text-left px-4 py-3 rounded-xl text-sm text-gold border-t border-slate-700 mt-1 hover:bg-slate-700/50"
                      >
                        Limpar Filtro
                      </button>
                    </div>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>

          {/* Input de Localização/Palavra-chave */}
          <div className="w-full md:flex-1 relative group">
            <div className="w-full flex items-center gap-3 px-6 py-4 bg-[#04122b]/40 border border-slate-600/30 rounded-2xl focus-within:border-gold/50 transition-all">
              <MapPin size={18} className="text-gold" />
              <div className="flex-1">
                <p className="text-[9px] uppercase text-slate-400 font-bold tracking-widest">Localização ou Nome</p>
                <input
                  type="text"
                  placeholder={categoria === 'urbano' ? "Ex: Centro, Bairro..." : "Ex: Região, Hectares, Cultivares..."}
                  className="w-full bg-transparent border-none focus:ring-0 text-sm text-white placeholder:text-slate-600 p-0"
                  value={localizacao}
                  onChange={(e) => setLocalizacao(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Botão de Busca */}
          <button
            type="submit"
            className="w-full md:w-auto bg-gold text-[#04122b] hover:bg-white transition-all px-10 py-5 rounded-2xl flex items-center justify-center gap-3 group"
          >
            <span className="text-xs font-black uppercase tracking-widest">Buscar Imóveis</span>
            <Search size={20} className="group-hover:scale-110 transition-transform" />
          </button>
        </form>
      </div>

      {/* Tags de Sugestão Rápidas */}
      <div className="mt-4 flex flex-wrap gap-4 px-2">
        <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest flex items-center gap-2">
          Buscas Frequentes:
        </p>
        {(categoria === 'urbano' 
          ? ['Apartamentos Luxo', 'Lotes Condomínio'] 
          : categoria === 'rural' 
            ? ['Áreas acima de 50ha', 'Fazendas de Soja'] 
            : ['Eucalipto', 'Pinus', 'Reserva Legal']
        ).map((sugestao) => (
          <button
            key={sugestao}
            type="button"
            onClick={() => setLocalizacao(sugestao)}
            className="text-[10px] text-slate-400 hover:text-gold transition-colors border-b border-transparent hover:border-gold pb-0.5"
          >
            {sugestao}
          </button>
        ))}
      </div>
    </div>
  )
}