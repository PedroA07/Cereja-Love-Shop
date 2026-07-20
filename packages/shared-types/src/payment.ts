/** Métodos e máquina de status de pagamento (§6.5). */
export const PaymentMethod = {
  Pix: 'pix',
  Boleto: 'boleto',
  CreditCard: 'credit_card',
} as const;
export type PaymentMethod = (typeof PaymentMethod)[keyof typeof PaymentMethod];

export const PaymentStatus = {
  Pending: 'pending',
  Authorized: 'authorized',
  Paid: 'paid',
  Failed: 'failed',
  Refunded: 'refunded',
} as const;
export type PaymentStatus = (typeof PaymentStatus)[keyof typeof PaymentStatus];

/** pending → authorized → paid → (failed|refunded) */
export const PAYMENT_TRANSITIONS: Readonly<Record<PaymentStatus, readonly PaymentStatus[]>> = {
  pending: ['authorized', 'paid', 'failed'],
  authorized: ['paid', 'failed'],
  paid: ['refunded'],
  failed: [],
  refunded: [],
};
