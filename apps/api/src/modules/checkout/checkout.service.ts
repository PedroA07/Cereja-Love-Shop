import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { canTransitionOrder, OrderStatus, ProductStatus } from '@cereja/shared-types';
import { PrismaService } from '../../infra/prisma/prisma.service';
import { InventoryService } from '../catalog/inventory.service';
import { ShippingService } from '../shipping/shipping.service';
import { CartService, type CartContext } from '../cart/cart.service';
import { CouponsService } from '../coupons/coupons.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { mapOrder } from './order.mapper';

/** Minutos até a reserva de estoque expirar se o pedido não for pago (§6.4). */
export const RESERVATION_TTL_MINUTES = 30;

@Injectable()
export class CheckoutService {
  private readonly logger = new Logger(CheckoutService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly inventory: InventoryService,
    private readonly shipping: ShippingService,
    private readonly cart: CartService,
    private readonly coupons: CouponsService,
  ) {}

  /**
   * Cria o pedido a partir do carrinho (§6.4):
   *  - snapshots de nome/preço/endereço (o pedido não muda se o catálogo mudar)
   *  - RESERVA de estoque atômica por item (nunca vende além do disponível)
   *  - status inicial + histórico; libera por timeout se não for pago
   * Tudo numa transação: se qualquer item faltar, nada é reservado.
   */
  async createOrder(ctx: CartContext, dto: CreateOrderDto, userId?: string) {
    if (!dto.acceptedReturnPolicy) {
      throw new BadRequestException('É necessário aceitar a política de devolução');
    }
    if (!userId && !dto.guestEmail) {
      throw new BadRequestException('Informe um e-mail para acompanhar o pedido');
    }

    const view = await this.cart.view(ctx);
    if (view.items.length === 0) throw new BadRequestException('Carrinho vazio');

    const quote = this.shipping.priceFor(dto.shippingCode, {
      state: dto.address.state,
      subtotalCents: view.subtotalCents,
    });
    if (!quote) throw new BadRequestException('Opção de frete inválida');

    const subtotalCents = view.subtotalCents;
    const baseShippingCents = quote.priceCents;

    const order = await this.prisma.$transaction(async (tx) => {
      // 0) Cupom: valida e RESERVA o uso atomicamente (§6.7), antes do estoque
      let discountCents = 0;
      let shippingCents = baseShippingCents;
      let appliedCoupon: { couponId: string; code: string; discountCents: number } | null = null;

      if (dto.couponCode) {
        const applied = await this.coupons.reserveIn(tx, {
          code: dto.couponCode,
          lines: view.items.map((i) => ({ productId: i.productId, lineCents: i.lineCents })),
          subtotalCents,
          shippingCents: baseShippingCents,
          userId,
          guestEmail: dto.guestEmail,
        });
        if (applied.freeShipping) {
          shippingCents = 0;
          discountCents = 0;
        } else {
          discountCents = applied.discountCents;
        }
        appliedCoupon = {
          couponId: applied.couponId,
          code: applied.code,
          discountCents: applied.discountCents,
        };
      }

      const totalCents = Math.max(0, subtotalCents + shippingCents - discountCents);

      // 1) Revalida preço/status e RESERVA cada item atomicamente
      for (const line of view.items) {
        const variant = await tx.productVariant.findUnique({
          where: { id: line.variantId },
          include: { product: { select: { status: true, name: true } } },
        });
        if (!variant || variant.product.status !== ProductStatus.Published) {
          throw new ConflictException(`Item indisponível: ${line.name}`);
        }
        const reserved = await this.inventory.reserveIn(tx, line.variantId, line.quantity);
        if (!reserved) {
          throw new ConflictException(
            `Estoque insuficiente para "${line.name}". Ajuste a quantidade e tente novamente.`,
          );
        }
      }

      // 2) Cria o pedido com snapshots
      const shippingSnapshot = {
        method: quote.code,
        label: quote.label,
        etaDays: quote.etaDays,
        discreetPackaging: true,
        address: { ...dto.address },
        reservationExpiresAt: new Date(
          Date.now() + RESERVATION_TTL_MINUTES * 60_000,
        ).toISOString(),
        ...(appliedCoupon ? { coupon: { code: appliedCoupon.code } } : {}),
      } as unknown as Prisma.InputJsonValue;

      const created = await tx.order.create({
        data: {
          userId: userId ?? null,
          guestEmail: userId ? null : dto.guestEmail!,
          status: OrderStatus.AwaitingPayment,
          subtotalCents: BigInt(subtotalCents),
          shippingCents: BigInt(shippingCents),
          discountCents: BigInt(discountCents),
          totalCents: BigInt(totalCents),
          shippingSnapshot,
          items: {
            create: view.items.map((l) => ({
              variantId: l.variantId,
              nameSnapshot: l.name,
              unitPriceCents: BigInt(l.unitPriceCents),
              quantity: l.quantity,
            })),
          },
          statusHistory: {
            create: [{ status: OrderStatus.Created }, { status: OrderStatus.AwaitingPayment }],
          },
        },
        include: { items: true, statusHistory: true },
      });

      // 3) Vincula as movimentações de reserva ao pedido (rastreabilidade)
      await tx.stockMovement.updateMany({
        where: {
          variantId: { in: view.items.map((l) => l.variantId) },
          type: 'reserva',
          orderId: null,
        },
        data: { orderId: created.id },
      });

      // 4) Registra o resgate do cupom (a reserva do contador já foi feita)
      if (appliedCoupon) {
        await this.coupons.recordRedemptionIn(tx, {
          couponId: appliedCoupon.couponId,
          orderId: created.id,
          discountCents: appliedCoupon.discountCents,
          userId,
          guestEmail: dto.guestEmail,
        });
      }

      return created;
    });

    // Carrinho esvaziado após o pedido criado
    await this.cart.clear(ctx);
    this.logger.log(`Pedido ${order.id} criado (${OrderStatus.AwaitingPayment})`);
    return mapOrder(order);
  }

