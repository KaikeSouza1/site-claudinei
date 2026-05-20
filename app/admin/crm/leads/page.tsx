'use client'

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Search, MessageCircle, PhoneCall, ArrowRight, Trash2, Filter, X, Zap, Flame, Star } from 'lucide-react';

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

const STATUS_COR: Record<string, string>   = { novo:'#3b82f6', contato_feito:'#f59e0b', visita_agendada:'#8b5cf6', proposta:'#f97316', fechado:'#22c55e', perdido:'#64748b' };
const STATUS_LABEL: Record<string, string> = { todos:'Todos', novo:'Novo', contato_feito:'Em Contato', visita_agendada:'Visita', proposta:'Proposta', fechado:'Fechado', perdido:'Perdido' };
const ORIGEM_LABEL: Record<string, string> = { site:'Site', whatsapp:'WhatsApp', indicacao:'Indicação', telefone:'Telefone', portal:'Portal', instagram:'Instagram' };

function tempo(iso: string) {
  const m = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (m < 60)   return `${m}m atrás`;
  if (m < 1440) return `${Math.floor(m / 60)}h atrás`;
  return `${Math.floor(m / 1440)}d atrás`;
}

export default function LeadsPage() {
  const [leads,    setLeads]    = useState<Lead[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [status,   setStatus]   = useState('todos');
  const [busca,    setBusca]    = useState('');
  const [prio,     setPrio]     = useState('todos');
  const [filtros,  setFiltros]  = useState(false);
  const [deleting, setDeleting] = useState<number | null>(null);

  const carregar = useCallback(async () => {
    setLoading(true);
    const p = new URLSearchParams();
    if (status !== 'todos') p.set('status', status);
    if (prio   !== 'todos') p.set('prioridade', prio);
    if (busca.trim())       p.set('busca', busca.trim());
    const res  = await fetch(`/api/admin/crm/leads?${p}`);
    const data = await res.json();
    setLeads(Array.isArray(data) ? data : []);
    setLoading(false);
  }, [status, prio, busca]);

  useEffect(() => {
    const t = setTimeout(carregar, busca ? 400 : 0);
    return () => clearTimeout(t);
  }, [carregar]);

  async function deletar(id: number) {
    if (!confirm('Excluir este lead permanentemente?')) return;
    setDeleting(id);
    await fetch(`/api/admin/crm/leads/${id}`, { method: 'DELETE' });
    setLeads(p => p.filter(l => l.id !== id));
    setDeleting(null);
  }

  const card = { background: '#1e3552', border: '1px solid rgba(255,255,255,0.06)' };

  return (
    <div className="p-6 max-w-7xl mx-auto">

      {/* Header */}
      <div className="flex flex-wrap gap-4 justify-between items-center mb-6">
        <div>
          <h1 className="text-white font-bold text-2xl">Todos os Leads</h1>
          <p className="text-[12px] mt-0.5" style={{ color: '#5a7a99' }}>
            {loading ? '…' : `${leads.length} lead${leads.length !== 1 ? 's' : ''} encontrado${leads.length !== 1 ? 's' : ''}`}
          </p>
        </div>
      </div>

      {/* Status chips */}
      <div className="flex flex-wrap gap-2 mb-4">
        {Object.keys(STATUS_LABEL).map(s => {
          const cor  = STATUS_COR[s] || '#C5A059';
          const ativo = status === s;
          const cnt  = s === 'todos' ? leads.length : leads.filter(l => l.status === s).length;
          return (
            <button key={s} onClick={() => setStatus(s)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold transition-all"
              style={ativo
                ? { background: cor + '20', color: cor, border: `1px solid ${cor}40` }
                : { background: 'rgba(255,255,255,0.04)', color: '#5a7a99', border: '1px solid rgba(255,255,255,0.07)' }
              }>
              {s !== 'todos' && <span className="w-1.5 h-1.5 rounded-full" style={{ background: ativo ? cor : '#5a7a99' }} />}
              {STATUS_LABEL[s]}
              <span className="px-1.5 py-0.5 rounded-full text-[10px]"
                style={{ background: ativo ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.2)' }}>
                {cnt}
              </span>
            </button>
          );
        })}
      </div>

      {/* Search + filtros */}
      <div className="flex gap-3 mb-5">
        <div className="flex-1 relative max-w-md">
          <Search size={13} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: '#4a6585' }} />
          <input
            value={busca} onChange={e => setBusca(e.target.value)}
            placeholder="Buscar por nome, e-mail ou telefone…"
            className="w-full pl-9 pr-9 py-2.5 rounded-xl text-sm focus:outline-none transition-colors"
            style={{ background: '#12243a', border: '1px solid rgba(255,255,255,0.08)', color: '#e2eaf4' }}
          />
          {busca && (
            <button onClick={() => setBusca('')} className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: '#4a6585' }}>
              <X size={13} />
            </button>
          )}
        </div>
        <button onClick={() => setFiltros(!filtros)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-[11px] font-bold transition-all"
          style={filtros
            ? { background: 'rgba(197,160,89,0.1)', color: '#C5A059', border: '1px solid rgba(197,160,89,0.2)' }
            : { background: '#12243a', color: '#5a7a99', border: '1px solid rgba(255,255,255,0.08)' }
          }>
          <Filter size={13} /> Filtros
        </button>
      </div>

      {filtros && (
        <div className="mb-5 p-4 rounded-xl flex gap-4"
          style={{ background: '#12243a', border: '1px solid rgba(255,255,255,0.06)' }}>
          <div>
            <label className="text-[10px] uppercase tracking-widest block mb-1.5 font-bold" style={{ color: '#5a7a99' }}>Prioridade</label>
            <select value={prio} onChange={e => setPrio(e.target.value)}
              className="rounded-xl px-3 py-2 text-sm focus:outline-none"
              style={{ background: '#1e3552', border: '1px solid rgba(255,255,255,0.08)', color: '#e2eaf4' }}>
              <option value="todos">Todas</option>
              <option value="baixa">Baixa</option>
              <option value="media">Média</option>
              <option value="alta">Alta</option>
              <option value="urgente">Urgente</option>
            </select>
          </div>
        </div>
      )}

      {/* Tabela */}
      <div className="rounded-2xl overflow-hidden" style={card}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', background: 'rgba(0,0,0,0.2)' }}>
                {['Lead', 'Origem', 'Status', 'Interesse', 'Interações', 'Chegou', 'Ações'].map((h, i) => (
                  <th key={h}
                    className={`px-5 py-3 text-[10px] uppercase tracking-widest font-bold text-left ${i === 6 ? 'text-right' : ''}
                      ${i >= 3 ? 'hidden md:table-cell' : ''} ${i === 4 ? 'lg:table-cell hidden' : ''}`}
                    style={{ color: '#C5A059' }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                [...Array(6)].map((_, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                    {[...Array(7)].map((_, j) => (
                      <td key={j} className="px-5 py-4">
                        <div className="h-3.5 rounded animate-pulse" style={{ background: '#12243a', width: `${50 + Math.random()*40}%` }} />
                      </td>
                    ))}
                  </tr>
                ))
              ) : leads.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-16 text-center">
                    <Search size={28} className="mx-auto mb-3" style={{ color: '#2a4060' }} />
                    <p className="font-medium" style={{ color: '#4a6585' }}>Nenhum lead encontrado</p>
                    <p className="text-[11px] mt-1" style={{ color: '#2a4060' }}>Tente outros filtros ou crie um novo</p>
                  </td>
                </tr>
              ) : leads.map((lead, i) => {
                const cor = STATUS_COR[lead.status] || '#64748b';
                const PrioIcon = lead.prioridade === 'urgente' ? Zap : lead.prioridade === 'alta' ? Flame : lead.prioridade === 'media' ? Star : null;
                const prioCor  = lead.prioridade === 'urgente' ? '#ef4444' : lead.prioridade === 'alta' ? '#f97316' : '#3b82f6';
                return (
                  <tr key={lead.id}
                    style={{ borderBottom: i < leads.length - 1 ? '1px solid rgba(255,255,255,0.03)' : 'none' }}
                    className="transition-colors hover:bg-white/[0.015]">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0"
                          style={{ background: 'rgba(197,160,89,0.15)', color: '#C5A059' }}>
                          {lead.nome.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-white font-medium text-[13px] flex items-center gap-1.5">
                            {lead.nome}
                            {PrioIcon && <PrioIcon size={11} style={{ color: prioCor }} />}
                          </p>
                          <p className="text-[11px]" style={{ color: '#4a6585' }}>
                            {lead.telefone || lead.email || '—'}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="text-[11px] px-2 py-1 rounded-lg"
                        style={{ background: 'rgba(0,0,0,0.2)', color: '#7a9db8', border: '1px solid rgba(255,255,255,0.06)' }}>
                        {ORIGEM_LABEL[lead.origem] || lead.origem}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="text-[11px] flex items-center gap-1.5 font-medium" style={{ color: cor }}>
                        <span className="w-1.5 h-1.5 rounded-full" style={{ background: cor }} />
                        {STATUS_LABEL[lead.status] || lead.status}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 hidden md:table-cell">
                      <span className="text-[11px] max-w-[140px] truncate block" style={{ color: '#5a7a99' }}>
                        {lead.imovel_interesse_titulo || '—'}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 hidden lg:table-cell">
                      <span className="text-[11px]" style={{ color: '#4a6585' }}>
                        {lead.atividades?.length ?? 0}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 hidden md:table-cell">
                      <span className="text-[11px]" style={{ color: '#4a6585' }}>{tempo(lead.criado_em)}</span>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center justify-end gap-1">
                        {lead.telefone && (
                          <a href={`https://wa.me/55${lead.telefone.replace(/\D/g,'')}`}
                            target="_blank" rel="noopener noreferrer"
                            className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors hover:bg-green-500/15"
                            style={{ color: '#22c55e' }} title="WhatsApp">
                            <MessageCircle size={13} />
                          </a>
                        )}
                        {lead.telefone && (
                          <a href={`tel:${lead.telefone}`}
                            className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors hover:bg-blue-500/15"
                            style={{ color: '#3b82f6' }} title="Ligar">
                            <PhoneCall size={13} />
                          </a>
                        )}
                        <Link href={`/admin/crm/leads/${lead.id}`}
                          className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors hover:bg-white/10"
                          style={{ color: '#5a7a99' }} title="Ver detalhes">
                          <ArrowRight size={13} />
                        </Link>
                        <button onClick={() => deletar(lead.id)} disabled={deleting === lead.id}
                          className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors hover:bg-red-500/15 opacity-0 group-hover:opacity-100"
                          style={{ color: '#ef444460' }} title="Excluir">
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {!loading && leads.length > 0 && (
          <div className="px-6 py-2.5 text-[10px]" style={{ borderTop: '1px solid rgba(255,255,255,0.04)', color: '#3a5270' }}>
            {leads.length} lead(s) · Pipeline CRM
          </div>
        )}
      </div>
    </div>
  );
}
