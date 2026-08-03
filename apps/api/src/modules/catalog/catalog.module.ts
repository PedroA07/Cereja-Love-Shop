import { Module } from '@nestjs/common';
import { CatalogController } from './catalog.controller';
import { CatalogAdminController } from './catalog-admin.controller';
import { CatalogService } from './catalog.service';
import { InventoryService } from './inventory.service';
import { CatalogRepository } from './catalog.repository';

/**
 * Bounded context de catálogo (§3/§6.2): produtos, variantes, categorias,
 * mídia, workflow de publicação e estoque como ledger com lock otimista.
 */
@Module({
  controllers: [CatalogController, CatalogAdminController],
  providers: [CatalogService, InventoryService, CatalogRepository],
  exports: [CatalogService, InventoryService],
})
export class CatalogModule {}
