// app/layout.tsx
import type { Metadata } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import "./globals.css";
// Importamos os componentes condicionais ao invés dos originais
import { ConditionalHeader, ConditionalFooter } from "@/components/ConditionalLayout";
import { SITE_NOME, SITE_URL, jsonLdCorretor, jsonLdScript } from "@/lib/site";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const playfair = Playfair_Display({ subsets: ["latin"], variable: "--font-playfair" });

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: SITE_NOME,
  description: "Corretor e avaliador de imóveis em União da Vitória/PR e Porto União/SC. Casas, apartamentos, terrenos, áreas rurais e laudos de avaliação. CRECI 37016-PR · CNAI 45505.",
  openGraph: {
    type: "website",
    url: SITE_URL,
    siteName: "Claudiney W. Otto Junior Imóveis",
    title: SITE_NOME,
    description: "Corretor e avaliador de imóveis em União da Vitória/PR e Porto União/SC.",
    locale: "pt_BR",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className="scroll-smooth">
      <body className={`${inter.variable} ${playfair.variable} font-sans bg-[#020b18] text-slate-100 min-h-screen flex flex-col`}>
        {/* Dados estruturados: o Google reconhece o corretor como negócio local */}
        <script type="application/ld+json" dangerouslySetInnerHTML={jsonLdScript(jsonLdCorretor())} />
        
        {/* Renderiza apenas nas rotas públicas */}
        <ConditionalHeader />
        
        {/* CONTEÚDO DA PÁGINA (Login, Admin ou Home) */}
        <div className="flex-1 flex flex-col">
          {children}
        </div>

        {/* Renderiza apenas nas rotas públicas */}
        <ConditionalFooter />
        
      </body>
    </html>
  );
}