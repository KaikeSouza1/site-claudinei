'use client'

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { Search, MessageCircle, PhoneCall, ChevronDown, X, Zap, Flame, Star } from 'lucide-react';

interface Lead {
  id: number;
  nome: string;
  email: string | null;
  telefone: string | null;
  origem: string;
  status: string;
  prioridade: string;
  imovel_interesse_titulo: string | null;
  criado_em: string;
  atividades: { id: number }[];
}

const COLUNAS = [
  {
    key:   'novo',
    label: 'NOVOS CONTATOS',
    cor:   '#3b82f6',
    light: 'rgba(59,130,246,0.12)',
    border:'#3b82f6',
  },
  {
    key:   'contato_feito',
    label: 'EM ATENDIMENTO',
    cor:   '#f59e0b',
    light: 'rgba(245,158,11,0.12)',
    border:'#f59e0b',
  },
  {
    key:   'visita_agendada',
    label: 'VISITA AGENDADA',
    cor:   '#8b5cf6',
    light: 'rgba(139,92,246,0.12)',
    border:'#8b5cf6',
  },
  {
    key:   'proposta',
    label: 'PROPOSTA / DOC.',
    cor:   '#f97316',
    light: 'rgba(249,115,22,0.12)',
    border:'#f97316',
  },
  {
    key:   'fechado',
    label: 'NEGÓCIO FECHADO',
    cor:   '#22c55e',
    light: 'rgba(34,197,94,0.12)',
    border:'#22c55e',
  },
  {
    key:   'perdido',
    label: 'ARQUIVADOS',
    cor:   '#64748b',
    light: 'rgba(100,116,139,0.08)',
    border:'#64748b',
  },
] as const;

const ORIGEM_LABEL: Record<string, string> = {
  site: 'Site', whatsapp: 'WA', indicacao: 'Indicação',
  telefone: 'Fone', portal: 'Portal', instagram: 'IG',
};

function dataFmt(iso: string) {
  return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
}

