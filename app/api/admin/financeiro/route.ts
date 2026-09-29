import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET() {
  const hoje    = new Date().toISOString().split('T')[0];
  const inicioMes = hoje.slice(0, 8) + '01';
  const fimMes    = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0)
    .toISOString().split('T')[0];
  const proximos7 = new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0];

  let contratos: { status: string }[];
  let ps: { status: string; valor: number; data_vencimento: string; valor_pago: number | null }[];
  try {
    [contratos, ps] = await Promise.all([
      query('SELECT id, tipo, status, valor_parcela, total_parcelas FROM contratos'),
      query('SELECT id, status, valor, data_vencimento, valor_pago, contrato_id FROM parcelas'),
    ]);
  } catch {
    return NextResponse.json({ error: 'Erro ao buscar dados financeiros' }, { status: 500 });
  }

  const totalReceber   = ps.filter(p => p.status === 'pendente').reduce((s, p) => s + Number(p.valor), 0);
  const totalPagoMes   = ps
    .filter(p => p.status === 'pago' && p.data_vencimento >= inicioMes && p.data_vencimento <= fimMes)
    .reduce((s, p) => s + Number(p.valor_pago ?? p.valor), 0);
  const totalAtrasado  = ps.filter(p => p.status === 'atrasado' || (p.status === 'pendente' && p.data_vencimento < hoje))
    .reduce((s, p) => s + Number(p.valor), 0);
  const vencendoEm7   = ps
    .filter(p => p.status === 'pendente' && p.data_vencimento >= hoje && p.data_vencimento <= proximos7)
    .reduce((s, p) => s + Number(p.valor), 0);

  const atrasadas = ps
    .filter(p => p.status === 'pendente' && p.data_vencimento < hoje)
    .length;
  const vencendo = ps
    .filter(p => p.status === 'pendente' && p.data_vencimento >= hoje && p.data_vencimento <= proximos7)
    .length;

  return NextResponse.json({
    contratos_ativos:    contratos.filter(c => c.status === 'ativo').length,
    total_receber:       totalReceber,
    total_pago_mes:      totalPagoMes,
    total_atrasado:      totalAtrasado,
    vencendo_7dias:      vencendoEm7,
    qtd_atrasadas:       atrasadas,
    qtd_vencendo_7dias:  vencendo,
  });
}
