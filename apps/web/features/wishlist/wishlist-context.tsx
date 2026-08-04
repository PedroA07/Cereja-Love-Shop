'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { apiFetch } from '@/lib/api';
import { useAuth } from '@/features/auth/auth-context';

export interface WishlistItem {
  productId: string;
  name: string;
  slug: string;
  brand: string | null;
  isSensitiveMedia: boolean;
  fromPriceCents: number;
  mediaCount: number;
  inStock: boolean;
}

interface WishlistValue {
  items: WishlistItem[];
  loading: boolean;
  has: (productId: string) => boolean;
  toggle: (productId: string) => Promise<void>;
}

const WishlistContext = createContext<WishlistValue | null>(null);

export function WishlistProvider({ children }: { children: React.ReactNode }) {
  const { user, loading: authLoading, getAccessToken } = useAuth();
  const [items, setItems] = useState<WishlistItem[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!user) {
      setItems([]);
      setLoading(false);
      return;
    }
    try {
      setItems(
        await apiFetch<WishlistItem[]>('/engagement/wishlist', {
          accessToken: getAccessToken() ?? undefined,
        }),
      );
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [user, getAccessToken]);

  useEffect(() => {
    if (!authLoading) void load();
  }, [authLoading, load]);

  const has = useCallback(
    (productId: string) => items.some((i) => i.productId === productId),
    [items],
  );

  const toggle = useCallback(
    async (productId: string) => {
      if (!user) return;
      const token = getAccessToken() ?? undefined;
      const next = has(productId)
        ? await apiFetch<WishlistItem[]>(`/engagement/wishlist/${productId}`, {
            method: 'DELETE',
            accessToken: token,
          })
        : await apiFetch<WishlistItem[]>('/engagement/wishlist', {
            method: 'POST',
            body: { productId },
            accessToken: token,
          });
      setItems(next);
    },
    [user, has, getAccessToken],
  );

  const value = useMemo<WishlistValue>(
    () => ({ items, loading, has, toggle }),
    [items, loading, has, toggle],
  );

  return <WishlistContext.Provider value={value}>{children}</WishlistContext.Provider>;
}

export function useWishlist(): WishlistValue {
  const ctx = useContext(WishlistContext);
  if (!ctx) throw new Error('useWishlist deve ser usado dentro de WishlistProvider');
  return ctx;
}
