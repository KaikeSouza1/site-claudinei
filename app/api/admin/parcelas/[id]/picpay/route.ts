import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { gerarCobrancaPix, consultarCobranca } from '@/lib/picpay';

type Params = { params: Promise<{ id: string }> };

// POST — gera ou re-usa uma cobrança PIX PicPay para a parcela
export async function POST(_req: NextRequest, { params }: Params) {
  const { id } = await params;

  // Busca parcela + dados do contrato (cliente)
  const { data: parcela, error: pErr } = await supabase
    .from('parcelas')
    .select('id, valor, status, boleto_id, boleto_url, boleto_dados, contratos(cliente_nome, cliente_email, cliente_cpf, cliente_telefone)')
    .eq('id', id)
    .single();

  if (pErr || !parcela) {
    return NextResponse.json({ error: 'Parcela não encontrada' }, { status: 404 });
  }
  if (parcela.status === 'pago') {
    return NextResponse.json({ error: 'Parcela já está paga' }, { status: 400 });
  }
  if (parcela.status === 'cancelado') {
    return NextResponse.json({ error: 'Parcela cancelada' }, { status: 400 });
  }

  const contrato = parcela.contratos as {
    cliente_nome: string;
    cliente_email: string | null;
    cliente_cpf: string | null;
    cliente_telefone: string | null;
  } | null;

  if (!contrato?.cliente_email) {
    return NextResponse.json(
      { error: 'E-mail do cliente é obrigatório para gerar cobrança PicPay. Edite o contrato e preencha o campo.' },
      { status: 422 },
    );
  }
  if (!contrato?.cliente_cpf) {
    return NextResponse.json(
      { error: 'CPF do cliente é obrigatório para gerar cobrança PicPay. Edite o contrato e preencha o campo.' },
      { status: 422 },
    );
  }

  // Se já existe uma cobrança ativa, retorna sem criar nova
  if (parcela.boleto_id && parcela.boleto_dados) {
    return NextResponse.json({
      reutilizado: true,
      merchantChargeId: parcela.boleto_id,
      qrCode: (parcela.boleto_dados as any).qrCode ?? parcela.boleto_url ?? '',
      qrCodeBase64: (parcela.boleto_dados as any).qrCodeBase64 ?? '',
      chargeStatus: (parcela.boleto_dados as any).chargeStatus ?? 'PENDING',
    });
  }

  try {
    const result = await gerarCobrancaPix(parcela.id, Number(parcela.valor), {
      nome: contrato.cliente_nome,
      email: contrato.cliente_email,
      cpf: contrato.cliente_cpf,
      telefone: contrato.cliente_telefone,
    });

    // Persiste na parcela para não gerar duplicatas
    await supabase
      .from('parcelas')
      .update({
        boleto_id: result.merchantChargeId,
        boleto_url: result.qrCode,
        boleto_dados: {
          qrCode: result.qrCode,
          qrCodeBase64: result.qrCodeBase64,
          chargeId: result.chargeId,
          chargeStatus: result.chargeStatus,
          geradoEm: new Date().toISOString(),
        },
      })
      .eq('id', id);

    return NextResponse.json({
      reutilizado: false,
      merchantChargeId: result.merchantChargeId,
      qrCode: result.qrCode,
      qrCodeBase64: result.qrCodeBase64,
      chargeStatus: result.chargeStatus,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

// GET — consulta status atual de uma cobrança PicPay
export async function GET(_req: NextRequest, { params }: Params) {
  const { id } = await params;

  const { data: parcela } = await supabase
    .from('parcelas')
    .select('id, boleto_id, status')
    .eq('id', id)
    .single();

  if (!parcela?.boleto_id) {
    return NextResponse.json({ error: 'Nenhuma cobrança PicPay ativa nesta parcela' }, { status: 404 });
  }

  try {
    const result = await consultarCobranca(parcela.boleto_id);
    return NextResponse.json({ chargeStatus: result.status, parcelaStatus: parcela.status });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
