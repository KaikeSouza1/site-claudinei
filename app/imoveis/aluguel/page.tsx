import { Suspense } from 'react'
import ImoveisCatalog from '@/components/ImoveisCatalog'

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