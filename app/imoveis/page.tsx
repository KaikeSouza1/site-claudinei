import { Suspense } from 'react'
import type { Metadata } from 'next'
import ImoveisCatalog from '@/components/ImoveisCatalog'

export const metadata: Metadata = {
  title: 'Imóveis à venda e para alugar em União da Vitória e Porto União | Claudiney W. Otto Junior',
  description: 'Casas, apartamentos, terrenos, salas comerciais e áreas rurais à venda e para alugar em União da Vitória/PR e Porto União/SC.',
  alternates: { canonical: '/imoveis' },
}

export default function ImoveisPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#020b18] flex items-center justify-center text-gold">Carregando imóveis...</div>}>
      <ImoveisCatalog
        pageTitle="Todos os imóveis"
        pageSubtitle="Venda e locação"
        defaultFinalidade=""
      />
    </Suspense>
  )
}