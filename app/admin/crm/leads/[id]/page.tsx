'use client'

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft, Save, Edit3, Trash2, MessageCircle, PhoneCall,
  Mail, Home, Clock, Phone, User, Zap, Flame, Star,
  CheckCircle, X, Plus, Send, ChevronDown,
} from 'lucide-react';

interface Atividade {
  id: number;
  lead_id: number;
  tipo: string;
  descricao: string;
  data_atividade: string;
  criado_em: string;
}

interface Lead {
  id: number;
  nome: string;
  email: string | null;
  telefone: string | null;
  mensagem: string | null;
  origem: string;
  status: string;
  prioridade: string;
  imovel_interesse_id: number | null;
  imovel_interesse_titulo: string | null;
  anotacoes: string | null;
  criado_em: string;
  atualizado_em: string;
  atividades: Atividade[];
}

const STATUS_CFG = {
  novo:            { label: 'Novo',           dot: 'bg-blue-400',   text: 'text-blue-400',    bg: 'bg-blue-400/10',    border: 'border-blue-400/30'   },
  contato_feito:   { label: 'Em Contato',     dot: 'bg-yellow-400', text: 'text-yellow-400',  bg: 'bg-yellow-400/10',  border: 'border-yellow-400/30' },
  visita_agendada: { label: 'Visita Agendada',dot: 'bg-purple-400', text: 'text-purple-400',  bg: 'bg-purple-400/10',  border: 'border-purple-400/30' },
  proposta:        { label: 'Proposta',       dot: 'bg-orange-400', text: 'text-orange-400',  bg: 'bg-orange-400/10',  border: 'border-orange-400/30' },
  fechado:         { label: 'Fechado ✓',      dot: 'bg-green-400',  text: 'text-green-400',   bg: 'bg-green-400/10',   border: 'border-green-400/30'  },
  perdido:         { label: 'Perdido',        dot: 'bg-red-400',    text: 'text-red-400',     bg: 'bg-red-400/10',     border: 'border-red-400/30'    },
} as const;

const ATIVIDADE_CFG = {
  ligacao:  { label: 'Ligação',       icon: Phone,          color: 'text-blue-400',   bg: 'bg-blue-400/15'   },
  whatsapp: { label: 'WhatsApp',      icon: MessageCircle,  color: 'text-green-400',  bg: 'bg-green-400/15'  },
  email:    { label: 'E-mail',        icon: Mail,           color: 'text-purple-400', bg: 'bg-purple-400/15' },
  visita:   { label: 'Visita',        icon: Home,           color: 'text-orange-400', bg: 'bg-orange-400/15' },
  proposta: { label: 'Proposta',      icon: CheckCircle,    color: 'text-gold',       bg: 'bg-gold/15'       },
  nota:     { label: 'Nota Interna',  icon: Edit3,          color: 'text-slate-400',  bg: 'bg-slate-400/15'  },
} as const;

const ORIGEM_LABEL: Record<string, string> = {
  site: 'Site', whatsapp: 'WhatsApp', indicacao: 'Indicação',
  telefone: 'Telefone', portal: 'Portal', instagram: 'Instagram',
};

