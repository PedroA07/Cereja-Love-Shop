import Link from 'next/link';
import { formatBRL } from '@cereja/shared-types';
import { CherryMark, IconEyeOff } from '@cereja/ui';
import type { ProductCard as Card } from '@/lib/catalog';

const CATEGORY_LABELS: Record<string, string> = {
  lingerie: 'Lingerie',
  cosmeticos: 'Cosméticos',
  'bem-estar': 'Bem-estar',
  acessorios: 'Acessórios',
};

/** Capa discreta por padrão (§1.2/§6.9): não expõe imagem sensível na vitrine. */
function Cover({ product, revealed }: { product: Card; revealed: boolean }) {
  const showImage = revealed && product.mediaCount > 0;
  return (
    <div className="relative aspect-[4/5] w-full overflow-hidden rounded-md bg-gradient-to-br from-creme to-nude/60">
      {showImage ? (
        // Imagem revelada só quando a pessoa opta por ver
        <span className="flex h-full items-center justify-center text-sm text-ink/60">
          Imagem do produto
        </span>
      ) : (
        <div className="flex h-full flex-col items-center justify-center gap-2 text-vinho/70">
          <CherryMark size={40} className="text-cereja/80" />
          <span className="text-xs uppercase tracking-wide text-ink/50">
            {product.category ? CATEGORY_LABELS[product.category] ?? product.category : 'Cereja'}
          </span>
          {product.isSensitiveMedia && (
            <span className="mt-1 inline-flex items-center gap-1 text-[11px] text-ink/40">
              <IconEyeOff size={13} /> capa discreta
            </span>
          )}
        </div>
      )}
      {product.salePriceCents != null && (
        <span className="absolute left-2 top-2 rounded-full bg-cereja px-2 py-0.5 text-[11px] font-medium text-offwhite">
          Promo
        </span>
      )}
      {!product.inStock && (
        <span className="absolute right-2 top-2 rounded-full bg-ink/70 px-2 py-0.5 text-[11px] text-offwhite">
          Esgotado
        </span>
      )}
    </div>
  );
}

export function ProductCard({ product, revealed }: { product: Card; revealed: boolean }) {
  const price = product.salePriceCents ?? product.fromPriceCents;
  return (
    <Link
      href={`/produtos/${product.slug}`}
      className="group flex flex-col rounded-lg bg-offwhite p-3 shadow-card ring-1 ring-nude/20 transition-shadow hover:shadow-soft"
    >
      <Cover product={product} revealed={revealed} />
      <div className="mt-3 flex flex-1 flex-col">
        {product.brand && <span className="text-xs text-ink/50">{product.brand}</span>}
        <h3 className="font-serif text-lg leading-snug text-vinho group-hover:text-cereja">
          {product.name}
        </h3>
        <div className="mt-auto pt-2">
          {product.salePriceCents != null ? (
            <span className="flex items-baseline gap-2">
              <span className="text-base font-semibold text-cereja">{formatBRL(price)}</span>
              <span className="text-xs text-ink/40 line-through">
                {formatBRL(product.fromPriceCents)}
              </span>
            </span>
          ) : (
            <span className="text-base font-semibold text-ink">
              a partir de {formatBRL(price)}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
