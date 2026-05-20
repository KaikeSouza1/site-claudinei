'use client'

import { use, useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  ArrowLeft, CheckCircle, Clock, AlertTriangle, Ban, CreditCard,
  Edit2, Save, X, Home, Phone, Mail, User, Calendar,
  FileText, Zap, Copy, FileDown,
  Receipt, Layers,
} from 'lucide-react';

/* ─── Types ─────────────────────────────────────────────── */
interface Parcela {
  id: number; numero: number; descricao: string; valor: number;
  data_vencimento: string; status: string;
  data_pagamento: string | null; valor_pago: number | null;
  forma_pagamento: string | null; anotacoes: string | null;
  boleto_id: string | null; boleto_url: string | null;
  boleto_dados: Record<string, unknown> | null;
}
interface Contrato {
  id: number; cliente_nome: string; cliente_email: string | null;
  cliente_telefone: string | null; cliente_cpf: string | null;
  proprietario_nome: string | null; tipo: string; status: string;
  valor_parcela: number; valor_entrada: number; total_parcelas: number;
  dia_vencimento: number; data_inicio: string; data_fim: string | null;
  data_assinatura: string | null; imovel_titulo: string | null;
  imovel_endereco: string | null; anotacoes: string | null;
  nfse_ativo: boolean; parcelas: Parcela[];
}

/* ─── Helpers ───────────────────────────────────────────── */
const STATUS_COR: Record<string, string>   = { ativo: '#22c55e', encerrado: '#64748b', rescindido: '#ef4444', pendente: '#f59e0b' };
const STATUS_LABEL: Record<string, string> = { ativo: 'Ativo', encerrado: 'Encerrado', rescindido: 'Rescindido', pendente: 'Pendente' };
const PARC_COR: Record<string, string>     = { pago: '#22c55e', pendente: '#f59e0b', atrasado: '#ef4444', cancelado: '#64748b' };
const PARC_LABEL: Record<string, string>   = { pago: 'Pago', pendente: 'A vencer', atrasado: 'Atrasado', cancelado: 'Cancelado' };
const TIPO_COR: Record<string, string>     = { aluguel: '#3b82f6', venda: '#8b5cf6' };
const FORMAS = ['pix','boleto','transferencia','dinheiro','cartao'];

function moeda(v: number) { return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }); }
function dtBR(iso: string)  { return new Date(iso + 'T12:00:00').toLocaleDateString('pt-BR'); }

function isAsaasBoleto(p: Parcela) {
  return p.boleto_id && (p.boleto_dados as any)?.provider === 'ASAAS';
}

