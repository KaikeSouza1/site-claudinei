import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne } from '@/lib/db';
import { getOrCreateCustomer, criarBoleto } from '@/lib/asaas';

type Params = { params: Promise<{ id: string }> };

// POST — gera boletos Asaas para todas as parcelas pendentes do contrato
export async function POST(_req: NextRequest, { params }: Params) {
  const { id } = await params;

  const contrato = await queryOne(
    `SELECT c.id, c.cliente_nome, c.cliente_email, c.cliente_cpf, c.cliente_telefone, c.fintech_dados,
            COALESCE((
              SELECT json_agg(json_build_object('id', p.id, 'valor', p.valor, 'data_vencimento', p.data_vencimento,
                                                'descricao', p.descricao, 'status', p.status,
                                                'boleto_id', p.boleto_id, 'boleto_dados', p.boleto_dados))
              FROM parcelas p WHERE p.contrato_id = c.id
            ), '[]'::json) AS parcelas
     FROM contratos c WHERE c.id = $1`,
    [id],
  ).catch(() => null);

  if (!contrato) {
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

      await query('UPDATE contratos SET fintech_dados = $2 WHERE id = $1', [
        id,
        { ...(contrato.fintech_dados ?? {}), asaas_customer_id: asaasCustomerId },
      ]);
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

        await query('UPDATE parcelas SET boleto_id = $2, boleto_url = $3, boleto_dados = $4 WHERE id = $1', [
          parcela.id,
          result.paymentId,
          result.bankSlipUrl,
          {
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
        ]);

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
