'use client';

import Link from 'next/link';
import { formatBRL } from '@cereja/shared-types';
import { Button, CherryMark, IconHeart } from '@cereja/ui';
import { useAuth } from '@/features/auth/auth-context';
import { useWishlist } from '@/features/wishlist/wishlist-context';

export function FavoritesList() {
  const { user, loading: authLoading } = useAuth();
  const { items, loading, toggle } = useWishlist();

  if (authLoading || loading) {
    return <p className="py-16 text-center text-ink/50">Carregando…</p>;
  }

  if (!user) {
    return (
      <div className="flex flex-col items-center gap-4 py-20 text-center">
        <IconHeart size={40} className="text-cereja/70" />
        <p className="text-ink/70">Entre na sua conta para ver os itens salvos.</p>
        <Link href="/entrar">
          <Button>Entrar</Button>
        </Link>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center gap-4 py-20 text-center">
        <CherryMark size={44} className="text-cereja/70" />
        <p className="text-ink/70">Você ainda não salvou nenhum item.</p>
        <Link href="/produtos">
          <Button>Explorar produtos</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
      {items.map((item) => (
        <div
          key={item.productId}
          className="flex flex-col rounded-lg bg-offwhite p-3 shadow-card ring-1 ring-nude/20"
        >
          <Link href={`/produtos/${item.slug}`}>
            <div className="flex aspect-[4/5] items-center justify-center rounded-md bg-gradient-to-br from-creme to-nude/60">
              <CherryMark size={36} className="text-cereja/80" />
            </div>
          </Link>
          <div className="mt-3 flex flex-1 flex-col">
            {item.brand && <span className="text-xs text-ink/50">{item.brand}</span>}
            <Link
              href={`/produtos/${item.slug}`}
              className="font-serif text-lg leading-snug text-vinho hover:text-cereja"
            >
              {item.name}
            </Link>
            <div className="mt-auto flex items-center justify-between pt-2">
              <span className="text-sm font-semibold text-ink">
                {formatBRL(item.fromPriceCents)}
              </span>
              <button
                onClick={() => void toggle(item.productId)}
                aria-label="Remover dos favoritos"
                className="text-cereja hover:text-vinho"
              >
                <IconHeart size={20} filled />
              </button>
            </div>
            {!item.inStock && <span className="text-xs text-ink/40">Esgotado</span>}
          </div>
        </div>
      ))}
    </div>
  );
}
