'use client'

import { motion } from 'framer-motion'

const numeros = [
  { numero: 'Vasta', label: 'Experiência no Mercado', descricao: 'No mercado imobiliário' },
  { numero: '500+', label: 'Imóveis Negociados', descricao: 'Urbanos e rurais' },
  { numero: '1000+', label: 'Hectares', descricao: 'Em áreas rurais transacionadas' },
  { numero: '98%', label: 'Taxa de Satisfação', descricao: 'Clientes recomendando' },
]

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
      delayChildren: 0.1,
    },
  },
}

const itemVariants = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.6 },
  },
}

export default function NumerosExpertise() {
  return (
    <section className="relative z-10 w-full bg-gradient-to-b from-[#223a51] to-[#1a2d3d] py-24 border-y border-slate-700/40">
      <div className="max-w-7xl mx-auto px-6 md:px-10">
        {/* Cabeçalho */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <p className="text-xs text-gold tracking-widest uppercase mb-4">Nosso Histórico</p>
          <h2 className="font-serif text-4xl md:text-5xl text-white">
            Expertise em <span className="text-gold">Números</span>
          </h2>
        </motion.div>

        {/* Grid de números */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
        >
          {numeros.map((item, index) => (
            <motion.div
              key={index}
              variants={itemVariants}
              className="relative p-8 rounded-[24px] bg-[#173a57]/60 backdrop-blur border border-slate-600/30 hover:border-gold/40 transition-all duration-300 group hover:-translate-y-1"
            >
              {/* Fundo com gradiente no hover */}
              <div className="absolute inset-0 bg-gradient-to-br from-gold/5 to-transparent rounded-[24px] opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

              {/* Conteúdo */}
              <div className="relative z-10">
                <h3 className="font-serif text-5xl md:text-6xl text-gold mb-3 font-bold">
                  {item.numero}
                </h3>
                <p className="text-white font-semibold text-lg mb-2">{item.label}</p>
                <p className="text-slate-400 text-sm leading-relaxed">{item.descricao}</p>
              </div>

              {/* Linha decorativa */}
              <div className="absolute bottom-0 left-0 h-1 bg-gold w-0 group-hover:w-full rounded-full transition-all duration-500" />
            </motion.div>
          ))}
        </motion.div>

        {/* Descritivo embaixo */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          viewport={{ once: true }}
          className="text-center mt-16"
        >
          <p className="max-w-3xl mx-auto text-slate-300 text-base md:text-lg leading-relaxed">
            Transformamos a expertise em resultados concretos. Cada número representa
            confiança depositada por clientes que escolheram trabalhar conosco em suas
            operações imobiliárias mais importantes.
          </p>
        </motion.div>
      </div>
    </section>
  )
}
