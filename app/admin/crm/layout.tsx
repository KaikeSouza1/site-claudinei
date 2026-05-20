'use client'

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { KanbanSquare, Users, BarChart2, UserPlus, Archive } from 'lucide-react';

const TABS = [
  { href: '/admin/crm/kanban', label: 'KANBAN',     icon: KanbanSquare },
  { href: '/admin/crm/leads',  label: 'LEADS',      icon: Users        },
  { href: '/admin/crm',        label: 'ANALYTICS',  icon: BarChart2, exact: true },
];

export default function CRMLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="-m-8 flex flex-col" style={{ minHeight: 'calc(100vh - 0px)' }}>

      {/* ── CRM Top Bar ── */}
      <header className="flex items-center justify-between px-8 py-0 bg-[#17293d] border-b border-slate-700/50 flex-shrink-0">

        {/* Left: branding + tabs */}
        <div className="flex items-center">

          {/* Logo */}
          <div className="pr-8 py-4 border-r border-slate-700/50 mr-6">
            <p className="text-white font-extrabold text-base leading-none tracking-tight">
              Pipeline <span className="text-gold">CRM</span>
            </p>
            <p className="text-[9px] text-slate-500 uppercase tracking-[0.15em] mt-0.5">
              Inteligência Comercial
            </p>
          </div>

          {/* Tabs */}
          <nav className="flex items-stretch h-full">
            {TABS.map(tab => {
              const ativo = tab.exact
                ? pathname === tab.href
                : pathname.startsWith(tab.href);
              return (
                <Link
                  key={tab.href}
                  href={tab.href}
                  className={`relative flex items-center gap-2 px-5 py-4 text-[11px] font-bold tracking-widest transition-colors ${
                    ativo
                      ? 'text-gold'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <tab.icon size={13} />
                  {tab.label}
                  {/* underline indicator */}
                  {ativo && (
                    <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-gold rounded-t-full" />
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Right: novo lead CTA */}
        <Link
          href="/admin/crm/leads/novo"
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-[11px] font-extrabold tracking-widest bg-gold text-[#04122b] hover:brightness-110 active:scale-95 transition-all shadow-lg shadow-gold/20"
        >
          + NOVO LEAD
        </Link>
      </header>

      {/* Page content */}
      <div className="flex-1 overflow-auto bg-[#1d3249]">
        {children}
      </div>
    </div>
  );
}
