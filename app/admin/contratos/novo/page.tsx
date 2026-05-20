'use client'

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft, ArrowRight, Check, Home, Users, FileText, Eye,
  Search, X, MapPin, BedDouble, Maximize2, DollarSign, Phone,
  Mail, User, Calendar, Hash, Save, AlertCircle,
} from 'lucide-react';

/* ─── Types ─────────────────────────────────────────────── */
interface Imovel {
  id: number; titulo: string; endereco: string | null; bairro: string | null;
  cidade: string | null; preco: number | null; tipo: string | null;
  finalidade: string | null; status: string | null; imagem_url: string | null;
  quartos: number | null; area: number | null;
}
interface Lead {
  id: number; nome: string; telefone: string | null; email: string | null;
  status: string; origem: string;
}

/* ─── Helpers ───────────────────────────────────────────── */
function moeda(v: number) { return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }); }
const TIPO_COR: Record<string, string> = { aluguel: '#3b82f6', venda: '#8b5cf6' };
const STATUS_IMV: Record<string, { label: string; color: string }> = {
  disponivel: { label: 'Disponível', color: '#22c55e' },
  reservado:  { label: 'Reservado',  color: '#f59e0b' },
  vendido:    { label: 'Vendido',    color: '#ef4444' },
  alugado:    { label: 'Alugado',    color: '#3b82f6' },
};

/* ─── Step progress bar ─────────────────────────────────── */
const STEPS = [
  { id: 1, icon: Home,     label: 'Imóvel'   },
  { id: 2, icon: Users,    label: 'Cliente'  },
  { id: 3, icon: FileText, label: 'Contrato' },
  { id: 4, icon: Eye,      label: 'Revisão'  },
];

