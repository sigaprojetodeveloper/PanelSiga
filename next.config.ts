import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Injeta as variáveis de ambiente SIGA_ no lado do cliente (navegador)
  env: {
    SIGA_SUPABASE_URL: process.env.SIGA_SUPABASE_URL,
    SIGA_SUPABASE_ANON_KEY: process.env.SIGA_SUPABASE_ANON_KEY,
    SIGA_STORAGE_ENV: process.env.SIGA_STORAGE_ENV,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.supabase.co',
      },
      {
        protocol: 'https',
        hostname: '**.cloudflare.com',
      },
    ],
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
        ],
      },
    ];
  },
};

export default nextConfig;
