import Link from 'next/link';
import { Home, Users, LogOut } from 'lucide-react';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen bg-[#020b18] w-full font-sans">
      
      {/* MENU LATERAL PREMIUM */}
      <aside className="w-64 bg-[#1a304d] border-r border-slate-700/50 flex flex-col">
        <div className="p-6 border-b border-slate-700/50">
          <h2 className="text-gold font-serif text-xl leading-tight">Claudiney W.<br/>Otto Junior</h2>
          <p className="text-[10px] text-slate-400 uppercase tracking-widest mt-2">Painel Administrativo</p>
        </div>
        
        <nav className="flex-1 p-4 flex flex-col gap-2">
          {/* Focado no que importa */}
          <Link href="/admin/imoveis" className="flex items-center gap-3 px-4 py-3 text-sm text-slate-300 hover:bg-white/5 hover:text-gold rounded-lg transition-colors">
            <Home size={18} />
            Meus Imóveis
          </Link>
          <Link href="/crm" className="flex items-center gap-3 px-4 py-3 text-sm text-slate-300 hover:bg-white/5 hover:text-gold rounded-lg transition-colors">
            <Users size={18} />
            CRM & Leads
          </Link>
        </nav>

        <div className="p-4 border-t border-slate-700/50">
          <Link href="/" className="flex items-center gap-3 px-4 py-3 text-sm text-red-400 hover:bg-red-400/10 rounded-lg transition-colors">
            <LogOut size={18} />
            Sair do Painel
          </Link>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto bg-[#020b18] p-8 relative">
        {children}
      </main>
    </div>
  );
}