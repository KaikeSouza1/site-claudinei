import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { NextResponse } from "next/server";
import sharp from "sharp";
import path from "path";
import fs from "fs";

const R2 = new S3Client({
  region: "auto",
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});

function gerarNomeArquivo(): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  return `imovel-${timestamp}-${random}.webp`;
}

async function otimizarComMarcaDagua(buffer: Buffer): Promise<Buffer> {
  const logoPath = path.join(process.cwd(), "public", "logo_nova.png");
  const imagem = sharp(buffer);
  
  // Verifica se a logo existe na pasta public. Se não existir, apenas otimiza.
  if (fs.existsSync(logoPath)) {
    const logoBuffer = fs.readFileSync(logoPath);
    const { width = 1280, height = 960 } = await imagem.metadata();

    // Redimensiona o logo para 25% da largura
    const logoWidth = Math.round(width * 0.25);
    const logoResized = await sharp(logoBuffer)
      .resize(logoWidth)
      .ensureAlpha()
      .toBuffer();

    // Aplica opacidade
    const { data, info } = await sharp(logoResized)
      .ensureAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });

    const opacidade = 0.15;
    for (let i = 3; i < data.length; i += 4) {
      data[i] = Math.round(data[i] * opacidade);
    }

    const logoComOpacidade = await sharp(data, {
      raw: { width: info.width, height: info.height, channels: 4 },
    })
      .png()
      .toBuffer();

    const { width: lw = 0, height: lh = 0 } = await sharp(logoComOpacidade).metadata();

    // Centraliza
    const left = Math.round((width - lw) / 2);
    const top = Math.round((height - lh) / 2);

    return imagem
      .resize({ width: 1280, height: 960, fit: "inside", withoutEnlargement: true })
      .composite([{ input: logoComOpacidade, left, top, blend: "over" }])
      .webp({ quality: 82, effort: 4 })
      .toBuffer();
  }

  // Se NÃO achar a logo, apenas redimensiona e converte pra WebP
  return imagem
    .resize({ width: 1280, height: 960, fit: "inside", withoutEnlargement: true })
    .webp({ quality: 82, effort: 4 })
    .toBuffer();
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const files = formData.getAll("file") as File[];

    if (!files || files.length === 0) {
      return NextResponse.json({ error: "Nenhum arquivo enviado" }, { status: 400 });
    }

    // Validação extra pra não quebrar no AWS SDK
    if (!process.env.R2_BUCKET_NAME) {
      return NextResponse.json({ error: "Faltando R2_BUCKET_NAME no .env" }, { status: 500 });
    }

    const urls: string[] = [];

    for (const file of files) {
      const arrayBuffer = await file.arrayBuffer();
      const bufferOriginal = Buffer.from(arrayBuffer);

      // Passa pela nossa função (com ou sem marca d'água)
      const bufferFinal = await otimizarComMarcaDagua(bufferOriginal);
      const fileName = gerarNomeArquivo();

      await R2.send(
        new PutObjectCommand({
          Bucket: process.env.R2_BUCKET_NAME,
          Key: fileName,
          Body: bufferFinal,
          ContentType: "image/webp",
        })
      );

      urls.push(`${process.env.NEXT_PUBLIC_R2_URL}/${fileName}`);
    }

    return NextResponse.json({ urls });
  } catch (error) {
    console.error("Erro no upload R2:", error);
    return NextResponse.json({ error: "Erro ao processar upload" }, { status: 500 });
  }
}