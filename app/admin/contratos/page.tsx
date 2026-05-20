'use client'

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  Search, X, Plus, ArrowRight, FileText, Home, Calendar,
  TrendingUp, AlertTriangle, Clock, CheckCircle,
} from 'lucide-react';

interface Parcela { id: number; status: string; data_vencimento: string; valor: number }
interface Contrato {
  id: number;
  cliente_nome: string;
  cliente_telefone: string | null;
  tipo: string;
  status: string;
  valor_parcela: number;
  total_parcelas: number;
  dia_vencimento: number;
  data_inicio: string;
  data_fim: string | null;
  imovel_titulo: string | null;
  imovel_endereco: string | null;
  parcelas: Parcela[];
  criado_em: string;
}

const STATUS_COR: Record<string, string>   = { ativo: '#22c55e', encerrado: '#64748b', rescindido: '#ef4444', pendente: '#f59e0b' };
const STATUS_LABEL: Record<string, string> = { todos: 'Todos', ativo: 'Ativo', encerrado: 'Encerrado', rescindido: 'Rescindido', pendente: 'Pendente' };
const TIPO_COR: Record<string, string>     = { aluguel: '#3b82f6', venda: '#8b5cf6' };

function moeda(v: number) { return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }); }

function parcelaSummary(parcelas: Parcela[]) {
  const hoje     = new Date().toISOString().split('T')[0];
  const atrasadas = parcelas.filter(p => p.status === 'pendente' && p.data_vencimento < hoje).length;
  const pendentes = parcelas.filter(p => p.status === 'pendente' && p.data_vencimento >= hoje).length;
  const pagas     = parcelas.filter(p => p.status === 'pago').length;
  return { atrasadas, pendentes, pagas };
}

function ProgressBar({ pagas, total }: { pagas: number; total: number }) {
  const pct = total > 0 ? (pagas / total) * 100 : 0;
  return (
    <div className="w-full rounded-full overflow-hidden" style={{ height: 3, background: 'rgba(255,255,255,0.06)' }}>
      <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: '#22c55e' }} />
    </div>
  );
}

