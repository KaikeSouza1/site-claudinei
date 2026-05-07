// components/Header.tsx
import Link from 'next/link';

export default function Header() {
  return (
    <header className="absolute top-0 w-full z-50">
      <div className="flex justify-between items-center px-10 py-8 max-w-7xl mx-auto">
        <div>
          <h1 className="font-serif text-2xl tracking-wide text-white">Claudiney W. Otto Junior.</h1>
          <p className="text-[10px] tracking-widest text-gold mt-1 uppercase opacity-80">CRECI 37016 • CNAI 45505</p>
        </div>
        
        <nav className="hidden md:flex gap-8 text-xs font-semibold tracking-widest text-slate-300 uppercase">
          <Link href="/" className="hover:text-gold transition-colors">Início</Link>
          <Link href="/imoveis/aluguel" className="hover:text-gold transition-colors">Locação</Link>
          <Link href="/imoveis/venda" className="hover:text-gold transition-colors">Venda</Link>
          <Link href="#contato" className="hover:text-gold transition-colors">Contato</Link>
        </nav>

        <button className="border border-gold text-gold hover:bg-gold hover:text-[#04122b] transition-all px-6 py-2 text-xs tracking-widest uppercase">
          Whatsapp
        </button>
      </div>
    </header>
  );
}