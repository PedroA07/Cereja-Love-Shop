import { Injectable } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { OrderStatus } from '@cereja/shared-types';
import { PrismaService } from '../../infra/prisma/prisma.service';

@Injectable()
export class AdminService {
  constructor(private readonly prisma: PrismaService) {}

  /** Indicadores do painel. Consultas agregadas leves (BI real fica no OLAP, §6.8). */
  async dashboard() {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const last30 = new Date(Date.now() - 30 * 24 * 60 * 60_000);

    const paidStatuses = [
      OrderStatus.Paid,
      OrderStatus.Processing,
      OrderStatus.Shipped,
      OrderStatus.Delivered,
      OrderStatus.Completed,
    ];

    const [ordersToday, awaitingPayment, revenue30, productsPublished, productsDraft, lowStock] =
      await Promise.all([
        this.prisma.order.count({ where: { createdAt: { gte: startOfDay } } }),
        this.prisma.order.count({ where: { status: OrderStatus.AwaitingPayment } }),
        this.prisma.order.aggregate({
          _sum: { totalCents: true },
          _count: true,
          where: { status: { in: paidStatuses }, createdAt: { gte: last30 } },
        }),
        this.prisma.product.count({ where: { status: 'published' } }),
        this.prisma.product.count({ where: { status: { in: ['draft', 'review'] } } }),
        this.prisma.inventory.count({ where: { quantity: { lte: 5 } } }),
      ]);

    return {
      ordersToday,
      awaitingPayment,
      revenue30Cents: Number(revenue30._sum.totalCents ?? 0),
      paidOrders30: revenue30._count,
      productsPublished,
      productsDraft,
      lowStockVariants: lowStock,
    };
  }

  /** Lista pedidos para o back-office, com filtro por status e busca. */
  async listOrders(params: { status?: string; q?: string; page?: number }) {
    const page = params.page ?? 1;
    const pageSize = 20;
    const where: Prisma.OrderWhereInput = {};
    if (params.status) where.status = params.status;
    if (params.q) {
      where.OR = [
        { guestEmail: { contains: params.q, mode: 'insensitive' } },
        { user: { email: { contains: params.q, mode: 'insensitive' } } },
      ];
    }

    const [orders, total] = await Promise.all([
      this.prisma.order.findMany({
        where,
        include: {
          items: true,
          user: { select: { email: true, name: true } },
          payments: { select: { method: true, status: true }, orderBy: { createdAt: 'desc' } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.order.count({ where }),
    ]);

    return {
      items: orders.map((o) => ({
        id: o.id,
        status: o.status,
        customer: o.user?.email ?? o.guestEmail ?? '—',
        customerName: o.user?.name ?? null,
        itemCount: o.items.reduce((s, i) => s + i.quantity, 0),
        totalCents: Number(o.totalCents),
        payment: o.payments[0] ? { method: o.payments[0].method, status: o.payments[0].status } : null,
        createdAt: o.createdAt,
      })),
      total,
      page,
      pageSize,
      pages: Math.ceil(total / pageSize),
    };
  }

  async getOrder(id: string) {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: {
        items: true,
        statusHistory: { orderBy: { createdAt: 'asc' } },
        payments: { orderBy: { createdAt: 'desc' } },
        user: { select: { email: true, name: true } },
      },
    });
    if (!order) return null;
    return {
      id: order.id,
      status: order.status,
      customer: order.user?.email ?? order.guestEmail ?? '—',
      customerName: order.user?.name ?? null,
      subtotalCents: Number(order.subtotalCents),
      shippingCents: Number(order.shippingCents),
      discountCents: Number(order.discountCents),
      totalCents: Number(order.totalCents),
      shipping: order.shippingSnapshot,
      createdAt: order.createdAt,
      items: order.items.map((i) => ({
        id: i.id,
        name: i.nameSnapshot,
        quantity: i.quantity,
        unitPriceCents: Number(i.unitPriceCents),
      })),
      history: order.statusHistory.map((h) => ({ status: h.status, at: h.createdAt })),
      payments: order.payments.map((p) => ({
        id: p.id,
        method: p.method,
        status: p.status,
        amountCents: Number(p.amountCents),
        installments: p.installments,
        createdAt: p.createdAt,
      })),
    };
  }

  /** Lista produtos para o back-office (inclui rascunhos, ao contrário da vitrine). */
  async listProducts(params: { status?: string; q?: string; page?: number }) {
    const page = params.page ?? 1;
    const pageSize = 20;
    const where: Prisma.ProductWhereInput = {};
    if (params.status) where.status = params.status;
    if (params.q) where.name = { contains: params.q, mode: 'insensitive' };

    const [products, total] = await Promise.all([
      this.prisma.product.findMany({
        where,
        include: { variants: { include: { inventory: true } } },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.product.count({ where }),
    ]);

    return {
      items: products.map((p) => {
        const stock = p.variants.reduce(
          (s, v) => s + (v.inventory ? v.inventory.quantity - v.inventory.reserved : 0),
          0,
        );
        const prices = p.variants.map((v) => Number(v.salePriceCents ?? v.priceCents));
        return {
          id: p.id,
          name: p.name,
          slug: p.slug,
          status: p.status,
          brand: p.brand,
          variantCount: p.variants.length,
          stock,
          fromPriceCents: prices.length ? Math.min(...prices) : 0,
          createdAt: p.createdAt,
        };
      }),
      total,
      page,
      pageSize,
      pages: Math.ceil(total / pageSize),
    };
  }
}
