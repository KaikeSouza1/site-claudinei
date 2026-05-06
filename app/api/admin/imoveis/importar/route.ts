// app/api/admin/imoveis/importar/route.ts
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { link } = await req.json();

    if (!link || !link.includes('http')) {
      return NextResponse.json({ error: 'Link inválido. Insira a URL completa.' }, { status: 400 });
    }

    // 1. Extrai o ID do final do link
    // Ex: https://imobiliariaportoiguacu.com.br/imovel/casa-linda-123 -> Pega o "123"
    const partes = link.split('/');
    const ultimoTrecho = partes.pop() || partes.pop() || '';
    const match = ultimoTrecho.match(/\d+$/);
    const id = match ? match[0] : null;

    if (!id) {
      return NextResponse.json({ error: 'Não foi possível encontrar o ID do imóvel no link.' }, { status: 400 });
    }

    // 2. Descobre a raiz do site (ex: https://imobiliariaportoiguacu.com.br)
    const urlObj = new URL(link);
    const baseUrl = urlObj.origin;

    // 3. Bate DIRETO na API secreta deles pra pegar o JSON perfeito
    const apiRes = await fetch(`${baseUrl}/api/imoveis/${id}`);

    if (!apiRes.ok) {
      return NextResponse.json({ error: 'Falha ao buscar os dados na API da imobiliária.' }, { status: 500 });
    }

    const data = await apiRes.json();

    // 4. Devolve os dados 100% mastigados para o nosso formulário
    return NextResponse.json({
      codigo: data.codigo || '',
      titulo: data.titulo || '',
      descricao: data.descricao || '',
      preco: data.preco || 0,
      tipo: data.tipo || 'Casa',
      finalidade: data.finalidade || 'Venda',
      cidade: data.cidade || '',
      bairro: data.bairro || '',
      endereco: data.endereco || '',
      latitude: data.latitude || '',
      longitude: data.longitude || '',
      quartos: data.quartos || 0,
      banheiros: data.banheiros || 0,
      vagas: data.vagas || 0,
      area: data.area || 0,
      imagem_url: data.imagem_url || ''
    });

  } catch (error) {
    console.error("Erro na importação Mágica:", error);
    return NextResponse.json({ error: 'Erro interno ao processar o link.' }, { status: 500 });
  }
}