  async findForCustomer(orderId: string, userId?: string, guestEmail?: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { items: true, statusHistory: true },
    });
    if (!order) throw new NotFoundException('Pedido não encontrado');

    const isOwner = userId ? order.userId === userId : order.guestEmail === guestEmail;
    if (!isOwner) throw new NotFoundException('Pedido não encontrado');
    return mapOrder(order);
  }

  listForCustomer(userId: string) {
    return this.prisma.order
      .findMany({
        where: { userId },
        include: { items: true, statusHistory: true },
        orderBy: { createdAt: 'desc' },
        take: 50,
      })
      .then((orders) => orders.map(mapOrder));
  }

  /** Transição de status com validação da máquina de estados (§7). */
  async transition(orderId: string, next: OrderStatus) {
    return this.prisma.$transaction(async (tx) => {
      const order = await tx.order.findUnique({
        where: { id: orderId },
        include: { items: true, statusHistory: true },
      });
      if (!order) throw new NotFoundException('Pedido não encontrado');

      const current = order.status as OrderStatus;
      if (!canTransitionOrder(current, next)) {
        throw new BadRequestException(`Transição inválida: ${current} → ${next}`);
      }

      // Efeitos colaterais no estoque
      if (next === OrderStatus.Paid) {
        for (const item of order.items) {
          if (item.variantId) {
            await this.inventory.commitReservationIn(tx, item.variantId, item.quantity);
          }
        }
      }
      if (next === OrderStatus.Canceled && current === OrderStatus.AwaitingPayment) {
        for (const item of order.items) {
          if (item.variantId) {
            await this.inventory.releaseIn(tx, item.variantId, item.quantity, 'pedido cancelado');
          }
        }
        // Devolve o uso do cupom ao estoque de resgates (§6.7)
        await this.coupons.releaseIn(tx, orderId);
      }

      const updated = await tx.order.update({
        where: { id: orderId },
        data: { status: next, statusHistory: { create: { status: next } } },
        include: { items: true, statusHistory: true },
      });
      return mapOrder(updated);
    });
  }

  /**
   * Libera reservas de pedidos não pagos que passaram do prazo (§6.4).
   * Chamado periodicamente pelo agendador.
   */
  async releaseExpiredReservations(): Promise<number> {
    const cutoff = new Date(Date.now() - RESERVATION_TTL_MINUTES * 60_000);
    const expired = await this.prisma.order.findMany({
      where: { status: OrderStatus.AwaitingPayment, createdAt: { lt: cutoff } },
      include: { items: true },
      take: 50,
    });

    let released = 0;
    for (const order of expired) {
      try {
        await this.prisma.$transaction(async (tx) => {
          for (const item of order.items) {
            if (item.variantId) {
              await this.inventory.releaseIn(
                tx,
                item.variantId,
                item.quantity,
                'reserva expirada (pedido não pago)',
              );
            }
          }
          await this.coupons.releaseIn(tx, order.id);
          await tx.order.update({
            where: { id: order.id },
            data: {
              status: OrderStatus.Canceled,
              statusHistory: { create: { status: OrderStatus.Canceled } },
            },
          });
        });
        released++;
      } catch (err) {
        this.logger.error(`Falha ao liberar reserva do pedido ${order.id}: ${String(err)}`);
      }
    }
    if (released > 0) this.logger.log(`${released} pedido(s) expirado(s) cancelado(s)`);
    return released;
  }
}