export default function ContratosPage() {
  const [contratos, setContratos] = useState<Contrato[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [status,    setStatus]    = useState('todos');
  const [tipo,      setTipo]      = useState('todos');
  const [busca,     setBusca]     = useState('');

  const carregar = useCallback(async () => {
    setLoading(true);
    const p = new URLSearchParams();
    if (status !== 'todos') p.set('status', status);
    if (tipo   !== 'todos') p.set('tipo',   tipo);
    if (busca.trim())       p.set('busca',  busca.trim());
    const res  = await fetch(`/api/admin/contratos?${p}`);
    const data = await res.json();
    setContratos(Array.isArray(data) ? data : []);
    setLoading(false);
  }, [status, tipo, busca]);

  useEffect(() => {
    const t = setTimeout(carregar, busca ? 400 : 0);
    return () => clearTimeout(t);
  }, [carregar]);

  /* KPIs rápidos */
  const ativos   = contratos.filter(c => c.status === 'ativo').length;
  const atrasadas = contratos.flatMap(c => c.parcelas ?? [])
    .filter(p => p.status === 'pendente' && p.data_vencimento < new Date().toISOString().split('T')[0]).length;
  const receitaMes = contratos.filter(c => c.status === 'ativo')
    .reduce((s, c) => s + Number(c.valor_parcela), 0);

  const bg = '#172840';
  const card = { background: '#1a2f47', border: '1px solid rgba(255,255,255,0.07)' };

  return (
    <div className="p-6 max-w-7xl mx-auto">

      {/* Header */}
      <div className="flex flex-wrap gap-4 justify-between items-center mb-6">
        <div>
          <h1 className="text-white font-bold text-2xl tracking-tight">Contratos</h1>
          <p className="text-[12px] mt-0.5" style={{ color: '#5a7a99' }}>
            Gestão de contratos de locação e venda
          </p>
        </div>
        <Link href="/admin/contratos/novo"
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-[12px] font-bold transition-all"
          style={{ background: 'rgba(197,160,89,0.12)', color: '#C5A059', border: '1px solid rgba(197,160,89,0.25)' }}>
          <Plus size={13} /> NOVO CONTRATO
        </Link>
      </div>

      {/* KPI strip */}
      {!loading && (
        <div className="grid grid-cols-3 gap-3 mb-6">
          {[
            { icon: FileText,     label: 'Contratos ativos', value: String(ativos),     color: '#C5A059' },
            { icon: TrendingUp,   label: 'Receita mensal',   value: moeda(receitaMes),  color: '#22c55e' },
            { icon: AlertTriangle,label: 'Parcelas atrasadas', value: String(atrasadas), color: atrasadas > 0 ? '#ef4444' : '#3a5270' },
          ].map(({ icon: Icon, label, value, color }) => (
            <div key={label} className="rounded-2xl px-5 py-4 flex items-center gap-3" style={card}>
              <Icon size={16} color={color} />
              <div>
                <p className="text-[10px] uppercase tracking-widest font-bold" style={{ color: '#5a7a99' }}>{label}</p>
                <p className="text-lg font-bold leading-none mt-0.5" style={{ color }}>{value}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-2 mb-4 items-center">
        {/* Status chips */}
        {Object.keys(STATUS_LABEL).map(s => {
          const cor  = STATUS_COR[s] || '#C5A059';
          const ativo = status === s;
          const cnt  = s === 'todos' ? contratos.length : contratos.filter(c => c.status === s).length;
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

        <div className="w-px h-4 mx-1" style={{ background: 'rgba(255,255,255,0.1)' }} />

        {/* Tipo */}
        {['todos', 'aluguel', 'venda'].map(t => (
          <button key={t} onClick={() => setTipo(t)}
            className="px-3 py-1.5 rounded-full text-[11px] font-bold transition-all"
            style={tipo === t
              ? { background: (TIPO_COR[t] || '#C5A059') + '20', color: TIPO_COR[t] || '#C5A059', border: `1px solid ${(TIPO_COR[t] || '#C5A059')}40` }
              : { background: 'rgba(255,255,255,0.04)', color: '#5a7a99', border: '1px solid rgba(255,255,255,0.07)' }
            }>
            {t === 'todos' ? 'Todos os tipos' : t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}

        {/* Busca */}
        <div className="flex-1 relative max-w-xs ml-auto">
          <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: '#4a6585' }} />
          <input value={busca} onChange={e => setBusca(e.target.value)}
            placeholder="Buscar cliente ou imóvel…"
            className="w-full pl-9 pr-9 py-2 rounded-xl text-[12px] focus:outline-none"
            style={{ background: '#12243a', border: '1px solid rgba(255,255,255,0.08)', color: '#e2eaf4' }} />
          {busca && (
            <button onClick={() => setBusca('')} className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: '#4a6585' }}>
              <X size={12} />
            </button>
          )}
        </div>
      </div>

      {/* Cards grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="rounded-2xl p-5 animate-pulse" style={card}>
              <div className="h-4 w-3/4 rounded mb-3" style={{ background: '#12243a' }} />
              <div className="h-3 w-1/2 rounded mb-4" style={{ background: '#12243a' }} />
              <div className="h-8 w-full rounded" style={{ background: '#12243a' }} />
            </div>
          ))}
        </div>
      ) : contratos.length === 0 ? (
        <div className="rounded-2xl py-20 text-center" style={card}>
          <FileText size={32} className="mx-auto mb-3" style={{ color: '#2a4060' }} />
          <p className="font-semibold" style={{ color: '#4a6585' }}>Nenhum contrato encontrado</p>
          <p className="text-[12px] mt-1 mb-4" style={{ color: '#2a4060' }}>
            {busca ? 'Tente outros termos de busca' : 'Crie o primeiro contrato do seu portfólio'}
          </p>
          <Link href="/admin/contratos/novo"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-[12px] font-bold"
            style={{ background: 'rgba(197,160,89,0.1)', color: '#C5A059', border: '1px solid rgba(197,160,89,0.2)' }}>
            <Plus size={12} /> Novo contrato
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {contratos.map(c => {
            const statusCor = STATUS_COR[c.status]  || '#64748b';
            const tipoCor   = TIPO_COR[c.tipo]       || '#5a7a99';
            const { atrasadas, pendentes, pagas } = parcelaSummary(c.parcelas ?? []);
            const total = (c.parcelas ?? []).length;

            return (
              <Link key={c.id} href={`/admin/contratos/${c.id}`}
                className="rounded-2xl p-5 flex flex-col gap-3 transition-all hover:scale-[1.01] hover:border-white/10 group"
                style={card}>

                {/* Header do card */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0"
                      style={{ background: 'rgba(197,160,89,0.12)', color: '#C5A059' }}>
                      {c.cliente_nome.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-white font-semibold text-[14px] leading-snug">{c.cliente_nome}</p>
                      <p className="text-[11px]" style={{ color: '#4a6585' }}>{c.cliente_telefone || '—'}</p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1 flex-shrink-0">
                    <span className="text-[10px] px-2 py-0.5 rounded-full font-bold capitalize"
                      style={{ background: tipoCor + '18', color: tipoCor }}>
                      {c.tipo}
                    </span>
                    <span className="text-[10px] flex items-center gap-1 font-medium" style={{ color: statusCor }}>
                      <span className="w-1.5 h-1.5 rounded-full" style={{ background: statusCor }} />
                      {STATUS_LABEL[c.status]}
                    </span>
                  </div>
                </div>

                {/* Imóvel */}
                {c.imovel_titulo && (
                  <div className="flex items-center gap-2 px-3 py-2 rounded-xl"
                    style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}>
                    <Home size={11} color="#4a6585" />
                    <p className="text-[12px] truncate" style={{ color: '#7a9db8' }}>{c.imovel_titulo}</p>
                  </div>
                )}

                {/* Valor */}
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-white text-lg font-bold leading-none">{moeda(c.valor_parcela)}</p>
                    <p className="text-[10px] mt-0.5" style={{ color: '#3a5270' }}>
                      {c.tipo === 'aluguel' ? `/mês · dia ${c.dia_vencimento}` : `em ${c.total_parcelas}x`}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-[11px]" style={{ color: '#5a7a99' }}>
                      <Calendar size={10} className="inline mr-1" />
                      {new Date(c.data_inicio + 'T12:00:00').toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' })}
                    </p>
                  </div>
                </div>

                {/* Parcelas progress */}
                {total > 0 && (
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[10px]" style={{ color: '#3a5270' }}>{pagas}/{total} pagas</span>
                      <div className="flex items-center gap-2">
                        {atrasadas > 0 && (
                          <span className="text-[10px] font-bold" style={{ color: '#ef4444' }}>
                            {atrasadas} atr.
                          </span>
                        )}
                        {pendentes > 0 && (
                          <span className="text-[10px] font-bold" style={{ color: '#f59e0b' }}>
                            {pendentes} pend.
                          </span>
                        )}
                      </div>
                    </div>
                    <ProgressBar pagas={pagas} total={total} />
                  </div>
                )}

                {/* CTA */}
                <div className="flex items-center justify-end pt-1">
                  <span className="flex items-center gap-1 text-[11px] font-bold opacity-0 group-hover:opacity-100 transition-opacity"
                    style={{ color: '#C5A059' }}>
                    Ver detalhes <ArrowRight size={11} />
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {!loading && contratos.length > 0 && (
        <p className="mt-4 text-center text-[10px]" style={{ color: '#2a4060' }}>
          {contratos.length} contrato{contratos.length !== 1 ? 's' : ''}
        </p>
      )}
    </div>
  );
}
