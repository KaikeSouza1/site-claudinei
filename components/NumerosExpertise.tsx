'use client'

import { motion } from 'framer-motion'
import { ShieldCheck, Award, BadgeCheck, Trees } from 'lucide-react'

const credentials = [
  {
    icon: ShieldCheck,
    titulo: 'Experiência Consolidada',
    descricao: 'Atuação no mercado imobiliário, avaliação e análise patrimonial.',
  },
  {
    icon: Award,
    titulo: 'CRECI 37016-PR',
    descricao: 'Corretor de Imóveis habilitado no Paraná.',
  },
  {
    icon: BadgeCheck,
    titulo: 'CNAI 45505',
    descricao: 'Avaliador imobiliário cadastrado para emissão de parecer técnico.',
  },
  {
    icon: Trees,
    titulo: 'Imóveis Urbanos, Rurais e Florestais',
    descricao: 'Atuação em venda, locação, avaliação e estratégia patrimonial.',
  },
]

export default function NumerosExpertise() {
  return (
    <section className="relative z-10 w-full py-10">
      <div className="max-w-6xl mx-auto px-6 md:px-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="bg-[#0d2a42]/90 backdrop-blur-md border border-gold/25 rounded-[20px] px-4 md:px-8 py-8 md:py-10"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
            {credentials.map((item, index) => {
              const Icon = item.icon
              const isLast = index === credentials.length - 1
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  viewport={{ once: true }}
                  className={`flex flex-col items-center text-center px-6 py-4 ${
                    !isLast ? 'lg:border-r border-gold/20' : ''
                  }`}
                >
                  <Icon size={40} className="text-gold mb-4" strokeWidth={1.4} />
                  <h3 className="text-gold font-bold text-sm md:text-[15px] leading-snug mb-2">
                    {item.titulo}
                  </h3>
                  <p className="text-slate-300 text-xs md:text-sm leading-relaxed">
                    {item.descricao}
                  </p>
                </motion.div>
              )
            })}
          </div>
        </motion.div>
      </div>
    </section>
  )
}
