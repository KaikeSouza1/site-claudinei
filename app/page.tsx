'use client'

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Bed, Bath, Car, Maximize, ChevronRight } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import SmartSearch from '@/components/SmartSearch';
import Link from 'next/link';

export default function Home() {
  const [abaAtiva, setAbaAtiva] = useState('Venda');
  const [imoveisDestaque, setImoveisDestaque] = useState<any[]>([]);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    async function fetchDestaques() {
      setCarregando(true);
      const { data, error } = await supabase
        .from('imoveis')
        .select('*')
        .eq('ativo', true)
        .eq('destaque', true)
        .or('status.is.null,status.eq.disponivel,status.eq.reservado')
        .ilike('finalidade', abaAtiva === 'Venda' ? '%vend%' : '%loc%')
        .limit(20);

      if (data && !error) {
        const embaralhado = data.sort(() => 0.5 - Math.random()).slice(0, 3);
        setImoveisDestaque(embaralhado);
      } else {
        setImoveisDestaque([]);
      }
      setCarregando(false);
    }

    fetchDestaques();
  }, [abaAtiva]);

  const formatarPreco = (valor: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor);
  };

  const linkVerTodos = abaAtiva === 'Venda' ? '/imoveis/venda' : '/imoveis/aluguel';
  const labelVerTodos = abaAtiva === 'Venda' ? 'Ver todos à venda' : 'Ver todos para alugar';

  return (
    <main className="flex-1 bg-[#020b18] flex flex-col relative overflow-hidden">
      {/* Gradiente de fundo */}
      <div className="absolute top-0 w-full h-[800px] bg-luxury-gradient z-0 pointer-events-none" />

      {/* ═══════════════════════════════════
          HERO
      ═══════════════════════════════════ */}
      <section className="relative z-10 max-w-7xl mx-auto w-full px-6 md:px-10 pt-32 pb-16">
        <div className="grid md:grid-cols-2 gap-10 items-center">

          {/* Coluna esquerda — texto */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="space-y-7"
          >
            <div className="flex items-center gap-4 text-gold text-xs tracking-widest uppercase">
              <span className="w-10 h-[1px] bg-gold block" />
              CRECI 37016 · CNAI 45505
            </div>

            <h1 className="font-serif text-5xl md:text-6xl xl:text-7xl leading-tight text-white">
              O imóvel <br />
              dos seus <br />
              <span className="text-gold italic">sonhos</span> existe.
            </h1>

            <p className="max-w-md text-slate-300 text-sm md:text-base leading-relaxed">
              Corretor e Avaliador Imobiliário certificado com mais de 10 anos de experiência.
              Especialista em imóveis de alto padrão com atendimento personalizado.
            </p>


          </motion.div>

          {/* Coluna direita — foto do corretor */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="relative flex justify-center md:justify-end"
          >
            {/* Moldura decorativa deslocada */}
            <div className="absolute right-0 top-4 w-[calc(100%-2rem)] max-w-[340px] h-full border border-slate-600/40 rounded-[28px] hidden md:block pointer-events-none translate-x-3 translate-y-3" />

            {/* Card da foto */}
            <div className="relative z-10 w-full max-w-[320px] md:max-w-[340px]">
              <div
                className="w-full rounded-[28px] overflow-hidden shadow-[0_40px_100px_rgba(0,0,0,0.55)]"
                style={{ aspectRatio: '3/4' }}
              >
                <img
                  src="/foto_claudinei.png"
                  alt="Claudiney W. Otto Junior — Corretor de Imóveis"
                  className="w-full h-full object-cover object-top"
                />
              </div>

              {/* Badge flutuante */}
              <div className="absolute -bottom-5 -left-5 md:-left-10 bg-[#04122b] border border-gold/30 rounded-2xl px-5 py-4 shadow-2xl max-w-[230px]">
                <p className="font-serif text-gold text-base leading-tight">Claudiney W. Otto Junior</p>
                <p className="text-[10px] uppercase tracking-[0.3em] text-slate-400 mt-1">
                  Corretor · Avaliador
                </p>
              </div>
            </div>
          </motion.div>

        </div>
      </section>

      {/* ═══════════════════════════════════
          SMART SEARCH
      ═══════════════════════════════════ */}
      <section className="relative z-20 max-w-5xl w-full mx-auto px-6 md:px-10 pb-8 mt-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
        >
          <SmartSearch />
        </motion.div>
      </section>

      {/* ═══════════════════════════════════
          DESTAQUES
      ═══════════════════════════════════ */}
      <section className="relative z-10 w-full max-w-7xl mx-auto px-6 md:px-10 py-20">

        {/* Cabeçalho da seção */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div>
            <p className="text-[10px] text-gold tracking-widest uppercase mb-3">Portfólio Exclusivo</p>
            <h2 className="font-serif text-4xl md:text-5xl text-white leading-tight">
              Imóveis em{' '}
              <span className="text-gold italic">destaque</span>
            </h2>
          </div>

          {/* Tabs + botão "Ver todos" lado a lado */}
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex gap-2 bg-[#04122b]/70 border border-slate-700/50 rounded-full px-3 py-2">
              {['Venda', 'Locação'].map((aba) => (
                <button
                  key={aba}
                  onClick={() => setAbaAtiva(aba)}
                  className={`rounded-full px-5 py-2 text-[10px] font-bold tracking-widest uppercase transition-all duration-300 ${
                    abaAtiva === aba
                      ? 'bg-gold text-[#04122b] shadow-[0_0_12px_rgba(197,160,89,0.35)]'
                      : 'text-slate-400 hover:text-gold'
                  }`}
                >
                  {aba}
                </button>
              ))}
            </div>

            <Link
              href={linkVerTodos}
              className="inline-flex items-center gap-2 border border-gold/40 text-gold hover:bg-gold hover:text-[#04122b] transition-all px-5 py-2.5 rounded-full text-[10px] font-bold uppercase tracking-widest group"
            >
              {labelVerTodos}
              <ChevronRight size={13} className="group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>
        </div>

        {/* Grade de imóveis */}
        <AnimatePresence mode="wait">
          {carregando ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex justify-center items-center h-72 rounded-[28px] border border-slate-700/50 bg-[#020b18]/80 text-slate-500 text-sm tracking-widest uppercase"
            >
              Carregando imóveis...
            </motion.div>
          ) : imoveisDestaque.length === 0 ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="rounded-[28px] border border-slate-700/50 bg-[#020b18]/80 p-16 text-center text-slate-500"
            >
              Nenhum imóvel em destaque para {abaAtiva.toLowerCase()}.
            </motion.div>
          ) : (
            <motion.div
              key={abaAtiva}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.4 }}
              className="grid gap-4 lg:grid-cols-12"
            >
              {/* Card principal — grande */}
              {imoveisDestaque[0] && (
                <Link
                  href={`/imovel/${imoveisDestaque[0].id}`}
                  className="lg:col-span-7 relative group overflow-hidden rounded-[24px] bg-slate-900 border border-slate-700/50 transition-transform duration-300 hover:-translate-y-1"
                  style={{ minHeight: '420px' }}
                >
                  <div
                    className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105"
                    style={{ backgroundImage: `url(${imoveisDestaque[0].imagem_url || ''})` }}
                  />
                  {!imoveisDestaque[0].imagem_url && (
                    <div className="absolute inset-0 bg-[#1a304d] flex items-center justify-center text-slate-500 text-sm">
                      Sem imagem
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-[#020b18] via-[#020b18]/50 to-transparent" />

                  {/* Badge destaque */}
                  <div className="absolute top-5 left-5 bg-gold text-[#04122b] px-3 py-1 text-[10px] font-black uppercase tracking-widest rounded-full">
                    Destaque
                  </div>

                  <div className="absolute bottom-0 left-0 w-full p-7">
                    <p className="text-[10px] text-gold tracking-widest uppercase mb-2">
                      {imoveisDestaque[0].tipo}
                    </p>
                    <h3 className="font-serif text-2xl md:text-3xl text-white mb-2 group-hover:text-gold transition-colors line-clamp-2">
                      {imoveisDestaque[0].titulo}
                    </h3>
                    <p className="font-serif text-xl text-gold mb-4">
                      {formatarPreco(imoveisDestaque[0].preco)}
                    </p>
                    <div className="flex flex-wrap items-center gap-4 text-xs text-slate-300">
                      <span className="flex items-center gap-1.5">
                        <MapPin size={13} className="text-gold" />
                        {imoveisDestaque[0].cidade}
                      </span>
                      {imoveisDestaque[0].quartos > 0 && (
                        <span className="flex items-center gap-1.5">
                          <Bed size={13} className="text-slate-400" />
                          {imoveisDestaque[0].quartos} qts
                        </span>
                      )}
                      {imoveisDestaque[0].banheiros > 0 && (
                        <span className="flex items-center gap-1.5">
                          <Bath size={13} className="text-slate-400" />
                          {imoveisDestaque[0].banheiros} wcs
                        </span>
                      )}
                      {imoveisDestaque[0].vagas > 0 && (
                        <span className="flex items-center gap-1.5">
                          <Car size={13} className="text-slate-400" />
                          {imoveisDestaque[0].vagas} vgs
                        </span>
                      )}
                      {imoveisDestaque[0].area > 0 && (
                        <span className="flex items-center gap-1.5">
                          <Maximize size={13} className="text-slate-400" />
                          {imoveisDestaque[0].area}m²
                        </span>
                      )}
                    </div>
                  </div>
                </Link>
              )}

              {/* Cards menores */}
              <div className="lg:col-span-5 flex flex-col gap-4">
                {imoveisDestaque.slice(1).map((item) => (
                  <Link
                    key={item.id}
                    href={`/imovel/${item.id}`}
                    className="group relative overflow-hidden rounded-[24px] bg-slate-900 border border-slate-700/50 transition-transform duration-300 hover:-translate-y-1 flex-1"
                    style={{ minHeight: '192px' }}
                  >
                    <div
                      className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105"
                      style={{ backgroundImage: `url(${item.imagem_url || ''})` }}
                    />
                    {!item.imagem_url && (
                      <div className="absolute inset-0 bg-[#152741] flex items-center justify-center text-slate-500 text-sm">
                        Sem imagem
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-[#020b18] via-[#020b18]/50 to-transparent" />

                    <div className="absolute bottom-0 left-0 w-full p-5">
                      <p className="text-[9px] text-gold tracking-widest uppercase mb-1">{item.tipo}</p>
                      <h3 className="font-serif text-lg text-white mb-1 group-hover:text-gold transition-colors truncate">
                        {item.titulo}
                      </h3>
                      <div className="flex items-center justify-between">
                        <p className="font-serif text-lg text-gold">{formatarPreco(item.preco)}</p>
                        <span className="flex items-center gap-1 text-slate-400 text-xs">
                          <MapPin size={11} className="text-gold" />
                          {item.cidade}
                        </span>
                      </div>
                    </div>
                  </Link>
                ))}

                {/* Botão ver todos — dentro da grade quando há apenas 1 card lateral */}
                {imoveisDestaque.slice(1).length < 2 && (
                  <Link
                    href={linkVerTodos}
                    className="flex items-center justify-center gap-3 rounded-[24px] border border-gold/30 bg-gold/5 hover:bg-gold/10 text-gold transition-all px-6 py-8 group flex-1"
                    style={{ minHeight: '100px' }}
                  >
                    <span className="text-xs font-bold uppercase tracking-widest">{labelVerTodos}</span>
                    <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform" />
                  </Link>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>


      </section>
    </main>
  );
}