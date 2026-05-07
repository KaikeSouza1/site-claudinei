'use client'

import { motion } from 'framer-motion'
import { CheckCircle2, Award, FileCheck, ArrowRight } from 'lucide-react'

const beneficios = [
  'Laudo técnico conforme normas ABNT',
  'Avaliação mercadológica precisa',
  'Parecer especializado para transações',
  'Análise comparativa de mercado',
]

export default function AvaliacaoImobiliaria() {
  return (
    <section className="relative z-10 w-full max-w-7xl mx-auto px-6 md:px-10 py-24">
      <div className="grid md:grid-cols-2 gap-12 items-center">
        {/* Coluna esquerda */}
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          whileInView={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
        >
          <div className="flex items-center gap-4 text-gold text-xs tracking-widest uppercase mb-8">
            <span className="w-10 h-[1px] bg-gold block" />
            Diferencial de Mercado
          </div>

          <h2 className="font-serif text-4xl md:text-5xl text-white mb-6 leading-tight">
            Avaliação <br />
            <span className="text-gold italic">Profissional</span> &<br />
            Autorizada
          </h2>

          <p className="text-slate-300 text-base md:text-lg leading-relaxed mb-8">
            Somos especializados em avaliação imobiliária técnica. Fornecemos laudos precisos
            para transações imobiliárias, financiamentos, sucessões, participação societária e
            qualquer situação que exija parecer especializado de mercado.
          </p>

          <div className="space-y-4 mb-10">
            {beneficios.map((beneficio, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="flex items-start gap-3"
              >
                <CheckCircle2 className="w-5 h-5 text-gold flex-shrink-0 mt-0.5" />
                <span className="text-slate-300 text-sm md:text-base">{beneficio}</span>
              </motion.div>
            ))}
          </div>

          <div className="flex flex-col sm:flex-row gap-4">
            <a
              href="https://wa.me/5542984156013"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 bg-gold text-[#04122b] hover:bg-gold/90 transition-all px-8 py-4 rounded-full text-sm font-bold uppercase tracking-widest group"
            >
              Solicitar Avaliação
              <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
            </a>
            <a
              href="https://wa.me/5542984156013"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 border border-gold/40 text-gold hover:bg-gold/10 transition-all px-8 py-4 rounded-full text-sm font-bold uppercase tracking-widest"
            >
              Mais Informações
            </a>
          </div>
        </motion.div>

        {/* Coluna direita - Card destacado */}
        <motion.div
          initial={{ opacity: 0, x: 30 }}
          whileInView={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          viewport={{ once: true }}
          className="relative"
        >
          {/* Moldura decorativa */}
          <div className="absolute inset-0 bg-gradient-to-br from-gold/20 to-gold/5 rounded-[32px] blur-2xl" />

          {/* Card principal */}
          <div className="relative z-10 bg-[#173a57]/90 backdrop-blur-xl border border-gold/30 rounded-[32px] p-10 shadow-[0_40px_100px_rgba(197,160,89,0.1)]">
            {/* Ícone grande */}
            <motion.div
              initial={{ scale: 0, rotate: -20 }}
              whileInView={{ scale: 1, rotate: 0 }}
              transition={{ duration: 0.7, delay: 0.3 }}
              viewport={{ once: true }}
              className="w-24 h-24 rounded-[24px] bg-gradient-to-br from-amber-500/30 to-gold/20 flex items-center justify-center mb-8 shadow-lg shadow-gold/20"
            >
              <FileCheck className="w-12 h-12 text-gold" strokeWidth={1.5} />
            </motion.div>

            {/* Badge */}
            <div className="flex items-center gap-2 mb-6">
              <Award className="w-5 h-5 text-gold" />
              <span className="text-xs text-gold tracking-widest uppercase font-bold">
                Especialista Certificado
              </span>
            </div>

            {/* Heading */}
            <h3 className="font-serif text-2xl text-gold mb-4">Por que nos escolher?</h3>

            {/* Pontos-chave */}
            <div className="space-y-4">
              <div className="space-y-2">
                <p className="text-white font-semibold text-sm">✓ Experiência Comprovada</p>
                <p className="text-slate-300 text-sm leading-relaxed">
                  Mais de 10 anos avaliando imóveis urbanos, rurais e especiais.
                </p>
              </div>
              <div className="space-y-2">
                <p className="text-white font-semibold text-sm">✓ Metodologia Técnica</p>
                <p className="text-slate-300 text-sm leading-relaxed">
                  Seguimos rigorosamente as normas ABNT e metodologia internacionalmente reconhecida.
                </p>
              </div>
              <div className="space-y-2">
                <p className="text-white font-semibold text-sm">✓ Resultado Preciso</p>
                <p className="text-slate-300 text-sm leading-relaxed">
                  Laudos confiáveis aceitos por instituições financeiras e órgãos públicos.
                </p>
              </div>
            </div>

            {/* Linha decorativa */}
            <div className="my-8 h-px bg-gradient-to-r from-gold/50 via-gold/20 to-transparent" />

            {/* Estatística ou selo */}
            <div className="text-center py-6 border-t border-slate-700/50">
              <p className="text-xs text-slate-400 uppercase tracking-widest mb-2">CRECI • ABNT</p>
              <p className="text-sm text-gold font-semibold">Laudo válido nacionalmente</p>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
