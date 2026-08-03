'use client';

import { useState } from 'react';
import { formatBRL } from '@cereja/shared-types';
import { Button, CherryMark, IconEye, IconEyeOff, cn } from '@cereja/ui';
import type { ProductDetail, ProductVariant } from '@/lib/catalog';

function variantLabel(v: ProductVariant): string {
  const opts = Object.values(v.options ?? {});
  return opts.length ? opts.join(' · ') : v.sku;
}

export function ProductView({ product }: { product: ProductDetail }) {
  const [selected, setSelected] = useState<ProductVariant>(product.variants[0]!);
  const [revealed, setRevealed] = useState(false);

  const price = selected.salePriceCents ?? selected.priceCents;
  const hasImage = revealed && product.media.length > 0;

  return (
    <div className="grid gap-8 md:grid-cols-2">
      {/* Mídia */}
      <div>
        <div className="relative aspect-[4/5] w-full overflow-hidden rounded-lg bg-gradient-to-br from-creme to-nude/60">
          {hasImage ? (
            <span className="flex h-full items-center justify-center text-ink/60">
              Imagem do produto
            </span>
          ) : (
            <div className="flex h-full flex-col items-center justify-center gap-3 text-vinho/70">
              <CherryMark size={64} className="text-cereja/80" />
              {product.isSensitiveMedia && (
                <span className="inline-flex items-center gap-1 text-sm text-ink/40">
                  <IconEyeOff size={16} /> capa discreta
                </span>
              )}
            </div>
          )}
        </div>
        {product.media.length > 0 && (
          <button
            onClick={() => setRevealed((v) => !v)}
            className="mt-3 inline-flex items-center gap-1.5 text-sm text-cereja hover:text-vinho"
          >
            {revealed ? <IconEyeOff size={16} /> : <IconEye size={16} />}
            {revealed ? 'Ocultar imagens' : 'Mostrar imagens'}
          </button>
        )}
      </div>

      {/* Informações */}
      <div>
        {product.brand && <span className="text-sm text-ink/50">{product.brand}</span>}
        <h1 className="font-serif text-4xl leading-tight text-vinho">{product.name}</h1>

        <div className="mt-4 flex items-baseline gap-3">
          <span className="text-2xl font-semibold text-cereja">{formatBRL(price)}</span>
          {selected.salePriceCents != null && (
            <span className="text-sm text-ink/40 line-through">{formatBRL(selected.priceCents)}</span>
          )}
        </div>

        {product.variants.length > 1 && (
          <div className="mt-6">
            <span className="text-sm font-medium text-ink">Opções</span>
            <div className="mt-2 flex flex-wrap gap-2">
              {product.variants.map((v) => (
                <button
                  key={v.id}
                  onClick={() => setSelected(v)}
                  disabled={!v.inStock}
                  className={cn(
                    'rounded-md border px-3 py-1.5 text-sm transition-colors',
                    selected.id === v.id
                      ? 'border-cereja bg-cereja text-offwhite'
                      : 'border-nude text-ink hover:bg-creme',
                    !v.inStock && 'cursor-not-allowed opacity-40',
                  )}
                >
                  {variantLabel(v)}
                </button>
              ))}
            </div>
          </div>
        )}

        <p className="mt-3 text-sm text-ink/60">
          {selected.inStock ? `${selected.available} em estoque` : 'Indisponível no momento'}
        </p>

        <div className="mt-6">
          <Button size="lg" disabled title="Carrinho chega no próximo passo">
            Adicionar ao carrinho (em breve)
          </Button>
        </div>

        {product.description && (
          <div className="mt-8 border-t border-nude/40 pt-6">
            <h2 className="font-serif text-xl text-vinho">Descrição</h2>
            <p className="mt-2 leading-relaxed text-ink/80">{product.description}</p>
          </div>
        )}

        <div className="mt-6 flex flex-col gap-1 text-xs text-ink/50">
          <span>Entrega sigilosa e embalagem discreta.</span>
          <span>Produtos íntimos abertos não são devolvíveis (regra sanitária).</span>
        </div>
      </div>
    </div>
  );
}
