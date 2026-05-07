import ImoveisCatalog from '@/components/ImoveisCatalog'

export default function ImoveisVendaPage() {
  return (
    <ImoveisCatalog
      pageTitle="Imóveis à Venda"
      pageSubtitle="Seleção exclusiva de imóveis para comprar"
      defaultFinalidade="Venda"
      activeSlug="venda"
    />
  )
}
