import type { Prisma } from '@prisma/client';

type OrderRow = Prisma.OrderGetPayload<{
  include: { items: true; statusHistory: true };
}>;

export function mapOrder(order: OrderRow) {
  return {
    id: order.id,
    status: order.status,
    guestEmail: order.guestEmail,
    subtotalCents: Number(order.subtotalCents),
    shippingCents: Number(order.shippingCents),
    discountCents: Number(order.discountCents),
    totalCents: Number(order.totalCents),
    shipping: order.shippingSnapshot,
    createdAt: order.createdAt,
    items: order.items.map((i) => ({
      id: i.id,
      variantId: i.variantId,
      name: i.nameSnapshot,
      unitPriceCents: Number(i.unitPriceCents),
      quantity: i.quantity,
      lineCents: Number(i.unitPriceCents) * i.quantity,
    })),
    history: order.statusHistory
      .slice()
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())
      .map((h) => ({ status: h.status, at: h.createdAt })),
  };
}
