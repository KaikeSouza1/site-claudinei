// app/api/admin/imoveis/importar/route.ts
import { NextResponse } from 'next/server';
import * as cheerio from 'cheerio';

function normalizarUrl(url: string, baseUrl: string) {
  if (!url) return '';
  const trimmed = url.trim();
  if (/^data:/i.test(trimmed)) return '';
  try {
    return new URL(trimmed, baseUrl).toString();
  } catch {
    return trimmed;
  }
}

function extrairUrlsDeSrcset(srcset: string, baseUrl: string) {
  return srcset
    .split(',')
    .map(item => item.trim().split(' ')[0])
    .map(url => normalizarUrl(url, baseUrl))
    .filter(Boolean);
}

export async function POST(req: Request) {
  try {
    const { link } = await req.json();

    if (!link || !link.includes('http')) {
      return NextResponse.json({ error: 'Link inválido. Insira a URL completa.' }, { status: 400 });
    }

    const urlObj = new URL(link);
    const baseUrl = urlObj.origin;

    const partes = link.split('/');
    const ultimoTrecho = partes.pop() || partes.pop() || '';
    const match = ultimoTrecho.match(/\d+$/);
    const id = match ? match[0] : null;

    if (!id) {
      return NextResponse.json({ error: 'Não foi possível encontrar o ID do imóvel no link.' }, { status: 400 });
    }

    let codigo = '';
    let titulo = '';
    let descricao = '';
    let preco = 0;
    let tipo = 'Casa';
    let finalidade = 'Venda';
    let cidade = '';
    let bairro = '';
    let endereco = '';
    let latitude = '';
    let longitude = '';
    let quartos = 0;
    let banheiros = 0;
    let vagas = 0;
    let area = 0;
    let imagem_url = '';
    let galeria: string[] = [];

    try {
      const apiRes = await fetch(`${baseUrl}/api/imoveis/${id}`, {
        headers: { Accept: 'application/json' },
      });

      if (apiRes.ok) {
        const data = await apiRes.json();
        codigo = data.codigo || codigo;
        titulo = data.titulo || titulo;
        descricao = data.descricao || descricao;
        preco = data.preco ?? preco;
        tipo = data.tipo || tipo;
        finalidade = data.finalidade || finalidade;
        cidade = data.cidade || cidade;
        bairro = data.bairro || bairro;
        endereco = data.endereco || endereco;
        latitude = data.latitude ?? latitude;
        longitude = data.longitude ?? longitude;
        quartos = data.quartos ?? quartos;
        banheiros = data.banheiros ?? banheiros;
        vagas = data.vagas ?? vagas;
        area = data.area ?? area;
        imagem_url = normalizarUrl(data.imagem_url || '', baseUrl);

        if (Array.isArray(data.galeria)) {
          galeria = data.galeria
            .map((url: string) => normalizarUrl(url, baseUrl))
            .filter(Boolean);
        }
      }
    } catch (apiError) {
      console.warn('Falha ao buscar JSON da API remota, tentando HTML:', apiError);
    }

    const response = await fetch(link);
    if (!response.ok) {
      return NextResponse.json({ error: 'Falha ao carregar a página do imóvel.' }, { status: 500 });
    }

    const html = await response.text();
    const $ = cheerio.load(html);

    if (!titulo) {
      titulo = $('h1').first().text().trim() || $('title').text().trim();
    }

    if (!descricao) {
      descricao = $('.descricao, .description, .property-description, .details, .text-description')
        .text()
        .trim()
        .replace(/\s+/g, ' ')
        .substring(0, 1000);
    }

    if (!preco) {
      const precoTexto = $('.preco, .price, .valor, .item-price, h2').first().text().replace(/\D/g, '');
      preco = precoTexto ? Number(precoTexto) / 100 : 0;
    }

    if (!bairro) {
      bairro = $('.bairro, .neighborhood, .localizacao, .location').first().text().trim();
    }

    if (!cidade) {
      cidade = $('.cidade, .city, .location-city').first().text().trim();
    }

    if (!endereco) {
      endereco = $('.endereco, .address, .property-address').first().text().trim();
    }

    if (!tipo) {
      tipo = $('.tipo, .property-type, .type').first().text().trim() || tipo;
    }

    if (!finalidade) {
      finalidade = $('.finalidade, .purpose, .operation').first().text().trim() || finalidade;
    }

    const imagensEncontradas = new Set<string>();
    const adicionarUrl = (url?: string) => {
      const normalized = normalizarUrl(String(url || ''), baseUrl);
      if (normalized) imagensEncontradas.add(normalized);
    };

    const adicionarSrcset = (srcset?: string) => {
      if (!srcset) return;
      extrairUrlsDeSrcset(srcset, baseUrl).forEach(adicionarUrl);
    };

    const seletores = [
      '.galeria img',
      '.carousel img',
      '.main-image img',
      '.gallery img',
      '.thumb img',
      '.property-gallery img',
      '.fotos img',
      '.slider img',
      '.owl-item img',
      '.splide__slide img',
      '.glide__slide img'
    ].join(', ');

    $(seletores).each((_, element) => {
      const img = $(element);
      adicionarUrl(img.attr('src') || img.attr('data-src') || img.attr('data-lazy') || img.attr('data-original'));
      adicionarSrcset(img.attr('srcset') || img.attr('data-srcset'));
    });

    $('source').each((_, element) => {
      const source = $(element);
      adicionarUrl(source.attr('src'));
      adicionarSrcset(source.attr('srcset'));
    });

    $('[style]').each((_, element) => {
      const style = ($(element).attr('style') || '').match(/background-image\s*:\s*url\(['"]?([^'")]+)['"]?\)/i);
      if (style && style[1]) {
        adicionarUrl(style[1]);
      }
    });

    $('[data-bg], [data-background], [data-image], [data-srcset], [data-lazy-src], [data-lazy]').each((_, element) => {
      const el = $(element);
      adicionarUrl(el.attr('data-bg') || el.attr('data-background') || el.attr('data-image') || el.attr('data-lazy-src') || el.attr('data-lazy'));
      adicionarSrcset(el.attr('data-srcset'));
    });

    if (imagensEncontradas.size > 0) {
      if (!imagem_url) {
        imagem_url = Array.from(imagensEncontradas)[0];
      }
      galeria = Array.from(imagensEncontradas);
    }

    if (imagem_url && !galeria.includes(imagem_url)) {
      galeria.unshift(imagem_url);
    }

    galeria = Array.from(new Set(galeria));

    return NextResponse.json({
      codigo,
      titulo,
      descricao,
      preco,
      tipo,
      finalidade,
      cidade,
      bairro,
      endereco,
      latitude,
      longitude,
      quartos,
      banheiros,
      vagas,
      area,
      imagem_url,
      galeria,
    });
  } catch (error) {
    console.error('Erro na importação Mágica:', error);
    return NextResponse.json({ error: 'Erro interno ao processar o link.' }, { status: 500 });
  }
}
