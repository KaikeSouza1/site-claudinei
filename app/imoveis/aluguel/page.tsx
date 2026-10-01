import { Suspense } from 'react'
import type { Metadata } from 'next'
import ImoveisCatalog from '@/components/ImoveisCatalog'

export const metadata: Metadata = {
  title: 'Imóveis para alugar em União da Vitória e Porto União | Claudiney W. Otto Junior',
  description: 'Casas, apartamentos, kitnets e salas comerciais para alugar em União da Vitória/PR e Porto União/SC.',
  alternates: { canonical: '/imoveis/aluguel' },
}

export default function ImoveisAluguelPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#020b18] flex items-center justify-center text-gold">Carregando catálogo...</div>}>
      <ImoveisCatalog
        pageTitle="Imóveis para Alugar"
        pageSubtitle="Opções exclusivas de locação"
        defaultFinalidade="Locação"
        activeSlug="aluguel"
      />
    </Suspense>
  )
}