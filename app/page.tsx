'use client'

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, MapPin, Bed, Bath, Car, Maximize } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import SmartSearch from '@/components/SmartSearch';
import Link from 'next/link';

export default function Home() {
  const [abaAtiva, setAbaAtiva] = useState('Venda');
  const [imoveisDestaque, setImoveisDestaque] = useState<any[]>([]);
  const [carregando, setCarregando] = useState(true);

  // Busca os imóveis reais do banco ao carregar ou trocar a aba
  useEffect(() => {
    async function fetchDestaques() {
      setCarregando(true);
      
      const { data, error } = await supabase
        .from('imoveis')
        .select('*')
        .eq('ativo', true)
        .eq('destaque', true)
        .eq('finalidade', abaAtiva)
        .or('status.is.null,status.eq.disponivel,status.eq.reservado') // Só mostra disponíveis, reservados ou sem status definido
        .limit(20); // Traz até 20 destaques para poder embaralhar

      if (data && !error) {
        // Embaralha aleatoriamente e pega exatamente 3 para o Grid
        const embaralhado = data.sort(() => 0.5 - Math.random()).slice(0, 3);
        setImoveisDestaque(embaralhado);
      } else {
        console.error("Erro ao buscar destaques:", error);
      }
      
      setCarregando(false);
    }

    fetchDestaques();
  }, [abaAtiva]);

  // Função auxiliar para formatar a moeda
  const formatarPreco = (valor: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor);
  };

  return (
    <main className="flex-1 bg-[#020b18] flex flex-col relative overflow-hidden">
      
      {/* O degradê principal */}
      <div className="absolute top-0 w-full h-[800px] bg-luxury-gradient z-0"></div>

      {/* HERO SECTION */}
      <section className="flex items-center justify-center max-w-7xl w-full mx-auto px-6 md:px-10 pt-32 pb-20 relative z-10">
        <div className="grid md:grid-cols-2 gap-12 items-center w-full">
          {/* LADO ESQUERDO: TEXTOS */}
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="flex flex-col gap-6"
          >
            <div className="flex items-center gap-4 text-gold text-xs tracking-widest uppercase">
              <span className="w-12 h-[1px] bg-gold"></span>
              CRECI 37016 • CNAI 45505
            </div>

            <h2 className="font-serif text-5xl md:text-7xl leading-tight text-white">
              O imóvel <br />
              dos seus <br />
              <span className="text-gold italic pr-4">sonhos</span> existe.
            </h2>

            <p className="text-slate-300 max-w-md text-sm leading-relaxed mt-4">
              Corretor e Avaliador Imobiliário certificado com mais de 10 anos de experiência. Especialista em imóveis de alto padrão, garantindo segurança jurídica e precisão na avaliação do seu patrimônio.
            </p>

            {/* BOTÕES */}
            <div className="flex items-center gap-6 mt-8">
              <button className="bg-gold text-[#04122b] px-8 py-4 text-xs font-bold tracking-widest uppercase hover:bg-gold-light transition-colors">
                Ver Imóveis
              </button>
              <button className="text-white flex items-center gap-2 text-xs tracking-widest uppercase hover:text-gold transition-colors">
                Conhecer Mais <ArrowRight size={16} />
              </button>
            </div>
          </motion.div>

          {/* LADO DIREITO: FOTO DO CORRETOR */}
          <motion.div 
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="relative flex justify-end"
          >
            <div className="absolute right-[-20px] top-[-20px] w-full h-full border border-slate-600/50 z-0 hidden md:block"></div>
            
            <div className="relative z-10 bg-transparent p-2 shadow-2xl">
              {/* CONTAINER DA FOTO ATUALIZADO COM MÁSCARA ABAIXO */}
              <div 
                className="w-full max-w-[350px] aspect-[4/5] bg-transparent relative overflow-hidden flex items-center justify-center"
                style={{
                  // Aplica uma máscara de degradê para suavizar o topo
                  maskImage: 'linear-gradient(to bottom, transparent, black 15%)',
                  WebkitMaskImage: 'linear-gradient(to bottom, transparent, black 15%)' // Para suporte ao Webkit/Chrome
                }}
              >
                <img 
                  src="/foto_claudinei.png" 
                  alt="Foto de Claudiney W. Otto Junior" 
                  className="w-full h-full object-cover"
                />
              </div>
              
              <div className="absolute bottom-6 left-[-20px] md:left-[-40px] bg-[#04122b] border border-gold/30 p-4 shadow-xl">
                <p className="font-serif text-gold text-lg">Claudiney W. Otto Junior</p>
                <p className="text-[10px] text-slate-400 tracking-widest uppercase mt-1">Corretor e Avaliador de Imóveis</p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* COMPONENTE DE BUSCA INTELIGENTE FLUTUANTE */}
      <section className="relative z-20 max-w-5xl w-full mx-auto px-6 md:px-10 -mt-24 md:-mt-16">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
        >
          <SmartSearch />
        </motion.div>
      </section>

      {/* SEÇÃO DE IMÓVEIS EM DESTAQUE */}
      <section className="relative z-10 w-full max-w-7xl mx-auto px-6 md:px-10 py-24">
        
        {/* Cabeçalho da Seção */}
        <div className="flex flex-col items-center text-center mb-16">
          <p className="text-[10px] text-gold tracking-widest uppercase mb-4">Portfólio Exclusivo</p>
          <h2 className="font-serif text-4xl md:text-5xl text-white">Imóveis em <span className="text-gold italic">destaque</span></h2>
          <p className="text-slate-400 text-sm mt-4 font-light">Seleção exclusiva das melhores oportunidades do mercado</p>
          
          {/* Abas Dinâmicas (Venda / Locação) */}
          <div className="flex gap-4 mt-8">
            <button 
              onClick={() => setAbaAtiva('Venda')}
              className={`${abaAtiva === 'Venda' ? 'bg-gold text-[#04122b]' : 'border border-slate-700 text-slate-300 hover:border-gold hover:text-gold'} transition-colors px-8 py-3 text-[10px] font-bold tracking-widest uppercase`}
            >
              À Venda
            </button>
            <button 
              onClick={() => setAbaAtiva('Locação')}
              className={`${abaAtiva === 'Locação' ? 'bg-gold text-[#04122b]' : 'border border-slate-700 text-slate-300 hover:border-gold hover:text-gold'} transition-colors px-8 py-3 text-[10px] font-bold tracking-widest uppercase`}
            >
              Locação
            </button>
          </div>
        </div>

        {/* BENTO GRID (Dinâmico) */}
        {carregando ? (
          <div className="flex justify-center items-center h-64">
            <p className="text-slate-400 uppercase tracking-widest text-xs animate-pulse">Buscando imóveis...</p>
          </div>
        ) : imoveisDestaque.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 h-auto lg:h-[600px]">
            
            {/* Card Principal (Esquerda - 8 colunas) */}
            {imoveisDestaque[0] && (
              <Link href={`/imovel/${imoveisDestaque[0].id}`} className="lg:col-span-8 h-[400px] lg:h-full relative group cursor-pointer overflow-hidden bg-slate-800 block">
                <div 
                  className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105"
                  style={{ backgroundImage: `url(${imoveisDestaque[0].imagem_url || ''})` }}
                >
                  {!imoveisDestaque[0].imagem_url && <div className="w-full h-full bg-[#1a304d] flex items-center justify-center text-slate-500">Sem Imagem</div>}
                </div>
                
                <div className="absolute inset-0 bg-gradient-to-t from-[#020b18] via-[#020b18]/60 to-transparent opacity-90"></div>
                
                <div className="absolute top-6 left-6 bg-gold text-[#04122b] px-3 py-1 text-[10px] font-bold tracking-widest uppercase">
                  DESTAQUE
                </div>

                <div className="absolute bottom-0 left-0 w-full p-6 md:p-8">
                  <p className="text-[10px] text-gold tracking-widest uppercase mb-2">{imoveisDestaque[0].tipo}</p>
                  <h3 className="font-serif text-2xl md:text-3xl text-white mb-2 group-hover:text-gold transition-colors">{imoveisDestaque[0].titulo}</h3>
                  <p className="font-serif text-xl text-gold mb-4">{formatarPreco(imoveisDestaque[0].preco)}</p>
                  
                  <div className="flex flex-wrap items-center gap-4 text-xs text-slate-300">
                    <span className="flex items-center gap-1"><MapPin size={14} className="text-gold"/> {imoveisDestaque[0].cidade}</span>
                    <div className="hidden md:block w-1 h-1 rounded-full bg-slate-600"></div>
                    {imoveisDestaque[0].quartos > 0 && <span className="flex items-center gap-1"><Bed size={14} className="text-slate-400"/> {imoveisDestaque[0].quartos} qts</span>}
                    {imoveisDestaque[0].banheiros > 0 && <span className="flex items-center gap-1"><Bath size={14} className="text-slate-400"/> {imoveisDestaque[0].banheiros} wcs</span>}
                    {imoveisDestaque[0].vagas > 0 && <span className="flex items-center gap-1"><Car size={14} className="text-slate-400"/> {imoveisDestaque[0].vagas} vgs</span>}
                    {imoveisDestaque[0].area > 0 && <span className="flex items-center gap-1"><Maximize size={14} className="text-slate-400"/> {imoveisDestaque[0].area}m²</span>}
                  </div>
                </div>
              </Link>
            )}

            {/* Cards Secundários (Direita - 4 colunas empilhados) */}
            <div className="lg:col-span-4 flex flex-col gap-4 h-full">
              
              {/* Card Secundário 1 */}
              {imoveisDestaque[1] && (
                <Link href={`/imovel/${imoveisDestaque[1].id}`} className="flex-1 h-[300px] lg:h-auto relative group cursor-pointer overflow-hidden bg-slate-800 block">
                  <div 
                    className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105"
                    style={{ backgroundImage: `url(${imoveisDestaque[1].imagem_url || ''})` }}
                  >
                    {!imoveisDestaque[1].imagem_url && <div className="w-full h-full bg-[#152741] flex items-center justify-center text-slate-500">Sem Imagem</div>}
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-t from-[#020b18] via-[#020b18]/60 to-transparent opacity-90"></div>
                  
                  <div className="absolute bottom-0 left-0 w-full p-6">
                    <p className="text-[9px] text-gold tracking-widest uppercase mb-1">{imoveisDestaque[1].tipo}</p>
                    <h3 className="font-serif text-lg text-white mb-1 group-hover:text-gold transition-colors truncate">{imoveisDestaque[1].titulo}</h3>
                    <p className="font-serif text-lg text-gold mb-3">{formatarPreco(imoveisDestaque[1].preco)}</p>
                    
                    <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-300">
                      <span className="flex items-center gap-1"><MapPin size={12} className="text-gold"/> {imoveisDestaque[1].cidade}</span>
                      {imoveisDestaque[1].quartos > 0 && <span className="flex items-center gap-1"><Bed size={12} className="text-slate-400"/> {imoveisDestaque[1].quartos} qts</span>}
                    </div>
                  </div>
                </Link>
              )}

              {/* Card Secundário 2 */}
              {imoveisDestaque[2] && (
                <Link href={`/imovel/${imoveisDestaque[2].id}`} className="flex-1 h-[300px] lg:h-auto relative group cursor-pointer overflow-hidden bg-slate-800 block">
                  <div 
                    className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105"
                    style={{ backgroundImage: `url(${imoveisDestaque[2].imagem_url || ''})` }}
                  >
                    {!imoveisDestaque[2].imagem_url && <div className="w-full h-full bg-[#0f1d30] flex items-center justify-center text-slate-500">Sem Imagem</div>}
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-t from-[#020b18] via-[#020b18]/60 to-transparent opacity-90"></div>
                  
                  <div className="absolute bottom-0 left-0 w-full p-6">
                    <p className="text-[9px] text-gold tracking-widest uppercase mb-1">{imoveisDestaque[2].tipo}</p>
                    <h3 className="font-serif text-lg text-white mb-1 group-hover:text-gold transition-colors truncate">{imoveisDestaque[2].titulo}</h3>
                    <p className="font-serif text-lg text-gold mb-3">{formatarPreco(imoveisDestaque[2].preco)}</p>
                    
                    <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-300">
                      <span className="flex items-center gap-1"><MapPin size={12} className="text-gold"/> {imoveisDestaque[2].cidade}</span>
                      {imoveisDestaque[2].quartos > 0 && <span className="flex items-center gap-1"><Bed size={12} className="text-slate-400"/> {imoveisDestaque[2].quartos} qts</span>}
                    </div>
                  </div>
                </Link>
              )}
            </div>
          </div>
        ) : (
          <div className="flex justify-center items-center h-64 border border-slate-800 bg-[#1a304d]/20">
            <p className="text-slate-400 font-light">Nenhum imóvel em destaque encontrado para {abaAtiva.toLowerCase()}.</p>
          </div>
        )}

        {/* Botão Ver Todos */}
        <div className="mt-12 flex justify-center">
          <button className="text-white flex items-center gap-2 text-xs tracking-widest uppercase hover:text-gold transition-colors group">
            Ver portfólio completo 
            <ArrowRight size={16} className="group-hover:translate-x-2 transition-transform" />
          </button>
        </div>

      </section>

    </main>
  );
}