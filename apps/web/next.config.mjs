/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@cereja/ui', '@cereja/shared-types'],
  // Proxy same-origin para a API (§8/§9): a loja chama /api/v1/* no próprio
  // domínio e a Vercel repassa para a API. Assim o cookie de sessão é
  // first-party (funciona mesmo com API e loja em domínios distintos, ex.:
  // vercel.app + onrender.com) e não há CORS. Defina API_PROXY_TARGET na Vercel.
  async rewrites() {
    const target =
      process.env.API_PROXY_TARGET ??
      (process.env.NODE_ENV !== 'production' ? 'http://localhost:3333' : undefined);
    if (!target) return [];
    const base = target.replace(/\/+$/, '');
    return [{ source: '/api/v1/:path*', destination: `${base}/api/v1/:path*` }];
  },
  // Headers de segurança (§8) também no front
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'no-referrer' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
        ],
      },
    ];
  },
};

export default nextConfig;
