/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    // Ignora erros de TypeScript no Build
    ignoreBuildErrors: true,
  },
  eslint: {
    // Ignora erros de ESLint no Build
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;