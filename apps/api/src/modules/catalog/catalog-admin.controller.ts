import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Post, UseGuards } from '@nestjs/common';
import type { ProductStatus } from '@cereja/shared-types';
import { AuthType, CurrentUser, RequirePermissions } from '../../common/auth/decorators';
import { JwtAuthGuard } from '../../common/auth/jwt-auth.guard';
import { PermissionsGuard } from '../../common/auth/permissions.guard';
import type { AuthUser } from '../../common/auth/auth-user';
import { CatalogService } from './catalog.service';
import { InventoryService } from './inventory.service';
import { CreateCategoryDto } from './dto/category.dto';
import { CreateProductDto, UpdateProductDto } from './dto/product.dto';
import { AdjustStockDto } from './dto/inventory.dto';
import { ChangeStatusDto, AddMediaDto } from './dto/admin-actions.dto';

/** Back-office de catálogo (§6.2/§6.8) — protegido por RBAC. */
@Controller('catalog/admin')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@AuthType('staff')
export class CatalogAdminController {
  constructor(
    private readonly catalog: CatalogService,
    private readonly inventory: InventoryService,
  ) {}

  @Post('categories')
  @RequirePermissions('product:update')
  createCategory(@Body() dto: CreateCategoryDto) {
    return this.catalog.createCategory(dto);
  }

  @Post('products')
  @RequirePermissions('product:create')
  createProduct(@CurrentUser() user: AuthUser, @Body() dto: CreateProductDto) {
    return this.catalog.createProduct(dto, user.id);
  }

  @Get('products/:id')
  @RequirePermissions('product:update')
  getProduct(@Param('id', ParseUUIDPipe) id: string) {
    return this.catalog.getByIdForAdmin(id);
  }

  @Patch('products/:id')
  @RequirePermissions('product:update')
  updateProduct(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateProductDto) {
    return this.catalog.updateProduct(id, dto);
  }

  @Post('products/:id/status')
  @RequirePermissions('product:publish')
  changeStatus(@Param('id', ParseUUIDPipe) id: string, @Body() dto: ChangeStatusDto) {
    return this.catalog.changeStatus(id, dto.status as ProductStatus);
  }

  @Post('products/:id/media')
  @RequirePermissions('product:update')
  addMedia(@Param('id', ParseUUIDPipe) id: string, @Body() dto: AddMediaDto) {
    return this.catalog.addMedia(id, dto.url, dto.position ?? 0);
  }

  @Post('variants/:variantId/stock')
  @RequirePermissions('inventory:manage')
  adjustStock(
    @CurrentUser() user: AuthUser,
    @Param('variantId', ParseUUIDPipe) variantId: string,
    @Body() dto: AdjustStockDto,
  ) {
    return this.inventory.adjust(variantId, dto.type, dto.quantity, dto.reason, user.id);
  }

  @Get('variants/:variantId/stock')
  @RequirePermissions('inventory:manage')
  async stock(@Param('variantId', ParseUUIDPipe) variantId: string) {
    const [current, movements] = await Promise.all([
      this.inventory.get(variantId),
      this.inventory.listMovements(variantId),
    ]);
    return { current, movements };
  }
}
