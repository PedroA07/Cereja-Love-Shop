import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { ProductStatus } from '@cereja/shared-types';
import { PrismaService } from '../../infra/prisma/prisma.service';
import { RedisService } from '../../infra/redis/redis.service';
import { CartRepository } from './cart.repository';

export interface CartContext {
  userId?: string;
  guestToken?: string;
}

interface RawItem {
  variantId: string;
  quantity: number;
}

export interface CartLine {
  variantId: string;
  productId: string;
  productSlug: string;
  name: string;
  options: unknown;
  unitPriceCents: number;
  quantity: number;
  available: number;
  inStock: boolean;
  lineCents: number;
}

export interface CartView {
  items: CartLine[];
  subtotalCents: number;
  count: number;
}

const GUEST_TTL = 60 * 60 * 24 * 7; // 7 dias

@Injectable()
export class CartService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
    private readonly repo: CartRepository,
  ) {}

  private guestKey(token: string): string {
    return `cart:guest:${token}`;
  }

  private async readRaw(ctx: CartContext): Promise<RawItem[]> {
    if (ctx.userId) return this.repo.items(ctx.userId);
    if (ctx.guestToken) {
      const json = await this.redis.client.get(this.guestKey(ctx.guestToken));
      return json ? (JSON.parse(json) as RawItem[]) : [];
    }
    return [];
  }

  private async writeGuest(token: string, items: RawItem[]): Promise<void> {
    await this.redis.client.set(this.guestKey(token), JSON.stringify(items), 'EX', GUEST_TTL);
  }

  /** Valida que a variante existe e o produto está publicado. */
  private async assertPurchasable(variantId: string): Promise<void> {
    const variant = await this.prisma.productVariant.findUnique({
      where: { id: variantId },
      include: { product: { select: { status: true } } },
    });
    if (!variant) throw new NotFoundException('Variante não encontrada');
    if (variant.product.status !== ProductStatus.Published) {
      throw new BadRequestException('Produto indisponível');
    }
  }

  async add(ctx: CartContext, variantId: string, quantity: number): Promise<CartView> {
    await this.assertPurchasable(variantId);
    if (ctx.userId) {
      await this.repo.addQuantity(ctx.userId, variantId, quantity);
    } else if (ctx.guestToken) {
      const items = await this.readRaw(ctx);
      const existing = items.find((i) => i.variantId === variantId);
      if (existing) existing.quantity = Math.min(existing.quantity + quantity, 99);
      else items.push({ variantId, quantity });
      await this.writeGuest(ctx.guestToken, items);
    }
    return this.view(ctx);
  }

  async setQuantity(ctx: CartContext, variantId: string, quantity: number): Promise<CartView> {
    if (ctx.userId) {
      await this.repo.setItem(ctx.userId, variantId, quantity);
    } else if (ctx.guestToken) {
      let items = await this.readRaw(ctx);
      if (quantity <= 0) items = items.filter((i) => i.variantId !== variantId);
      else {
        const existing = items.find((i) => i.variantId === variantId);
        if (existing) existing.quantity = quantity;
        else items.push({ variantId, quantity });
      }
      await this.writeGuest(ctx.guestToken, items);
    }
    return this.view(ctx);
  }

  async clear(ctx: CartContext): Promise<void> {
    if (ctx.userId) await this.repo.clear(ctx.userId);
    else if (ctx.guestToken) await this.redis.client.del(this.guestKey(ctx.guestToken));
  }

  /** Mescla o carrinho de convidado no do usuário ao logar (§6.3). */
  async mergeGuestIntoUser(guestToken: string, userId: string): Promise<void> {
    const json = await this.redis.client.get(this.guestKey(guestToken));
    if (!json) return;
    const guestItems = JSON.parse(json) as RawItem[];
    for (const item of guestItems) {
      try {
        await this.assertPurchasable(item.variantId);
        await this.repo.addQuantity(userId, item.variantId, item.quantity);
      } catch {
        // item obsoleto no carrinho de convidado — ignora
      }
    }
    await this.redis.client.del(this.guestKey(guestToken));
  }

  /** Carrinho enriquecido para exibição (§6.3): valida disponibilidade. */
  async view(ctx: CartContext): Promise<CartView> {
    const raw = await this.readRaw(ctx);
    if (raw.length === 0) return { items: [], subtotalCents: 0, count: 0 };

    const variants = await this.prisma.productVariant.findMany({
      where: { id: { in: raw.map((r) => r.variantId) } },
      include: { product: { select: { name: true, slug: true, status: true } }, inventory: true },
    });
    const byId = new Map(variants.map((v) => [v.id, v]));

    const lines: CartLine[] = [];
    for (const r of raw) {
      const v = byId.get(r.variantId);
      if (!v || v.product.status !== ProductStatus.Published) continue; // remove obsoletos
      const unit = Number(v.salePriceCents ?? v.priceCents);
      const available = v.inventory ? v.inventory.quantity - v.inventory.reserved : 0;
      lines.push({
        variantId: v.id,
        productId: v.productId,
        productSlug: v.product.slug,
        name: v.product.name,
        options: v.options,
        unitPriceCents: unit,
        quantity: r.quantity,
        available,
        inStock: available >= r.quantity,
        lineCents: unit * r.quantity,
      });
    }

    const subtotalCents = lines.reduce((sum, l) => sum + l.lineCents, 0);
    const count = lines.reduce((sum, l) => sum + l.quantity, 0);
    return { items: lines, subtotalCents, count };
  }
}
