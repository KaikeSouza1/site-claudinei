import { NextRequest, NextResponse } from 'next/server';
import { queryOne } from '@/lib/db';

type Params = { params: Promise<{ id: string }> };

// A Vercel recusa requisições acima de ~4,5 MB, então o limite fica um pouco abaixo.
const TAMANHO_MAXIMO = 4 * 1024 * 1024;
const TIPOS_ACEITOS = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'];

// POST (multipart: file, categoria) — anexa um documento interno ao imóvel
export async function POST(request: NextRequest, { params }: Params) {
  const { id } = await params;

  const form = await request.formData().catch(() => null);
  const file = form?.get('file');
  const categoria = String(form?.get('categoria') || 'outro').slice(0, 30);

  if (!(file instanceof File)) {
    return NextResponse.json({ error: 'Nenhum arquivo enviado' }, { status: 400 });
  }
  if (!TIPOS_ACEITOS.includes(file.type)) {
    return NextResponse.json({ error: 'Envie PDF, JPG, PNG ou WEBP' }, { status: 400 });
  }
  if (file.size > TAMANHO_MAXIMO) {
    return NextResponse.json({ error: 'Arquivo acima de 4 MB' }, { status: 413 });
  }

  try {
    const conteudo = Buffer.from(await file.arrayBuffer());
    const doc = await queryOne(
      `INSERT INTO imovel_documentos (imovel_id, nome, categoria, mime, tamanho, conteudo)
       SELECT id, $2, $3, $4, $5, $6 FROM imoveis WHERE id = $1
       RETURNING id, nome, categoria, mime, tamanho, criado_em`,
      [id, file.name.slice(0, 200), categoria, file.type, file.size, conteudo],
    );
    if (!doc) return NextResponse.json({ error: 'Imóvel não encontrado' }, { status: 404 });
    return NextResponse.json(doc, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
