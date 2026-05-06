// app/api/admin/imoveis/importar/route.ts
import { NextResponse } from 'next/server';
import * as cheerio from 'cheerio';

export async function POST(req: Request) {
  try {
    const { link } = await req.json();

    // Validação básica do link
    if (!link || !link.includes('http')) {
      return NextResponse.json({ error: 'Link inválido. Insira a URL completa.' }, { status: 400 });
    }

    // Acessa a página do imóvel
    const response = await fetch(link);
    const html = await response.text();
    const $ = cheerio.load(html);

    // ====================================================================
    // LÓGICA DE EXTRAÇÃO (RASPAGEM)
    // Atenção: Você pode precisar ajustar as classes (ex: '.preco') 
    // dependendo de como é o HTML real do site da Porto Iguaçu.
    // ====================================================================
    
    // Tenta pegar o título do h1 ou da tag title
    const titulo = $('h1').first().text().trim() || $('title').text().trim();
    
    // Pegando o preço e limpando para deixar só números (R$ 1.500.000,00 -> 1500000)
    // Tente achar a classe onde fica o preço no site deles
    const precoTexto = $('.preco, .price, h2').text().replace(/\D/g, ''); 
    const preco = precoTexto ? Number(precoTexto) / 100 : 0;

    const descricao = $('.descricao, .description, p').text().trim().substring(0, 1000); // Pega um trecho da descrição
    
    // Tenta pegar informações de localização
    const cidade = 'União da Vitória'; // Padrão, ajuste se conseguir pegar do HTML
    const bairro = $('.bairro, .neighborhood').first().text().trim();
    
    // Características básicas
    const quartos = parseInt($('.quartos, .beds').text()) || 0;
    const banheiros = parseInt($('.banheiros, .baths').text()) || 0;
    const vagas = parseInt($('.vagas, .garages').text()) || 0;
    const areaTexto = $('.area, .size').text().replace(/\D/g, '');
    const area = areaTexto ? parseInt(areaTexto) : 0;

    // Extraindo a imagem de capa (buscando a primeira imagem grande)
    let imagem_url = '';
    const imgElement = $('.galeria img, .carousel img, .main-image img').first();
    if (imgElement.length > 0) {
      imagem_url = imgElement.attr('src') || '';
    }

    // Retorna os dados formatados para o nosso Front-end preencher os campos!
    return NextResponse.json({
      titulo,
      preco,
      descricao,
      cidade,
      bairro,
      quartos,
      banheiros,
      vagas,
      area,
      imagem_url
    });

  } catch (error) {
    console.error("Erro ao raspar dados da Porto Iguaçu:", error);
    return NextResponse.json({ error: 'Falha ao processar o link. O site pode estar bloqueando a leitura.' }, { status: 500 });
  }
}