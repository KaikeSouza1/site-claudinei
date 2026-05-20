'use client'

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Home, Users, LogOut, LayoutDashboard,
  KanbanSquare, UserPlus, BarChart2, ChevronDown,
  FileText, DollarSign, FilePlus,
} from 'lucide-react';
import { useState } from 'react';

function NavItem({
  href, icon: Icon, label, active,
}: {
  href: string; icon: React.ElementType; label: string; active: boolean;
}) {
  return (
    <Link
      href={href}
      className={`flex items-center gap-3 px-4 py-2.5 text-sm rounded-lg transition-colors ${
        active
          ? 'bg-gold/10 text-gold border border-gold/20'
          : 'text-slate-300 hover:bg-white/5 hover:text-white'
      }`}
    >
      <Icon size={16} />
      {label}
    </Link>
  );
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname      = usePathname();
  const crmAberto     = pathname.startsWith('/admin/crm');
  const contratosAberto = pathname.startsWith('/admin/contratos') || pathname.startsWith('/admin/financeiro');
  const [crmExpand,       setCrmExpand]       = useState(crmAberto);
  const [contratosExpand, setContratosExpand] = useState(contratosAberto);

  return (
    <div className="flex h-screen bg-[#223a51] w-full font-sans">

      {/* MENU LATERAL */}
      <aside className="w-64 bg-[#2f4968] border-r border-slate-500/30 flex flex-col flex-shrink-0">

        {/* Logo / Branding */}
        <div className="p-6 border-b border-slate-500/30">
          <h2 className="text-gold font-serif text-xl leading-tight">Claudiney W.<br />Otto Junior</h2>
          <p className="text-[10px] text-slate-400 uppercase tracking-widest mt-2">Painel Administrativo</p>
        </div>

        <nav className="flex-1 p-4 flex flex-col gap-1 overflow-y-auto">

          {/* Dashboard */}
          <NavItem
            href="/admin"
            icon={LayoutDashboard}
            label="Dashboard"
            active={pathname === '/admin'}
          />

          {/* Imóveis */}
          <NavItem
            href="/admin/imoveis"
            icon={Home}
            label="Meus Imóveis"
            active={pathname.startsWith('/admin/imoveis')}
          />

          {/* Divisor */}
          <div className="my-2 border-t border-slate-500/20" />
          <p className="text-[9px] uppercase tracking-widest text-slate-500 px-4 pb-1 font-bold">CRM</p>

          {/* CRM: item principal com accordion */}
          <button
            onClick={() => setCrmExpand(!crmExpand)}
            className={`flex items-center gap-3 px-4 py-2.5 text-sm rounded-lg transition-colors w-full ${
              crmAberto ? 'bg-gold/10 text-gold border border-gold/20' : 'text-slate-300 hover:bg-white/5 hover:text-white'
            }`}
          >
            <Users size={16} />
            <span className="flex-1 text-left">CRM &amp; Leads</span>
            <ChevronDown size={14} className={`transition-transform ${crmExpand ? 'rotate-180' : ''}`} />
          </button>

          {/* Sub-links CRM */}
          {crmExpand && (
            <div className="ml-4 flex flex-col gap-1 border-l border-slate-500/20 pl-3">
              <NavItem
                href="/admin/crm"
                icon={BarChart2}
                label="Dashboard CRM"
                active={pathname === '/admin/crm'}
              />
              <NavItem
                href="/admin/crm/leads"
                icon={Users}
                label="Todos os Leads"
                active={pathname === '/admin/crm/leads'}
              />
              <NavItem
                href="/admin/crm/leads/novo"
                icon={UserPlus}
                label="Novo Lead"
                active={pathname === '/admin/crm/leads/novo'}
              />
              <NavItem
                href="/admin/crm/kanban"
                icon={KanbanSquare}
                label="Kanban Board"
                active={pathname === '/admin/crm/kanban'}
              />
            </div>
          )}

          {/* Divisor */}
          <div className="my-2 border-t border-slate-500/20" />
          <p className="text-[9px] uppercase tracking-widest text-slate-500 px-4 pb-1 font-bold">Pós-Venda</p>

          {/* Contratos: accordion */}
          <button
            onClick={() => setContratosExpand(!contratosExpand)}
            className={`flex items-center gap-3 px-4 py-2.5 text-sm rounded-lg transition-colors w-full ${
              contratosAberto ? 'bg-gold/10 text-gold border border-gold/20' : 'text-slate-300 hover:bg-white/5 hover:text-white'
            }`}
          >
            <FileText size={16} />
            <span className="flex-1 text-left">Contratos</span>
            <ChevronDown size={14} className={`transition-transform ${contratosExpand ? 'rotate-180' : ''}`} />
          </button>

          {contratosExpand && (
            <div className="ml-4 flex flex-col gap-1 border-l border-slate-500/20 pl-3">
              <NavItem
                href="/admin/contratos"
                icon={FileText}
                label="Todos os Contratos"
                active={pathname === '/admin/contratos'}
              />
              <NavItem
                href="/admin/contratos/novo"
                icon={FilePlus}
                label="Novo Contrato"
                active={pathname === '/admin/contratos/novo'}
              />
              <NavItem
                href="/admin/financeiro"
                icon={DollarSign}
                label="Financeiro"
                active={pathname === '/admin/financeiro'}
              />
            </div>
          )}
        </nav>

        {/* Sair */}
        <div className="p-4 border-t border-slate-500/30">
          <button
            onClick={async () => {
              await fetch('/api/auth/logout', { method: 'POST' });
              window.location.href = '/login';
            }}
            className="flex items-center gap-3 px-4 py-2.5 text-sm text-red-400 hover:bg-red-400/10 rounded-lg transition-colors w-full text-left"
          >
            <LogOut size={16} />
            Sair do Painel
          </button>
        </div>
      </aside>

      {/* Conteúdo */}
      <main className="flex-1 overflow-y-auto bg-[#223a51] p-8 relative">
        {children}
      </main>
    </div>
  );
}
