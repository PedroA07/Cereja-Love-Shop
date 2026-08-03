import { Controller, Get, Param, Query } from '@nestjs/common';
import { CatalogService } from './catalog.service';
import { ListProductsQueryDto } from './dto/list-products.dto';

/** Vitrine pública (§6.2). Só produtos publicados. */
@Controller('catalog')
export class CatalogController {
  constructor(private readonly catalog: CatalogService) {}

  @Get('categories')
  categories() {
    return this.catalog.listCategories();
  }

  @Get('products')
  list(@Query() query: ListProductsQueryDto) {
    return this.catalog.listPublished(query);
  }

  @Get('products/:slug')
  bySlug(@Param('slug') slug: string) {
    return this.catalog.getPublishedBySlug(slug);
  }
}
