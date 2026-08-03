import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../infra/prisma/prisma.service';

/** Acesso ao carrinho persistido do cliente logado (§6.3). */
@Injectable()
export class CartRepository {
  constructor(private readonly prisma: PrismaService) {}

  async getOrCreate(userId: string) {
    const existing = await this.prisma.cart.findUnique({
      where: { userId },
      include: { items: true },
    });
    if (existing) return existing;
    return this.prisma.cart.create({ data: { userId }, include: { items: true } });
  }

  async setItem(userId: string, variantId: string, quantity: number): Promise<void> {
    const cart = await this.getOrCreate(userId);
    const item = cart.items.find((i) => i.variantId === variantId);
    if (quantity <= 0) {
      if (item) await this.prisma.cartItem.delete({ where: { id: item.id } });
      return;
    }
    if (item) {
      await this.prisma.cartItem.update({ where: { id: item.id }, data: { quantity } });
    } else {
      await this.prisma.cartItem.create({ data: { cartId: cart.id, variantId, quantity } });
    }
    await this.prisma.cart.update({ where: { id: cart.id }, data: { updatedAt: new Date() } });
  }

  async addQuantity(userId: string, variantId: string, delta: number): Promise<void> {
    const cart = await this.getOrCreate(userId);
    const item = cart.items.find((i) => i.variantId === variantId);
    const next = (item?.quantity ?? 0) + delta;
    await this.setItem(userId, variantId, Math.min(next, 99));
  }

  async clear(userId: string): Promise<void> {
    const cart = await this.prisma.cart.findUnique({ where: { userId } });
    if (cart) await this.prisma.cartItem.deleteMany({ where: { cartId: cart.id } });
  }

  async items(userId: string): Promise<{ variantId: string; quantity: number }[]> {
    const cart = await this.prisma.cart.findUnique({ where: { userId }, include: { items: true } });
    return (cart?.items ?? []).map((i) => ({ variantId: i.variantId, quantity: i.quantity }));
  }
}
