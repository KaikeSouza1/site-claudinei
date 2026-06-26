'use client'

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Bed, Bath, Car, Maximize, ChevronRight, ChevronLeft, ArrowRight, Building2, Trees, Leaf, FileText } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import SmartSearch from '@/components/SmartSearch';
import AvaliacaoImobiliaria from '@/components/AvaliacaoImobiliaria';
import NumerosExpertise from '@/components/NumerosExpertise';
import Link from 'next/link';

const areas = [
  {
    id: 1,
    title: 'Imóveis Urbanos',
    description: 'Casas, terrenos, apartamentos e comerciais em principais regiões.',
    icon: Building2,
    color: 'from-blue-600 to-blue-400',
    borderColor: 'border-blue-500/30',
  },
  {
    id: 2,
    title: 'Imóveis Rurais',
    description: 'Chácaras, sítios, fazendas e áreas produtivas com potencial.',
    icon: Trees,
    color: 'from-green-600 to-green-400',
    borderColor: 'border-green-500/30',
  },
  {
    id: 3,
    title: 'Ativos Florestais',
    description: 'Áreas de reflorestamento e investimentos florestais estratégicos.',
    icon: Leaf,
    color: 'from-emerald-600 to-emerald-400',
    borderColor: 'border-emerald-500/30',
  },
  {
    id: 4,
    title: 'Avaliação Imobiliária',
    description: 'Laudos técnicos especializados e avaliação mercadológica profissional.',
    icon: FileText,
    color: 'from-amber-600 to-amber-400',
    borderColor: 'border-amber-500/30',
  },
]

