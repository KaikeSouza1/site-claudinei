import { NextRequest, NextResponse } from 'next/server';
import { geocodificar } from '@/lib/geocode';

// POST { endereco, numero, bairro, cidade, estado, cep } → { lat, lng, precisao }
export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  const r = await geocodificar(body);
  if (!r) return NextResponse.json({ error: 'Endereço não encontrado no mapa' }, { status: 404 });
  return NextResponse.json(r);
}
