// components/SmartSearch.tsx
'use client'

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, SlidersHorizontal, MapPin, Home, DollarSign, Bed } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function SmartSearch() {
  const [abaAtiva, setAbaAtiva] = useState<'inteligente' | 'detalhada'>('inteligente');
  const router = useRouter();

  // Estados dos formulários (vazios por enquanto, aguardando o backend)
  const [buscaLivre, setBuscaLivre] = useState('');
  const [filtros, setFiltros] = useState({
    finalidade: '',
    tipo: '',
    localizacao: '',
    quartos: ''
  });

  const realizarBusca = (e: React.FormEvent) => {
    e.preventDefault();

    const params = new URLSearchParams();
    if (abaAtiva === 'inteligente') {
      if (buscaLivre.trim()) params.set('busca', buscaLivre.trim())
    } else {
      if (filtros.finalidade) params.set('finalidade', filtros.finalidade)
      if (filtros.tipo) params.set('tipo', filtros.tipo)
      if (filtros.localizacao) params.set('localizacao', filtros.localizacao.trim())
      if (filtros.quartos) params.set('busca', `${filtros.quartos} quartos`)
    }

    router.push(`/imoveis?${params.toString()}`)
  };

  return (
    <div className="w-full bg-[#04122b]/40 backdrop-blur-xl border border-slate-600/50 rounded-2xl p-6 md:p-8 shadow-[0_8px_30px_rgb(0,0,0,0.5)]">
      
      {/* Abas de Navegação */}
      <div className="flex gap-6 mb-8 border-b border-slate-700/50 pb-4">
        <button 
          onClick={() => setAbaAtiva('inteligente')}
          className={`flex items-center gap-2 text-xs tracking-widest uppercase font-bold transition-colors ${abaAtiva === 'inteligente' ? 'text-gold' : 'text-slate-400 hover:text-slate-200'}`}
        >
          <Search size={16} />
          Busca Inteligente
        </button>
        <button 
          onClick={() => setAbaAtiva('detalhada')}
          className={`flex items-center gap-2 text-xs tracking-widest uppercase font-bold transition-colors ${abaAtiva === 'detalhada' ? 'text-gold' : 'text-slate-400 hover:text-slate-200'}`}
        >
          <SlidersHorizontal size={16} />
          Busca Detalhada
        </button>
      </div>

      {/* Formulários com Animação de Troca */}
      <AnimatePresence mode="wait">
        
        {/* FORMULÁRIO 1: BUSCA ESTILO GOOGLE */}
        {abaAtiva === 'inteligente' && (
          <motion.form 
            key="inteligente"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
            onSubmit={realizarBusca}
            className="flex flex-col md:flex-row gap-4"
          >
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gold/70" size={20} />
              <input 
                type="text" 
                value={buscaLivre}
                onChange={(e) => setBuscaLivre(e.target.value)}
                placeholder="Ex: Casa com 3 quartos para alugar no Centro..." 
                className="w-full bg-[#020b18]/60 border border-slate-600 text-white text-base px-12 py-5 rounded-lg focus:outline-none focus:border-gold transition-colors placeholder:text-slate-500 font-light"
              />
            </div>
            <button type="submit" className="bg-gold text-[#04122b] px-10 py-5 rounded-lg text-xs font-bold tracking-widest uppercase hover:bg-gold-light transition-all shadow-lg hover:shadow-gold/20 whitespace-nowrap">
              Pesquisar
            </button>
          </motion.form>
        )}

        {/* FORMULÁRIO 2: BUSCA DETALHADA COM PARÂMETROS */}
        {abaAtiva === 'detalhada' && (
          <motion.form 
            key="detalhada"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
            onSubmit={realizarBusca}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4"
          >
            {/* Finalidade */}
            <div className="relative">
              <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 text-gold/70" size={16} />
              <select 
                value={filtros.finalidade}
                onChange={(e) => setFiltros({...filtros, finalidade: e.target.value})}
                className="w-full bg-[#020b18]/60 border border-slate-600 text-slate-300 text-sm px-10 py-4 rounded-lg focus:outline-none focus:border-gold appearance-none cursor-pointer"
              >
                <option value="">Finalidade</option>
                <option value="Venda">Comprar</option>
                <option value="Locacao">Alugar</option>
              </select>
            </div>

            {/* Tipo */}
            <div className="relative">
              <Home className="absolute left-4 top-1/2 -translate-y-1/2 text-gold/70" size={16} />
              <select 
                value={filtros.tipo}
                onChange={(e) => setFiltros({...filtros, tipo: e.target.value})}
                className="w-full bg-[#020b18]/60 border border-slate-600 text-slate-300 text-sm px-10 py-4 rounded-lg focus:outline-none focus:border-gold appearance-none cursor-pointer"
              >
                <option value="">Tipo de Imóvel</option>
                <option value="Casa">Casa</option>
                <option value="Apartamento">Apartamento</option>
                <option value="Terreno">Terreno</option>
                <option value="Comercial">Comercial</option>
              </select>
            </div>

            {/* Localização */}
            <div className="relative lg:col-span-2">
              <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-gold/70" size={16} />
              <input 
                type="text" 
                value={filtros.localizacao}
                onChange={(e) => setFiltros({...filtros, localizacao: e.target.value})}
                placeholder="Cidade ou Bairro" 
                className="w-full bg-[#020b18]/60 border border-slate-600 text-white text-sm px-10 py-4 rounded-lg focus:outline-none focus:border-gold transition-colors placeholder:text-slate-500"
              />
            </div>

            {/* Botão Buscar */}
            <button type="submit" className="bg-gold text-[#04122b] px-6 py-4 rounded-lg text-xs font-bold tracking-widest uppercase hover:bg-gold-light transition-all shadow-lg hover:shadow-gold/20 whitespace-nowrap">
              Buscar
            </button>
          </motion.form>
        )}

      </AnimatePresence>
    </div>
  );
}