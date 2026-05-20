'use client'

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Save, User, Phone, Mail, MessageSquare, Home } from 'lucide-react';

interface Imovel { id: number; titulo: string; cidade: string; }

export default function NovoLeadPage() {
  const router = useRouter();
  const [salvando, setSalvando] = useState(false);
  const [imoveis,  setImoveis]  = useState<Imovel[]>([]);
  const [erro,     setErro]     = useState('');

  const [form, setForm] = useState({
    nome:                    '',
    email:                   '',
    telefone:                '',
    mensagem:                '',
    origem:                  'site',
    status:                  'novo',
    prioridade:              'media',
    imovel_interesse_id:     '',
    imovel_interesse_titulo: '',
    anotacoes:               '',
  });

  useEffect(() => {
    fetch('/api/imoveis')
      .then(r => r.json())
      .then((d: Imovel[]) => setImoveis(Array.isArray(d) ? d : []))
      .catch(() => {});
  }, []);

  function set(field: string, value: string) {
    setForm(p => ({ ...p, [field]: value }));
    if (field === 'imovel_interesse_id') {
      const imovel = imoveis.find(i => String(i.id) === value);
      setForm(p => ({
        ...p,
        imovel_interesse_id:     value,
        imovel_interesse_titulo: imovel ? imovel.titulo : '',
      }));
    }
  }

  async function salvar(e: React.FormEvent) {
    e.preventDefault();
    if (!form.nome.trim()) { setErro('Nome é obrigatório.'); return; }
    setSalvando(true);
    setErro('');

    const payload = {
      ...form,
      imovel_interesse_id: form.imovel_interesse_id ? Number(form.imovel_interesse_id) : null,
    };

    const res = await fetch('/api/admin/crm/leads', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(payload),
    });

    const data = await res.json();
    if (!res.ok) {
      setErro(data.error || 'Erro ao salvar o lead.');
      setSalvando(false);
      return;
    }
    router.push(`/admin/crm/leads/${data.id}`);
  }

  const inputClass = "w-full bg-[#223a51] border border-slate-500/30 rounded-lg px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-gold/60 transition-colors";
  const labelClass = "block text-[10px] uppercase tracking-widest text-slate-400 mb-1.5 font-bold";

  return (
    <div className="max-w-3xl mx-auto">

      {/* Header */}
      <div className="mb-8 flex items-center gap-4">
        <Link href="/admin/crm/leads"
          className="text-slate-400 hover:text-white transition-colors p-2 hover:bg-white/5 rounded-lg">
          <ArrowLeft size={18} />
        </Link>
        <div>
          <h1 className="font-serif text-3xl text-white">Novo Lead</h1>
          <p className="text-sm text-slate-400 mt-1">Cadastre um novo cliente interessado.</p>
        </div>
      </div>

      <form onSubmit={salvar} className="space-y-6">

        {/* Dados Pessoais */}
        <div className="bg-[#2f4968]/60 border border-slate-500/30 rounded-xl p-6">
          <h2 className="text-white font-medium mb-5 flex items-center gap-2">
            <User size={16} className="text-gold" /> Dados do Lead
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className={labelClass}>Nome *</label>
              <input value={form.nome} onChange={e => set('nome', e.target.value)}
                placeholder="Nome completo" className={inputClass} />
            </div>
            <div>
              <label className={labelClass}><Phone size={10} className="inline mr-1" />Telefone</label>
              <input value={form.telefone} onChange={e => set('telefone', e.target.value)}
                placeholder="(00) 00000-0000" className={inputClass} />
            </div>
            <div>
              <label className={labelClass}><Mail size={10} className="inline mr-1" />E-mail</label>
              <input value={form.email} onChange={e => set('email', e.target.value)}
                type="email" placeholder="email@exemplo.com" className={inputClass} />
            </div>
            <div className="sm:col-span-2">
              <label className={labelClass}><MessageSquare size={10} className="inline mr-1" />Mensagem</label>
              <textarea value={form.mensagem} onChange={e => set('mensagem', e.target.value)}
                rows={3} placeholder="O que o cliente disse ou pediu..."
                className={`${inputClass} resize-none`} />
            </div>
          </div>
        </div>

        {/* Classificação */}
        <div className="bg-[#2f4968]/60 border border-slate-500/30 rounded-xl p-6">
          <h2 className="text-white font-medium mb-5">Classificação</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className={labelClass}>Origem</label>
              <select value={form.origem} onChange={e => set('origem', e.target.value)} className={inputClass}>
                <option value="site">Site</option>
                <option value="whatsapp">WhatsApp</option>
                <option value="indicacao">Indicação</option>
                <option value="telefone">Telefone</option>
                <option value="portal">Portal (ZAP/OLX)</option>
                <option value="instagram">Instagram</option>
              </select>
            </div>
            <div>
              <label className={labelClass}>Status Inicial</label>
              <select value={form.status} onChange={e => set('status', e.target.value)} className={inputClass}>
                <option value="novo">Novo</option>
                <option value="contato_feito">Em Contato</option>
                <option value="visita_agendada">Visita Agendada</option>
                <option value="proposta">Proposta</option>
                <option value="fechado">Fechado</option>
                <option value="perdido">Perdido</option>
              </select>
            </div>
            <div>
              <label className={labelClass}>Prioridade</label>
              <select value={form.prioridade} onChange={e => set('prioridade', e.target.value)} className={inputClass}>
                <option value="baixa">Baixa</option>
                <option value="media">Média</option>
                <option value="alta">Alta</option>
                <option value="urgente">🚨 Urgente</option>
              </select>
            </div>
          </div>
        </div>

        {/* Imóvel de Interesse */}
        <div className="bg-[#2f4968]/60 border border-slate-500/30 rounded-xl p-6">
          <h2 className="text-white font-medium mb-5 flex items-center gap-2">
            <Home size={16} className="text-gold" /> Imóvel de Interesse
          </h2>
          <select value={form.imovel_interesse_id} onChange={e => set('imovel_interesse_id', e.target.value)} className={inputClass}>
            <option value="">— Nenhum imóvel específico —</option>
            {imoveis.map(im => (
              <option key={im.id} value={im.id}>{im.titulo} · {im.cidade}</option>
            ))}
          </select>
        </div>

        {/* Anotações */}
        <div className="bg-[#2f4968]/60 border border-slate-500/30 rounded-xl p-6">
          <h2 className="text-white font-medium mb-5">Anotações Internas</h2>
          <textarea value={form.anotacoes} onChange={e => set('anotacoes', e.target.value)}
            rows={4} placeholder="Notas privadas sobre este lead..."
            className={`${inputClass} resize-none`} />
        </div>

        {erro && (
          <div className="bg-red-400/10 border border-red-400/30 text-red-400 text-sm px-4 py-3 rounded-lg">
            {erro}
          </div>
        )}

        {/* Ações */}
        <div className="flex justify-end gap-3 pb-8">
          <Link href="/admin/crm/leads"
            className="px-6 py-2.5 rounded-lg text-sm font-bold border border-slate-500/30 text-slate-400 hover:text-white hover:border-slate-400/50 transition-colors">
            Cancelar
          </Link>
          <button type="submit" disabled={salvando}
            className="flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-bold bg-gold text-[#04122b] hover:brightness-110 transition-all disabled:opacity-60">
            <Save size={14} /> {salvando ? 'Salvando…' : 'Salvar Lead'}
          </button>
        </div>
      </form>
    </div>
  );
}
