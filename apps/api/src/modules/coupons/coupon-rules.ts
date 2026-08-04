import { CouponDiscountType, CouponScope } from '@cereja/shared-types';

export interface CouponRule {
  discountType: string;
  value: bigint | number;
  maxDiscountCents?: bigint | number | null;
  minOrderCents?: bigint | number | null;
  scope: string;
  isActive: boolean;
  validFrom?: Date | null;
  validUntil?: Date | null;
  usageLimit?: number | null;
  usedCount: number;
  usageLimitPerUser: number;
  firstPurchaseOnly: boolean;
}

export interface CartLineForCoupon {
  productId: string;
  categoryId?: string | null;
  lineCents: number;
}

export interface EvaluationContext {
  lines: CartLineForCoupon[];
  subtotalCents: number;
  shippingCents: number;
  /** Ids no escopo do cupom (produtos/categorias), quando aplicável. */
  scopedProductIds: Set<string>;
  scopedCategoryIds: Set<string>;
  /** Quantas vezes este cliente já usou o cupom. */
  userRedemptions: number;
  /** Cliente já comprou antes? (para first_purchase_only) */
  hasPreviousOrders: boolean;
  now?: Date;
}

export type CouponRejection =
  | 'inactive'
  | 'not_started'
  | 'expired'
  | 'exhausted'
  | 'user_limit'
  | 'min_order'
  | 'first_purchase_only'
  | 'no_eligible_items';

export interface CouponEvaluation {
  valid: boolean;
  reason?: CouponRejection;
  discountCents: number;
  freeShipping: boolean;
}

const REJECTION_MESSAGES: Record<CouponRejection, string> = {
  inactive: 'Cupom indisponível',
  not_started: 'Este cupom ainda não está valendo',
  expired: 'Este cupom expirou',
  exhausted: 'Este cupom se esgotou',
  user_limit: 'Você já utilizou este cupom',
  min_order: 'O valor do pedido não atinge o mínimo do cupom',
  first_purchase_only: 'Cupom válido apenas na primeira compra',
  no_eligible_items: 'Nenhum item do carrinho é elegível a este cupom',
};

export function rejectionMessage(reason: CouponRejection): string {
  return REJECTION_MESSAGES[reason];
}

function num(value: bigint | number | null | undefined): number {
  if (value === null || value === undefined) return 0;
  return typeof value === 'bigint' ? Number(value) : value;
}

/**
 * Motor de regras do cupom (§6.7): validade, mínimo, escopo, primeira compra,
 * limites (global e por cliente) e teto em percentuais.
 *
 * Função pura — a reserva atômica do contador acontece no serviço.
 */
export function evaluateCoupon(rule: CouponRule, ctx: EvaluationContext): CouponEvaluation {
  const now = ctx.now ?? new Date();
  const nothing = { discountCents: 0, freeShipping: false };

  if (!rule.isActive) return { valid: false, reason: 'inactive', ...nothing };
  if (rule.validFrom && now < rule.validFrom) return { valid: false, reason: 'not_started', ...nothing };
  if (rule.validUntil && now > rule.validUntil) return { valid: false, reason: 'expired', ...nothing };

  if (rule.usageLimit != null && rule.usedCount >= rule.usageLimit) {
    return { valid: false, reason: 'exhausted', ...nothing };
  }
  if (ctx.userRedemptions >= rule.usageLimitPerUser) {
    return { valid: false, reason: 'user_limit', ...nothing };
  }
  if (rule.firstPurchaseOnly && ctx.hasPreviousOrders) {
    return { valid: false, reason: 'first_purchase_only', ...nothing };
  }

  const minOrder = num(rule.minOrderCents);
  if (minOrder > 0 && ctx.subtotalCents < minOrder) {
    return { valid: false, reason: 'min_order', ...nothing };
  }

  // Base elegível conforme o escopo
  let eligibleCents = ctx.subtotalCents;
  if (rule.scope === CouponScope.Products) {
    eligibleCents = ctx.lines
      .filter((l) => ctx.scopedProductIds.has(l.productId))
      .reduce((s, l) => s + l.lineCents, 0);
  } else if (rule.scope === CouponScope.Categories) {
    eligibleCents = ctx.lines
      .filter((l) => l.categoryId && ctx.scopedCategoryIds.has(l.categoryId))
      .reduce((s, l) => s + l.lineCents, 0);
  }

  if (rule.scope !== CouponScope.Cart && eligibleCents <= 0) {
    return { valid: false, reason: 'no_eligible_items', ...nothing };
  }

  // Cálculo do desconto
  if (rule.discountType === CouponDiscountType.FreeShipping) {
    return { valid: true, discountCents: ctx.shippingCents, freeShipping: true };
  }

  let discount: number;
  if (rule.discountType === CouponDiscountType.Percent) {
    discount = Math.floor((eligibleCents * num(rule.value)) / 100);
    const cap = num(rule.maxDiscountCents);
    if (cap > 0) discount = Math.min(discount, cap); // teto (§6.7)
  } else {
    discount = num(rule.value);
  }

  // Nunca descontar mais do que a base elegível
  discount = Math.max(0, Math.min(discount, eligibleCents));
  return { valid: true, discountCents: discount, freeShipping: false };
}
