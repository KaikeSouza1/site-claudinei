'use client'

import { motion } from 'framer-motion'
import { Building2, Trees, Leaf, FileText } from 'lucide-react'

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

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.2,
      delayChildren: 0.1,
    },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6 },
  },
}

export default function AreasAtuacao() {
  return (
    <section className="relative z-10 w-full max-w-7xl mx-auto px-6 md:px-10 py-24">
      {/* Cabeçalho */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        viewport={{ once: true }}
        className="text-center mb-20"
      >
        <p className="text-xs text-gold tracking-widest uppercase mb-4">Nossa Expertise</p>
        <h2 className="font-serif text-4xl md:text-5xl text-white mb-6 leading-tight">
          Especialista em <span className="text-gold">Patrimônio Imobiliário</span>
        </h2>
        <p className="max-w-2xl mx-auto text-slate-300 text-base md:text-lg leading-relaxed">
          Atendemos as quatro frentes estratégicas do mercado imobiliário com expertise técnica,
          experiência de mercado e resultado comprovado.
        </p>
      </motion.div>

      {/* Grid de 4 áreas */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        className="grid grid-cols-1 md:grid-cols-2 gap-8"
      >
        {areas.map((area) => {
          const IconComponent = area.icon
          return (
            <motion.div
              key={area.id}
              variants={itemVariants}
              className={`group relative p-8 md:p-10 rounded-[24px] border ${area.borderColor} bg-[#173a57]/80 backdrop-blur-xl shadow-[0_20px_60px_rgba(15,23,42,0.25)] hover:shadow-[0_30px_90px_rgba(15,23,42,0.35)] transition-all duration-500 hover:-translate-y-2 cursor-pointer`}
            >
              {/* Ícone com gradiente */}
              <div
                className={`w-16 h-16 rounded-[16px] bg-gradient-to-br ${area.color} p-4 mb-6 shadow-lg shadow-${area.color.split('-')[2]}-500/20`}
              >
                <IconComponent className="w-full h-full text-white" strokeWidth={1.5} />
              </div>

              {/* Conteúdo */}
              <h3 className="font-serif text-2xl text-white mb-3 group-hover:text-gold transition-colors duration-300">
                {area.title}
              </h3>
              <p className="text-slate-300 text-sm md:text-base leading-relaxed">
                {area.description}
              </p>

              {/* Linha decorativa embaixo que se expande no hover */}
              <div className="absolute bottom-0 left-0 h-1 bg-gradient-to-r from-gold via-gold to-transparent w-0 group-hover:w-full rounded-full transition-all duration-500" />
            </motion.div>
          )
        })}
      </motion.div>

      {/* CTA secundário */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.4 }}
        viewport={{ once: true }}
        className="text-center mt-16"
      >
        <p className="text-slate-400 text-sm mb-6">
          Quer conhecer melhor nossas soluções para seu patrimônio?
        </p>
        <a
          href="https://wa.me/5542984156013"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 border border-gold text-gold hover:bg-gold hover:text-[#04122b] transition-all px-8 py-3 rounded-full text-sm font-bold uppercase tracking-widest group"
        >
          Entre em Contato
          <span className="group-hover:translate-x-1 transition-transform">→</span>
        </a>
      </motion.div>
    </section>
  )
}