export default function Home() {
  const [abaAtiva, setAbaAtiva] = useState('Venda');
  const [imoveisDestaque, setImoveisDestaque] = useState<any[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

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
        .limit(50);

      if (data && !error) {
        const embaralhado = data.sort(() => 0.5 - Math.random()).slice(0, 7);
        setImoveisDestaque(embaralhado);
      } else {
        setImoveisDestaque([]);
      }
      setCarregando(false);
    }

    fetchDestaques();
  }, [abaAtiva]);

  // Autoplay do carrossel
  useEffect(() => {
    if (imoveisDestaque.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) =>
        prevIndex + 1 >= imoveisDestaque.length ? 0 : prevIndex + 1
      );
    }, 5000);

    return () => clearInterval(interval);
  }, [imoveisDestaque.length]);

  const formatarPreco = (valor: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor);
  };

  const linkVerTodos = abaAtiva === 'Venda' ? '/imoveis/venda' : '/imoveis/aluguel';
  const labelVerTodos = abaAtiva === 'Venda' ? 'Ver todos à venda' : 'Ver todos para alugar';

  const nextSlide = () => {
    setCurrentIndex((prevIndex) =>
      prevIndex + 1 >= imoveisDestaque.length ? 0 : prevIndex + 1
    );
  };

  const prevSlide = () => {
    setCurrentIndex((prevIndex) =>
      prevIndex - 1 < 0 ? imoveisDestaque.length - 1 : prevIndex - 1
    );
  };

  const goToSlide = (index: number) => {
    setCurrentIndex(index);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;
    if (isLeftSwipe) nextSlide();
    if (isRightSwipe) prevSlide();
  };

  return (
    <main className="flex-1 bg-[#223a51] flex flex-col relative overflow-hidden text-slate-100">
      {/* Imagem de fundo do hero */}
      <div
        className="absolute top-0 w-full h-screen z-0 pointer-events-none"
        style={{ backgroundImage: 'url(/fundo.png)', backgroundSize: 'cover', backgroundPosition: 'center top' }}
      >
        <div className="absolute inset-0 bg-[#04122b]/55" />
        <div className="absolute inset-0 bg-linear-to-r from-[#04122b]/45 via-[#04122b]/20 to-transparent" />
        <div className="absolute inset-0 bg-linear-to-b from-transparent via-transparent to-[#223a51]" />
      </div>

      {/* ═══════════════════════════════════
          HERO
      ═══════════════════════════════════ */}
      <section className="relative z-10 w-full min-h-screen flex items-center overflow-hidden">
        <div className="max-w-7xl mx-auto w-full px-6 md:px-10 pt-28 pb-10">

          {/* Título centralizado */}
          <div className="flex flex-col items-center mb-8">

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="flex flex-col items-center text-center space-y-5 w-full max-w-3xl mx-auto"
            >
              <h1 className="font-serif text-5xl md:text-6xl xl:text-6xl leading-tight text-white text-center">
                Seu Patrimônio Tratado com <br />
                <span className="text-gold italic">Técnica, Estratégia</span> e Resultado
              </h1>

              <p className="max-w-xl text-slate-300 text-sm md:text-base leading-relaxed text-center">
                Especialista em imóveis urbanos, áreas rurais, ativos florestais e avaliação mercadológica.
                Segurança jurídica e técnica para seus investimentos.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 pt-1">
                <a
                  href="#destaques"
                  className="inline-flex items-center justify-center gap-2 bg-gold text-[#04122b] hover:bg-gold/90 transition-all px-8 py-4 rounded-full text-xs font-bold uppercase tracking-widest group shadow-[0_0_20px_rgba(197,160,89,0.3)]"
                >
                  Ver Portfólio
                  <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                </a>
                <a
                  href="#avaliacao"
                  className="inline-flex items-center justify-center gap-2 border-2 border-gold text-gold bg-[#04122b]/80 backdrop-blur-md hover:bg-gold hover:text-[#04122b] transition-all px-8 py-4 rounded-full text-xs font-bold uppercase tracking-widest shadow-lg"
                >
                  Laudo de Avaliação
                </a>
              </div>
            </motion.div>
          </div>

          {/* Busca */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.3 }}
            className="max-w-4xl mx-auto mb-8"
          >
            <SmartSearch />
          </motion.div>

          {/* Cards de áreas */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.4 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-4"
          >
            {areas.map((area) => {
              const IconComponent = area.icon
              return (
                <motion.div
                  key={area.id}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: area.id * 0.1 }}
                  className={`group flex items-start gap-4 p-5 rounded-2xl border ${area.borderColor} bg-[#04122b]/60 backdrop-blur-md hover:bg-[#04122b]/80 transition-all duration-300 hover:-translate-y-1 cursor-pointer`}
                >
                  <div className={`w-11 h-11 shrink-0 rounded-xl bg-gradient-to-br ${area.color} p-2.5 shadow-lg`}>
                    <IconComponent className="w-full h-full text-white" strokeWidth={1.5} />
                  </div>
                  <div>
                    <h3 className="text-white text-sm font-semibold group-hover:text-gold transition-colors duration-300 mb-1">
                      {area.title}
                    </h3>
                    <p className="text-slate-400 text-xs leading-relaxed">
                      {area.description}
                    </p>
                  </div>
                </motion.div>
              )
            })}
          </motion.div>

        </div>
      </section>

      {/* ═══════════════════════════════════
          PORTFÓLIO / DESTAQUES
      ═══════════════════════════════════ */}
      <section id="destaques" className="relative z-10 w-full max-w-7xl mx-auto px-6 md:px-10 py-12 scroll-mt-20">
        <div className="bg-[#173a57]/80 backdrop-blur-xl rounded-4xl border border-slate-500/20 shadow-[0_40px_120px_rgba(15,23,42,0.18)] p-6 md:p-10">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
            <div>
              <p className="text-[10px] text-gold tracking-widest uppercase mb-3">Oportunidades Estratégicas</p>
              <h2 className="font-serif text-4xl md:text-5xl text-white leading-tight">
                Portfólio de <span className="text-gold italic">Investimentos</span>
              </h2>
            </div>

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

          <AnimatePresence mode="wait">
            {carregando ? (
              <motion.div
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex justify-center items-center h-72 rounded-[28px] border border-slate-500/40 bg-[#2f5a83]/70 text-slate-100 text-sm tracking-widest uppercase"
              >
                Carregando imóveis...
              </motion.div>
            ) : imoveisDestaque.length === 0 ? (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="rounded-[28px] border border-slate-500/40 bg-[#2f5a83]/70 p-16 text-center text-slate-100"
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
                className="relative"
              >
                <div
                  className="relative overflow-hidden rounded-[28px]"
                  onTouchStart={handleTouchStart}
                  onTouchMove={handleTouchMove}
                  onTouchEnd={handleTouchEnd}
                >
                  <motion.div
                    className="flex transition-transform duration-500 ease-in-out"
                    style={{ transform: `translateX(-${currentIndex * 100}%)` }}
                  >
                    {imoveisDestaque.map((item) => (
                      <div key={item.id} className="w-full shrink-0 px-2">
                        <Link
                          href={`/imovel/${item.id}`}
                          className="relative group overflow-hidden rounded-[24px] bg-[#5a7ca5] border border-slate-300/30 shadow-[0_30px_90px_rgba(19,36,62,0.18)] transition-transform duration-300 hover:-translate-y-1 block"
                          style={{ minHeight: '500px' }}
                        >
                          <div
                            className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105"
                            style={{ backgroundImage: `url(${item.imagem_url || ''})` }}
                          />
                          {!item.imagem_url && (
                            <div className="absolute inset-0 bg-[#2f4d6e] flex items-center justify-center text-slate-200 text-sm">
                              Sem imagem
                            </div>
                          )}
                          <div className="absolute inset-0 bg-linear-to-t from-[#3f6f92] via-[#8ca7d0]/25 to-transparent" />

                          <div className="absolute top-5 left-5 bg-linear-to-r from-[#2b5f86] via-[#4e7fab] to-[#8ba7cb] text-[#04122b] px-3 py-1 text-[10px] font-black uppercase tracking-widest rounded-full shadow-[0_10px_40px_rgba(29,60,96,0.18)]">
                            Destaque
                          </div>

                          <div className="absolute bottom-0 left-0 w-full p-7">
                            <p className="text-[10px] text-gold tracking-widest uppercase mb-2">
                              {item.tipo}
                            </p>
                            <h3 className="font-serif text-2xl md:text-3xl text-white mb-2 group-hover:text-gold transition-colors line-clamp-2">
                              {item.titulo}
                            </h3>
                            <p className="font-serif text-xl text-gold mb-4">
                              {formatarPreco(item.preco)}
                            </p>
                            <div className="flex flex-wrap items-center gap-4 text-xs text-slate-300">
                              <span className="flex items-center gap-1.5">
                                <MapPin size={13} className="text-gold" />
                                {item.cidade}
                              </span>
                              {item.quartos > 0 && (
                                <span className="flex items-center gap-1.5">
                                  <Bed size={13} className="text-slate-400" />
                                  {item.quartos} {item.quartos === 1 ? 'quarto' : 'quartos'}
                                </span>
                              )}
                              {item.banheiros > 0 && (
                                <span className="flex items-center gap-1.5">
                                  <Bath size={13} className="text-slate-400" />
                                  {item.banheiros} {item.banheiros === 1 ? 'banheiro' : 'banheiros'}
                                </span>
                              )}
                              {item.vagas > 0 && (
                                <span className="flex items-center gap-1.5">
                                  <Car size={13} className="text-slate-400" />
                                  {item.vagas} {item.vagas === 1 ? 'vaga' : 'vagas'}
                                </span>
                              )}
                              {item.area > 0 && (
                                <span className="flex items-center gap-1.5">
                                  <Maximize size={13} className="text-slate-400" />
                                  {item.area} m²
                                </span>
                              )}
                            </div>
                          </div>
                        </Link>
                      </div>
                    ))}
                  </motion.div>
                </div>

                {imoveisDestaque.length > 1 && (
                  <>
                    <button
                      onClick={prevSlide}
                      className="absolute left-4 top-1/2 -translate-y-1/2 bg-[#04122b]/80 hover:bg-[#04122b] border border-slate-500/30 text-slate-300 hover:text-gold transition-all p-3 rounded-full shadow-lg backdrop-blur-sm z-10"
                    >
                      <ChevronLeft size={20} />
                    </button>
                    <button
                      onClick={nextSlide}
                      className="absolute right-4 top-1/2 -translate-y-1/2 bg-[#04122b]/80 hover:bg-[#04122b] border border-slate-500/30 text-slate-300 hover:text-gold transition-all p-3 rounded-full shadow-lg backdrop-blur-sm z-10"
                    >
                      <ChevronRight size={20} />
                    </button>

                    <div className="flex justify-center gap-2 mt-6">
                      {imoveisDestaque.map((_, index) => (
                        <button
                          key={index}
                          onClick={() => goToSlide(index)}
                          className={`w-2 h-2 rounded-full transition-all ${
                            index === currentIndex
                              ? 'bg-gold shadow-[0_0_8px_rgba(197,160,89,0.5)]'
                              : 'bg-slate-500/50 hover:bg-slate-400/70'
                          }`}
                        />
                      ))}
                    </div>
                  </>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </section>

      {/* ═══════════════════════════════════
          AVALIAÇÃO IMOBILIÁRIA
      ═══════════════════════════════════ */}
      <section id="avaliacao">
        <AvaliacaoImobiliaria />
      </section>

      {/* ═══════════════════════════════════
          NÚMEROS E EXPERTISE
      ═══════════════════════════════════ */}
      <NumerosExpertise />

    </main>
  );
}