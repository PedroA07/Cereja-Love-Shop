import type { Prisma } from '@prisma/client';

/** Converte BigInt (centavos) para number seguro na serialização JSON. */
function cents(value: bigint | null): number | null {
  return value === null ? null : Number(value);
}

type VariantRow = Prisma.ProductVariantGetPayload<{ include: { inventory: true } }>;
type ProductRow = Prisma.ProductGetPayload<{
  include: { variants: { include: { inventory: true } }; media: true };
}>;

export function mapVariant(v: VariantRow) {
  const available = v.inventory ? v.inventory.quantity - v.inventory.reserved : 0;
  return {
    id: v.id,
    sku: v.sku,
    priceCents: cents(v.priceCents)!,
    salePriceCents: cents(v.salePriceCents),
    options: v.options,
    barcode: v.barcode,
    available,
    inStock: available > 0,
  };
}

function minPrice(variants: VariantRow[]): { priceCents: number; salePriceCents: number | null } {
  const effective = variants.map((v) => Number(v.salePriceCents ?? v.priceCents));
  const idx = effective.indexOf(Math.min(...effective));
  const chosen = variants[idx] ?? variants[0]!;
  return { priceCents: Number(chosen.priceCents), salePriceCents: cents(chosen.salePriceCents) };
}

/** Item de vitrine (resumo). */
export function mapProductCard(p: ProductRow) {
  const price = minPrice(p.variants);
  const available = p.variants.reduce(
    (sum, v) => sum + (v.inventory ? v.inventory.quantity - v.inventory.reserved : 0),
    0,
  );
  const attrs = (p.attributes ?? {}) as Record<string, unknown>;
  return {
    id: p.id,
    name: p.name,
    slug: p.slug,
    brand: p.brand,
    isSensitiveMedia: p.isSensitiveMedia,
    fromPriceCents: price.priceCents,
    salePriceCents: price.salePriceCents,
    category: typeof attrs.category === 'string' ? attrs.category : null,
    mediaCount: p.media.length,
    inStock: available > 0,
  };
}

/** Produto completo (página de produto / admin). */
export function mapProductDetail(p: ProductRow) {
  return {
    id: p.id,
    name: p.name,
    slug: p.slug,
    description: p.description,
    brand: p.brand,
    status: p.status,
    isSensitiveMedia: p.isSensitiveMedia,
    attributes: p.attributes,
    createdAt: p.createdAt,
    variants: p.variants.map(mapVariant),
    media: p.media
      .slice()
      .sort((a, b) => a.position - b.position)
      .map((m) => ({ id: m.id, url: m.url, position: m.position })),
  };
}
