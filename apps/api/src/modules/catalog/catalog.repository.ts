import { Injectable } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { PrismaService } from '../../infra/prisma/prisma.service';

const productInclude = {
  variants: { include: { inventory: true } },
  media: true,
} satisfies Prisma.ProductInclude;

@Injectable()
export class CatalogRepository {
  constructor(private readonly prisma: PrismaService) {}

  // -------- categorias --------
  createCategory(data: { name: string; slug: string; parentId?: string }) {
    return this.prisma.category.create({ data });
  }

  listCategories() {
    return this.prisma.category.findMany({ orderBy: { name: 'asc' } });
  }

  findCategoryBySlug(slug: string) {
    return this.prisma.category.findUnique({ where: { slug } });
  }

  // -------- produtos --------
  findProductBySlug(slug: string) {
    return this.prisma.product.findUnique({ where: { slug }, include: productInclude });
  }

  findProductById(id: string) {
    return this.prisma.product.findUnique({ where: { id }, include: productInclude });
  }

  slugExists(slug: string): Promise<boolean> {
    return this.prisma.product
      .findUnique({ where: { slug }, select: { id: true } })
      .then((p) => p !== null);
  }

  createProduct(data: Prisma.ProductCreateInput) {
    return this.prisma.product.create({ data, include: productInclude });
  }

  updateProduct(id: string, data: Prisma.ProductUpdateInput) {
    return this.prisma.product.update({ where: { id }, data, include: productInclude });
  }

  async listPublished(params: {
    q?: string;
    category?: string;
    sort?: 'recent' | 'price_asc' | 'price_desc';
    skip: number;
    take: number;
  }) {
    const where: Prisma.ProductWhereInput = { status: 'published' };
    if (params.q) {
      where.OR = [
        { name: { contains: params.q, mode: 'insensitive' } },
        { description: { contains: params.q, mode: 'insensitive' } },
        { brand: { contains: params.q, mode: 'insensitive' } },
      ];
    }
    if (params.category) {
      where.attributes = { path: ['category'], equals: params.category };
    }

    const [items, total] = await Promise.all([
      this.prisma.product.findMany({
        where,
        include: productInclude,
        orderBy: { createdAt: 'desc' },
        skip: params.skip,
        take: params.take,
      }),
      this.prisma.product.count({ where }),
    ]);
    return { items, total };
  }
}
