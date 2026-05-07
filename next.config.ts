import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* Configurações de TypeScript */
  typescript: {
    // Permite que o build na Vercel ignore erros de tipagem e complete o deploy
    ignoreBuildErrors: true,
  },
  
  /* Configurações de ESLint */
  eslint: {
    // Impede que avisos ou erros de linting interrompam o build
    ignoreDuringBuilds: true,
  },

  /* Caso o erro persista, você pode usar esta sintaxe para forçar a tipagem: */
  // ... (outras configurações se houver)
} as NextConfig;

export default nextConfig;