import { evaluateCoupon, type CouponRule, type EvaluationContext } from './coupon-rules';

const baseRule: CouponRule = {
  discountType: 'percent',
  value: 10,
  maxDiscountCents: null,
  minOrderCents: null,
  scope: 'cart',
  isActive: true,
  validFrom: null,
  validUntil: null,
  usageLimit: null,
  usedCount: 0,
  usageLimitPerUser: 1,
  firstPurchaseOnly: false,
};

const baseCtx: EvaluationContext = {
  lines: [{ productId: 'p1', categoryId: 'c1', lineCents: 10000 }],
  subtotalCents: 10000,
  shippingCents: 1990,
  scopedProductIds: new Set(),
  scopedCategoryIds: new Set(),
  userRedemptions: 0,
  hasPreviousOrders: false,
};

describe('evaluateCoupon', () => {
  it('aplica percentual sobre o subtotal', () => {
    const r = evaluateCoupon(baseRule, baseCtx);
    expect(r.valid).toBe(true);
    expect(r.discountCents).toBe(1000); // 10% de R$100
  });

  it('respeita o teto do desconto percentual (§6.7)', () => {
    const r = evaluateCoupon({ ...baseRule, value: 50, maxDiscountCents: 2000 }, baseCtx);
    expect(r.discountCents).toBe(2000); // 50% seria 5000, teto corta em 2000
  });

  it('aplica desconto fixo sem passar do subtotal', () => {
    const r = evaluateCoupon(
      { ...baseRule, discountType: 'fixed', value: 15000 },
      baseCtx,
    );
    expect(r.discountCents).toBe(10000); // nunca desconta mais que a base
  });

  it('frete grátis zera o frete', () => {
    const r = evaluateCoupon({ ...baseRule, discountType: 'free_shipping', value: 0 }, baseCtx);
    expect(r.freeShipping).toBe(true);
    expect(r.discountCents).toBe(1990);
  });

  it('rejeita cupom esgotado (limite global)', () => {
    const r = evaluateCoupon({ ...baseRule, usageLimit: 5, usedCount: 5 }, baseCtx);
    expect(r.valid).toBe(false);
    expect(r.reason).toBe('exhausted');
  });

  it('rejeita quando o cliente já atingiu o limite por pessoa', () => {
    const r = evaluateCoupon(baseRule, { ...baseCtx, userRedemptions: 1 });
    expect(r.reason).toBe('user_limit');
  });

  it('rejeita fora da janela de validade', () => {
    const future = new Date('2030-01-01');
    const past = new Date('2020-01-01');
    expect(evaluateCoupon({ ...baseRule, validFrom: future }, baseCtx).reason).toBe('not_started');
    expect(evaluateCoupon({ ...baseRule, validUntil: past }, baseCtx).reason).toBe('expired');
  });

  it('rejeita abaixo do pedido mínimo', () => {
    const r = evaluateCoupon({ ...baseRule, minOrderCents: 20000 }, baseCtx);
    expect(r.reason).toBe('min_order');
  });

  it('rejeita cupom de primeira compra para quem já comprou', () => {
    const r = evaluateCoupon(
      { ...baseRule, firstPurchaseOnly: true },
      { ...baseCtx, hasPreviousOrders: true },
    );
    expect(r.reason).toBe('first_purchase_only');
  });

  it('escopo por produto desconta só os itens elegíveis', () => {
    const ctx: EvaluationContext = {
      ...baseCtx,
      lines: [
        { productId: 'p1', categoryId: 'c1', lineCents: 6000 },
        { productId: 'p2', categoryId: 'c2', lineCents: 4000 },
      ],
      subtotalCents: 10000,
      scopedProductIds: new Set(['p1']),
    };
    const r = evaluateCoupon({ ...baseRule, scope: 'products', value: 50 }, ctx);
    expect(r.discountCents).toBe(3000); // 50% apenas sobre os 6000 elegíveis
  });

  it('rejeita quando nenhum item do carrinho é elegível', () => {
    const ctx: EvaluationContext = { ...baseCtx, scopedProductIds: new Set(['outro']) };
    const r = evaluateCoupon({ ...baseRule, scope: 'products' }, ctx);
    expect(r.reason).toBe('no_eligible_items');
  });

  it('rejeita cupom inativo', () => {
    expect(evaluateCoupon({ ...baseRule, isActive: false }, baseCtx).reason).toBe('inactive');
  });
});
