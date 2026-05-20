'use client'

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { TrendingUp, AlertTriangle, Clock, CheckCircle, FileText, ArrowRight } from 'lucide-react';

interface ResumoFinanceiro {
  contratos_ativos:   number;
  total_receber:      number;
  total_pago_mes:     number;
  total_atrasado:     number;
  vencendo_7dias:     number;
  qtd_atrasadas:      number;
  qtd_vencendo_7dias: number;
}

interface Parcela {
  id: number;
  numero: number;
  descricao: string;
  valor: number;
  data_vencimento: string;
  status: string;
  contrato_id: number;
  boleto_id: string | null;
  boleto_dados: Record<string, unknown> | null;
  contratos?: { cliente_nome: string; tipo: string; imovel_titulo: string | null };
}

function moeda(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}
function dtBR(iso: string) {
  return new Date(iso + 'T12:00:00').toLocaleDateString('pt-BR');
}


export default function FinanceiroPage() {
  const [resumo,    setResumo]    = useState<ResumoFinanceiro | null>(null);
  const [atrasadas, setAtrasadas] = useState<Parcela[]>([]);
  const [proximas,  setProximas]  = useState<Parcela[]>([]);
  const [loading,   setLoading]   = useState(true);

  useEffect(() => {
    async function carregar() {
      setLoading(true);
      const hoje     = new Date().toISOString().split('T')[0];
      const proximos = new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0];

      const [res, resParc] = await Promise.all([
        fetch('/api/admin/financeiro'),
        fetch('/api/admin/contratos?status=ativo'),
      ]);

      const resumoData   = await res.json();
      const contratosRaw = await resParc.json();

      setResumo(resumoData);

      const todasParcelas: Parcela[] = [];
      for (const c of (Array.isArray(contratosRaw) ? contratosRaw : [])) {
        for (const p of (c.parcelas ?? [])) {
          todasParcelas.push({
            ...p,
            contratos: { cliente_nome: c.cliente_nome, tipo: c.tipo, imovel_titulo: c.imovel_titulo },
          });
        }
      }

      setAtrasadas(
        todasParcelas
          .filter(p => p.status === 'pendente' && p.data_vencimento < hoje)
          .sort((a, b) => a.data_vencimento.localeCompare(b.data_vencimento)),
      );
      setProximas(
        todasParcelas
          .filter(p => p.status === 'pendente' && p.data_vencimento >= hoje && p.data_vencimento <= proximos)
          .sort((a, b) => a.data_vencimento.localeCompare(b.data_vencimento)),
      );

      setLoading(false);
    }
    carregar();
  }, []);

