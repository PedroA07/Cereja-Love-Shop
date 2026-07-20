/** Enums de cupons (§6.7). */
export const CouponDiscountType = {
  Percent: 'percent',
  Fixed: 'fixed',
  FreeShipping: 'free_shipping',
} as const;
export type CouponDiscountType = (typeof CouponDiscountType)[keyof typeof CouponDiscountType];

export const CouponScope = {
  Cart: 'cart',
  Products: 'products',
  Categories: 'categories',
} as const;
export type CouponScope = (typeof CouponScope)[keyof typeof CouponScope];
