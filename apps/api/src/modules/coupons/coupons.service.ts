import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { CouponScope } from '@cereja/shared-types';
import { PrismaService } from '../../infra/prisma/prisma.service';
import { CreateCouponDto } from './dto/coupon.dto';
import {
  evaluateCoupon,
  rejectionMessage,
  type CartLineForCoupon,
  type CouponEvaluation,
  type CouponRule,
} from './coupon-rules';

export interface CouponApplication extends CouponEvaluation {
  couponId: string;
  code: string;
}

@Injectable()
export class CouponsService {
  private readonly logger = new Logger(CouponsService.name);

  constructor(private readonly prisma: PrismaService) {}

  // ---------------- admin ----------------

  async create(dto: CreateCouponDto, staffId?: string) {
    const code = dto.code.toUpperCase();
    if (await this.prisma.coupon.findUnique({ where: { code } })) {
      throw new ConflictException('Já existe cupom com esse código');
    }
    if (dto.discountType === 'percent' && dto.value > 100) {
      throw new BadRequestException('Percentual não pode exceder 100');
    }

    const coupon = await this.prisma.coupon.create({
      data: {
        code,
        name: dto.name ?? null,
        discountType: dto.discountType,
        value: BigInt(dto.value),
        maxDiscountCents: dto.maxDiscountCents != null ? BigInt(dto.maxDiscountCents) : null,
        minOrderCents: dto.minOrderCents != null ? BigInt(dto.minOrderCents) : null,
        scope: dto.scope ?? CouponScope.Cart,
        firstPurchaseOnly: dto.firstPurchaseOnly ?? false,
        combinable: dto.combinable ?? false,
        usageLimit: dto.usageLimit ?? null,
        usageLimitPerUser: dto.usageLimitPerUser ?? 1,
        validFrom: dto.validFrom ? new Date(dto.validFrom) : null,
        validUntil: dto.validUntil ? new Date(dto.validUntil) : null,
        createdBy: staffId ?? null,
        scopes: {
          create: [
            ...(dto.productIds ?? []).map((productId) => ({ productId })),
            ...(dto.categoryIds ?? []).map((categoryId) => ({ categoryId })),
          ],
        },
      },
      include: { scopes: true },
    });
    return this.mapCoupon(coupon);
  }

