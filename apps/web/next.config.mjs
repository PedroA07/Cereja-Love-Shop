/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@cereja/ui', '@cereja/shared-types'],
  // O proxy same-origin da API é feito por uma função em app/api/v1/[...path]
  // (lê API_PROXY_TARGET em runtime) — cookie first-party, sem CORS no browser.
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
