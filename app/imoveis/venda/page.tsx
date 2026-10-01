import { Suspense } from 'react'
import type { Metadata } from 'next'
import ImoveisCatalog from '@/components/ImoveisCatalog'

export const metadata: Metadata = {
  title: 'Imóveis à venda em União da Vitória e Porto União | Claudiney W. Otto Junior',
  description: 'Casas, sobrados, apartamentos, terrenos e áreas rurais à venda em União da Vitória/PR e Porto União/SC. Corretor CRECI 37016-PR.',
  alternates: { canonical: '/imoveis/venda' },
}

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