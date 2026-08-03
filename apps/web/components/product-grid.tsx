'use client';

import { useState } from 'react';
import { Button, IconEye, IconEyeOff } from '@cereja/ui';
import type { ProductCard as Card } from '@/lib/catalog';
import { ProductCard } from './product-card';

/** Grade da vitrine com o toggle "mostrar imagens" (§6.9). */
export function ProductGrid({ products }: { products: Card[] }) {
  const [revealed, setRevealed] = useState(false);

  if (products.length === 0) {
    return (
      <p className="rounded-lg bg-creme/40 p-8 text-center text-ink/60">
        Nenhum produto encontrado por aqui.
      </p>
    );
  }

  return (
    <div>
      <div className="mb-4 flex justify-end">
        <Button variant="outline" size="sm" onClick={() => setRevealed((v) => !v)}>
          {revealed ? <IconEyeOff size={16} /> : <IconEye size={16} />}
          {revealed ? 'Ocultar imagens' : 'Mostrar imagens'}
        </Button>
      </div>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {products.map((p) => (
          <ProductCard key={p.id} product={p} revealed={revealed} />
        ))}
      </div>
    </div>
  );
}