// ── Card individual ──
function LeadCard({
  lead, colunaKey, onMoverPara, isDragging, onDragStart, onDragEnd,
}: {
  lead: Lead;
  colunaKey: string;
  onMoverPara: (id: number, status: string) => void;
  isDragging: boolean;
  onDragStart: (id: number) => void;
  onDragEnd: () => void;
}) {
  const [menu, setMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const PrioIcon = lead.prioridade === 'urgente' ? Zap : lead.prioridade === 'alta' ? Flame : lead.prioridade === 'media' ? Star : null;
  const prioCor  = lead.prioridade === 'urgente' ? '#ef4444' : lead.prioridade === 'alta' ? '#f97316' : '#3b82f6';

  useEffect(() => {
    const fechar = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenu(false);
    };
    document.addEventListener('mousedown', fechar);
    return () => document.removeEventListener('mousedown', fechar);
  }, []);

  const iniciais = lead.nome.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();

  return (
    <div
      draggable
      onDragStart={() => onDragStart(lead.id)}
      onDragEnd={onDragEnd}
      className={`rounded-xl border transition-all duration-150 cursor-grab active:cursor-grabbing select-none group
        ${isDragging ? 'opacity-40 scale-95' : 'opacity-100'}
      `}
      style={{
        background: '#1e3552',
        borderColor: '#2e4a6a',
        boxShadow: '0 2px 8px rgba(0,0,0,0.25)',
      }}
    >
      {/* Priority bar top */}
      {lead.prioridade !== 'baixa' && lead.prioridade !== 'media' && (
        <div className="h-0.5 rounded-t-xl" style={{ background: prioCor }} />
      )}

      <div className="p-4">
        {/* Header: avatar + nome + data */}
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="flex items-center gap-2.5 min-w-0">
            {/* Avatar */}
            <div
              className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
              style={{ background: 'rgba(197,160,89,0.18)', color: '#C5A059' }}
            >
              {iniciais}
            </div>
            <div className="min-w-0">
              <p className="text-white font-semibold text-sm leading-tight truncate">{lead.nome}</p>
              <p className="text-[11px] mt-0.5" style={{ color: '#6b8aad' }}>
                {ORIGEM_LABEL[lead.origem] || lead.origem} · {dataFmt(lead.criado_em)}
              </p>
            </div>
          </div>
          {PrioIcon && (
            <PrioIcon size={13} style={{ color: prioCor }} className="flex-shrink-0 mt-0.5" />
          )}
        </div>

        {/* Telefone */}
        {lead.telefone && (
          <div className="flex items-center gap-2 mb-2.5">
            <PhoneCall size={11} style={{ color: '#6b8aad' }} className="flex-shrink-0" />
            <span className="text-[12px]" style={{ color: '#9ab2c8' }}>{lead.telefone}</span>
          </div>
        )}

        {/* Imóvel */}
        {lead.imovel_interesse_titulo && (
          <div
            className="text-[11px] px-2.5 py-1.5 rounded-lg mb-3 truncate"
            style={{ background: 'rgba(0,0,0,0.2)', color: '#7fa3c0', border: '1px solid rgba(255,255,255,0.05)' }}
          >
            {lead.imovel_interesse_titulo}
          </div>
        )}

        {/* Footer: atividades + ações */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            {lead.atividades?.length > 0 && (
              <span
                className="text-[10px] px-2 py-0.5 rounded-full font-medium"
                style={{ background: 'rgba(255,255,255,0.07)', color: '#6b8aad' }}
              >
                {lead.atividades.length} interação{lead.atividades.length > 1 ? 'ões' : ''}
              </span>
            )}
          </div>

          <div className="flex items-center gap-1">
            {lead.telefone && (
              <a
                href={`https://wa.me/55${lead.telefone.replace(/\D/g, '')}`}
                target="_blank" rel="noopener noreferrer"
                onClick={e => e.stopPropagation()}
                className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors hover:bg-green-500/20"
                style={{ color: '#22c55e' }}
                title="WhatsApp"
              >
                <MessageCircle size={13} />
              </a>
            )}
            <Link
              href={`/admin/crm/leads/${lead.id}`}
              className="text-[10px] px-2 py-1 rounded-lg font-medium transition-colors hover:text-gold"
              style={{ color: '#6b8aad' }}
            >
              ver
            </Link>

            {/* Mover para */}
            <div ref={menuRef} className="relative">
              <button
                onClick={e => { e.stopPropagation(); setMenu(!menu); }}
                className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors hover:bg-white/10"
                style={{ color: '#6b8aad' }}
              >
                <ChevronDown size={12} />
              </button>
              {menu && (
                <div
                  className="absolute right-0 top-8 z-50 rounded-xl py-1 min-w-[168px]"
                  style={{ background: '#12243a', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 16px 40px rgba(0,0,0,0.4)' }}
                >
                  <p className="text-[9px] uppercase tracking-widest px-3 py-2" style={{ color: '#4a6585' }}>
                    Mover para
                  </p>
                  {COLUNAS.filter(c => c.key !== colunaKey).map(c => (
                    <button
                      key={c.key}
                      onClick={() => { onMoverPara(lead.id, c.key); setMenu(false); }}
                      className="w-full text-left flex items-center gap-2.5 px-3 py-2 text-[12px] transition-colors hover:bg-white/5"
                      style={{ color: '#9ab2c8' }}
                    >
                      <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: c.cor }} />
                      {c.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Página principal ──
export default function KanbanPage() {
  const [leads,    setLeads]    = useState<Lead[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [busca,    setBusca]    = useState('');
  const [dragging, setDragging] = useState<number | null>(null);
  const [overCol,  setOverCol]  = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/admin/crm/leads')
      .then(r => r.json())
      .then(d => { setLeads(Array.isArray(d) ? d : []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const leadsFiltrados = busca.trim()
    ? leads.filter(l =>
        l.nome.toLowerCase().includes(busca.toLowerCase()) ||
        (l.telefone || '').includes(busca) ||
        (l.imovel_interesse_titulo || '').toLowerCase().includes(busca.toLowerCase())
      )
    : leads;

  async function moverLead(leadId: number, novoStatus: string) {
    setLeads(prev => prev.map(l => l.id === leadId ? { ...l, status: novoStatus } : l));
    await fetch(`/api/admin/crm/leads/${leadId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: novoStatus }),
    });
  }

  return (
    <div className="flex flex-col" style={{ height: 'calc(100vh - 57px)' }}>

      {/* Search Bar */}
      <div
        className="flex items-center gap-4 px-6 py-4 flex-shrink-0"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}
      >
        <div className="flex-1 relative max-w-md">
          <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: '#4a6585' }} />
          <input
            value={busca}
            onChange={e => setBusca(e.target.value)}
            placeholder="Buscar lead por nome, fone, imóvel…"
            className="w-full pl-10 pr-9 py-2.5 rounded-xl text-sm transition-colors focus:outline-none"
            style={{
              background: '#12243a',
              border: '1px solid rgba(255,255,255,0.08)',
              color: '#e2eaf4',
            }}
          />
          {busca && (
            <button onClick={() => setBusca('')} className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: '#4a6585' }}>
              <X size={13} />
            </button>
          )}
        </div>
        <span className="text-sm" style={{ color: '#4a6585' }}>
          {loading ? '…' : `${leadsFiltrados.length} lead${leadsFiltrados.length !== 1 ? 's' : ''}`}
        </span>
      </div>

      {/* Kanban Board */}
      <div className="flex-1 flex gap-5 px-6 py-5 overflow-x-auto overflow-y-hidden">
        {loading ? (
          COLUNAS.map(col => (
            <div key={col.key} className="w-72 flex-shrink-0">
              <div className="h-12 rounded-xl mb-4 animate-pulse" style={{ background: '#1e3552' }} />
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-28 rounded-xl mb-3 animate-pulse" style={{ background: '#1e3552' }} />
              ))}
            </div>
          ))
        ) : (
          COLUNAS.map(col => {
            const colLeads = leadsFiltrados.filter(l => l.status === col.key);
            const isOver   = overCol === col.key;

            return (
              <div
                key={col.key}
                className="w-72 flex-shrink-0 flex flex-col"
                onDragOver={e => { e.preventDefault(); setOverCol(col.key); }}
                onDragLeave={e => {
                  if (!(e.currentTarget as HTMLElement).contains(e.relatedTarget as HTMLElement)) {
                    setOverCol(null);
                  }
                }}
                onDrop={() => {
                  if (dragging !== null) moverLead(dragging, col.key);
                  setDragging(null);
                  setOverCol(null);
                }}
              >
                {/* Column Header */}
                <div
                  className="rounded-xl px-4 py-3 mb-3 flex-shrink-0"
                  style={{
                    background: col.light,
                    borderTop: `3px solid ${col.cor}`,
                    border: `1px solid ${col.cor}22`,
                    borderTopColor: col.cor,
                  }}
                >
                  <div className="flex items-center justify-between">
                    <p
                      className="text-[11px] font-extrabold tracking-wider"
                      style={{ color: col.cor }}
                    >
                      {col.label}
                    </p>
                    <span
                      className="text-[11px] font-bold w-6 h-6 rounded-full flex items-center justify-center"
                      style={{ background: col.cor, color: '#fff' }}
                    >
                      {colLeads.length}
                    </span>
                  </div>
                </div>

                {/* Cards */}
                <div
                  className={`flex-1 space-y-3 overflow-y-auto pr-1 pb-4 transition-all rounded-xl ${
                    isOver ? 'outline outline-2 outline-dashed' : ''
                  }`}
                  style={isOver ? { outlineColor: col.cor + '60', background: col.light } : {}}
                >
                  {colLeads.length === 0 && !isOver ? (
                    <div
                      className="h-20 rounded-xl flex items-center justify-center text-xs"
                      style={{
                        border: `1px dashed rgba(255,255,255,0.06)`,
                        color: '#3a5270',
                      }}
                    >
                      Sem leads
                    </div>
                  ) : (
                    colLeads.map(lead => (
                      <LeadCard
                        key={lead.id}
                        lead={lead}
                        colunaKey={col.key}
                        isDragging={dragging === lead.id}
                        onDragStart={setDragging}
                        onDragEnd={() => setDragging(null)}
                        onMoverPara={moverLead}
                      />
                    ))
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
