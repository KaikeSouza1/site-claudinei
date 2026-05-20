import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getOrCreateCustomer, criarBoleto } from '@/lib/asaas';

type Params = { params: Promise<{ id: string }> };

// POST — gera boletos Asaas para todas as parcelas pendentes do contrato
export async function POST(_req: NextRequest, { params }: Params) {
  const { id } = await params;

  const { data: contrato, error } = await supabase
    .from('contratos')
    .select(`
      id, cliente_nome, cliente_email, cliente_cpf, cliente_telefone, fintech_dados,
      parcelas(id, valor, data_vencimento, descricao, status, boleto_id, boleto_dados)
    `)
    .eq('id', id)
    .single();

  if (error || !contrato) {
    return NextResponse.json({ error: 'Contrato não encontrado' }, { status: 404 });
  }

  if (!contrato.cliente_cpf) {
    return NextResponse.json(
      { error: 'CPF do cliente é obrigatório. Edite o contrato e preencha o campo.' },
      { status: 422 },
    );
  }

  // Apenas parcelas pendentes/atrasadas sem boleto Asaas já gerado
  const parcelas = ((contrato.parcelas ?? []) as Array<{
    id: number; valor: number; data_vencimento: string;
    descricao: string; status: string;
    boleto_id: string | null; boleto_dados: Record<string, unknown> | null;
  }>).filter(p =>
    p.status !== 'pago' &&
    p.status !== 'cancelado' &&
    (p.boleto_dados as any)?.provider !== 'ASAAS',
  );

  if (parcelas.length === 0) {
    return NextResponse.json({
      gerados: 0,
      pulados: 0,
      message: 'Todas as parcelas pendentes já possuem boleto gerado.',
    });
  }

  try {
    // ── Garantir cliente no Asaas ────────────────────────────────────────────
    let asaasCustomerId = (contrato.fintech_dados as any)?.asaas_customer_id as string | undefined;

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
          fintech_dados: {
            ...(contrato.fintech_dados ?? {}),
            asaas_customer_id: asaasCustomerId,
          },
        })
        .eq('id', id);
    }

    // ── Gerar boleto para cada parcela ────────────────────────────────────────
    let gerados = 0;
    const erros: Array<{ parcelaId: number; error: string }> = [];

    for (const parcela of parcelas) {
      try {
        const result = await criarBoleto(
          parcela.id,
          Number(parcela.valor),
          parcela.data_vencimento,
          parcela.descricao,
          asaasCustomerId!,
        );

        await supabase
          .from('parcelas')
          .update({
            boleto_id:    result.paymentId,
            boleto_url:   result.bankSlipUrl,
            boleto_dados: {
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
            },
          })
          .eq('id', parcela.id);

        gerados++;
      } catch (err) {
        erros.push({ parcelaId: parcela.id, error: String(err) });
      }
    }

    return NextResponse.json({
      gerados,
      total:  parcelas.length,
      erros,
      message: `${gerados} boleto${gerados !== 1 ? 's' : ''} gerado${gerados !== 1 ? 's' : ''} com sucesso.`,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
