// app/layout.tsx
import type { Metadata } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import "./globals.css";
// Importamos os componentes condicionais ao invés dos originais
import { ConditionalHeader, ConditionalFooter } from "@/components/ConditionalLayout";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const playfair = Playfair_Display({ subsets: ["latin"], variable: "--font-playfair" });

export const metadata: Metadata = {
  title: "Claudiney W. Otto Junior | Corretor e Avaliador de Imóveis",
  description: "O imóvel dos seus sonhos existe. Corretor e Avaliador certificado.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className="scroll-smooth">
      <body className={`${inter.variable} ${playfair.variable} font-sans bg-[#020b18] text-slate-100 min-h-screen flex flex-col`}>
        
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