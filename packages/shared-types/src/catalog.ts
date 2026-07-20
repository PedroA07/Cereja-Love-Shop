/** Enums do catálogo e engajamento (§6.2 / §5). */
export const ProductStatus = {
  Draft: 'draft',
  Review: 'review',
  Published: 'published',
  Archived: 'archived',
} as const;
export type ProductStatus = (typeof ProductStatus)[keyof typeof ProductStatus];

/** Workflow de publicação (§6.2): draft → review → published → archived. */
export const PRODUCT_TRANSITIONS: Readonly<Record<ProductStatus, readonly ProductStatus[]>> = {
  draft: ['review', 'archived'],
  review: ['published', 'draft', 'archived'],
  published: ['archived'],
  archived: ['draft'],
};

export const StockMovementType = {
  Entrada: 'entrada',
  Saida: 'saida',
  Ajuste: 'ajuste',
  Reserva: 'reserva',
  Liberacao: 'liberacao',
  Transferencia: 'transferencia',
} as const;
export type StockMovementType = (typeof StockMovementType)[keyof typeof StockMovementType];

export const ReviewStatus = {
  Pending: 'pending',
  Approved: 'approved',
  Rejected: 'rejected',
} as const;
export type ReviewStatus = (typeof ReviewStatus)[keyof typeof ReviewStatus];
