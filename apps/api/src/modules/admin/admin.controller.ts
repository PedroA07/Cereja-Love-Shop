import {
  Body,
  Controller,
  Get,
  NotFoundException,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';
import { Type } from 'class-transformer';
import { IsInt, Min } from 'class-validator';
import { OrderStatus } from '@cereja/shared-types';
import { AuthType, RequirePermissions } from '../../common/auth/decorators';
import { JwtAuthGuard } from '../../common/auth/jwt-auth.guard';
import { PermissionsGuard } from '../../common/auth/permissions.guard';
import { AuditInterceptor } from '../../common/audit/audit.interceptor';
import { CheckoutService } from '../checkout/checkout.service';
import { AdminService } from './admin.service';
import { AuditService } from './audit.service';

class ListQueryDto {
  @IsOptional()
  @IsString()
  @MaxLength(40)
  status?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  q?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;
}

class TransitionOrderDto {
  @IsIn(Object.values(OrderStatus))
  status!: string;
}

/** Back-office (§6.8): tudo protegido por RBAC e auditado. */
@Controller('admin')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@UseInterceptors(AuditInterceptor)
@AuthType('staff')
export class AdminController {
  constructor(
    private readonly admin: AdminService,
    private readonly audit: AuditService,
    private readonly checkout: CheckoutService,
  ) {}

  @Get('dashboard')
  @RequirePermissions('report:read')
  dashboard() {
    return this.admin.dashboard();
  }

  // ---- pedidos ----
  @Get('orders')
  @RequirePermissions('order:read')
  listOrders(@Query() query: ListQueryDto) {
    return this.admin.listOrders(query);
  }

  @Get('orders/:id')
  @RequirePermissions('order:read')
  async getOrder(@Param('id', ParseUUIDPipe) id: string) {
    const order = await this.admin.getOrder(id);
    if (!order) throw new NotFoundException('Pedido não encontrado');
    return order;
  }

  @Post('orders/:id/status')
  @RequirePermissions('order:update')
  transition(@Param('id', ParseUUIDPipe) id: string, @Body() dto: TransitionOrderDto) {
    return this.checkout.transition(id, dto.status as OrderStatus);
  }

  // ---- produtos (listagem inclui rascunhos) ----
  @Get('products')
  @RequirePermissions('product:update')
  listProducts(@Query() query: ListQueryDto) {
    return this.admin.listProducts(query);
  }

  // ---- auditoria ----
  @Get('audit')
  @RequirePermissions('user:manage')
  listAudit(@Query() query: ListQueryDto) {
    return this.audit.list({ page: query.page, action: query.q, entity: query.status });
  }
}
