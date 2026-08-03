'use client';

import Link from 'next/link';
import { IconBag } from '@cereja/ui';
import { useCart } from './cart-context';

/** Ícone de carrinho com contador, no cabeçalho. */
export function CartNav() {
  const { count } = useCart();
  return (
    <Link
      href="/carrinho"
      aria-label={`Carrinho com ${count} ${count === 1 ? 'item' : 'itens'}`}
      className="relative inline-flex h-9 w-9 items-center justify-center rounded-md text-ink hover:bg-creme"
    >
      <IconBag size={22} />
      {count > 0 && (
        <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-cereja px-1 text-[11px] font-semibold text-offwhite">
          {count}
        </span>
      )}
    </Link>
  );
}
