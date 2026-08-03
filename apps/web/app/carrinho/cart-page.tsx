'use client';

import Link from 'next/link';
import { formatBRL } from '@cereja/shared-types';
import { Button, CherryMark, IconTrash } from '@cereja/ui';
import { useCart } from '@/features/cart/cart-context';

function options(o: Record<string, unknown>): string {
  const vals = Object.values(o ?? {});
  return vals.length ? vals.join(' · ') : '';
}

export function CartPageClient() {
  const { items, subtotalCents, count, loading, setQuantity, remove } = useCart();

  if (loading) {
    return <p className="py-16 text-center text-ink/50">Carregando carrinho…</p>;
  }

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center gap-4 py-20 text-center">
        <CherryMark size={48} className="text-cereja/70" />
        <p className="text-lg text-ink/70">Seu carrinho está vazio.</p>
        <Link href="/produtos">
          <Button>Ver produtos</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
      <ul className="divide-y divide-nude/30">
        {items.map((item) => (
          <li key={item.variantId} className="flex gap-4 py-4">
            <div className="flex h-20 w-16 flex-none items-center justify-center rounded-md bg-gradient-to-br from-creme to-nude/60">
              <CherryMark size={22} className="text-cereja/70" />
            </div>
            <div className="flex flex-1 flex-col">
              <Link
                href={`/produtos/${item.productSlug}`}
                className="font-serif text-lg text-vinho hover:text-cereja"
              >
                {item.name}
              </Link>
              {options(item.options) && (
                <span className="text-xs text-ink/50">{options(item.options)}</span>
              )}
              {!item.inStock && (
                <span className="mt-1 text-xs text-cereja">
                  Apenas {item.available} em estoque
                </span>
              )}
              <div className="mt-auto flex items-center gap-3 pt-2">
                <div className="flex h-9 items-center rounded-md border border-nude">
                  <button
                    aria-label="Diminuir"
                    onClick={() => void setQuantity(item.variantId, item.quantity - 1)}
                    className="flex h-full w-8 items-center justify-center text-ink/70 hover:text-cereja"
                  >
                    −
                  </button>
                  <span className="w-7 text-center text-sm">{item.quantity}</span>
                  <button
                    aria-label="Aumentar"
                    onClick={() => void setQuantity(item.variantId, item.quantity + 1)}
                    className="flex h-full w-8 items-center justify-center text-ink/70 hover:text-cereja"
                  >
                    +
                  </button>
                </div>
                <button
                  onClick={() => void remove(item.variantId)}
                  className="inline-flex items-center gap-1 text-sm text-ink/50 hover:text-cereja"
                >
                  <IconTrash size={16} /> Remover
                </button>
              </div>
            </div>
            <div className="flex-none text-right font-semibold text-ink">
              {formatBRL(item.lineCents)}
            </div>
          </li>
        ))}
      </ul>

      <aside className="h-fit rounded-lg bg-creme/40 p-6">
        <h2 className="font-serif text-xl text-vinho">Resumo</h2>
        <div className="mt-4 flex justify-between text-sm text-ink/70">
          <span>Subtotal ({count} {count === 1 ? 'item' : 'itens'})</span>
          <span className="font-semibold text-ink">{formatBRL(subtotalCents)}</span>
        </div>
        <p className="mt-1 text-xs text-ink/50">Frete calculado no checkout.</p>
        <Link href="/checkout" className="mt-6 block">
          <Button size="lg" className="w-full">
            Finalizar compra
          </Button>
        </Link>
        <p className="mt-3 text-center text-xs text-ink/40">Entrega sigilosa e embalagem discreta.</p>
      </aside>
    </div>
  );
}
