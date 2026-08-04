'use client';

import Link from 'next/link';
import { IconHeart } from '@cereja/ui';
import { useAuth } from '@/features/auth/auth-context';
import { useWishlist } from './wishlist-context';

/** Atalho para os favoritos no cabeçalho (só para quem está logado). */
export function WishlistNav() {
  const { user } = useAuth();
  const { items } = useWishlist();
  if (!user) return null;

  return (
    <Link
      href="/favoritos"
      aria-label={`Favoritos (${items.length})`}
      className="relative inline-flex h-9 w-9 items-center justify-center rounded-md text-ink hover:bg-creme"
    >
      <IconHeart size={20} filled={items.length > 0} />
      {items.length > 0 && (
        <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-cereja px-1 text-[11px] font-semibold text-offwhite">
          {items.length}
        </span>
      )}
    </Link>
  );
}
