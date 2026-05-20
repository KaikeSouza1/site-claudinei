'use client'

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Users, TrendingUp, CheckCircle, Clock, Zap, ArrowRight, MessageCircle, PhoneCall } from 'lucide-react';

interface Lead {
  id: number;
  nome: string;
  telefone: string | null;
  origem: string;
  status: string;
  prioridade: string;
  imovel_interesse_titulo: string | null;
  criado_em: string;
  atividades: { id: number }[];
}

const FUNIL = [
  { key: 'novo',            label: 'Novos Contatos',   cor: '#3b82f6' },
  { key: 'contato_feito',   label: 'Em Atendimento',   cor: '#f59e0b' },
  { key: 'visita_agendada', label: 'Visita Agendada',  cor: '#8b5cf6' },
  { key: 'proposta',        label: 'Proposta / Doc.',  cor: '#f97316' },
  { key: 'fechado',         label: 'Negócio Fechado',  cor: '#22c55e' },
] as const;

const ORIGEM_LABEL: Record<string, string> = {
  site: 'Site', whatsapp: 'WhatsApp', indicacao: 'Indicação',
  telefone: 'Telefone', portal: 'Portal', instagram: 'Instagram',
};

function tempo(iso: string) {
  const m = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (m < 60)   return `${m}m atrás`;
  if (m < 1440) return `${Math.floor(m / 60)}h atrás`;
  return `${Math.floor(m / 1440)}d atrás`;
}

function StatCard({ label, value, icon: Icon, cor, loading }: {
  label: string; value: number; icon: React.ElementType; cor: string; loading: boolean;
}) {
  return (
    <div
      className="rounded-2xl p-5 flex flex-col gap-3"
      style={{ background: '#1e3552', border: '1px solid rgba(255,255,255,0.06)' }}
    >
      <div className="flex items-center justify-between">
        <p className="text-[10px] uppercase tracking-widest font-bold" style={{ color: '#5a7a99' }}>{label}</p>
        <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: cor + '20' }}>
          <Icon size={14} style={{ color: cor }} />
        </div>
      </div>
      <p className="font-serif text-4xl text-white font-bold">
        {loading ? <span className="text-2xl animate-pulse" style={{ color: '#3a5270' }}>—</span> : value}
      </p>
    </div>
  );
}

