// Asaas API — service layer
// Docs: https://docs.asaas.com

const ENV = process.env.ASAAS_ENV === 'production' ? 'production' : 'sandbox';

const BASE_URL =
  ENV === 'production'
    ? 'https://api.asaas.com/v3'
    : 'https://api-sandbox.asaas.com/v3';

function reqHeaders(): Record<string, string> {
  return {
    access_token: process.env.ASAAS_API_KEY ?? '',
    'Content-Type': 'application/json',
  };
}

// ─── Tipos públicos ───────────────────────────────────────────────────────────

export interface AsaasBoletoResult {
  paymentId: string;
  status: string;
  barCode: string;
  bankSlipUrl: string;
  invoiceUrl: string;
  nossoNumero: string;
  dueDate: string;
}

export interface AsaasPixResult {
  paymentId: string;
  status: string;
  qrCode: string;           // payload texto (copia e cola)
  qrCodeBase64: string;     // imagem PNG em base64
  expirationDate: string;
  invoiceUrl: string;
}

// ─── Cliente ──────────────────────────────────────────────────────────────────

export async function getOrCreateCustomer(
  nome: string,
  cpf: string,
  email?: string | null,
  telefone?: string | null,
): Promise<string> {
  const cpfLimpo = cpf.replace(/\D/g, '');
  if (!cpfLimpo) throw new Error('CPF inválido para criar cliente Asaas');

  // Tenta encontrar cliente já existente pelo CPF
  const searchRes = await fetch(`${BASE_URL}/customers?cpfCnpj=${cpfLimpo}&limit=1`, {
    headers: reqHeaders(),
  });

  if (searchRes.ok) {
    const searchData = await searchRes.json();
    if ((searchData.data ?? []).length > 0) {
      return searchData.data[0].id as string;
    }
  }

  // Cria novo cliente
  const createRes = await fetch(`${BASE_URL}/customers`, {
    method: 'POST',
    headers: reqHeaders(),
    body: JSON.stringify({
      name:        nome,
      cpfCnpj:    cpfLimpo,
      email:       email      ?? undefined,
      mobilePhone: telefone ? telefone.replace(/\D/g, '') : undefined,
    }),
  });

  if (!createRes.ok) {
    const err = await createRes.text();
    throw new Error(`Asaas create customer (${createRes.status}): ${err}`);
  }

  const customer = await createRes.json();
  return customer.id as string;
}

// ─── Boleto ───────────────────────────────────────────────────────────────────

export async function criarBoleto(
  parcelaId: number,
  valor: number,
  dueDate: string,          // YYYY-MM-DD
  descricao: string,
  customerId: string,
): Promise<AsaasBoletoResult> {
  const res = await fetch(`${BASE_URL}/payments`, {
    method: 'POST',
    headers: reqHeaders(),
    body: JSON.stringify({
      customer:          customerId,
      billingType:       'BOLETO',
      value:             valor,
      dueDate,
      description:       descricao.slice(0, 500),
      externalReference: `parcela_${parcelaId}`,
      fine:     { value: 2 },     // 2 % de multa após vencimento
      interest: { value: 1 },     // 1 % ao mês de juros
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Asaas criar boleto (${res.status}): ${err}`);
  }

  const data = await res.json();
  return {
    paymentId:   data.id          ?? '',
    status:      data.status      ?? 'PENDING',
    barCode:     data.barCode     ?? '',
    bankSlipUrl: data.bankSlipUrl ?? '',
    invoiceUrl:  data.invoiceUrl  ?? '',
    nossoNumero: data.nossoNumero ?? '',
    dueDate:     data.dueDate     ?? dueDate,
  };
}

// ─── PIX via Asaas ────────────────────────────────────────────────────────────

export async function criarPixAsaas(
  parcelaId: number,
  valor: number,
  dueDate: string,
  descricao: string,
  customerId: string,
): Promise<AsaasPixResult> {
  // 1. Cria a cobrança PIX
  const res = await fetch(`${BASE_URL}/payments`, {
    method: 'POST',
    headers: reqHeaders(),
    body: JSON.stringify({
      customer:          customerId,
      billingType:       'PIX',
      value:             valor,
      dueDate,
      description:       descricao.slice(0, 500),
      externalReference: `parcela_${parcelaId}`,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Asaas criar PIX (${res.status}): ${err}`);
  }

  const data = await res.json();

  // 2. Busca o QR code dinâmico
  const qrRes = await fetch(`${BASE_URL}/payments/${data.id}/pixQrCode`, {
    headers: reqHeaders(),
  });

  let qrCode = '';
  let qrCodeBase64 = '';
  let expirationDate = dueDate;

  if (qrRes.ok) {
    const qr = await qrRes.json();
    qrCode         = qr.payload     ?? '';
    qrCodeBase64   = (qr.encodedImage ?? '').replace(/^data:image\/png;base64,/, '');
    expirationDate = qr.expirationDate ?? dueDate;
  }

  return {
    paymentId:      data.id         ?? '',
    status:         data.status     ?? 'PENDING',
    qrCode,
    qrCodeBase64,
    expirationDate,
    invoiceUrl:     data.invoiceUrl ?? '',
  };
}