function dataFmt(iso: string) {
  return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function dataFmtCurta(iso: string) {
  return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
}

export default function LeadDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id }     = use(params);
  const router     = useRouter();
  const [lead,     setLead]     = useState<Lead | null>(null);
  const [loading,  setLoading]  = useState(true);
  const [editando, setEditando] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [form,     setForm]     = useState<Partial<Lead>>({});
  const [novaAt,   setNovaAt]   = useState({ tipo: 'nota', descricao: '' });
  const [addingAt, setAddingAt] = useState(false);
  const [deletandoAt, setDelAt] = useState<number | null>(null);

  async function carregar() {
    const res  = await fetch(`/api/admin/crm/leads/${id}`);
    const data = await res.json();
    if (res.ok) { setLead(data); setForm(data); }
    setLoading(false);
  }

  useEffect(() => { carregar(); }, [id]);

  async function salvarEdicao() {
    setSalvando(true);
    const res = await fetch(`/api/admin/crm/leads/${id}`, {
      method:  'PUT',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(form),
    });
    const data = await res.json();
    if (res.ok) { setLead(data); setEditando(false); }
    setSalvando(false);
  }

  async function mudarStatus(novoStatus: string) {
    const res = await fetch(`/api/admin/crm/leads/${id}`, {
      method:  'PUT',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ status: novoStatus }),
    });
    const data = await res.json();
    if (res.ok) setLead(prev => prev ? { ...prev, status: data.status } : prev);
  }

  async function adicionarAtividade(e: React.FormEvent) {
    e.preventDefault();
    if (!novaAt.descricao.trim()) return;
    setAddingAt(true);
    const res = await fetch('/api/admin/crm/atividades', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ lead_id: id, ...novaAt }),
    });
    if (res.ok) {
      await carregar();
      setNovaAt({ tipo: 'nota', descricao: '' });
    }
    setAddingAt(false);
  }

  async function deletarAtividade(atId: number) {
    setDelAt(atId);
    await fetch(`/api/admin/crm/atividades?id=${atId}`, { method: 'DELETE' });
    setLead(prev => prev ? { ...prev, atividades: prev.atividades.filter(a => a.id !== atId) } : prev);
    setDelAt(null);
  }

  async function excluirLead() {
    if (!confirm('Excluir este lead permanentemente?')) return;
    await fetch(`/api/admin/crm/leads/${id}`, { method: 'DELETE' });
    router.push('/admin/crm/leads');
  }

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-[#2f4968] rounded w-1/3" />
          <div className="h-48 bg-[#2f4968] rounded-xl" />
          <div className="h-64 bg-[#2f4968] rounded-xl" />
        </div>
      </div>
    );
  }

  if (!lead) {
    return (
      <div className="max-w-5xl mx-auto text-center py-20">
        <p className="text-slate-400 text-lg">Lead não encontrado.</p>
        <Link href="/admin/crm/leads" className="text-gold hover:underline mt-4 inline-block">← Voltar</Link>
      </div>
    );
  }

  const scfg  = STATUS_CFG[lead.status as keyof typeof STATUS_CFG] ?? STATUS_CFG.novo;
  const PrioIcon = lead.prioridade === 'urgente' ? Zap : lead.prioridade === 'alta' ? Flame : lead.prioridade === 'media' ? Star : null;
  const prioColor = lead.prioridade === 'urgente' ? 'text-red-400' : lead.prioridade === 'alta' ? 'text-orange-400' : 'text-blue-400';
  const inputClass = "w-full bg-[#223a51] border border-slate-500/30 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-gold/50";

  return (
    <div className="max-w-5xl mx-auto">

      {/* Header */}
      <div className="mb-6 flex flex-wrap gap-4 justify-between items-start">
        <div className="flex items-center gap-4">
          <Link href="/admin/crm/leads"
            className="text-slate-400 hover:text-white transition-colors p-2 hover:bg-white/5 rounded-lg">
            <ArrowLeft size={18} />
          </Link>
          <div>
            <h1 className="font-serif text-2xl text-white flex items-center gap-2">
              {lead.nome}
              {PrioIcon && <PrioIcon size={16} className={prioColor} />}
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">Lead #{lead.id} · Criado em {dataFmt(lead.criado_em)}</p>
          </div>
        </div>

        <div className="flex gap-2 flex-wrap">
          {lead.telefone && (
            <a href={`https://wa.me/55${lead.telefone.replace(/\D/g,'')}`}
              target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold bg-green-500/10 border border-green-500/30 text-green-400 hover:bg-green-500/20 transition-colors">
              <MessageCircle size={13} /> WhatsApp
            </a>
          )}
          {lead.telefone && (
            <a href={`tel:${lead.telefone}`}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold bg-blue-500/10 border border-blue-500/30 text-blue-400 hover:bg-blue-500/20 transition-colors">
              <PhoneCall size={13} /> Ligar
            </a>
          )}
          {!editando && (
            <button onClick={() => setEditando(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold bg-[#2f4968] border border-slate-500/30 text-slate-300 hover:text-white transition-colors">
              <Edit3 size={13} /> Editar
            </button>
          )}
          <button onClick={excluirLead}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20 transition-colors">
            <Trash2 size={13} /> Excluir
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Coluna Esquerda: Info + Status */}
        <div className="lg:col-span-1 space-y-4">

          {/* Card de Perfil */}
          <div className="bg-[#2f4968]/60 border border-slate-500/30 rounded-xl p-5">
            <div className="flex items-center gap-4 mb-5">
              <div className="w-14 h-14 rounded-full bg-gold/15 flex items-center justify-center text-gold text-2xl font-serif font-bold">
                {lead.nome.charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="text-white font-medium text-lg">{lead.nome}</p>
                <span className={`text-xs flex items-center gap-1 mt-0.5 ${scfg.text}`}>
                  <span className={`w-2 h-2 rounded-full ${scfg.dot}`} /> {scfg.label}
                </span>
              </div>
            </div>

            {!editando ? (
              <div className="space-y-3 text-sm">
                {lead.telefone && (
                  <div className="flex items-center gap-3 text-slate-300">
                    <Phone size={14} className="text-slate-500 flex-shrink-0" />
                    <span>{lead.telefone}</span>
                  </div>
                )}
                {lead.email && (
                  <div className="flex items-center gap-3 text-slate-300">
                    <Mail size={14} className="text-slate-500 flex-shrink-0" />
                    <span className="truncate">{lead.email}</span>
                  </div>
                )}
                <div className="flex items-center gap-3 text-slate-300">
                  <User size={14} className="text-slate-500 flex-shrink-0" />
                  <span>{ORIGEM_LABEL[lead.origem] || lead.origem}</span>
                </div>
                {lead.imovel_interesse_titulo && (
                  <div className="flex items-start gap-3 text-slate-300">
                    <Home size={14} className="text-slate-500 flex-shrink-0 mt-0.5" />
                    <span className="text-xs leading-relaxed">{lead.imovel_interesse_titulo}</span>
                  </div>
                )}
                {lead.mensagem && (
                  <div className="mt-4 pt-4 border-t border-slate-500/20">
                    <p className="text-[10px] uppercase tracking-widest text-slate-500 mb-2">Mensagem</p>
                    <p className="text-xs text-slate-400 leading-relaxed">{lead.mensagem}</p>
                  </div>
                )}
                {lead.anotacoes && (
                  <div className="mt-3 pt-3 border-t border-slate-500/20">
                    <p className="text-[10px] uppercase tracking-widest text-slate-500 mb-2">Anotações</p>
                    <p className="text-xs text-slate-400 leading-relaxed">{lead.anotacoes}</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                <div>
                  <label className="text-[10px] uppercase tracking-widest text-slate-400 block mb-1">Nome</label>
                  <input value={form.nome || ''} onChange={e => setForm(p => ({...p, nome: e.target.value}))} className={inputClass} />
                </div>
                <div>
                  <label className="text-[10px] uppercase tracking-widest text-slate-400 block mb-1">Telefone</label>
                  <input value={form.telefone || ''} onChange={e => setForm(p => ({...p, telefone: e.target.value}))} placeholder="(00) 00000-0000" className={inputClass} />
                </div>
                <div>
                  <label className="text-[10px] uppercase tracking-widest text-slate-400 block mb-1">E-mail</label>
                  <input value={form.email || ''} onChange={e => setForm(p => ({...p, email: e.target.value}))} type="email" className={inputClass} />
                </div>
                <div>
                  <label className="text-[10px] uppercase tracking-widest text-slate-400 block mb-1">Origem</label>
                  <select value={form.origem || 'site'} onChange={e => setForm(p => ({...p, origem: e.target.value}))} className={inputClass}>
                    <option value="site">Site</option>
                    <option value="whatsapp">WhatsApp</option>
                    <option value="indicacao">Indicação</option>
                    <option value="telefone">Telefone</option>
                    <option value="portal">Portal</option>
                    <option value="instagram">Instagram</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] uppercase tracking-widest text-slate-400 block mb-1">Prioridade</label>
                  <select value={form.prioridade || 'media'} onChange={e => setForm(p => ({...p, prioridade: e.target.value}))} className={inputClass}>
                    <option value="baixa">Baixa</option>
                    <option value="media">Média</option>
                    <option value="alta">Alta</option>
                    <option value="urgente">🚨 Urgente</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] uppercase tracking-widest text-slate-400 block mb-1">Mensagem</label>
                  <textarea value={form.mensagem || ''} onChange={e => setForm(p => ({...p, mensagem: e.target.value}))} rows={3} className={`${inputClass} resize-none`} />
                </div>
                <div>
                  <label className="text-[10px] uppercase tracking-widest text-slate-400 block mb-1">Anotações</label>
                  <textarea value={form.anotacoes || ''} onChange={e => setForm(p => ({...p, anotacoes: e.target.value}))} rows={3} className={`${inputClass} resize-none`} />
                </div>
                <div className="flex gap-2 pt-1">
                  <button onClick={salvarEdicao} disabled={salvando}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-bold bg-gold text-[#04122b] hover:brightness-110 disabled:opacity-60 transition-all">
                    <Save size={12} /> {salvando ? 'Salvando…' : 'Salvar'}
                  </button>
                  <button onClick={() => { setEditando(false); setForm(lead); }}
                    className="px-4 py-2 rounded-lg text-xs font-bold border border-slate-500/30 text-slate-400 hover:text-white transition-colors">
                    <X size={12} />
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Mudar Status */}
          <div className="bg-[#2f4968]/60 border border-slate-500/30 rounded-xl p-5">
            <p className="text-[10px] uppercase tracking-widest text-slate-400 mb-3 font-bold">Pipeline / Status</p>
            <div className="space-y-2">
              {(Object.keys(STATUS_CFG) as (keyof typeof STATUS_CFG)[]).map(s => {
                const cfg    = STATUS_CFG[s];
                const ativo  = lead.status === s;
                return (
                  <button key={s} onClick={() => mudarStatus(s)}
                    className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-xs font-medium transition-all border ${
                      ativo
                        ? `${cfg.bg} ${cfg.border} ${cfg.text}`
                        : 'bg-transparent border-transparent text-slate-400 hover:bg-white/5'
                    }`}>
                    <span className={`w-2 h-2 rounded-full flex-shrink-0 ${cfg.dot}`} />
                    {cfg.label}
                    {ativo && <span className="ml-auto"><CheckCircle size={12} /></span>}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Coluna Direita: Timeline de Atividades */}
        <div className="lg:col-span-2 space-y-4">

          {/* Adicionar Atividade */}
          <div className="bg-[#2f4968]/60 border border-slate-500/30 rounded-xl p-5">
            <h3 className="text-white font-medium mb-4 flex items-center gap-2">
              <Plus size={15} className="text-gold" /> Registrar Interação
            </h3>
            <form onSubmit={adicionarAtividade} className="space-y-3">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {(Object.keys(ATIVIDADE_CFG) as (keyof typeof ATIVIDADE_CFG)[]).map(tipo => {
                  const cfg  = ATIVIDADE_CFG[tipo];
                  const Ico  = cfg.icon;
                  const ativ = novaAt.tipo === tipo;
                  return (
                    <button key={tipo} type="button" onClick={() => setNovaAt(p => ({...p, tipo}))}
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium border transition-all ${
                        ativ
                          ? `${cfg.bg} ${cfg.color} border-current/30`
                          : 'bg-[#223a51]/50 text-slate-400 border-transparent hover:bg-[#223a51]'
                      }`}>
                      <Ico size={13} /> {cfg.label}
                    </button>
                  );
                })}
              </div>
              <div className="flex gap-2">
                <textarea
                  value={novaAt.descricao}
                  onChange={e => setNovaAt(p => ({...p, descricao: e.target.value}))}
                  placeholder="Descreva a interação…"
                  rows={2}
                  className={`flex-1 ${inputClass} resize-none`}
                  onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); adicionarAtividade(e as any); } }}
                />
                <button type="submit" disabled={addingAt || !novaAt.descricao.trim()}
                  className="self-end px-4 py-2 rounded-lg bg-gold text-[#04122b] text-xs font-bold hover:brightness-110 disabled:opacity-50 transition-all flex items-center gap-1.5">
                  <Send size={13} /> {addingAt ? '…' : 'Registrar'}
                </button>
              </div>
            </form>
          </div>

          {/* Timeline */}
          <div className="bg-[#2f4968]/60 border border-slate-500/30 rounded-xl p-5">
            <h3 className="text-white font-medium mb-5 flex items-center gap-2">
              <Clock size={15} className="text-gold" />
              Histórico de Interações
              <span className="ml-1 text-xs bg-[#223a51] border border-slate-500/20 px-2 py-0.5 rounded-full text-slate-400">
                {lead.atividades.length}
              </span>
            </h3>

            {lead.atividades.length === 0 ? (
              <div className="text-center py-10">
                <Clock size={28} className="mx-auto mb-3 text-slate-600" />
                <p className="text-slate-500 text-sm">Nenhuma interação registrada ainda.</p>
                <p className="text-slate-600 text-xs mt-1">Registre a primeira acima.</p>
              </div>
            ) : (
              <div className="relative">
                {/* Linha vertical */}
                <div className="absolute left-[18px] top-0 bottom-0 w-px bg-slate-500/20" />

                <div className="space-y-4">
                  {lead.atividades.map((at, i) => {
                    const cfg  = ATIVIDADE_CFG[at.tipo as keyof typeof ATIVIDADE_CFG] ?? ATIVIDADE_CFG.nota;
                    const Ico  = cfg.icon;
                    return (
                      <div key={at.id} className="flex gap-4 group">
                        {/* Ícone na linha */}
                        <div className={`relative z-10 w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${cfg.bg}`}>
                          <Ico size={15} className={cfg.color} />
                        </div>

                        {/* Conteúdo */}
                        <div className="flex-1 pb-4">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <span className={`text-xs font-bold ${cfg.color}`}>{cfg.label}</span>
                              <span className="text-xs text-slate-500 ml-2">{dataFmtCurta(at.data_atividade)}</span>
                            </div>
                            <button onClick={() => deletarAtividade(at.id)} disabled={deletandoAt === at.id}
                              className="opacity-0 group-hover:opacity-100 text-slate-600 hover:text-red-400 transition-all flex-shrink-0">
                              <X size={13} />
                            </button>
                          </div>
                          <p className="text-sm text-slate-300 mt-1.5 leading-relaxed bg-[#223a51]/40 px-3 py-2 rounded-lg">
                            {at.descricao}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
