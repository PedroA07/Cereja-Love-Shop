'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { apiFetch } from '@/lib/api';
import { useAuth } from '@/features/auth/auth-context';

export interface CartLine {
  variantId: string;
  productId: string;
  productSlug: string;
  name: string;
  options: Record<string, unknown>;
  unitPriceCents: number;
  quantity: number;
  available: number;
  inStock: boolean;
  lineCents: number;
}

export interface CartView {
  items: CartLine[];
  subtotalCents: number;
  count: number;
}

interface CartContextValue extends CartView {
  loading: boolean;
  add: (variantId: string, quantity: number) => Promise<void>;
  setQuantity: (variantId: string, quantity: number) => Promise<void>;
  remove: (variantId: string) => Promise<void>;
  refresh: () => Promise<void>;
}

const EMPTY: CartView = { items: [], subtotalCents: 0, count: 0 };
const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const { getAccessToken, user, loading: authLoading } = useAuth();
  const [cart, setCart] = useState<CartView>(EMPTY);
  const [loading, setLoading] = useState(true);

  const call = useCallback(
    <T,>(path: string, method = 'GET', body?: unknown) =>
      apiFetch<T>(path, { method, body, accessToken: getAccessToken() ?? undefined }),
    [getAccessToken],
  );

  const refresh = useCallback(async () => {
    try {
      setCart(await call<CartView>('/cart'));
    } catch {
      setCart(EMPTY);
    } finally {
      setLoading(false);
    }
  }, [call]);

  // Recarrega quando a sessão muda (login/logout) — pega o carrinho certo.
  useEffect(() => {
    if (!authLoading) void refresh();
  }, [authLoading, user?.id, refresh]);

  const add = useCallback(
    async (variantId: string, quantity: number) => {
      setCart(await call<CartView>('/cart/items', 'POST', { variantId, quantity }));
    },
    [call],
  );

  const setQuantity = useCallback(
    async (variantId: string, quantity: number) => {
      setCart(await call<CartView>(`/cart/items/${variantId}`, 'PATCH', { quantity }));
    },
    [call],
  );

  const remove = useCallback(
    async (variantId: string) => {
      setCart(await call<CartView>(`/cart/items/${variantId}`, 'DELETE'));
    },
    [call],
  );

  const value = useMemo<CartContextValue>(
    () => ({ ...cart, loading, add, setQuantity, remove, refresh }),
    [cart, loading, add, setQuantity, remove, refresh],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart deve ser usado dentro de CartProvider');
  return ctx;
}
