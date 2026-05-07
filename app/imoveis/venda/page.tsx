import { Suspense } from 'react'
import ImoveisCatalog from '@/components/ImoveisCatalog'

export default function ImoveisVendaPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#020b18] flex items-center justify-center text-gold">Carregando catálogo...</div>}>
      <ImoveisCatalog
        pageTitle="Imóveis à Venda"
        pageSubtitle="Seleção exclusiva de imóveis para comprar"
        defaultFinalidade="Venda"
        activeSlug="venda"
      />
    </Suspense>
  )
}