  async list(page = 1) {
    const pageSize = 20;
    const [items, total] = await Promise.all([
      this.prisma.coupon.findMany({
        include: { scopes: true },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.coupon.count(),
    ]);
    return { items: items.map((c) => this.mapCoupon(c)), total, page, pageSize };
  }

  async setActive(id: string, isActive: boolean) {
    const coupon = await this.prisma.coupon.update({
      where: { id },
      data: { isActive },
      include: { scopes: true },
    });
    return this.mapCoupon(coupon);
  }

  // ---------------- loja ----------------

  /**
   * Simula a aplicação do cupom no carrinho, SEM consumir o limite (§6.7).
   * Usado para mostrar o desconto no checkout antes de fechar o pedido.
   */
  async preview(params: {
    code: string;
    lines: CartLineForCoupon[];
    subtotalCents: number;
    shippingCents: number;
    userId?: string;
    guestEmail?: string;
  }): Promise<CouponApplication> {
    const { coupon, rule } = await this.loadRule(params.code);
    const ctx = await this.buildContext(coupon, params);
    const result = evaluateCoupon(rule, ctx);
    if (!result.valid) {
      throw new BadRequestException(rejectionMessage(result.reason!));
    }
    return { ...result, couponId: coupon.id, code: coupon.code! };
  }

  /**
   * RESERVA o cupom (§6.7) — o coração da concorrência.
   *
   * `UPDATE coupons SET used_count = used_count + 1
   *   WHERE id = :id AND is_active AND (usage_limit IS NULL OR used_count < usage_limit)`
   *
   * 0 linhas afetadas = esgotado. O contador nunca ultrapassa o limite, mesmo
   * sob requisições simultâneas. Deve rodar na transação do pedido.
   */
  async reserveIn(
    tx: Prisma.TransactionClient,
    params: {
      code: string;
      lines: CartLineForCoupon[];
      subtotalCents: number;
      shippingCents: number;
      userId?: string;
      guestEmail?: string;
    },
  ): Promise<CouponApplication> {
    const { coupon, rule } = await this.loadRule(params.code, tx);
    const ctx = await this.buildContext(coupon, params, tx);

    const evaluation = evaluateCoupon(rule, ctx);
    if (!evaluation.valid) throw new BadRequestException(rejectionMessage(evaluation.reason!));

    // Incremento condicional atômico — nunca ultrapassa usage_limit
    const affected = await tx.$executeRaw`
      UPDATE coupons
         SET used_count = used_count + 1
       WHERE id = ${coupon.id}::uuid
         AND is_active = true
         AND (usage_limit IS NULL OR used_count < usage_limit)`;

    if (affected === 0) {
      throw new ConflictException('Este cupom se esgotou');
    }

    return { ...evaluation, couponId: coupon.id, code: coupon.code! };
  }

  /** Registra o resgate após o pedido existir (a reserva já foi feita). */
  async recordRedemptionIn(
    tx: Prisma.TransactionClient,
    params: {
      couponId: string;
      orderId: string;
      discountCents: number;
      userId?: string;
      guestEmail?: string;
    },
  ): Promise<void> {
    await tx.couponRedemption.create({
      data: {
        couponId: params.couponId,
        orderId: params.orderId,
        userId: params.userId ?? null,
        guestEmail: params.userId ? null : (params.guestEmail ?? null),
        discountCents: BigInt(params.discountCents),
      },
    });
    this.logger.log(`Cupom ${params.couponId} resgatado no pedido ${params.orderId}`);
  }

  /** Devolve o uso ao cancelar/expirar o pedido (§6.7). */
  async releaseIn(tx: Prisma.TransactionClient, orderId: string): Promise<void> {
    const redemptions = await tx.couponRedemption.findMany({ where: { orderId } });
    for (const r of redemptions) {
      await tx.$executeRaw`
        UPDATE coupons
           SET used_count = GREATEST(used_count - 1, 0)
         WHERE id = ${r.couponId}::uuid`;
      await tx.couponRedemption.delete({ where: { id: r.id } });
    }
  }

  // ---------------- internos ----------------

  private async loadRule(code: string, tx?: Prisma.TransactionClient) {
    const client = tx ?? this.prisma;
    const coupon = await client.coupon.findUnique({
      where: { code: code.toUpperCase() },
      include: { scopes: true },
    });
    if (!coupon) throw new NotFoundException('Cupom não encontrado');

    const rule: CouponRule = {
      discountType: coupon.discountType,
      value: coupon.value,
      maxDiscountCents: coupon.maxDiscountCents,
      minOrderCents: coupon.minOrderCents,
      scope: coupon.scope,
      isActive: coupon.isActive,
      validFrom: coupon.validFrom,
      validUntil: coupon.validUntil,
      usageLimit: coupon.usageLimit,
      usedCount: coupon.usedCount,
      usageLimitPerUser: coupon.usageLimitPerUser,
      firstPurchaseOnly: coupon.firstPurchaseOnly,
    };
    return { coupon, rule };
  }

  private async buildContext(
    coupon: { id: string; scopes: { productId: string | null; categoryId: string | null }[] },
    params: {
      lines: CartLineForCoupon[];
      subtotalCents: number;
      shippingCents: number;
      userId?: string;
      guestEmail?: string;
    },
    tx?: Prisma.TransactionClient,
  ) {
    const client = tx ?? this.prisma;

    // Limite por cliente: conta resgates deste user/e-mail (§6.7)
    const userRedemptions = await client.couponRedemption.count({
      where: {
        couponId: coupon.id,
        ...(params.userId ? { userId: params.userId } : { guestEmail: params.guestEmail ?? '' }),
      },
    });

    const hasPreviousOrders = params.userId
      ? (await client.order.count({
          where: { userId: params.userId, status: { notIn: ['created', 'canceled'] } },
        })) > 0
      : params.guestEmail
        ? (await client.order.count({
            where: { guestEmail: params.guestEmail, status: { notIn: ['created', 'canceled'] } },
          })) > 0
        : false;

    return {
      lines: params.lines,
      subtotalCents: params.subtotalCents,
      shippingCents: params.shippingCents,
      scopedProductIds: new Set(
        coupon.scopes.map((s) => s.productId).filter((v): v is string => Boolean(v)),
      ),
      scopedCategoryIds: new Set(
        coupon.scopes.map((s) => s.categoryId).filter((v): v is string => Boolean(v)),
      ),
      userRedemptions,
      hasPreviousOrders,
    };
  }

  private mapCoupon(c: {
    id: string;
    code: string | null;
    name: string | null;
    discountType: string;
    value: bigint;
    maxDiscountCents: bigint | null;
    minOrderCents: bigint | null;
    scope: string;
    firstPurchaseOnly: boolean;
    combinable: boolean;
    usageLimit: number | null;
    usageLimitPerUser: number;
    usedCount: number;
    validFrom: Date | null;
    validUntil: Date | null;
    isActive: boolean;
    createdAt: Date;
    scopes?: { productId: string | null; categoryId: string | null }[];
  }) {
    return {
      id: c.id,
      code: c.code,
      name: c.name,
      discountType: c.discountType,
      value: Number(c.value),
      maxDiscountCents: c.maxDiscountCents != null ? Number(c.maxDiscountCents) : null,
      minOrderCents: c.minOrderCents != null ? Number(c.minOrderCents) : null,
      scope: c.scope,
      firstPurchaseOnly: c.firstPurchaseOnly,
      combinable: c.combinable,
      usageLimit: c.usageLimit,
      usageLimitPerUser: c.usageLimitPerUser,
      usedCount: c.usedCount,
      remaining: c.usageLimit != null ? Math.max(0, c.usageLimit - c.usedCount) : null,
      validFrom: c.validFrom,
      validUntil: c.validUntil,
      isActive: c.isActive,
      createdAt: c.createdAt,
    };
  }
}
