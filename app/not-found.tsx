import Link from 'next/link';

export const metadata = { title: 'Página não encontrada', robots: { index: false } };

export default function NotFound() {
  return (
    <main className="min-h-screen pt-32 pb-20 px-6 flex flex-col items-center justify-center text-center bg-[#020b18]">
      <p className="text-[10px] uppercase tracking-[0.3em] text-gold mb-4">Erro 404</p>
      <h1 className="font-serif text-3xl md:text-4xl text-white mb-4">Página não encontrada</h1>
      <p className="text-slate-400 max-w-md mb-8">
        Este imóvel pode ter sido vendido, alugado ou retirado do site. Veja as outras opções disponíveis.
      </p>
      <div className="flex flex-wrap gap-4 justify-center">
        <Link href="/imoveis/venda" className="bg-gold text-[#04122b] px-8 py-3 rounded-full text-xs font-bold uppercase tracking-widest">Imóveis à venda</Link>
        <Link href="/imoveis/aluguel" className="border-2 border-gold text-gold px-8 py-3 rounded-full text-xs font-bold uppercase tracking-widest">Para alugar</Link>
      </div>
    </main>
  );
}
