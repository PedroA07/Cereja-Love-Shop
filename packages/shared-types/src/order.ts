/**
 * Máquina de estados do pedido (§7).
 *
 *   created → awaiting_payment → paid → processing → shipped → delivered → completed
 *                            ↘ canceled
 *   paid → refunded ;  processing → canceled
 */
export const OrderStatus = {
  Created: 'created',
  AwaitingPayment: 'awaiting_payment',
  Paid: 'paid',
  Processing: 'processing',
  Shipped: 'shipped',
  Delivered: 'delivered',
  Completed: 'completed',
  Canceled: 'canceled',
  Refunded: 'refunded',
} as const;

export type OrderStatus = (typeof OrderStatus)[keyof typeof OrderStatus];

/** Transições permitidas. Toda transição grava em order_status_history e emite evento (§7). */
export const ORDER_TRANSITIONS: Readonly<Record<OrderStatus, readonly OrderStatus[]>> = {
  created: ['awaiting_payment', 'canceled'],
  awaiting_payment: ['paid', 'canceled'],
  paid: ['processing', 'refunded'],
  processing: ['shipped', 'canceled'],
  shipped: ['delivered'],
  delivered: ['completed'],
  completed: [],
  canceled: [],
  refunded: [],
};

export function canTransitionOrder(from: OrderStatus, to: OrderStatus): boolean {
  return ORDER_TRANSITIONS[from].includes(to);
}
