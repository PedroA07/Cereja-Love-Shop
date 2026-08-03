import { Logger } from '@nestjs/common';
import type { CorsOptions } from '@nestjs/common/interfaces/external/cors-options.interface';

const logger = new Logger('CORS');

function hostname(url: string): string | null {
  try {
    return new URL(url).hostname;
  } catch {
    return null;
  }
}

/**
 * CORS restrito às origens conhecidas (loja e admin) com tolerância prática:
 * - ignora barra final;
 * - aceita lista extra em CORS_ORIGINS (separada por vírgula);
 * - aceita URLs de preview da Vercel do mesmo projeto (ex.:
 *   projeto-git-branch.vercel.app), já que a produção fica em *.vercel.app.
 */
export function buildCorsOptions(): CorsOptions {
  const normalize = (o: string): string => o.trim().replace(/\/+$/, '');

  const configured = [
    process.env.WEB_URL ?? 'http://localhost:3000',
    process.env.ADMIN_URL ?? 'http://localhost:3001',
    ...(process.env.CORS_ORIGINS?.split(',') ?? []),
  ]
    .map(normalize)
    .filter(Boolean);

  const allowlist = new Set([normalize('http://localhost:3000'), normalize('http://localhost:3001'), ...configured]);

  // Prefixos dos projetos Vercel configurados (primeiro rótulo do host),
  // para liberar os deploys de preview do mesmo projeto.
  const vercelPrefixes = configured
    .map(hostname)
    .filter((h): h is string => h !== null && h.endsWith('.vercel.app'))
    .map((h) => (h.split('.')[0] ?? '').replace(/-git-.*$/, '').replace(/-[a-z0-9]{6,}$/, ''))
    .filter(Boolean);

  return {
    credentials: true,
    origin(origin, callback) {
      // Requisições sem Origin (curl, health checks, server-to-server)
      if (!origin) return callback(null, true);
      const normalized = normalize(origin);
      if (allowlist.has(normalized)) return callback(null, true);

      const host = hostname(normalized);
      if (host?.endsWith('.vercel.app') && vercelPrefixes.some((p) => p && host.startsWith(p))) {
        return callback(null, true);
      }

      logger.warn(`Origin bloqueada por CORS: ${origin}`);
      return callback(null, false);
    },
  };
}
