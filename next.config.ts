import type { NextConfig } from 'next';

// Domínios permitidos para imagens externas
const IMAGE_HOSTS = [
  'pub-574d165956bd4fa68acb1286fcafdd02.r2.dev',
  'cpmvjvpaexspfwrxhjke.supabase.co',
];

// Content-Security-Policy
// unsafe-inline é necessário para:
//   - style: JSX inline styles (style={{...}}) em todo o app
//   - script: Next.js App Router hydration chunks
// frame-ancestors 'none' substitui X-Frame-Options ao nível de política
const CSP = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
  "style-src 'self' 'unsafe-inline'",
  `img-src 'self' data: blob: ${IMAGE_HOSTS.map(h => `https://${h}`).join(' ')} https:`,
  "font-src 'self' data:",
  [
    "connect-src 'self'",
    'https://*.supabase.co',
    'wss://*.supabase.co',
    'https://api.asaas.com',
    'https://api-sandbox.asaas.com',
  ].join(' '),
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  "upgrade-insecure-requests",
].join('; ');

const securityHeaders = [
  // Impede clickjacking (redundante com CSP frame-ancestors, mas reforça compat.)
  { key: 'X-Frame-Options',        value: 'DENY' },
  // Impede MIME-type sniffing
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  // Força HTTPS por 1 ano em produção (incluindo subdomínios)
  { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains; preload' },
  // Limita informações do Referrer em cross-origin
  { key: 'Referrer-Policy',        value: 'strict-origin-when-cross-origin' },
  // Restringe acesso a APIs de hardware sensíveis
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()',
  },
  // XSS filter legado (browsers antigos)
  { key: 'X-XSS-Protection',       value: '1; mode=block' },
  // DNS prefetch para evitar vazamento de URLs internas
  { key: 'X-DNS-Prefetch-Control', value: 'off' },
  // Política de conteúdo
  { key: 'Content-Security-Policy', value: CSP },
];

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },

  // Headers de segurança aplicados a todas as rotas
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: securityHeaders,
      },
    ];
  },

  // Permite imagens de hosts externos já usados no projeto
  images: {
    remotePatterns: IMAGE_HOSTS.map(hostname => ({
      protocol: 'https',
      hostname,
    })),
  },
};

export default nextConfig;