/* ─── Modal de baixa manual ────────────────────────────── */
function BaixaModal({ parcela, onClose, onSaved }: { parcela: Parcela; onClose: () => void; onSaved: (p: Parcela) => void }) {
  const [form, setForm] = useState({
    status: 'pago', data_pagamento: new Date().toISOString().split('T')[0],
    valor_pago: String(parcela.valor_pago ?? parcela.valor),
    forma_pagamento: parcela.forma_pagamento || 'pix', anotacoes: parcela.anotacoes || '',
  });
  const [saving, setSaving] = useState(false);

  async function salvar() {
    setSaving(true);
    const res = await fetch(`/api/admin/parcelas/${parcela.id}`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, valor_pago: Number(form.valor_pago) }),
    });
    const data = await res.json();
    setSaving(false);
    if (res.ok) onSaved(data);
  }

  const inp2 = { background: '#0e1e30', border: '1px solid rgba(255,255,255,0.1)', color: '#e2eaf4', borderRadius: 10, padding: '9px 12px', fontSize: 13, outline: 'none', width: '100%' } as const;
  const lbl  = { color: '#5a7a99', fontSize: 10, fontWeight: 700, textTransform: 'uppercase' as const, letterSpacing: '0.06em', display: 'block', marginBottom: 5 };

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(4px)' }}>
      <div className="w-full max-w-md rounded-3xl p-6" style={{ background: '#1a2f47', border: '1px solid rgba(255,255,255,0.1)' }}>
        <div className="flex items-start justify-between mb-5">
          <div>
            <p className="text-white font-bold text-[15px]">Registrar Pagamento</p>
            <p className="text-[12px] mt-0.5" style={{ color: '#5a7a99' }}>{parcela.descricao} · <span style={{ color: '#C5A059' }}>{moeda(parcela.valor)}</span></p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-xl flex items-center justify-center hover:bg-white/10" style={{ color: '#5a7a99' }}><X size={15} /></button>
        </div>
        <div className="grid grid-cols-4 gap-1.5 mb-4 p-1 rounded-2xl" style={{ background: '#0e1e30' }}>
          {['pago','pendente','atrasado','cancelado'].map(s => (
            <button key={s} onClick={() => setForm(f => ({ ...f, status: s }))}
              className="py-2 rounded-xl text-[10px] font-bold capitalize transition-all"
              style={form.status === s ? { background: PARC_COR[s]+'20', color: PARC_COR[s] } : { color: '#3a5270' }}>
              {PARC_LABEL[s]}
            </button>
          ))}
        </div>
        {form.status === 'pago' && (
          <div className="flex flex-col gap-3">
            <div className="grid grid-cols-2 gap-3">
              <div><label style={lbl}>Data</label><input type="date" value={form.data_pagamento} onChange={e => setForm(f => ({ ...f, data_pagamento: e.target.value }))} style={inp2} /></div>
              <div><label style={lbl}>Valor pago</label><input type="number" step="0.01" value={form.valor_pago} onChange={e => setForm(f => ({ ...f, valor_pago: e.target.value }))} style={inp2} /></div>
            </div>
            <div>
              <label style={lbl}>Forma de pagamento</label>
              <div className="grid grid-cols-5 gap-1.5">
                {FORMAS.map(f => (
                  <button key={f} onClick={() => setForm(p => ({ ...p, forma_pagamento: f }))}
                    className="py-2 rounded-xl text-[10px] font-bold capitalize transition-all"
                    style={form.forma_pagamento === f
                      ? { background: 'rgba(197,160,89,0.12)', color: '#C5A059', border: '1px solid rgba(197,160,89,0.3)' }
                      : { background: '#0e1e30', color: '#3a5270', border: '1px solid rgba(255,255,255,0.06)' }}>
                    {f === 'transferencia' ? 'TED' : f.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
        <div className="mt-3"><label style={lbl}>Anotações</label><input value={form.anotacoes} onChange={e => setForm(f => ({ ...f, anotacoes: e.target.value }))} placeholder="Ex: pago com desconto de…" style={inp2} /></div>
        <div className="flex gap-2 mt-5">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl text-[12px] font-bold" style={{ background: 'rgba(255,255,255,0.04)', color: '#5a7a99', border: '1px solid rgba(255,255,255,0.08)' }}>Cancelar</button>
          <button onClick={salvar} disabled={saving} className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-[12px] font-bold disabled:opacity-50" style={{ background: 'rgba(34,197,94,0.12)', color: '#22c55e', border: '1px solid rgba(34,197,94,0.25)' }}>
            <Save size={12} /> {saving ? 'Salvando…' : 'Confirmar'}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Modal Boleto Asaas ────────────────────────────────── */
function BoletoModal({ parcela, onClose, onGerado }: { parcela: Parcela; onClose: () => void; onGerado: (updated: Parcela) => void }) {
  const [loading, setLoading] = useState(!isAsaasBoleto(parcela));
  const [dados,   setDados]   = useState<Record<string, unknown> | null>(
    isAsaasBoleto(parcela) ? (parcela.boleto_dados as any) : null,
  );
  const [errMsg,  setErrMsg]  = useState('');
  const [copied,  setCopied]  = useState(false);

  useEffect(() => {
    if (isAsaasBoleto(parcela)) return;
    gerar();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function gerar() {
    setLoading(true); setErrMsg('');
    try {
      const res  = await fetch(`/api/admin/parcelas/${parcela.id}/boleto`, { method: 'POST' });
      const json = await res.json();
      if (!res.ok) { setErrMsg(json.error ?? 'Erro ao gerar boleto'); setLoading(false); return; }
      setDados(json);
      // Notifica o pai para atualizar a parcela localmente
      onGerado({ ...parcela, boleto_id: json.paymentId, boleto_url: json.bankSlipUrl, boleto_dados: json });
    } catch { setErrMsg('Falha de conexão.'); }
    setLoading(false);
  }

  async function copiarCodigo() {
    const code = dados?.barCode as string | undefined;
    if (!code) return;
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  }

  const statusMap: Record<string, { label: string; color: string }> = {
    PENDING:   { label: 'Aguardando pagamento', color: '#f59e0b' },
    RECEIVED:  { label: 'Pago',                 color: '#22c55e' },
    CONFIRMED: { label: 'Confirmado',            color: '#22c55e' },
    OVERDUE:   { label: 'Vencido',               color: '#ef4444' },
    CANCELED:  { label: 'Cancelado',             color: '#64748b' },
  };
  const st = statusMap[(dados?.status as string) ?? 'PENDING'] ?? { label: dados?.status as string, color: '#5a7a99' };

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(6px)' }}>
      <div className="w-full max-w-sm rounded-3xl overflow-hidden" style={{ background: '#1a2f47', border: '1px solid rgba(255,255,255,0.1)' }}>

        {/* Header */}
        <div className="px-5 pt-5 pb-4 flex items-start justify-between" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl flex items-center justify-center" style={{ background: 'rgba(197,160,89,0.12)' }}>
              <Receipt size={16} color="#C5A059" />
            </div>
            <div>
              <p className="text-white font-bold text-[14px]">Boleto Bancário · Asaas</p>
              <p className="text-[11px]" style={{ color: '#5a7a99' }}>{parcela.descricao} · <span style={{ color: '#C5A059' }}>{moeda(parcela.valor)}</span></p>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-xl flex items-center justify-center hover:bg-white/10" style={{ color: '#5a7a99' }}><X size={14} /></button>
        </div>

        <div className="px-5 pb-5 pt-4">
          {loading && (
            <div className="py-12 text-center">
              <div className="w-10 h-10 rounded-full border-2 border-t-transparent animate-spin mx-auto mb-3" style={{ borderColor: '#C5A05940', borderTopColor: '#C5A059' }} />
              <p className="text-[12px]" style={{ color: '#5a7a99' }}>Gerando boleto no Asaas…</p>
            </div>
          )}

          {errMsg && !loading && (
            <div className="rounded-2xl p-4 text-center" style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}>
              <AlertTriangle size={18} color="#ef4444" className="mx-auto mb-2" />
              <p className="text-[12px] font-medium" style={{ color: '#ef4444' }}>{errMsg}</p>
            </div>
          )}

          {!loading && !errMsg && dados && (
            <div className="flex flex-col gap-4">

              {/* Status */}
              <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl" style={{ background: '#0e1e30', border: '1px solid rgba(255,255,255,0.05)' }}>
                <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: st.color }} />
                <span className="text-[12px] font-medium" style={{ color: st.color }}>{st.label}</span>
                <span className="ml-auto text-[10px]" style={{ color: '#3a5270' }}>Venc. {dtBR(dados.dueDate as string)}</span>
              </div>

              {/* Linha digitável */}
              {dados.barCode && (
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest mb-1.5" style={{ color: '#5a7a99' }}>Linha Digitável</p>
                  <div className="rounded-xl px-3 py-2.5 flex items-center gap-2" style={{ background: '#0e1e30', border: '1px solid rgba(255,255,255,0.07)' }}>
                    <p className="flex-1 text-[10px] font-mono break-all leading-relaxed" style={{ color: '#7a9db8' }}>{dados.barCode as string}</p>
                    <button onClick={copiarCodigo} className="flex-shrink-0 flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[10px] font-bold transition-all"
                      style={copied ? { background: 'rgba(34,197,94,0.15)', color: '#22c55e' } : { background: 'rgba(197,160,89,0.1)', color: '#C5A059' }}>
                      <Copy size={10} />{copied ? 'Copiado!' : 'Copiar'}
                    </button>
                  </div>
                </div>
              )}

              {/* Botões */}
              <div className="grid grid-cols-2 gap-2">
                {dados.bankSlipUrl && (
                  <a href={dados.bankSlipUrl as string} target="_blank" rel="noopener noreferrer"
                    className="flex items-center justify-center gap-1.5 py-3 rounded-xl text-[11px] font-bold transition-all"
                    style={{ background: 'rgba(197,160,89,0.1)', color: '#C5A059', border: '1px solid rgba(197,160,89,0.25)' }}>
                    <FileDown size={12} /> Ver PDF
                  </a>
                )}
                {dados.invoiceUrl && (
                  <a href={dados.invoiceUrl as string} target="_blank" rel="noopener noreferrer"
                    className="flex items-center justify-center gap-1.5 py-3 rounded-xl text-[11px] font-bold transition-all"
                    style={{ background: 'rgba(255,255,255,0.04)', color: '#5a7a99', border: '1px solid rgba(255,255,255,0.08)' }}>
                    <FileText size={12} /> Fatura
                  </a>
                )}
              </div>

              {/* Info */}
              <div className="flex items-start gap-2 px-3 py-2.5 rounded-xl" style={{ background: 'rgba(197,160,89,0.05)', border: '1px solid rgba(197,160,89,0.12)' }}>
                <Zap size={11} color="#C5A059" className="mt-0.5 flex-shrink-0" />
                <p className="text-[10px] leading-relaxed" style={{ color: '#8a7a5a' }}>
                  Quando o boleto for pago, a parcela será baixada <strong>automaticamente</strong> via webhook Asaas. Multa de 2% + juros de 1%/mês após vencimento.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


/* ─── Main page ─────────────────────────────────────────── */
export default function ContratoDetalhePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [contrato,     setContrato]     = useState<Contrato | null>(null);
  const [loading,      setLoading]      = useState(true);
  const [editando,     setEditando]     = useState(false);
  const [baixa,        setBaixa]        = useState<Parcela | null>(null);
  const [boleto,       setBoleto]       = useState<Parcela | null>(null);
  const [editForm,     setEditForm]     = useState<Partial<Contrato>>({});
  const [saving,       setSaving]       = useState(false);
  const [filtro,       setFiltro]       = useState('todos');
  const [gerandoTodos, setGerandoTodos] = useState(false);
  const [bulkMsg,      setBulkMsg]      = useState('');

  const carregar = useCallback(async () => {
    setLoading(true);
    const res  = await fetch(`/api/admin/contratos/${id}`);
    const data = await res.json();
    setContrato(data); setEditForm(data);
    setLoading(false);
  }, [id]);

  useEffect(() => { carregar(); }, [carregar]);

  async function salvarEdicao() {
    setSaving(true);
    await fetch(`/api/admin/contratos/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(editForm) });
    setSaving(false); setEditando(false); carregar();
  }

  function updateParcela(p: Parcela) {
    setContrato(c => c ? { ...c, parcelas: c.parcelas.map(x => x.id === p.id ? p : x) } : c);
  }

  async function gerarTodosBoletos() {
    setGerandoTodos(true); setBulkMsg('');
    try {
      const res  = await fetch(`/api/admin/contratos/${id}/boletos`, { method: 'POST' });
      const json = await res.json();
      if (!res.ok) { setBulkMsg(`Erro: ${json.error}`); }
      else { setBulkMsg(json.message ?? `${json.gerados} boletos gerados.`); await carregar(); }
    } catch { setBulkMsg('Falha de conexão.'); }
    setGerandoTodos(false);
    setTimeout(() => setBulkMsg(''), 6000);
  }

  if (loading) {
    return (
      <div className="p-6 max-w-5xl mx-auto space-y-4">
        <div className="h-8 w-48 rounded-xl animate-pulse" style={{ background: '#1a2f47' }} />
        <div className="h-32 rounded-2xl animate-pulse" style={{ background: '#1a2f47' }} />
        <div className="grid grid-cols-4 gap-3">{[...Array(4)].map((_, i) => <div key={i} className="h-20 rounded-2xl animate-pulse" style={{ background: '#1a2f47' }} />)}</div>
      </div>
    );
  }
  if (!contrato) return <div className="p-6 text-center" style={{ color: '#5a7a99' }}>Contrato não encontrado.</div>;

  const statusCor = STATUS_COR[contrato.status] || '#64748b';
  const tipoCor   = TIPO_COR[contrato.tipo]      || '#5a7a99';
  const hoje      = new Date().toISOString().split('T')[0];
  const parcelas  = contrato.parcelas ?? [];
  const pagas     = parcelas.filter(p => p.status === 'pago');
  const atrasadas = parcelas.filter(p => p.status === 'pendente' && p.data_vencimento < hoje);
  const pendentes = parcelas.filter(p => p.status === 'pendente' && p.data_vencimento >= hoje);
  const totalPago = pagas.reduce((s, p) => s + Number(p.valor_pago ?? p.valor), 0);
  const totalAbert = [...atrasadas, ...pendentes].reduce((s, p) => s + Number(p.valor), 0);
  const pct = parcelas.length > 0 ? (pagas.length / parcelas.length) * 100 : 0;
  const semBoleto = parcelas.filter(p => p.status !== 'pago' && p.status !== 'cancelado' && !isAsaasBoleto(p)).length;

  const filtrados = filtro === 'todos' ? parcelas : filtro === 'atrasado' ? atrasadas : filtro === 'pendente' ? pendentes : pagas;
  const card  = { background: '#1a2f47', border: '1px solid rgba(255,255,255,0.07)' };
  const inp2  = { background: '#0e1e30', border: '1px solid rgba(255,255,255,0.1)', color: '#e2eaf4', borderRadius: 10, padding: '9px 12px', fontSize: 13, outline: 'none', width: '100%' } as const;

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {baixa  && <BaixaModal  parcela={baixa}  onClose={() => setBaixa(null)}  onSaved={p => { updateParcela(p); setBaixa(null); }} />}
      {boleto && <BoletoModal parcela={boleto} onClose={() => setBoleto(null)} onGerado={p => { updateParcela(p); }} />}

      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Link href="/admin/contratos" className="w-8 h-8 rounded-xl flex items-center justify-center hover:bg-white/10 transition-colors" style={{ color: '#5a7a99' }}><ArrowLeft size={16} /></Link>
        <div className="flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-white font-bold text-xl">{contrato.cliente_nome}</h1>
            <span className="text-[11px] px-2.5 py-0.5 rounded-full font-bold" style={{ background: statusCor+'18', color: statusCor, border: `1px solid ${statusCor}30` }}>{STATUS_LABEL[contrato.status]}</span>
            <span className="text-[11px] px-2.5 py-0.5 rounded-full font-bold capitalize" style={{ background: tipoCor+'18', color: tipoCor, border: `1px solid ${tipoCor}30` }}>{contrato.tipo}</span>
          </div>
          <p className="text-[12px] mt-0.5" style={{ color: '#5a7a99' }}>{contrato.imovel_titulo || 'Imóvel não vinculado'}{contrato.imovel_endereco && ` · ${contrato.imovel_endereco}`}</p>
        </div>
        <button onClick={() => setEditando(!editando)}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-[11px] font-bold"
          style={editando ? { background: 'rgba(197,160,89,0.1)', color: '#C5A059', border: '1px solid rgba(197,160,89,0.25)' } : { background: '#12243a', color: '#5a7a99', border: '1px solid rgba(255,255,255,0.08)' }}>
          {editando ? <><X size={11} /> Cancelar</> : <><Edit2 size={11} /> Editar</>}
        </button>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
        {[
          { l: 'Valor / parcela', v: moeda(contrato.valor_parcela), s: contrato.tipo === 'aluguel' ? '/mês' : `${contrato.total_parcelas}x`, c: '#C5A059' },
          { l: 'Total recebido',  v: moeda(totalPago),  s: `${pagas.length} parcela${pagas.length !== 1 ? 's' : ''}`, c: '#22c55e' },
          { l: 'Em aberto',       v: moeda(totalAbert), s: `${pendentes.length} a vencer`, c: '#f59e0b' },
          { l: 'Atrasado', v: moeda(atrasadas.reduce((s, p) => s + Number(p.valor), 0)), s: `${atrasadas.length} parcela${atrasadas.length !== 1 ? 's' : ''}`, c: atrasadas.length > 0 ? '#ef4444' : '#3a5270' },
        ].map(({ l, v, s, c }) => (
          <div key={l} className="rounded-2xl p-4" style={card}>
            <p className="text-[10px] uppercase tracking-widest font-bold mb-1.5" style={{ color: '#5a7a99' }}>{l}</p>
            <p className="text-[17px] font-bold leading-none" style={{ color: c }}>{v}</p>
            <p className="text-[10px] mt-1" style={{ color: '#3a5270' }}>{s}</p>
          </div>
        ))}
      </div>

      {/* Progress bar */}
      <div className="rounded-2xl px-5 py-4 mb-5 flex items-center gap-4" style={card}>
        <div className="flex-1">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold" style={{ color: '#c8d8e8' }}>{pagas.length} de {parcelas.length} parcelas pagas</span>
            <span className="text-[11px] font-bold" style={{ color: '#22c55e' }}>{pct.toFixed(0)}%</span>
          </div>
          <div className="w-full rounded-full overflow-hidden" style={{ height: 6, background: 'rgba(255,255,255,0.06)' }}>
            <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: 'linear-gradient(90deg, #22c55e, #16a34a)' }} />
          </div>
        </div>
        <div className="text-right flex-shrink-0">
          <p className="text-[10px]" style={{ color: '#5a7a99' }}>Vigência</p>
          <p className="text-[12px] font-medium" style={{ color: '#c8d8e8' }}>{dtBR(contrato.data_inicio)}{contrato.data_fim && ` → ${dtBR(contrato.data_fim)}`}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">

        {/* Coluna esquerda */}
        <div className="md:col-span-1 space-y-4">
          <div className="rounded-2xl p-5" style={card}>
            <p className="text-white font-semibold text-[13px] mb-4">Detalhes</p>
            {editando ? (
              <div className="space-y-3">
                {[
                  { k: 'cliente_nome',      l: 'Nome',         t: 'text'  },
                  { k: 'cliente_telefone',  l: 'Telefone',     t: 'text'  },
                  { k: 'cliente_email',     l: 'E-mail',       t: 'email' },
                  { k: 'cliente_cpf',       l: 'CPF',          t: 'text'  },
                  { k: 'proprietario_nome', l: 'Proprietário', t: 'text'  },
                  { k: 'imovel_titulo',     l: 'Imóvel',       t: 'text'  },
                  { k: 'imovel_endereco',   l: 'Endereço',     t: 'text'  },
                ].map(({ k, l, t }) => (
                  <div key={k}>
                    <label className="block text-[10px] uppercase tracking-widest font-bold mb-1" style={{ color: '#5a7a99' }}>{l}</label>
                    <input type={t} value={(editForm as any)[k] || ''} onChange={e => setEditForm(f => ({ ...f, [k]: e.target.value }))} style={inp2} />
                  </div>
                ))}
                <div>
                  <label className="block text-[10px] uppercase tracking-widest font-bold mb-1" style={{ color: '#5a7a99' }}>Status</label>
                  <select value={(editForm as any).status || ''} onChange={e => setEditForm(f => ({ ...f, status: e.target.value }))} style={inp2}>
                    <option value="pendente">Pendente</option><option value="ativo">Ativo</option>
                    <option value="encerrado">Encerrado</option><option value="rescindido">Rescindido</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] uppercase tracking-widest font-bold mb-1" style={{ color: '#5a7a99' }}>Anotações</label>
                  <textarea value={(editForm as any).anotacoes || ''} rows={3} onChange={e => setEditForm(f => ({ ...f, anotacoes: e.target.value }))} className="resize-none focus:outline-none" style={{ ...inp2, padding: '9px 12px' }} />
                </div>
                <button onClick={salvarEdicao} disabled={saving} className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-[12px] font-bold disabled:opacity-50" style={{ background: 'rgba(197,160,89,0.1)', color: '#C5A059', border: '1px solid rgba(197,160,89,0.25)' }}>
                  <Save size={12} /> {saving ? 'Salvando…' : 'Salvar alterações'}
                </button>
              </div>
            ) : (
              <dl className="space-y-3">
                {[
                  { label: 'Cliente',    value: contrato.cliente_nome,        icon: User },
                  { label: 'Telefone',   value: contrato.cliente_telefone,    icon: Phone },
                  { label: 'E-mail',     value: contrato.cliente_email,       icon: Mail },
                  { label: 'CPF',        value: contrato.cliente_cpf,         icon: FileText },
                  { label: 'Proprietário', value: contrato.proprietario_nome, icon: User },
                  { label: 'Imóvel',     value: contrato.imovel_titulo,       icon: Home },
                  { label: 'Vencimento', value: `Todo dia ${contrato.dia_vencimento}`, icon: Calendar },
                  { label: 'Assinatura', value: contrato.data_assinatura ? dtBR(contrato.data_assinatura) : null, icon: Calendar },
                ].filter(({ value }) => value).map(({ label, value, icon: Icon }) => (
                  <div key={label} className="flex items-start gap-2.5">
                    <Icon size={12} className="mt-0.5 flex-shrink-0" style={{ color: '#4a6585' }} />
                    <div>
                      <p className="text-[10px] uppercase tracking-widest font-bold" style={{ color: '#4a6585' }}>{label}</p>
                      <p className="text-[12px] mt-0.5" style={{ color: '#c8d8e8' }}>{value}</p>
                    </div>
                  </div>
                ))}
                {contrato.anotacoes && (
                  <div className="pt-2 mt-2" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                    <p className="text-[10px] uppercase tracking-widest font-bold mb-1" style={{ color: '#4a6585' }}>Anotações</p>
                    <p className="text-[12px] leading-relaxed" style={{ color: '#7a9db8' }}>{contrato.anotacoes}</p>
                  </div>
                )}
              </dl>
            )}
          </div>

          {/* Integrações */}
          <div className="rounded-2xl p-5" style={card}>
            <p className="text-white font-semibold text-[13px] mb-3">Integrações</p>
            <div className="space-y-2">
              <div className="px-3 py-2.5 rounded-xl" style={{ background: 'rgba(197,160,89,0.06)', border: '1px solid rgba(197,160,89,0.15)' }}>
                <div className="flex items-center justify-between mb-1">
                  <p className="text-[11px] font-bold" style={{ color: '#C5A059' }}>Boleto · Asaas</p>
                  <span className="text-[9px] px-2 py-0.5 rounded-full font-bold" style={{ background: 'rgba(197,160,89,0.15)', color: '#C5A059' }}>ativo</span>
                </div>
                <p className="text-[10px]" style={{ color: '#8a7a5a' }}>Boleto bancário com baixa automática via webhook</p>
              </div>
              <div className="flex items-center justify-between px-3 py-2.5 rounded-xl" style={{ background: '#0e1e30', border: '1px solid rgba(255,255,255,0.05)' }}>
                <div><p className="text-[11px] font-medium" style={{ color: '#5a7a99' }}>NFSe · Nota Fiscal</p><p className="text-[10px]" style={{ color: '#2a4060' }}>Emissão eletrônica</p></div>
                <span className="text-[9px] px-2 py-0.5 rounded-full font-bold" style={{ background: '#2a406030', color: '#2a4060' }}>em breve</span>
              </div>
            </div>
          </div>
        </div>

        {/* Coluna direita: parcelas */}
        <div className="md:col-span-2">
          <div className="rounded-2xl overflow-hidden" style={card}>
            <div className="px-5 py-4 flex items-center justify-between" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              <p className="text-white font-semibold text-[13px]">
                Parcelas <span className="ml-2 text-[11px]" style={{ color: '#5a7a99' }}>{parcelas.length} total</span>
              </p>
              <div className="flex items-center gap-2">
                {/* Gerar Todos os Boletos */}
                {semBoleto > 0 && (
                  <button onClick={gerarTodosBoletos} disabled={gerandoTodos}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-bold transition-all disabled:opacity-50"
                    style={{ background: 'rgba(197,160,89,0.1)', color: '#C5A059', border: '1px solid rgba(197,160,89,0.25)' }}>
                    {gerandoTodos
                      ? <span className="w-3 h-3 border border-[#C5A059] border-t-transparent rounded-full animate-spin" />
                      : <Layers size={10} />}
                    {gerandoTodos ? 'Gerando…' : `Gerar ${semBoleto} Boleto${semBoleto !== 1 ? 's' : ''}`}
                  </button>
                )}
                {/* Filtro */}
                <div className="flex gap-1 p-0.5 rounded-xl" style={{ background: '#0e1e30' }}>
                  {['todos','atrasado','pendente','pago'].map(f => (
                    <button key={f} onClick={() => setFiltro(f)} className="px-2.5 py-1.5 rounded-lg text-[10px] font-bold capitalize transition-all"
                      style={filtro === f ? { background: (PARC_COR[f]||'#C5A059')+'20', color: PARC_COR[f]||'#C5A059' } : { color: '#3a5270' }}>
                      {f === 'todos' ? 'Todas' : PARC_LABEL[f]}
                      {f !== 'todos' && <span className="ml-1">{f==='atrasado'?atrasadas.length:f==='pendente'?pendentes.length:pagas.length}</span>}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Feedback bulk */}
            {bulkMsg && (
              <div className="mx-4 mt-3 px-3 py-2 rounded-xl text-[11px] font-medium" style={{ background: bulkMsg.startsWith('Erro') ? 'rgba(239,68,68,0.1)' : 'rgba(197,160,89,0.1)', color: bulkMsg.startsWith('Erro') ? '#ef4444' : '#C5A059', border: `1px solid ${bulkMsg.startsWith('Erro') ? 'rgba(239,68,68,0.2)' : 'rgba(197,160,89,0.2)'}` }}>
                {bulkMsg}
              </div>
            )}

            {/* Lista */}
            <div className="overflow-y-auto" style={{ maxHeight: 500 }}>
              {filtrados.length === 0 ? (
                <p className="px-5 py-12 text-center text-[12px]" style={{ color: '#3a5270' }}>Nenhuma parcela neste filtro.</p>
              ) : filtrados.map((p, i) => {
                const isAtrasada  = p.status === 'pendente' && p.data_vencimento < hoje;
                const efStatus    = isAtrasada ? 'atrasado' : p.status;
                const cor         = PARC_COR[efStatus] || '#5a7a99';
                const temBoleto   = isAsaasBoleto(p);
                const bStatus     = (p.boleto_dados as any)?.status ?? null;

                return (
                  <div key={p.id} style={{ borderBottom: i < filtrados.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}
                    className="px-5 py-3.5 flex items-center gap-3 group transition-colors hover:bg-white/[0.015]">

                    <div className="w-7 h-7 rounded-xl flex items-center justify-center flex-shrink-0 text-[10px] font-bold" style={{ background: cor+'15', color: cor }}>{p.numero}</div>

                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-medium" style={{ color: '#c8d8e8' }}>{p.descricao}</p>
                      <div className="flex items-center gap-2 flex-wrap mt-0.5">
                        <p className="text-[11px]" style={{ color: '#4a6585' }}>
                          Venc. {dtBR(p.data_vencimento)}
                          {p.data_pagamento && <span style={{ color: '#22c55e66' }}> · Pago {dtBR(p.data_pagamento)}</span>}
                          {p.forma_pagamento && <span> · {p.forma_pagamento === 'transferencia' ? 'TED' : p.forma_pagamento.toUpperCase()}</span>}
                        </p>
                        {/* Badge boleto Asaas */}
                        {temBoleto && p.status !== 'pago' && (
                          <span className="flex items-center gap-1 text-[9px] px-1.5 py-0.5 rounded-full font-bold"
                            style={{ background: bStatus === 'RECEIVED' ? 'rgba(34,197,94,0.12)' : 'rgba(197,160,89,0.1)', color: bStatus === 'RECEIVED' ? '#22c55e' : '#C5A059', border: `1px solid ${bStatus === 'RECEIVED' ? 'rgba(34,197,94,0.2)' : 'rgba(197,160,89,0.2)'}` }}>
                            <Receipt size={8} /> {bStatus === 'RECEIVED' ? 'Pago' : bStatus === 'OVERDUE' ? 'Vencido' : 'Boleto gerado'}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="text-right mr-2 flex-shrink-0">
                      <p className="text-[14px] font-bold" style={{ color: cor }}>{moeda(p.status === 'pago' ? (p.valor_pago ?? p.valor) : p.valor)}</p>
                      <p className="text-[10px]" style={{ color: cor+'80' }}>{PARC_LABEL[efStatus]}</p>
                    </div>

                    {/* Ações (visíveis no hover) */}
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 flex items-center gap-1">
                      {p.status !== 'cancelado' && p.status !== 'pago' && (
                        <>
                          <button onClick={() => setBoleto(p)}
                            className="flex items-center gap-1 px-2 py-1.5 rounded-lg text-[10px] font-bold"
                            style={{ background: 'rgba(197,160,89,0.1)', color: '#C5A059', border: '1px solid rgba(197,160,89,0.25)' }}>
                            <Receipt size={9} /> {temBoleto ? 'Ver Boleto' : 'Boleto'}
                          </button>
                          <button onClick={() => setBaixa(p)}
                            className="flex items-center gap-1 px-2 py-1.5 rounded-lg text-[10px] font-bold"
                            style={{ background: 'rgba(255,255,255,0.04)', color: '#5a7a99', border: '1px solid rgba(255,255,255,0.08)' }}>
                            <CreditCard size={9} /> Baixa
                          </button>
                        </>
                      )}
                      {p.status === 'pago' && (
                        <>
                          {temBoleto && (
                            <a href={(p.boleto_dados as any)?.bankSlipUrl} target="_blank" rel="noopener noreferrer"
                              className="flex items-center gap-1 px-2 py-1.5 rounded-lg text-[10px] font-bold"
                              style={{ background: 'rgba(197,160,89,0.08)', color: '#C5A059', border: '1px solid rgba(197,160,89,0.18)' }}>
                              <FileDown size={9} /> PDF
                            </a>
                          )}
                          <button onClick={() => setBaixa(p)} className="flex items-center gap-1 px-2 py-1.5 rounded-lg text-[10px] font-bold" style={{ background: 'rgba(255,255,255,0.04)', color: '#5a7a99', border: '1px solid rgba(255,255,255,0.08)' }}>
                            <Edit2 size={9} /> Editar
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Footer */}
            <div className="px-5 py-3 flex items-center justify-between" style={{ borderTop: '1px solid rgba(255,255,255,0.05)', background: 'rgba(0,0,0,0.15)' }}>
              <span className="text-[10px]" style={{ color: '#3a5270' }}>{pagas.length}/{parcelas.length} pagas</span>
              <div className="flex items-center gap-4">
                <span className="text-[11px] font-semibold" style={{ color: '#22c55e' }}>Recebido: {moeda(totalPago)}</span>
                {totalAbert > 0 && <span className="text-[11px] font-semibold" style={{ color: '#f59e0b' }}>Aberto: {moeda(totalAbert)}</span>}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