const card = { background: '#1e3552', border: '1px solid rgba(255,255,255,0.06)' };

  function ParcelaRow({ p, cor }: { p: Parcela; cor: string }) {
    return (
      <div className="px-5 py-3 flex items-center gap-3 hover:bg-white/[0.01] transition-colors">
        <div className="flex-1 min-w-0">
          <p className="text-[12px] font-medium truncate" style={{ color: '#c8d8e8' }}>
            {p.contratos?.cliente_nome || '—'}
          </p>
          <p className="text-[10px]" style={{ color: '#4a6585' }}>
            {p.descricao} · Venc. {dtBR(p.data_vencimento)}
          </p>
        </div>
        <span className="text-[12px] font-bold flex-shrink-0" style={{ color: cor }}>{moeda(p.valor)}</span>
        <Link href={`/admin/contratos/${p.contrato_id}`}
          className="w-6 h-6 rounded-lg flex items-center justify-center hover:bg-white/10 flex-shrink-0"
          style={{ color: '#5a7a99' }}>
          <ArrowRight size={11} />
        </Link>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-white font-bold text-2xl">Financeiro</h1>
          <p className="text-[12px] mt-0.5" style={{ color: '#5a7a99' }}>Visão geral do fluxo de caixa</p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/admin/contratos"
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-[12px] font-bold"
            style={{ background: 'rgba(255,255,255,0.04)', color: '#5a7a99', border: '1px solid rgba(255,255,255,0.08)' }}>
            <FileText size={13} /> Ver Contratos
          </Link>
        </div>
      </div>

      {/* Cards KPI */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {loading ? [...Array(4)].map((_, i) => (
          <div key={i} className="rounded-2xl p-5 animate-pulse" style={card}>
            <div className="h-3 w-20 rounded mb-3" style={{ background: '#12243a' }} />
            <div className="h-7 w-28 rounded" style={{ background: '#12243a' }} />
          </div>
        )) : resumo ? [
          {
            icon: FileText, label: 'Contratos Ativos',
            value: resumo.contratos_ativos, fmt: (v: number) => String(v),
            color: '#C5A059', bg: 'rgba(197,160,89,0.08)',
          },
          {
            icon: CheckCircle, label: 'Recebido este mês',
            value: resumo.total_pago_mes, fmt: moeda,
            color: '#22c55e', bg: 'rgba(34,197,94,0.08)',
          },
          {
            icon: Clock, label: `A vencer (7 dias)`,
            value: resumo.vencendo_7dias, fmt: moeda,
            sub: `${resumo.qtd_vencendo_7dias} parcela${resumo.qtd_vencendo_7dias !== 1 ? 's' : ''}`,
            color: '#f59e0b', bg: 'rgba(245,158,11,0.08)',
          },
          {
            icon: AlertTriangle, label: 'Atrasado',
            value: resumo.total_atrasado, fmt: moeda,
            sub: `${resumo.qtd_atrasadas} parcela${resumo.qtd_atrasadas !== 1 ? 's' : ''}`,
            color: resumo.qtd_atrasadas > 0 ? '#ef4444' : '#3a5270',
            bg: resumo.qtd_atrasadas > 0 ? 'rgba(239,68,68,0.08)' : 'rgba(255,255,255,0.03)',
          },
        ].map(({ icon: Icon, label, value, fmt, sub, color, bg }) => (
          <div key={label} className="rounded-2xl p-5" style={{ ...card, background: bg }}>
            <div className="flex items-center gap-2 mb-2">
              <Icon size={14} color={color} />
              <p className="text-[10px] uppercase tracking-widest font-bold" style={{ color: '#5a7a99' }}>{label}</p>
            </div>
            <p className="text-xl font-bold" style={{ color }}>{fmt(value)}</p>
            {sub && <p className="text-[10px] mt-0.5" style={{ color: '#3a5270' }}>{sub}</p>}
          </div>
        )) : null}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

        {/* Parcelas atrasadas */}
        <div className="rounded-2xl overflow-hidden" style={card}>
          <div className="px-5 py-4 flex items-center gap-2"
            style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            <AlertTriangle size={13} color="#ef4444" />
            <p className="text-white font-semibold text-[13px]">Parcelas Atrasadas</p>
            {atrasadas.length > 0 && (
              <span className="ml-auto text-[10px] px-2 py-0.5 rounded-full font-bold"
                style={{ background: '#ef444420', color: '#ef4444' }}>
                {atrasadas.length}
              </span>
            )}
          </div>
          {loading ? (
            <div className="p-5 flex flex-col gap-3">
              {[...Array(3)].map((_, i) => <div key={i} className="h-12 rounded-xl animate-pulse" style={{ background: '#12243a' }} />)}
            </div>
          ) : atrasadas.length === 0 ? (
            <p className="px-5 py-10 text-center text-[12px]" style={{ color: '#3a5270' }}>Nenhuma parcela atrasada.</p>
          ) : (
            <div className="overflow-y-auto" style={{ maxHeight: 340 }}>
              {atrasadas.map((p, i) => (
                <div key={p.id} style={{ borderBottom: i < atrasadas.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}>
                  <ParcelaRow p={p} cor="#ef4444" />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Próximos 14 dias */}
        <div className="rounded-2xl overflow-hidden" style={card}>
          <div className="px-5 py-4 flex items-center gap-2"
            style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            <Clock size={13} color="#f59e0b" />
            <p className="text-white font-semibold text-[13px]">Vencendo em 14 Dias</p>
            {proximas.length > 0 && (
              <span className="ml-auto text-[10px] px-2 py-0.5 rounded-full font-bold"
                style={{ background: '#f59e0b20', color: '#f59e0b' }}>
                {proximas.length}
              </span>
            )}
          </div>
          {loading ? (
            <div className="p-5 flex flex-col gap-3">
              {[...Array(3)].map((_, i) => <div key={i} className="h-12 rounded-xl animate-pulse" style={{ background: '#12243a' }} />)}
            </div>
          ) : proximas.length === 0 ? (
            <p className="px-5 py-10 text-center text-[12px]" style={{ color: '#3a5270' }}>Nenhum vencimento nos próximos 14 dias.</p>
          ) : (
            <div className="overflow-y-auto" style={{ maxHeight: 340 }}>
              {proximas.map((p, i) => (
                <div key={p.id} style={{ borderBottom: i < proximas.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}>
                  <ParcelaRow p={p} cor="#f59e0b" />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
