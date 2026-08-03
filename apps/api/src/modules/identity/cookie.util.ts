import type { CookieOptions, Response } from 'express';

/**
 * Cookie do refresh token (§6.1): httpOnly, Secure e SameSite.
 * Fora do alcance de JS no browser.
 *
 * SameSite depende do deploy:
 *  - Loja e API em domínios diferentes (ex.: *.vercel.app + *.onrender.com) →
 *    é cross-site, então o cookie só trafega com `SameSite=None; Secure`.
 *  - Mesmo domínio/subdomínio (ex.: loja.com + api.loja.com) → pode-se usar
 *    `Lax`/`Strict` (mais restritivo). Configurável via COOKIE_SAMESITE.
 */
export const REFRESH_COOKIE = 'clv_refresh';

const REFRESH_MAX_AGE_MS = 1000 * 60 * 60 * 24 * 14; // 14 dias

function baseCookieOptions(): CookieOptions {
  const isProd = process.env.NODE_ENV === 'production';
  const configured = process.env.COOKIE_SAMESITE as 'lax' | 'strict' | 'none' | undefined;
  // Em produção o padrão é cross-site (fronts na Vercel, API no Render) → None.
  const sameSite = configured ?? (isProd ? 'none' : 'lax');
  // SameSite=None exige Secure. Em produção também é sempre HTTPS.
  const secure = sameSite === 'none' ? true : isProd;
  return { httpOnly: true, secure, sameSite, path: '/' };
}

export function setRefreshCookie(res: Response, token: string): void {
  res.cookie(REFRESH_COOKIE, token, { ...baseCookieOptions(), maxAge: REFRESH_MAX_AGE_MS });
}

export function clearRefreshCookie(res: Response): void {
  res.clearCookie(REFRESH_COOKIE, baseCookieOptions());
}
