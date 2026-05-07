'use client'

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { MapPin, Bed, Bath, Car, Maximize } from 'lucide-react';
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
        console.error('Erro ao buscar destaques:', error);
        setImoveisDestaque([]);
      }
      setCarregando(false);
    }

    fetchDestaques();
  }, [abaAtiva]);

  const formatarPreco = (valor: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor);
  };

  return (
    <main className="flex-1 bg-[#020b18] flex flex-col relative overflow-hidden">
      <div className="absolute top-0 w-full h-[800px] bg-luxury-gradient z-0"></div>

      {/* Hero */}
      <section className="relative z-10 max-w-7xl mx-auto px-6 md:px-10 pt-32 pb-20">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="space-y-6"
          >
            <div className="flex items-center gap-4 text-gold text-xs tracking-widest uppercase">
              <span className="w-12 h-[1px] bg-gold block"></span>
              CRECI 37016 • CNAI 45505
            </div>

            <h1 className="font-serif text-5xl md:text-7xl leading-tight text-white">
              O imóvel <br />
              dos seus <br />
              <span className="text-gold italic">sonhos</span> existe.
            </h1>

            <p className="max-w-xl text-slate-300 text-sm md:text-base leading-relaxed">
              Corretor e Avaliador Imobiliário certificado com mais de 10 anos de experiência. Especialista em imóveis de alto padrão com atendimento personalizado, soluções jurídicas e ofertas selecionadas.
            </p>

            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <div className="flex flex-wrap gap-3 rounded-full bg-[#04122b]/70 border border-slate-700 px-4 py-3">
                <button
                  onClick={() => setAbaAtiva('Venda')}
                  className={`rounded-full px-5 py-2 text-xs uppercase tracking-[0.35em] font-semibold transition ${abaAtiva === 'Venda' ? 'bg-gold text-[#04122b]' : 'text-slate-300 hover:text-gold'}`}
                >
                  Venda
                </button>
                <button
                  onClick={() => setAbaAtiva('Locação')}
                  className={`rounded-full px-5 py-2 text-xs uppercase tracking-[0.35em] font-semibold transition ${abaAtiva === 'Locação' ? 'bg-gold text-[#04122b]' : 'text-slate-300 hover:text-gold'}`}
                >
                  Locação
                </button>
              </div>

              <Link
                href={abaAtiva === 'Venda' ? '/imoveis/venda' : '/imoveis/aluguel'}
                className="inline-flex items-center justify-center rounded-full bg-gold px-8 py-4 text-xs font-bold uppercase tracking-widest text-[#04122b] hover:bg-gold-light transition"
              >
                Ver todos
              </Link>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="relative flex justify-end"
          >
            <div className="absolute right-[-20px] top-[-20px] hidden md:block w-full h-full border border-slate-600/50"></div>
            <div className="relative z-10 overflow-hidden rounded-[32px] shadow-[0_40px_120px_rgba(0,0,0,0.45)] max-w-[360px]">
              <div className="aspect-[4/5] bg-slate-950">
                <img src="/foto_claudinei.png" alt="Foto de Claudiney W. Otto Junior" className="h-full w-full object-cover" />
              </div>
              <div className="absolute bottom-6 left-[-18px] md:left-[-30px] rounded-3xl bg-[#04122b] border border-gold/30 p-4 text-white shadow-xl">
                <p className="font-serif text-gold text-lg">Claudiney W. Otto Junior</p>
                <p className="text-[10px] uppercase tracking-[0.35em] text-slate-400 mt-1">Corretor e Avaliador de Imóveis</p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Smart Search */}
      <section className="relative z-20 max-w-5xl w-full mx-auto px-6 md:px-10 -mt-24 md:-mt-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
        >
          <SmartSearch />
        </motion.div>
      </section>

      {/* Destaques */}
      <section className="relative z-10 w-full max-w-7xl mx-auto px-6 md:px-10 py-24">
        <div className="flex flex-col items-center text-center mb-16 gap-6">
          <div className="text-[10px] text-gold tracking-widest uppercase">Portfólio Exclusivo</div>
          <h2 className="font-serif text-4xl md:text-5xl text-white">
            Imóveis em <span className="text-gold italic">destaque</span>
          </h2>
          <p className="text-slate-400 text-sm max-w-2xl leading-relaxed">
            Seleção exclusiva das melhores oportunidades do mercado. Escolha entre venda e locação e veja apenas imóveis relevantes para sua necessidade.
          </p>

          <div className="flex flex-wrap justify-center gap-4 mt-6">
            <button
              onClick={() => setAbaAtiva('Venda')}
              className={`${abaAtiva === 'Venda' ? 'bg-gold text-[#04122b]' : 'border border-slate-700 text-slate-300 hover:border-gold hover:text-gold'} transition-colors px-8 py-3 text-[10px] font-bold tracking-widest uppercase rounded-full`}
            >
              À Venda
            </button>
            <button
              onClick={() => setAbaAtiva('Locação')}
              className={`${abaAtiva === 'Locação' ? 'bg-gold text-[#04122b]' : 'border border-slate-700 text-slate-300 hover:border-gold hover:text-gold'} transition-colors px-8 py-3 text-[10px] font-bold tracking-widest uppercase rounded-full`}
            >
              Locação
            </button>
          </div>
        </div>

        {carregando ? (
          <div className="flex justify-center items-center h-64 rounded-[32px] border border-slate-700/60 bg-[#020b18]/90 text-slate-400">Carregando imóveis...</div>
        ) : imoveisDestaque.length > 0 ? (
          <div className="grid gap-4 lg:grid-cols-12">
            {imoveisDestaque[0] && (
              <Link href={`/imovel/${imoveisDestaque[0].id}`} className="lg:col-span-8 h-[420px] relative group overflow-hidden rounded-[28px] bg-slate-900 border border-slate-700/60 transition hover:-translate-y-1">
                <div className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105" style={{ backgroundImage: `url(${imoveisDestaque[0].imagem_url || ''})` }}>
                  {!imoveisDestaque[0].imagem_url && <div className="h-full w-full bg-[#1a304d] flex items-center justify-center text-slate-500">Sem Imagem</div>}
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-[#020b18] via-[#020b18]/60 to-transparent opacity-90"></div>
                <div className="absolute top-6 left-6 bg-gold text-[#04122b] px-3 py-1 text-[10px] font-bold tracking-widest uppercase">DESTAQUE</div>
                <div className="absolute bottom-0 left-0 w-full p-6 md:p-8">
                  <p className="text-[10px] text-gold tracking-widest uppercase mb-2">{imoveisDestaque[0].tipo}</p>
                  <h3 className="font-serif text-2xl md:text-3xl text-white mb-2 group-hover:text-gold transition-colors">{imoveisDestaque[0].titulo}</h3>
                  <p className="font-serif text-xl text-gold mb-4">{formatarPreco(imoveisDestaque[0].preco)}</p>
                  <div className="flex flex-wrap items-center gap-4 text-xs text-slate-300">
                    <span className="flex items-center gap-1"><MapPin size={14} className="text-gold" />{imoveisDestaque[0].cidade}</span>
                    {imoveisDestaque[0].quartos > 0 && <span className="flex items-center gap-1"><Bed size={14} className="text-slate-400" />{imoveisDestaque[0].quartos} qts</span>}
                    {imoveisDestaque[0].banheiros > 0 && <span className="flex items-center gap-1"><Bath size={14} className="text-slate-400" />{imoveisDestaque[0].banheiros} wcs</span>}
                    {imoveisDestaque[0].vagas > 0 && <span className="flex items-center gap-1"><Car size={14} className="text-slate-400" />{imoveisDestaque[0].vagas} vgs</span>}
                    {imoveisDestaque[0].area > 0 && <span className="flex items-center gap-1"><Maximize size={14} className="text-slate-400" />{imoveisDestaque[0].area}m²</span>}
                  </div>
                </div>
              </Link>
            )}

            <div className="lg:col-span-4 flex flex-col gap-4">
              {imoveisDestaque.slice(1).map((item) => (
                <Link key={item.id} href={`/imovel/${item.id}`} className="group h-[300px] relative overflow-hidden rounded-[28px] bg-slate-900 border border-slate-700/60 transition hover:-translate-y-1">
                  <div className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105" style={{ backgroundImage: `url(${item.imagem_url || ''})` }}>
                    {!item.imagem_url && <div className="h-full w-full bg-[#152741] flex items-center justify-center text-slate-500">Sem Imagem</div>}
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-t from-[#020b18] via-[#020b18]/60 to-transparent opacity-90"></div>
                  <div className="absolute bottom-0 left-0 w-full p-6">
                    <p className="text-[9px] text-gold tracking-widest uppercase mb-1">{item.tipo}</p>
                    <h3 className="font-serif text-lg text-white mb-1 group-hover:text-gold transition-colors truncate">{item.titulo}</h3>
                    <p className="font-serif text-lg text-gold mb-3">{formatarPreco(item.preco)}</p>
                    <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-300">
                      <span className="flex items-center gap-1"><MapPin size={12} className="text-gold" />{item.cidade}</span>
                      {item.quartos > 0 && <span className="flex items-center gap-1"><Bed size={12} className="text-slate-400" />{item.quartos} qts</span>}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        ) : (
          <div className="rounded-[32px] border border-slate-700/60 bg-[#020b18]/90 p-16 text-center text-slate-400">Nenhum imóvel em destaque encontrado para {abaAtiva.toLowerCase()}.</div>
        )}
      </section>
    </main>
  )
}
