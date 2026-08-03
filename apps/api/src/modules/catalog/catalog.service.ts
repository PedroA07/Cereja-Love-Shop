import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { PRODUCT_TRANSITIONS, ProductStatus, type ProductStatus as Status } from '@cereja/shared-types';
import { PrismaService } from '../../infra/prisma/prisma.service';
import { CatalogRepository } from './catalog.repository';
import { CreateCategoryDto } from './dto/category.dto';
import { CreateProductDto, UpdateProductDto } from './dto/product.dto';
import { ListProductsQueryDto } from './dto/list-products.dto';
import { mapProductCard, mapProductDetail } from './catalog.mapper';

@Injectable()
export class CatalogService {
  constructor(
    private readonly repo: CatalogRepository,
    private readonly prisma: PrismaService,
  ) {}

  // -------- categorias --------
  async createCategory(dto: CreateCategoryDto) {
    if (await this.repo.findCategoryBySlug(dto.slug)) {
      throw new ConflictException('Já existe categoria com esse slug');
    }
    return this.repo.createCategory(dto);
  }

  listCategories() {
    return this.repo.listCategories();
  }

  // -------- vitrine pública --------
  async listPublished(query: ListProductsQueryDto) {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 12;
    const { items, total } = await this.repo.listPublished({
      q: query.q,
      category: query.category,
      sort: query.sort,
      skip: (page - 1) * pageSize,
      take: pageSize,
    });

    let cards = items.map(mapProductCard);
    if (query.sort === 'price_asc') cards = cards.sort((a, b) => a.fromPriceCents - b.fromPriceCents);
    if (query.sort === 'price_desc') cards = cards.sort((a, b) => b.fromPriceCents - a.fromPriceCents);

    return { items: cards, total, page, pageSize, pages: Math.ceil(total / pageSize) };
  }

  async getPublishedBySlug(slug: string) {
    const product = await this.repo.findProductBySlug(slug);
    if (!product || product.status !== ProductStatus.Published) {
      throw new NotFoundException('Produto não encontrado');
    }
    return mapProductDetail(product);
  }

  // -------- admin --------
  async getByIdForAdmin(id: string) {
    const product = await this.repo.findProductById(id);
    if (!product) throw new NotFoundException('Produto não encontrado');
    return mapProductDetail(product);
  }

  async createProduct(dto: CreateProductDto, staffId?: string) {
    if (await this.repo.slugExists(dto.slug)) {
      throw new ConflictException('Já existe produto com esse slug');
    }
    const skus = dto.variants.map((v) => v.sku);
    if (new Set(skus).size !== skus.length) {
      throw new BadRequestException('SKUs duplicados no mesmo produto');
    }
    if (dto.categorySlug && !(await this.repo.findCategoryBySlug(dto.categorySlug))) {
      throw new BadRequestException('Categoria informada não existe');
    }

    const attributes = {
      ...(dto.attributes ?? {}),
      ...(dto.categorySlug ? { category: dto.categorySlug } : {}),
    } as Prisma.InputJsonValue;

    const initialBySku = new Map(dto.variants.map((v) => [v.sku, v.initialStock ?? 0]));

    const product = await this.prisma.$transaction(async (tx) => {
      const created = await tx.product.create({
        data: {
          name: dto.name,
          slug: dto.slug,
          description: dto.description ?? null,
          brand: dto.brand ?? null,
          attributes,
          status: ProductStatus.Draft,
          variants: {
            create: dto.variants.map((v) => ({
              sku: v.sku,
              priceCents: BigInt(v.priceCents),
              salePriceCents: v.salePriceCents != null ? BigInt(v.salePriceCents) : null,
              options: (v.options ?? {}) as Prisma.InputJsonValue,
              barcode: v.barcode ?? null,
              inventory: { create: { quantity: v.initialStock ?? 0 } },
            })),
          },
        },
        include: { variants: { include: { inventory: true } }, media: true },
      });

      // Ledger: registra a entrada inicial de estoque (§6.2)
      for (const variant of created.variants) {
        const initial = initialBySku.get(variant.sku) ?? 0;
        if (initial > 0) {
          await tx.stockMovement.create({
            data: {
              variantId: variant.id,
              type: 'entrada',
              quantity: initial,
              reason: 'estoque inicial',
              staffId: staffId ?? null,
            },
          });
        }
      }
      return created;
    });

    return mapProductDetail(product);
  }

  async updateProduct(id: string, dto: UpdateProductDto) {
    const existing = await this.repo.findProductById(id);
    if (!existing) throw new NotFoundException('Produto não encontrado');
    const data: Prisma.ProductUpdateInput = {};
    if (dto.name !== undefined) data.name = dto.name;
    if (dto.description !== undefined) data.description = dto.description;
    if (dto.brand !== undefined) data.brand = dto.brand;
    if (dto.attributes !== undefined) {
      data.attributes = {
        ...((existing.attributes ?? {}) as Record<string, unknown>),
        ...dto.attributes,
      } as Prisma.InputJsonValue;
    }
    const updated = await this.repo.updateProduct(id, data);
    return mapProductDetail(updated);
  }

  /** Workflow de publicação (§6.2): draft → review → published → archived. */
  async changeStatus(id: string, next: Status) {
    const product = await this.repo.findProductById(id);
    if (!product) throw new NotFoundException('Produto não encontrado');
    const current = product.status as Status;
    if (!PRODUCT_TRANSITIONS[current]?.includes(next)) {
      throw new BadRequestException(`Transição inválida: ${current} → ${next}`);
    }
    const updated = await this.repo.updateProduct(id, { status: next });
    return mapProductDetail(updated);
  }

  async addMedia(productId: string, url: string, position = 0) {
    const product = await this.repo.findProductById(productId);
    if (!product) throw new NotFoundException('Produto não encontrado');
    await this.prisma.productMedia.create({ data: { productId, url, position } });
    return this.getByIdForAdmin(productId);
  }
}
