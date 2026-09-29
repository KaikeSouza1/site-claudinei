import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne } from '@/lib/db';
import { getOrCreateCustomer, criarBoleto } from '@/lib/asaas';

type Params = { params: Promise<{ id: string }> };

// POST — gera ou retorna boleto Asaas para a parcela
export async function POST(_req: NextRequest, { params }: Params) {
  const { id } = await params;

  const parcela = await queryOne(
    `SELECT p.id, p.valor, p.status, p.data_vencimento, p.descricao, p.boleto_id, p.boleto_dados,
            json_build_object('id', c.id, 'cliente_nome', c.cliente_nome, 'cliente_email', c.cliente_email,
                              'cliente_cpf', c.cliente_cpf, 'cliente_telefone', c.cliente_telefone,
                              'fintech_dados', c.fintech_dados) AS contratos
     FROM parcelas p LEFT JOIN contratos c ON c.id = p.contrato_id
     WHERE p.id = $1`,
    [id],
  ).catch(() => null);

  if (!parcela) {
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

      await query('UPDATE contratos SET fintech_dados = $2 WHERE id = $1', [
        contrato.id,
        { ...(contrato.fintech_dados ?? {}), asaas_customer_id: asaasCustomerId },
      ]);
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

    await query('UPDATE parcelas SET boleto_id = $2, boleto_url = $3, boleto_dados = $4 WHERE id = $1', [
      id, result.paymentId, result.bankSlipUrl, boletoData,
    ]);

    return NextResponse.json({ reutilizado: false, ...boletoData });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
