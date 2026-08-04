import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { OrderStatus, ProductStatus, ReviewStatus } from '@cereja/shared-types';
import { PrismaService } from '../../infra/prisma/prisma.service';

@Injectable()
export class EngagementService {
  constructor(private readonly prisma: PrismaService) {}

  // ---------------- wishlist ----------------

  private async getOrCreateWishlist(userId: string) {
    const existing = await this.prisma.wishlist.findFirst({ where: { userId } });
    if (existing) return existing;
    return this.prisma.wishlist.create({ data: { userId } });
  }

  async listWishlist(userId: string) {
    const wishlist = await this.getOrCreateWishlist(userId);
    const items = await this.prisma.wishlistItem.findMany({
      where: { wishlistId: wishlist.id },
      include: {
        product: {
          include: { variants: { include: { inventory: true } }, media: true },
        },
      },
    });

    return items
      .filter((i) => i.product.status === ProductStatus.Published)
      .map((i) => {
        const prices = i.product.variants.map((v) => Number(v.salePriceCents ?? v.priceCents));
        const stock = i.product.variants.reduce(
          (s, v) => s + (v.inventory ? v.inventory.quantity - v.inventory.reserved : 0),
          0,
        );
        return {
          productId: i.productId,
          name: i.product.name,
          slug: i.product.slug,
          brand: i.product.brand,
          isSensitiveMedia: i.product.isSensitiveMedia,
          fromPriceCents: prices.length ? Math.min(...prices) : 0,
          mediaCount: i.product.media.length,
          inStock: stock > 0,
        };
      });
  }

  async addToWishlist(userId: string, productId: string) {
    const product = await this.prisma.product.findUnique({ where: { id: productId } });
    if (!product) throw new NotFoundException('Produto não encontrado');

    const wishlist = await this.getOrCreateWishlist(userId);
    await this.prisma.wishlistItem.upsert({
      where: { wishlistId_productId: { wishlistId: wishlist.id, productId } },
      update: {},
      create: { wishlistId: wishlist.id, productId },
    });
    return this.listWishlist(userId);
  }

  async removeFromWishlist(userId: string, productId: string) {
    const wishlist = await this.getOrCreateWishlist(userId);
    await this.prisma.wishlistItem
      .delete({ where: { wishlistId_productId: { wishlistId: wishlist.id, productId } } })
      .catch(() => undefined);
    return this.listWishlist(userId);
  }

  // ---------------- avaliações ----------------

  /** Avaliações aprovadas de um produto (§6.8: moderação obrigatória). */
  async listApprovedReviews(productId: string) {
    const reviews = await this.prisma.review.findMany({
      where: { productId, status: ReviewStatus.Approved },
      include: { user: { select: { name: true } } },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    const average =
      reviews.length > 0
        ? Math.round((reviews.reduce((s, r) => s + r.rating, 0) / reviews.length) * 10) / 10
        : null;

    return {
      average,
      count: reviews.length,
      items: reviews.map((r) => ({
        id: r.id,
        rating: r.rating,
        comment: r.comment,
        // Primeiro nome apenas — discrição do cliente (§1.2)
        author: r.user?.name ? `${r.user.name.split(' ')[0]}` : 'Cliente',
        createdAt: r.createdAt,
      })),
    };
  }

  /**
   * Cria avaliação (§6.8). Exige compra confirmada do produto (evita spam) e
   * nasce como `pending` — só aparece na loja após moderação.
   */
  async createReview(userId: string, productId: string, rating: number, comment?: string) {
    const purchased = await this.prisma.orderItem.findFirst({
      where: {
        variant: { productId },
        order: {
          userId,
          status: {
            in: [
              OrderStatus.Paid,
              OrderStatus.Processing,
              OrderStatus.Shipped,
              OrderStatus.Delivered,
              OrderStatus.Completed,
            ],
          },
        },
      },
    });
    if (!purchased) {
      throw new BadRequestException('Só é possível avaliar produtos que você comprou');
    }

    const already = await this.prisma.review.findFirst({ where: { userId, productId } });
    if (already) throw new ConflictException('Você já avaliou este produto');

    const review = await this.prisma.review.create({
      data: { productId, userId, rating, comment: comment ?? null, status: ReviewStatus.Pending },
    });
    return { id: review.id, status: review.status };
  }

  async listMyReviews(userId: string) {
    const reviews = await this.prisma.review.findMany({
      where: { userId },
      include: { product: { select: { name: true, slug: true } } },
      orderBy: { createdAt: 'desc' },
    });
    return reviews.map((r) => ({
      id: r.id,
      rating: r.rating,
      comment: r.comment,
      status: r.status,
      product: r.product,
      createdAt: r.createdAt,
    }));
  }

  // ---------------- moderação (staff) ----------------

  async listPendingReviews(page = 1) {
    const pageSize = 20;
    const [items, total] = await Promise.all([
      this.prisma.review.findMany({
        where: { status: ReviewStatus.Pending },
        include: { product: { select: { name: true } }, user: { select: { name: true } } },
        orderBy: { createdAt: 'asc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.review.count({ where: { status: ReviewStatus.Pending } }),
    ]);

    return {
      items: items.map((r) => ({
        id: r.id,
        rating: r.rating,
        comment: r.comment,
        product: r.product.name,
        author: r.user?.name ?? 'Cliente',
        createdAt: r.createdAt,
      })),
      total,
      page,
      pageSize,
    };
  }

  async moderateReview(id: string, status: string) {
    const review = await this.prisma.review.findUnique({ where: { id } });
    if (!review) throw new NotFoundException('Avaliação não encontrada');
    const updated = await this.prisma.review.update({ where: { id }, data: { status } });
    return { id: updated.id, status: updated.status };
  }
}
