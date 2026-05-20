import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// Asaas envia o token no header 'asaas-access-token'
// Configurado em: Painel Asaas → Integrações → Webhook → authToken
export async function POST(request: NextRequest) {
  // ── 1. Validar autenticidade ──────────────────────────────────────────────
  const token    = request.headers.get('asaas-access-token') ?? '';
  const expected = process.env.ASAAS_WEBHOOK_TOKEN ?? '';

  if (!expected || token !== expected) {
    console.warn('[Asaas Webhook] Token inválido. Recebido:', token.slice(0, 8) + '…');
    // Retorna 200 para não pausar a fila de webhooks do Asaas
    return NextResponse.json({ received: true }, { status: 200 });
  }

  // ── 2. Parsear payload ────────────────────────────────────────────────────
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ received: true }, { status: 200 });
  }

  const payload = body as {
    id?: string;
    event?: string;
    payment?: {
      id?: string;
      status?: string;
      value?: number;
      billingType?: string;
      externalReference?: string;
      paymentDate?: string;
      customer?: string;
    };
  };

  const { event, payment } = payload;

  // ── 3. Processar apenas eventos de pagamento recebido ─────────────────────
  const EVENTOS_PAGAMENTO = ['PAYMENT_RECEIVED', 'PAYMENT_CONFIRMED'];
  if (!event || !EVENTOS_PAGAMENTO.includes(event)) {
    return NextResponse.json({ received: true, event: event ?? 'unknown' }, { status: 200 });
  }

  if (!payment?.id) {
    return NextResponse.json({ received: true }, { status: 200 });
  }

  // ── 4. Localizar parcela ──────────────────────────────────────────────────
  let parcela: { id: number; valor: number; status: string } | null = null;

  // Tenta pelo boleto_id (payment.id do Asaas)
  const { data: p1 } = await supabase
    .from('parcelas')
    .select('id, valor, status')
    .eq('boleto_id', payment.id)
    .maybeSingle();

  if (p1) {
    parcela = p1;
  } else if (payment.externalReference?.startsWith('parcela_')) {
    // Fallback: localiza pelo externalReference
    const parcelaId = payment.externalReference.replace('parcela_', '');
    const { data: p2 } = await supabase
      .from('parcelas')
      .select('id, valor, status')
      .eq('id', parcelaId)
      .maybeSingle();
    if (p2) parcela = p2;
  }

  if (!parcela) {
    console.warn('[Asaas Webhook] Parcela não encontrada para payment.id:', payment.id);
    return NextResponse.json({ received: true }, { status: 200 });
  }

  // ── 5. Evitar dupla baixa (idempotência) ──────────────────────────────────
  if (parcela.status === 'pago') {
    return NextResponse.json({ received: true, already_paid: true }, { status: 200 });
  }

  // ── 6. Baixa automática ───────────────────────────────────────────────────
  const valorPago  = payment.value ?? Number(parcela.valor);
  const formaPgto  = payment.billingType === 'PIX' ? 'pix' : 'boleto';
  const dataPgto   = payment.paymentDate ?? new Date().toISOString().split('T')[0];

  const { error: updateError } = await supabase
    .from('parcelas')
    .update({
      status:          'pago',
      data_pagamento:  dataPgto,
      valor_pago:      valorPago,
      forma_pagamento: formaPgto,
      anotacoes:       `Baixa automática Asaas · Payment ID: ${payment.id} · Evento: ${event}`,
      boleto_dados: {
        provider:    'ASAAS',
        billingType: payment.billingType ?? 'BOLETO',
        paymentId:   payment.id,
        status:      'RECEIVED',
        valorPago,
        pagoEm:      new Date().toISOString(),
        evento:      event,
      },
    })
    .eq('id', parcela.id);

  if (updateError) {
    console.error('[Asaas Webhook] Erro ao atualizar parcela:', updateError.message);
  } else {
    console.info(`[Asaas Webhook] Parcela ${parcela.id} baixada. Valor: R$ ${valorPago} · Evento: ${event}`);
  }

  return NextResponse.json({ received: true, parcela_id: parcela.id }, { status: 200 });
}
