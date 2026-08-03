import type { CookieOptions, Response } from 'express';
import { randomBytes } from 'node:crypto';

/** Cookie do carrinho de convidado (§6.3). Aponta para a chave no Redis. */
export const CART_COOKIE = 'clv_cart';
const CART_MAX_AGE_MS = 1000 * 60 * 60 * 24 * 7; // 7 dias

function options(): CookieOptions {
  const isProd = process.env.NODE_ENV === 'production';
  const sameSite = (process.env.COOKIE_SAMESITE as 'lax' | 'strict' | 'none') ?? (isProd ? 'none' : 'lax');
  return {
    httpOnly: true,
    secure: sameSite === 'none' ? true : isProd,
    sameSite,
    path: '/',
  };
}

export function newCartToken(): string {
  return randomBytes(16).toString('hex');
}

export function setCartCookie(res: Response, token: string): void {
  res.cookie(CART_COOKIE, token, { ...options(), maxAge: CART_MAX_AGE_MS });
}

export function clearCartCookie(res: Response): void {
  res.clearCookie(CART_COOKIE, options());
}
