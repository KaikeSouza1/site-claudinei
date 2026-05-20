import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getOrCreateCustomer, criarBoleto } from '@/lib/asaas';

type Params = { params: Promise<{ id: string }> };

// POST — gera ou retorna boleto Asaas para a parcela
export async function POST(_req: NextRequest, { params }: Params) {
  const { id } = await params;

  const { data: parcela, error } = await supabase
    .from('parcelas')
    .select('id, valor, status, data_vencimento, descricao, boleto_id, boleto_dados, contratos(id, cliente_nome, cliente_email, cliente_cpf, cliente_telefone, fintech_dados)')
    .eq('id', id)
    .single();

  if (error || !parcela) {
    return NextResponse.json({ error: 'Parcela não encontrada' }, { status: 404 });
  }
  if (parcela.status === 'pago') {
    return NextResponse.json({ error: 'Parcela já está paga' }, { status: 400 });
  }
  if (parcela.status === 'cancelado') {
    return NextResponse.json({ error: 'Parcela cancelada' }, { status: 400 });
  }

  // Retorna boleto existente se já foi gerado pelo Asaas
  const dadosExistentes = parcela.boleto_dados as Record<string, unknown> | null;
  if (parcela.boleto_id && dadosExistentes?.provider === 'ASAAS') {
    return NextResponse.json({ reutilizado: true, ...dadosExistentes });
  }

  const contrato = parcela.contratos as {
    id: number;
    cliente_nome: string;
    cliente_email: string | null;
    cliente_cpf: string | null;
    cliente_telefone: string | null;
    fintech_dados: Record<string, unknown> | null;
  } | null;

  if (!contrato?.cliente_cpf) {
    return NextResponse.json(
      { error: 'CPF do cliente é obrigatório para gerar boleto. Edite o contrato e preencha o campo.' },
      { status: 422 },
    );
  }

  try {
    // ── Garantir cliente no Asaas ────────────────────────────────────────────
    let asaasCustomerId = (contrato.fintech_dados?.asaas_customer_id as string | undefined);

    if (!asaasCustomerId) {
      asaasCustomerId = await getOrCreateCustomer(
        contrato.cliente_nome,
        contrato.cliente_cpf,
        contrato.cliente_email,
        contrato.cliente_telefone,
      );

      await supabase
        .from('contratos')
        .update({
          fintech_dados: { ...(contrato.fintech_dados ?? {}), asaas_customer_id: asaasCustomerId },
        })
        .eq('id', contrato.id);
    }

    // ── Criar boleto ─────────────────────────────────────────────────────────
    const result = await criarBoleto(
      parcela.id,
      Number(parcela.valor),
      parcela.data_vencimento,
      parcela.descricao,
      asaasCustomerId,
    );

    const boletoData = {
      provider:    'ASAAS',
      billingType: 'BOLETO',
      paymentId:   result.paymentId,
      status:      result.status,
      barCode:     result.barCode,
      bankSlipUrl: result.bankSlipUrl,
      invoiceUrl:  result.invoiceUrl,
      nossoNumero: result.nossoNumero,
      dueDate:     result.dueDate,
      geradoEm:    new Date().toISOString(),
    };

    await supabase
      .from('parcelas')
      .update({
        boleto_id:   result.paymentId,
        boleto_url:  result.bankSlipUrl,
        boleto_dados: boletoData,
      })
      .eq('id', id);

    return NextResponse.json({ reutilizado: false, ...boletoData });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
