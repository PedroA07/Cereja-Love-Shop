'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { IconHeart, cn } from '@cereja/ui';
import { useAuth } from '@/features/auth/auth-context';
import { useWishlist } from './wishlist-context';

/** Botão de salvar na lista de desejos. Visitante é levado ao login. */
export function WishlistButton({
  productId,
  className,
  withLabel,
}: {
  productId: string;
  className?: string;
  withLabel?: boolean;
}) {
  const { user } = useAuth();
  const { has, toggle } = useWishlist();
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const saved = has(productId);

  async function onClick() {
    if (!user) {
      router.push('/entrar');
      return;
    }
    setBusy(true);
    try {
      await toggle(productId);
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      type="button"
      onClick={() => void onClick()}
      disabled={busy}
      aria-label={saved ? 'Remover da lista de desejos' : 'Salvar na lista de desejos'}
      aria-pressed={saved}
      className={cn(
        'inline-flex items-center gap-1.5 text-sm transition-colors',
        saved ? 'text-cereja' : 'text-ink/50 hover:text-cereja',
        className,
      )}
    >
      <IconHeart size={20} filled={saved} />
      {withLabel && <span>{saved ? 'Salvo' : 'Salvar'}</span>}
    </button>
  );
}