function StepBar({ current }: { current: number }) {
  return (
    <div className="flex items-center gap-0 mb-8">
      {STEPS.map((s, i) => {
        const done    = current > s.id;
        const active  = current === s.id;
        const Icon    = s.icon;
        return (
          <div key={s.id} className="flex items-center flex-1">
            <div className="flex flex-col items-center">
              <div className="w-9 h-9 rounded-full flex items-center justify-center text-[12px] font-bold transition-all"
                style={done   ? { background: '#22c55e',              color: '#fff' }
                     : active ? { background: 'rgba(197,160,89,0.15)', color: '#C5A059', border: '2px solid #C5A059' }
                              : { background: '#12243a',               color: '#3a5270', border: '2px solid rgba(255,255,255,0.06)' }}>
                {done ? <Check size={14} /> : <Icon size={14} />}
              </div>
              <span className="text-[10px] mt-1 font-bold" style={{ color: done ? '#22c55e' : active ? '#C5A059' : '#3a5270' }}>
                {s.label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div className="flex-1 h-px mx-2 mt-[-14px]"
                style={{ background: done ? '#22c55e40' : 'rgba(255,255,255,0.06)' }} />
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ─── Imovel card ───────────────────────────────────────── */
function ImovelCard({ imovel, selected, onClick }: { imovel: Imovel; selected: boolean; onClick: () => void }) {
  const st = STATUS_IMV[imovel.status ?? ''] ?? { label: imovel.status ?? '', color: '#5a7a99' };
  return (
    <button onClick={onClick}
      className="text-left rounded-2xl overflow-hidden transition-all duration-200 relative"
      style={{
        background: selected ? 'rgba(197,160,89,0.06)' : '#1e3552',
        border: selected ? '2px solid #C5A059' : '1px solid rgba(255,255,255,0.07)',
        transform: selected ? 'scale(1.01)' : 'scale(1)',
      }}>
      {/* Imagem */}
      <div className="relative" style={{ height: 130 }}>
        {imovel.imagem_url
          ? <img src={imovel.imagem_url} alt={imovel.titulo} className="w-full h-full object-cover" />
          : <div className="w-full h-full flex items-center justify-center" style={{ background: '#12243a' }}>
              <Home size={28} color="#2a4060" />
            </div>
        }
        {/* Status badge */}
        <span className="absolute top-2 right-2 text-[10px] font-bold px-2 py-0.5 rounded-full"
          style={{ background: st.color + '20', color: st.color, border: `1px solid ${st.color}40`, backdropFilter: 'blur(4px)' }}>
          {st.label}
        </span>
        {selected && (
          <div className="absolute top-2 left-2 w-6 h-6 rounded-full flex items-center justify-center"
            style={{ background: '#C5A059' }}>
            <Check size={12} color="#000" />
          </div>
        )}
      </div>
      {/* Info */}
      <div className="p-3">
        <p className="text-white font-semibold text-[13px] leading-snug line-clamp-2">{imovel.titulo}</p>
        {(imovel.endereco || imovel.bairro) && (
          <p className="flex items-center gap-1 mt-1 text-[11px]" style={{ color: '#4a6585' }}>
            <MapPin size={9} />
            {[imovel.bairro, imovel.cidade].filter(Boolean).join(' · ')}
          </p>
        )}
        <div className="flex items-center justify-between mt-2">
          <span className="text-[12px] font-bold" style={{ color: '#C5A059' }}>
            {imovel.preco ? moeda(imovel.preco) : '—'}
          </span>
          <div className="flex items-center gap-2">
            {imovel.quartos && <span className="text-[10px]" style={{ color: '#4a6585' }}><BedDouble size={9} className="inline mr-0.5" />{imovel.quartos}</span>}
            {imovel.area    && <span className="text-[10px]" style={{ color: '#4a6585' }}><Maximize2 size={9} className="inline mr-0.5" />{imovel.area}m²</span>}
          </div>
        </div>
      </div>
    </button>
  );
}

/* ─── Lead card ─────────────────────────────────────────── */
function LeadCard({ lead, selected, onClick }: { lead: Lead; selected: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick}
      className="text-left w-full flex items-center gap-3 px-4 py-3 rounded-2xl transition-all"
      style={{
        background: selected ? 'rgba(197,160,89,0.06)' : '#1e3552',
        border: selected ? '2px solid #C5A059' : '1px solid rgba(255,255,255,0.07)',
      }}>
      <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0"
        style={{ background: 'rgba(197,160,89,0.15)', color: '#C5A059' }}>
        {lead.nome.charAt(0).toUpperCase()}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-white font-medium text-[13px]">{lead.nome}</p>
        <p className="text-[11px]" style={{ color: '#4a6585' }}>
          {lead.telefone || lead.email || lead.origem}
        </p>
      </div>
      {selected && <Check size={14} color="#C5A059" />}
    </button>
  );
}

/* ─── Input component ───────────────────────────────────── */
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-[10px] uppercase tracking-widest font-bold mb-1.5" style={{ color: '#5a7a99' }}>{label}</label>
      {children}
    </div>
  );
}

const inp = { background: '#12243a', border: '1px solid rgba(255,255,255,0.08)', color: '#e2eaf4', borderRadius: 12, padding: '10px 14px', width: '100%', fontSize: 13, outline: 'none' } as const;
const sel = { ...inp };

/* ─── Main page ─────────────────────────────────────────── */
export default function NovoContratoPage() {
  const router = useRouter();
  const [step,    setStep]    = useState(1);
  const [saving,  setSaving]  = useState(false);
  const [erro,    setErro]    = useState('');

  /* Dados */
  const [imoveis, setImoveis] = useState<Imovel[]>([]);
  const [leads,   setLeads]   = useState<Lead[]>([]);
  const [buscaImv, setBuscaImv] = useState('');
  const [buscaLead, setBuscaLead] = useState('');

  /* Seleções */
  const [imovelSel, setImovelSel] = useState<Imovel | null>(null);
  const [leadSel,   setLeadSel]   = useState<Lead   | null>(null);
  const [clienteManual, setClienteManual] = useState(false);

  /* Form dados */
  const [cliente, setCliente] = useState({ nome: '', telefone: '', email: '', cpf: '', proprietario: '' });
  const [contrato, setContrato] = useState({
    tipo: 'aluguel', status: 'ativo', valor_parcela: '', valor_entrada: '',
    valor_total: '', total_parcelas: '12', dia_vencimento: '5',
    data_inicio: '', data_fim: '', data_assinatura: '', anotacoes: '',
  });

  /* Carrega dados */
  useEffect(() => {
    fetch('/api/admin/imoveis').then(r => r.json()).then(d => setImoveis(Array.isArray(d) ? d : []));
    fetch('/api/admin/crm/leads').then(r => r.json()).then(d => setLeads(Array.isArray(d) ? d : []));
  }, []);

  /* Busca imóvel com debounce */
  useEffect(() => {
    const t = setTimeout(() => {
      fetch(`/api/admin/imoveis?busca=${encodeURIComponent(buscaImv)}`).then(r => r.json()).then(d => setImoveis(Array.isArray(d) ? d : []));
    }, 300);
    return () => clearTimeout(t);
  }, [buscaImv]);

  /* Quando seleciona lead, preenche cliente */
  function selecionarLead(lead: Lead) {
    setLeadSel(lead);
    setCliente(c => ({ ...c, nome: lead.nome, telefone: lead.telefone || '', email: lead.email || '' }));
  }

  /* Avança step */
  function avancar() {
    if (step === 1 && !imovelSel) { setErro('Selecione um imóvel para continuar.'); return; }
    if (step === 2 && !cliente.nome.trim()) { setErro('Informe o nome do cliente.'); return; }
    if (step === 3) {
      if (!contrato.valor_parcela) { setErro('Informe o valor da parcela.'); return; }
      if (!contrato.data_inicio)   { setErro('Informe a data de início.'); return; }
    }
    setErro('');
    setStep(s => s + 1);
  }

  /* Salva */
  async function salvar() {
    setSaving(true);
    setErro('');
    const res = await fetch('/api/admin/contratos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        lead_id:            leadSel?.id      || null,
        imovel_id:          imovelSel?.id    || null,
        imovel_titulo:      imovelSel?.titulo || null,
        imovel_endereco:    [imovelSel?.endereco, imovelSel?.bairro, imovelSel?.cidade].filter(Boolean).join(', ') || null,
        cliente_nome:       cliente.nome.trim(),
        cliente_email:      cliente.email.trim()    || null,
        cliente_telefone:   cliente.telefone.trim() || null,
        cliente_cpf:        cliente.cpf.trim()      || null,
        proprietario_nome:  cliente.proprietario.trim() || null,
        tipo:               contrato.tipo,
        status:             contrato.status,
        valor_parcela:      Number(contrato.valor_parcela),
        valor_entrada:      Number(contrato.valor_entrada)  || 0,
        valor_total:        Number(contrato.valor_total)    || null,
        total_parcelas:     Number(contrato.total_parcelas),
        dia_vencimento:     Number(contrato.dia_vencimento),
        data_inicio:        contrato.data_inicio,
        data_fim:           contrato.data_fim        || null,
        data_assinatura:    contrato.data_assinatura || null,
        anotacoes:          contrato.anotacoes       || null,
      }),
    });
    const data = await res.json();
    setSaving(false);
    if (!res.ok) { setErro(data.error || 'Erro ao salvar'); return; }
    router.push(`/admin/contratos/${data.id}`);
  }

  const cardStyle = { background: '#1a2f47', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 20 };

  /* ─────────────── RENDER ─────────────────────────────── */
  return (
    <div className="min-h-full p-6" style={{ background: '#172840' }}>
      <div className="max-w-4xl mx-auto">

        {/* Back + title */}
        <div className="flex items-center gap-3 mb-6">
          <Link href="/admin/contratos"
            className="w-8 h-8 rounded-xl flex items-center justify-center hover:bg-white/10 transition-colors"
            style={{ color: '#5a7a99' }}>
            <ArrowLeft size={16} />
          </Link>
          <div>
            <h1 className="text-white font-bold text-xl">Novo Contrato</h1>
            <p className="text-[11px]" style={{ color: '#5a7a99' }}>
              {step === 1 ? 'Escolha o imóvel' : step === 2 ? 'Dados do cliente' : step === 3 ? 'Termos do contrato' : 'Revise e confirme'}
            </p>
          </div>
        </div>

        <StepBar current={step} />

        {/* Erro */}
        {erro && (
          <div className="flex items-center gap-2 mb-4 px-4 py-3 rounded-xl text-[12px]"
            style={{ background: '#ef444418', color: '#ef4444', border: '1px solid #ef444430' }}>
            <AlertCircle size={14} />{erro}
          </div>
        )}

        {/* ── STEP 1: Imóvel ── */}
        {step === 1 && (
          <div style={cardStyle} className="p-6">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: 'rgba(197,160,89,0.1)' }}>
                <Home size={15} color="#C5A059" />
              </div>
              <div>
                <p className="text-white font-semibold">Selecionar Imóvel</p>
                <p className="text-[11px]" style={{ color: '#5a7a99' }}>Escolha o imóvel que será objeto do contrato</p>
              </div>
            </div>

            {/* Search */}
            <div className="relative mb-5">
              <Search size={13} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: '#4a6585' }} />
              <input value={buscaImv} onChange={e => setBuscaImv(e.target.value)}
                placeholder="Buscar por título, bairro ou endereço…"
                className="w-full pl-10 pr-10 py-2.5 rounded-xl text-[13px] focus:outline-none"
                style={{ background: '#12243a', border: '1px solid rgba(255,255,255,0.08)', color: '#e2eaf4' }} />
              {buscaImv && (
                <button onClick={() => setBuscaImv('')} className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: '#4a6585' }}>
                  <X size={13} />
                </button>
              )}
            </div>

            {/* Selected summary */}
            {imovelSel && (
              <div className="flex items-center gap-3 mb-4 px-4 py-3 rounded-xl"
                style={{ background: 'rgba(197,160,89,0.06)', border: '1px solid rgba(197,160,89,0.2)' }}>
                <Check size={14} color="#C5A059" />
                <div>
                  <p className="text-[13px] font-semibold" style={{ color: '#C5A059' }}>{imovelSel.titulo}</p>
                  <p className="text-[11px]" style={{ color: '#8a7040' }}>
                    {[imovelSel.bairro, imovelSel.cidade].filter(Boolean).join(' · ')}
                    {imovelSel.preco ? ` · ${moeda(imovelSel.preco)}` : ''}
                  </p>
                </div>
                <button onClick={() => setImovelSel(null)} className="ml-auto" style={{ color: '#8a7040' }}>
                  <X size={13} />
                </button>
              </div>
            )}

            {/* Grid de cards */}
            {imoveis.length === 0 ? (
              <p className="text-center py-10 text-[12px]" style={{ color: '#3a5270' }}>Nenhum imóvel encontrado.</p>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 overflow-y-auto" style={{ maxHeight: 420 }}>
                {imoveis.map(imv => (
                  <ImovelCard key={imv.id} imovel={imv}
                    selected={imovelSel?.id === imv.id}
                    onClick={() => setImovelSel(imv)} />
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── STEP 2: Cliente ── */}
        {step === 2 && (
          <div style={cardStyle} className="p-6">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: 'rgba(59,130,246,0.1)' }}>
                <Users size={15} color="#3b82f6" />
              </div>
              <div>
                <p className="text-white font-semibold">Dados do Cliente</p>
                <p className="text-[11px]" style={{ color: '#5a7a99' }}>Vincule a um lead existente ou preencha manualmente</p>
              </div>
            </div>

            {/* Lead picker */}
            {!clienteManual && (
              <>
                <div className="relative mb-3">
                  <Search size={13} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: '#4a6585' }} />
                  <input value={buscaLead} onChange={e => setBuscaLead(e.target.value)}
                    placeholder="Buscar lead por nome ou telefone…"
                    className="w-full pl-10 pr-10 py-2.5 rounded-xl text-[13px] focus:outline-none"
                    style={{ background: '#12243a', border: '1px solid rgba(255,255,255,0.08)', color: '#e2eaf4' }} />
                  {buscaLead && (
                    <button onClick={() => setBuscaLead('')} className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: '#4a6585' }}>
                      <X size={13} />
                    </button>
                  )}
                </div>

                <div className="flex flex-col gap-2 mb-4 overflow-y-auto" style={{ maxHeight: 280 }}>
                  {leads
                    .filter(l => !buscaLead || l.nome.toLowerCase().includes(buscaLead.toLowerCase()) || (l.telefone || '').includes(buscaLead))
                    .map(lead => (
                      <LeadCard key={lead.id} lead={lead}
                        selected={leadSel?.id === lead.id}
                        onClick={() => selecionarLead(lead)} />
                    ))
                  }
                </div>

                <div className="flex items-center gap-2 mb-5">
                  <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.06)' }} />
                  <span className="text-[11px]" style={{ color: '#3a5270' }}>ou</span>
                  <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.06)' }} />
                </div>
                <button onClick={() => { setLeadSel(null); setClienteManual(true); }}
                  className="w-full py-2.5 rounded-xl text-[12px] font-bold transition-colors"
                  style={{ background: 'rgba(255,255,255,0.04)', color: '#5a7a99', border: '1px solid rgba(255,255,255,0.08)' }}>
                  + Preencher cliente manualmente
                </button>
              </>
            )}

            {/* Form manual */}
            {(clienteManual || leadSel) && (
              <div className="mt-2">
                {clienteManual && (
                  <button onClick={() => setClienteManual(false)} className="flex items-center gap-1 text-[11px] mb-4" style={{ color: '#5a7a99' }}>
                    <ArrowLeft size={11} /> Voltar para leads
                  </button>
                )}
                {leadSel && (
                  <div className="flex items-center gap-2 mb-4 px-3 py-2 rounded-xl"
                    style={{ background: 'rgba(59,130,246,0.06)', border: '1px solid rgba(59,130,246,0.15)' }}>
                    <Users size={12} color="#3b82f6" />
                    <span className="text-[11px]" style={{ color: '#3b82f6' }}>Lead vinculado: {leadSel.nome}</span>
                    <button onClick={() => { setLeadSel(null); setCliente({ nome: '', telefone: '', email: '', cpf: '', proprietario: '' }); }}
                      className="ml-auto" style={{ color: '#3b82f650' }}>
                      <X size={11} />
                    </button>
                  </div>
                )}
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <Field label="Nome completo *">
                      <input value={cliente.nome} onChange={e => setCliente(c => ({ ...c, nome: e.target.value }))}
                        placeholder="Nome do locatário / comprador"
                        style={inp} />
                    </Field>
                  </div>
                  <Field label="Telefone">
                    <input value={cliente.telefone} onChange={e => setCliente(c => ({ ...c, telefone: e.target.value }))}
                      placeholder="(00) 00000-0000" style={inp} />
                  </Field>
                  <Field label="E-mail">
                    <input type="email" value={cliente.email} onChange={e => setCliente(c => ({ ...c, email: e.target.value }))}
                      placeholder="email@exemplo.com" style={inp} />
                  </Field>
                  <Field label="CPF">
                    <input value={cliente.cpf} onChange={e => setCliente(c => ({ ...c, cpf: e.target.value }))}
                      placeholder="000.000.000-00" style={inp} />
                  </Field>
                  <Field label="Nome do proprietário">
                    <input value={cliente.proprietario} onChange={e => setCliente(c => ({ ...c, proprietario: e.target.value }))}
                      placeholder="Quem está locando/vendendo" style={inp} />
                  </Field>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── STEP 3: Contrato ── */}
        {step === 3 && (
          <div style={cardStyle} className="p-6">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: 'rgba(139,92,246,0.1)' }}>
                <FileText size={15} color="#8b5cf6" />
              </div>
              <div>
                <p className="text-white font-semibold">Termos do Contrato</p>
                <p className="text-[11px]" style={{ color: '#5a7a99' }}>Tipo, valores e vigência</p>
              </div>
            </div>

            {/* Tipo selector */}
            <div className="grid grid-cols-2 gap-3 mb-5">
              {(['aluguel', 'venda'] as const).map(t => (
                <button key={t} onClick={() => setContrato(c => ({ ...c, tipo: t, total_parcelas: t === 'aluguel' ? '12' : '1' }))}
                  className="py-4 rounded-2xl font-bold capitalize transition-all"
                  style={contrato.tipo === t
                    ? { background: TIPO_COR[t] + '18', color: TIPO_COR[t], border: `2px solid ${TIPO_COR[t]}50` }
                    : { background: '#12243a', color: '#5a7a99', border: '1px solid rgba(255,255,255,0.07)' }
                  }>
                  {t === 'aluguel' ? '🏠 Aluguel' : '🔑 Venda'}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Field label={contrato.tipo === 'aluguel' ? 'Aluguel mensal (R$) *' : 'Valor da parcela (R$) *'}>
                <input type="number" step="0.01" min="0" value={contrato.valor_parcela}
                  onChange={e => setContrato(c => ({ ...c, valor_parcela: e.target.value }))}
                  placeholder="0,00" style={inp} />
              </Field>

              <Field label="Entrada / Caução (R$)">
                <input type="number" step="0.01" min="0" value={contrato.valor_entrada}
                  onChange={e => setContrato(c => ({ ...c, valor_entrada: e.target.value }))}
                  placeholder="0,00" style={inp} />
              </Field>

              {contrato.tipo === 'venda' && (
                <Field label="Valor total (R$)">
                  <input type="number" step="0.01" min="0" value={contrato.valor_total}
                    onChange={e => setContrato(c => ({ ...c, valor_total: e.target.value }))}
                    placeholder="0,00" style={inp} />
                </Field>
              )}

              <Field label="Número de parcelas">
                <input type="number" min="1" max="360" value={contrato.total_parcelas}
                  onChange={e => setContrato(c => ({ ...c, total_parcelas: e.target.value }))}
                  style={inp} />
              </Field>

              <Field label="Dia do vencimento">
                <input type="number" min="1" max="28" value={contrato.dia_vencimento}
                  onChange={e => setContrato(c => ({ ...c, dia_vencimento: e.target.value }))}
                  style={inp} />
              </Field>

              <Field label="Data início *">
                <input type="date" value={contrato.data_inicio}
                  onChange={e => setContrato(c => ({ ...c, data_inicio: e.target.value }))}
                  style={inp} />
              </Field>

              <Field label="Data término (opcional)">
                <input type="date" value={contrato.data_fim}
                  onChange={e => setContrato(c => ({ ...c, data_fim: e.target.value }))}
                  style={inp} />
              </Field>

              <Field label="Data assinatura">
                <input type="date" value={contrato.data_assinatura}
                  onChange={e => setContrato(c => ({ ...c, data_assinatura: e.target.value }))}
                  style={inp} />
              </Field>

              <Field label="Status do contrato">
                <select value={contrato.status}
                  onChange={e => setContrato(c => ({ ...c, status: e.target.value }))}
                  style={sel}>
                  <option value="ativo">Ativo</option>
                  <option value="pendente">Pendente</option>
                  <option value="encerrado">Encerrado</option>
                  <option value="rescindido">Rescindido</option>
                </select>
              </Field>

              <div className="col-span-2">
                <Field label="Anotações">
                  <textarea value={contrato.anotacoes}
                    onChange={e => setContrato(c => ({ ...c, anotacoes: e.target.value }))}
                    rows={3} placeholder="Observações, condições especiais…"
                    className="resize-none focus:outline-none"
                    style={{ ...inp, padding: '10px 14px' }} />
                </Field>
              </div>
            </div>
          </div>
        )}

        {/* ── STEP 4: Revisão ── */}
        {step === 4 && (
          <div style={cardStyle} className="p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: 'rgba(34,197,94,0.1)' }}>
                <Eye size={15} color="#22c55e" />
              </div>
              <div>
                <p className="text-white font-semibold">Revise e Confirme</p>
                <p className="text-[11px]" style={{ color: '#5a7a99' }}>Confira todos os dados antes de criar o contrato</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

              {/* Imóvel */}
              <div className="rounded-2xl p-4" style={{ background: '#12243a', border: '1px solid rgba(255,255,255,0.06)' }}>
                <p className="text-[10px] uppercase tracking-widest font-bold mb-3" style={{ color: '#C5A059' }}>Imóvel</p>
                {imovelSel?.imagem_url && (
                  <img src={imovelSel.imagem_url} alt="" className="w-full rounded-xl mb-3 object-cover" style={{ height: 80 }} />
                )}
                <p className="text-white font-semibold text-[13px]">{imovelSel?.titulo}</p>
                <p className="text-[11px] mt-1" style={{ color: '#4a6585' }}>
                  {[imovelSel?.bairro, imovelSel?.cidade].filter(Boolean).join(' · ')}
                </p>
                {imovelSel?.preco && <p className="text-[12px] font-bold mt-2" style={{ color: '#C5A059' }}>{moeda(imovelSel.preco)}</p>}
              </div>

              {/* Cliente */}
              <div className="rounded-2xl p-4" style={{ background: '#12243a', border: '1px solid rgba(255,255,255,0.06)' }}>
                <p className="text-[10px] uppercase tracking-widest font-bold mb-3" style={{ color: '#3b82f6' }}>Cliente</p>
                <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm mb-3"
                  style={{ background: 'rgba(59,130,246,0.1)', color: '#3b82f6' }}>
                  {cliente.nome.charAt(0).toUpperCase()}
                </div>
                <p className="text-white font-semibold text-[13px]">{cliente.nome}</p>
                {cliente.telefone && <p className="text-[11px] mt-1" style={{ color: '#4a6585' }}>{cliente.telefone}</p>}
                {cliente.email    && <p className="text-[11px]"     style={{ color: '#4a6585' }}>{cliente.email}</p>}
                {cliente.cpf      && <p className="text-[11px]"     style={{ color: '#4a6585' }}>CPF: {cliente.cpf}</p>}
              </div>

              {/* Contrato */}
              <div className="rounded-2xl p-4" style={{ background: '#12243a', border: '1px solid rgba(255,255,255,0.06)' }}>
                <p className="text-[10px] uppercase tracking-widest font-bold mb-3" style={{ color: '#8b5cf6' }}>Contrato</p>
                <span className="inline-block text-[11px] px-2 py-0.5 rounded-full font-bold capitalize mb-2"
                  style={{ background: TIPO_COR[contrato.tipo] + '18', color: TIPO_COR[contrato.tipo] }}>
                  {contrato.tipo}
                </span>
                <p className="text-white text-lg font-bold">{moeda(Number(contrato.valor_parcela) || 0)}</p>
                <p className="text-[11px]" style={{ color: '#4a6585' }}>
                  {contrato.tipo === 'aluguel' ? '/mês' : `em ${contrato.total_parcelas}x`}
                </p>
                <div className="mt-3 flex flex-col gap-1.5">
                  <p className="text-[11px]" style={{ color: '#5a7a99' }}>
                    Início: <span style={{ color: '#c8d8e8' }}>
                      {contrato.data_inicio ? new Date(contrato.data_inicio + 'T12:00:00').toLocaleDateString('pt-BR') : '—'}
                    </span>
                  </p>
                  <p className="text-[11px]" style={{ color: '#5a7a99' }}>
                    Vencimento: <span style={{ color: '#c8d8e8' }}>dia {contrato.dia_vencimento}</span>
                  </p>
                  <p className="text-[11px]" style={{ color: '#5a7a99' }}>
                    Parcelas: <span style={{ color: '#c8d8e8' }}>{contrato.total_parcelas}</span>
                  </p>
                  {Number(contrato.valor_entrada) > 0 && (
                    <p className="text-[11px]" style={{ color: '#5a7a99' }}>
                      Entrada: <span style={{ color: '#C5A059' }}>{moeda(Number(contrato.valor_entrada))}</span>
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Preview parcelas */}
            <div className="mt-4 p-4 rounded-2xl" style={{ background: '#12243a', border: '1px solid rgba(255,255,255,0.06)' }}>
              <p className="text-[11px] font-bold uppercase tracking-widest mb-2" style={{ color: '#5a7a99' }}>
                {contrato.total_parcelas} parcelas de {moeda(Number(contrato.valor_parcela) || 0)} serão geradas automaticamente
              </p>
              <div className="flex flex-wrap gap-2">
                {Array.from({ length: Math.min(6, Number(contrato.total_parcelas)) }, (_, i) => {
                  const d = new Date((contrato.data_inicio || new Date().toISOString().split('T')[0]) + 'T12:00:00');
                  d.setMonth(d.getMonth() + i + 1);
                  d.setDate(Number(contrato.dia_vencimento));
                  return (
                    <span key={i} className="text-[10px] px-2 py-1 rounded-lg"
                      style={{ background: 'rgba(197,160,89,0.08)', color: '#C5A059', border: '1px solid rgba(197,160,89,0.15)' }}>
                      {d.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' })}
                    </span>
                  );
                })}
                {Number(contrato.total_parcelas) > 6 && (
                  <span className="text-[10px] px-2 py-1 rounded-lg" style={{ color: '#3a5270' }}>
                    +{Number(contrato.total_parcelas) - 6} mais
                  </span>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ── Navegação ── */}
        <div className="flex items-center justify-between mt-5">
          <button
            onClick={() => step === 1 ? router.push('/admin/contratos') : setStep(s => s - 1)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-[12px] font-bold"
            style={{ background: 'rgba(255,255,255,0.04)', color: '#5a7a99', border: '1px solid rgba(255,255,255,0.08)' }}>
            <ArrowLeft size={13} /> {step === 1 ? 'Cancelar' : 'Voltar'}
          </button>

          {step < 4 ? (
            <button onClick={avancar}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-[12px] font-bold transition-all"
              style={{ background: 'rgba(197,160,89,0.12)', color: '#C5A059', border: '1px solid rgba(197,160,89,0.25)' }}>
              Próximo <ArrowRight size={13} />
            </button>
          ) : (
            <button onClick={salvar} disabled={saving}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-[12px] font-bold transition-all disabled:opacity-50"
              style={{ background: saving ? 'rgba(34,197,94,0.08)' : 'rgba(34,197,94,0.12)', color: '#22c55e', border: '1px solid rgba(34,197,94,0.25)' }}>
              <Save size={13} /> {saving ? 'Criando contrato…' : 'Criar Contrato'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
