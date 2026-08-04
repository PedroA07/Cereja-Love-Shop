import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  Req,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { AuditInterceptor } from '../../common/audit/audit.interceptor';
import { Throttle } from '@nestjs/throttler';
import type { Request } from 'express';
import { AuthType, CurrentUser, RequirePermissions } from '../../common/auth/decorators';
import { JwtAuthGuard } from '../../common/auth/jwt-auth.guard';
import { OptionalJwtAuthGuard } from '../../common/auth/optional-jwt-auth.guard';
import { PermissionsGuard } from '../../common/auth/permissions.guard';
import type { AuthUser } from '../../common/auth/auth-user';
import { CART_COOKIE } from '../cart/cart.cookie';
import { CartService } from '../cart/cart.service';
import { ShippingService } from '../shipping/shipping.service';
import { CouponsService } from './coupons.service';
import { CreateCouponDto, ListCouponsQueryDto, PreviewCouponDto } from './dto/coupon.dto';

/** Aplicação de cupom pelo cliente (simulação, sem consumir o limite). */
@Controller('coupons')
@UseGuards(OptionalJwtAuthGuard)
export class CouponsController {
  constructor(
    private readonly coupons: CouponsService,
    private readonly cart: CartService,
    private readonly shipping: ShippingService,
  ) {}

  @Post('preview')
  // Rate limit apertado: evita força bruta em códigos de cupom (§8)
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  async preview(@Req() req: Request, @Body() dto: PreviewCouponDto) {
    const user = (req as Request & { user?: AuthUser }).user;
    const ctx =
      user?.type === 'customer'
        ? { userId: user.id }
        : { guestToken: req.cookies?.[CART_COOKIE] as string | undefined };

    const view = await this.cart.view(ctx);
    const quote = this.shipping.quote({ state: null, subtotalCents: view.subtotalCents })[0];

    return this.coupons.preview({
      code: dto.code,
      lines: view.items.map((i) => ({ productId: i.productId, lineCents: i.lineCents })),
      subtotalCents: view.subtotalCents,
      shippingCents: quote?.priceCents ?? 0,
      userId: user?.type === 'customer' ? user.id : undefined,
      guestEmail: dto.guestEmail,
    });
  }
}

/** Gestão de cupons no back-office (§6.7) — exige permissão coupon:manage. */
@Controller('coupons/admin')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@UseInterceptors(AuditInterceptor)
@AuthType('staff')
export class CouponsAdminController {
  constructor(private readonly coupons: CouponsService) {}

  @Post()
  @RequirePermissions('coupon:manage')
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateCouponDto) {
    return this.coupons.create(dto, user.id);
  }

  @Get()
  @RequirePermissions('coupon:manage')
  list(@Query() query: ListCouponsQueryDto) {
    return this.coupons.list(query.page ?? 1);
  }

  @Post(':id/activate')
  @RequirePermissions('coupon:manage')
  activate(@Param('id', ParseUUIDPipe) id: string) {
    return this.coupons.setActive(id, true);
  }

  @Post(':id/deactivate')
  @RequirePermissions('coupon:manage')
  deactivate(@Param('id', ParseUUIDPipe) id: string) {
    return this.coupons.setActive(id, false);
  }
}
