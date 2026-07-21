import type { Response } from 'express';

/**
 * Cookie do refresh token (§6.1): httpOnly + Secure + SameSite=Strict.
 * Fora do alcance de JS no browser; mitiga CSRF por SameSite.
 */
export const REFRESH_COOKIE = 'clv_refresh';

const REFRESH_MAX_AGE_MS = 1000 * 60 * 60 * 24 * 14; // 14 dias

export function setRefreshCookie(res: Response, token: string): void {
  res.cookie(REFRESH_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
    maxAge: REFRESH_MAX_AGE_MS,
  });
}

export function clearRefreshCookie(res: Response): void {
  res.clearCookie(REFRESH_COOKIE, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
  });
}
