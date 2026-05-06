'use client'

import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

export default function Home() {
  return (
    // Como o Header global já está no layout, ajustamos a main para preencher o resto da tela
    <main className="flex-1 bg-luxury-gradient flex flex-col relative overflow-hidden">
      
      {/* HERO SECTION */}
      {/* Adicionei um py-20 para dar um respiro já que o header saiu daqui */}
      <section className="flex-1 flex items-center justify-center max-w-7xl w-full mx-auto px-10 py-20 relative z-10">
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

            {/* ESTATÍSTICAS */}
            <div className="flex gap-10 mt-8">
              <div>
                <p className="font-serif text-3xl text-gold">10+</p>
                <p className="text-[10px] text-slate-400 uppercase tracking-widest mt-1">Anos de<br/>Experiência</p>
              </div>
              <div>
                <p className="font-serif text-3xl text-gold">850+</p>
                <p className="text-[10px] text-slate-400 uppercase tracking-widest mt-1">Imóveis<br/>Negociados</p>
              </div>
              <div>
                <p className="font-serif text-3xl text-gold">98%</p>
                <p className="text-[10px] text-slate-400 uppercase tracking-widest mt-1">Clientes<br/>Satisfeitos</p>
              </div>
            </div>

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
            {/* Decoração sutil atrás da foto */}
            <div className="absolute right-[-20px] top-[-20px] w-full h-full border border-slate-600/50 z-0"></div>
            
            <div className="relative z-10 bg-[#1a304d] p-2 shadow-2xl">
              {/* Substitua o src pela URL real do Cloudflare R2 depois */}
              <div className="w-[400px] h-[500px] bg-slate-800 relative overflow-hidden">
                <div className="absolute inset-0 flex items-center justify-center text-slate-500">
                  [Foto do Claudiney aqui]
                </div>
                {/* 
                  <Image 
                    src="https://seu-link-do-cloudflare.com/foto-claudiney.jpg" 
                    alt="Claudiney W. Otto Junior" 
                    fill 
                    className="object-cover"
                  /> 
                */}
              </div>
              
              {/* Etiqueta flutuante sobre a foto */}
              <div className="absolute bottom-6 left-[-40px] bg-[#04122b] border border-gold/30 p-4 shadow-xl">
                <p className="font-serif text-gold text-lg">Claudiney W. Otto Junior</p>
                <p className="text-[10px] text-slate-400 tracking-widest uppercase mt-1">Corretor e Avaliador de Imóveis</p>
              </div>
            </div>
          </motion.div>

        </div>
      </section>

    </main>
  );
}