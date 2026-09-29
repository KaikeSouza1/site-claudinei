import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne } from '@/lib/db';

type Params = { params: Promise<{ docId: string }> };

// GET — abre/baixa o documento (só com login do painel, via middleware)
export async function GET(_req: NextRequest, { params }: Params) {
  const { docId } = await params;

  const doc = await queryOne<{ nome: string; mime: string; conteudo: Buffer }>(
    'SELECT nome, mime, conteudo FROM imovel_documentos WHERE id = $1', [docId],
  ).catch(() => null);
  if (!doc) return NextResponse.json({ error: 'Documento não encontrado' }, { status: 404 });

  return new NextResponse(new Uint8Array(doc.conteudo), {
    headers: {
      'Content-Type': doc.mime,
      'Content-Disposition': `inline; filename*=UTF-8''${encodeURIComponent(doc.nome)}`,
      'Cache-Control': 'private, no-store',
      'X-Content-Type-Options': 'nosniff',
    },
  });
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const { docId } = await params;

  try {
    await query('DELETE FROM imovel_documentos WHERE id = $1', [docId]);
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