export default function CRMAnalytics() {
  const [leads,   setLeads]   = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/admin/crm/leads')
      .then(r => r.json())
      .then(d => { setLeads(Array.isArray(d) ? d : []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const agora     = new Date();
  const ha7dias   = new Date(agora.getTime() - 7 * 864e5);
  const inicioMes = new Date(agora.getFullYear(), agora.getMonth(), 1);

  const stats = {
    total:       leads.length,
    novos7d:     leads.filter(l => new Date(l.criado_em) >= ha7dias).length,
    andamento:   leads.filter(l => ['contato_feito','visita_agendada','proposta'].includes(l.status)).length,
    fechadosMes: leads.filter(l => l.status === 'fechado' && new Date(l.criado_em) >= inicioMes).length,
    urgentes:    leads.filter(l => l.prioridade === 'urgente' && !['fechado','perdido'].includes(l.status)).length,
  };

  const maxFunil  = Math.max(...FUNIL.map(f => leads.filter(l => l.status === f.key).length), 1);
  const recentes  = leads.slice(0, 10);
  const urgentes  = leads.filter(l => l.prioridade === 'urgente' && !['fechado','perdido'].includes(l.status));

  // taxa de conversão
  const totalAtivos = leads.filter(l => l.status !== 'perdido').length;
  const taxaConv    = totalAtivos > 0 ? Math.round((stats.fechadosMes / totalAtivos) * 100) : 0;

  // origens
  const origens = Object.entries(ORIGEM_LABEL)
    .map(([key, label]) => ({ key, label, count: leads.filter(l => l.origem === key).length }))
    .filter(o => o.count > 0)
    .sort((a, b) => b.count - a.count);

  const maxOrigem = Math.max(...origens.map(o => o.count), 1);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        <StatCard label="Total de Leads"  value={stats.total}       icon={Users}       cor="#3b82f6" loading={loading} />
        <StatCard label="Novos (7 dias)"  value={stats.novos7d}     icon={TrendingUp}  cor="#f59e0b" loading={loading} />
        <StatCard label="Em Andamento"    value={stats.andamento}   icon={Clock}       cor="#8b5cf6" loading={loading} />
        <StatCard label="Fechados (mês)"  value={stats.fechadosMes} icon={CheckCircle} cor="#22c55e" loading={loading} />
        <StatCard label="Urgentes"        value={stats.urgentes}    icon={Zap}         cor="#ef4444" loading={loading} />
      </div>

      <div className="grid lg:grid-cols-3 gap-5">

        {/* Funil */}
        <div
          className="lg:col-span-2 rounded-2xl p-6"
          style={{ background: '#1e3552', border: '1px solid rgba(255,255,255,0.06)' }}
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-white font-bold text-base">Funil de Vendas</h2>
              <p className="text-[11px] mt-0.5" style={{ color: '#5a7a99' }}>Distribuição atual do pipeline</p>
            </div>
            <Link href="/admin/crm/kanban"
              className="flex items-center gap-1.5 text-[11px] font-bold transition-colors hover:text-gold"
              style={{ color: '#C5A059' }}>
              Ver Kanban <ArrowRight size={12} />
            </Link>
          </div>

          {loading ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-8 rounded-full animate-pulse" style={{ background: '#12243a' }} />
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {FUNIL.map(stage => {
                const count = leads.filter(l => l.status === stage.key).length;
                const pct   = Math.max((count / maxFunil) * 100, 0);
                return (
                  <div key={stage.key} className="flex items-center gap-4">
                    <span className="text-[11px] font-medium w-36 text-right flex-shrink-0" style={{ color: '#7a9db8' }}>
                      {stage.label}
                    </span>
                    <div className="flex-1 rounded-full overflow-hidden" style={{ background: '#12243a', height: '28px' }}>
                      <div
                        className="h-full rounded-full flex items-center px-3 transition-all duration-700"
                        style={{ width: `${pct}%`, background: stage.cor + 'cc', minWidth: count > 0 ? '2.5rem' : 0 }}
                      >
                        {pct > 15 && (
                          <span className="text-[10px] font-bold text-white/80">{count}</span>
                        )}
                      </div>
                    </div>
                    <span className="text-sm font-bold text-white w-5 text-right flex-shrink-0">{count}</span>
                  </div>
                );
              })}
            </div>
          )}

          {/* Conversão */}
          <div className="mt-6 pt-5 flex items-center justify-between"
            style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
            <p className="text-[11px]" style={{ color: '#5a7a99' }}>Taxa de Conversão (mês)</p>
            <div className="flex items-center gap-3">
              <div className="w-32 rounded-full overflow-hidden" style={{ background: '#12243a', height: 6 }}>
                <div className="h-full rounded-full transition-all" style={{ width: `${taxaConv}%`, background: '#22c55e' }} />
              </div>
              <span className="text-sm font-bold" style={{ color: '#22c55e' }}>{taxaConv}%</span>
            </div>
          </div>
        </div>

        {/* Urgentes + Origens */}
        <div className="flex flex-col gap-4">

          {/* Urgentes */}
          <div
            className="rounded-2xl p-5 flex-1"
            style={{ background: '#1e3552', border: '1px solid rgba(239,68,68,0.15)' }}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white font-bold text-sm flex items-center gap-2">
                <Zap size={14} style={{ color: '#ef4444' }} /> Atenção Urgente
              </h3>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                style={{ background: 'rgba(239,68,68,0.12)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.2)' }}>
                {urgentes.length}
              </span>
            </div>
            {urgentes.length === 0 ? (
              <div className="text-center py-6">
                <CheckCircle size={24} className="mx-auto mb-2" style={{ color: '#22c55e', opacity: 0.5 }} />
                <p className="text-[12px]" style={{ color: '#3a5270' }}>Nenhum urgente!</p>
              </div>
            ) : (
              <div className="space-y-2">
                {urgentes.slice(0, 4).map(lead => (
                  <Link key={lead.id} href={`/admin/crm/leads/${lead.id}`}
                    className="flex items-center gap-2.5 p-2.5 rounded-xl transition-colors group"
                    style={{ background: 'rgba(0,0,0,0.2)' }}
                  >
                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                      style={{ background: 'rgba(239,68,68,0.15)', color: '#ef4444' }}>
                      {lead.nome.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[12px] text-white font-medium truncate group-hover:text-gold transition-colors">
                        {lead.nome}
                      </p>
                      <p className="text-[10px] truncate" style={{ color: '#4a6585' }}>
                        {lead.telefone || '—'}
                      </p>
                    </div>
                    {lead.telefone && (
                      <a href={`https://wa.me/55${lead.telefone.replace(/\D/g,'')}`}
                        target="_blank" rel="noopener noreferrer"
                        onClick={e => e.stopPropagation()}
                        style={{ color: '#22c55e' }} className="flex-shrink-0">
                        <MessageCircle size={14} />
                      </a>
                    )}
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Origens */}
          <div
            className="rounded-2xl p-5"
            style={{ background: '#1e3552', border: '1px solid rgba(255,255,255,0.06)' }}
          >
            <h3 className="text-white font-bold text-sm mb-4">Origem dos Leads</h3>
            {origens.length === 0 ? (
              <p className="text-[11px]" style={{ color: '#3a5270' }}>Sem dados ainda.</p>
            ) : (
              <div className="space-y-2.5">
                {origens.map(o => (
                  <div key={o.key} className="flex items-center gap-3">
                    <span className="text-[11px] w-20 text-right flex-shrink-0" style={{ color: '#7a9db8' }}>{o.label}</span>
                    <div className="flex-1 rounded-full overflow-hidden" style={{ background: '#12243a', height: 6 }}>
                      <div className="h-full rounded-full" style={{ width: `${(o.count / maxOrigem) * 100}%`, background: '#C5A059' }} />
                    </div>
                    <span className="text-[11px] font-bold text-white w-4 text-right">{o.count}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Tabela de Leads Recentes */}
      <div className="rounded-2xl overflow-hidden"
        style={{ background: '#1e3552', border: '1px solid rgba(255,255,255,0.06)' }}>

        <div className="flex items-center justify-between px-6 py-4"
          style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <h2 className="text-white font-bold text-base">Leads Recentes</h2>
          <Link href="/admin/crm/leads"
            className="text-[11px] font-bold flex items-center gap-1.5 transition-colors hover:text-white"
            style={{ color: '#C5A059' }}>
            Ver todos <ArrowRight size={12} />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                {['Lead', 'Origem', 'Status', 'Interesse', 'Chegou', 'Ações'].map((h, i) => (
                  <th key={h} className={`px-6 py-3 text-[10px] uppercase tracking-widest font-bold text-left ${i === 5 ? 'text-right' : ''}`}
                    style={{ color: '#C5A059', background: 'rgba(0,0,0,0.15)' }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} className="px-6 py-10 text-center text-sm animate-pulse" style={{ color: '#3a5270' }}>Carregando…</td></tr>
              ) : recentes.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-14 text-center">
                    <Users size={28} className="mx-auto mb-3" style={{ color: '#3a5270' }} />
                    <p className="text-sm" style={{ color: '#4a6585' }}>Nenhum lead cadastrado.</p>
                  </td>
                </tr>
              ) : recentes.map((lead, i) => {
                const STATUS_COR: Record<string, string> = {
                  novo: '#3b82f6', contato_feito: '#f59e0b', visita_agendada: '#8b5cf6',
                  proposta: '#f97316', fechado: '#22c55e', perdido: '#64748b',
                };
                const STATUS_LABEL: Record<string, string> = {
                  novo: 'Novo', contato_feito: 'Em Contato', visita_agendada: 'Visita',
                  proposta: 'Proposta', fechado: 'Fechado', perdido: 'Perdido',
                };
                const cor = STATUS_COR[lead.status] || '#64748b';
                return (
                  <tr key={lead.id}
                    style={{ borderBottom: i < recentes.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}
                    className="transition-colors hover:bg-white/[0.02]">
                    <td className="px-6 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                          style={{ background: 'rgba(197,160,89,0.15)', color: '#C5A059' }}>
                          {lead.nome.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-white font-medium text-[13px]">{lead.nome}</p>
                          <p className="text-[11px]" style={{ color: '#4a6585' }}>{lead.telefone || '—'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-3.5">
                      <span className="text-[11px] px-2 py-1 rounded-lg"
                        style={{ background: 'rgba(0,0,0,0.2)', color: '#7a9db8', border: '1px solid rgba(255,255,255,0.06)' }}>
                        {ORIGEM_LABEL[lead.origem] || lead.origem}
                      </span>
                    </td>
                    <td className="px-6 py-3.5">
                      <span className="text-[11px] flex items-center gap-1.5 font-medium" style={{ color: cor }}>
                        <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: cor }} />
                        {STATUS_LABEL[lead.status] || lead.status}
                      </span>
                    </td>
                    <td className="px-6 py-3.5">
                      <span className="text-[12px] max-w-[150px] truncate block" style={{ color: '#5a7a99' }}>
                        {lead.imovel_interesse_titulo || '—'}
                      </span>
                    </td>
                    <td className="px-6 py-3.5 text-[11px]" style={{ color: '#4a6585' }}>
                      {tempo(lead.criado_em)}
                    </td>
                    <td className="px-6 py-3.5">
                      <div className="flex items-center justify-end gap-2">
                        {lead.telefone && (
                          <a href={`https://wa.me/55${lead.telefone.replace(/\D/g,'')}`}
                            target="_blank" rel="noopener noreferrer"
                            className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors hover:bg-green-500/20"
                            style={{ color: '#22c55e' }}>
                            <MessageCircle size={13} />
                          </a>
                        )}
                        {lead.telefone && (
                          <a href={`tel:${lead.telefone}`}
                            className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors hover:bg-blue-500/20"
                            style={{ color: '#3b82f6' }}>
                            <PhoneCall size={13} />
                          </a>
                        )}
                        <Link href={`/admin/crm/leads/${lead.id}`}
                          className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors hover:bg-white/10"
                          style={{ color: '#5a7a99' }}>
                          <ArrowRight size={13} />
                        </Link>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
