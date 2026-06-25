import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get('url');
  if (!url) {
    return NextResponse.json({ error: 'URL ausente' }, { status: 400 });
  }

  try {
    const parsed = new URL(url);
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return NextResponse.json({ error: 'URL inválida' }, { status: 400 });
    }

    const response = await fetch(parsed.toString());
    if (!response.ok) {
      return NextResponse.json({ error: 'Falha ao buscar imagem' }, { status: response.status });
    }

    const contentType = response.headers.get('content-type') || 'application/octet-stream';
    return new Response(response.body, {
      headers: {
        'content-type': contentType,
      },
    });
  } catch (error) {
    console.error('proxy-image error', error);
    return NextResponse.json({ error: 'Erro ao carregar imagem' }, { status: 500 });
  }
}
