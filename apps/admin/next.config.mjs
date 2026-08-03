/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@cereja/ui', '@cereja/shared-types'],
  // Proxy same-origin para a API (mesma abordagem da loja) — cookie first-party.
  async rewrites() {
    const target = process.env.API_PROXY_TARGET;
    if (!target) return [];
    const base = target.replace(/\/+$/, '');
    return [{ source: '/api/v1/:path*', destination: `${base}/api/v1/:path*` }];
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'no-referrer' },
          // Painel interno: nunca indexar (§6.8)
          { key: 'X-Robots-Tag', value: 'noindex, nofollow' },
        ],
      },
    ];
  },
};

export default nextConfig;
