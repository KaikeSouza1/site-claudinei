import { Suspense } from 'react'
import ImoveisCatalog from '@/components/ImoveisCatalog'

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