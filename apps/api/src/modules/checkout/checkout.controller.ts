import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  Req,
  Res,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import type { Request, Response } from 'express';
import { OptionalJwtAuthGuard } from '../../common/auth/optional-jwt-auth.guard';
import type { AuthUser } from '../../common/auth/auth-user';
import { CART_COOKIE, newCartToken, setCartCookie } from '../cart/cart.cookie';
import type { CartContext } from '../cart/cart.service';
import { CheckoutService } from './checkout.service';
import { CreateOrderDto } from './dto/create-order.dto';

@Controller('checkout')
@UseGuards(OptionalJwtAuthGuard)
export class CheckoutController {
  constructor(private readonly checkout: CheckoutService) {}

  private cartContext(req: Request, res: Response): { ctx: CartContext; userId?: string } {
    const user = (req as Request & { user?: AuthUser }).user;
    if (user?.type === 'customer') return { ctx: { userId: user.id }, userId: user.id };
    let token = req.cookies?.[CART_COOKIE] as string | undefined;
    if (!token) {
      token = newCartToken();
      setCartCookie(res, token);
    }
    return { ctx: { guestToken: token } };
  }

  /** Cria o pedido e reserva o estoque (§6.4). Convidado é first-class. */
  @Post('orders')
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  async create(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
    @Body() dto: CreateOrderDto,
  ) {
    const { ctx, userId } = this.cartContext(req, res);
    return this.checkout.createOrder(ctx, dto, userId);
  }

  /** Consulta do pedido: cliente pelo token; convidado pelo e-mail informado. */
  @Get('orders/:id')
  async find(
    @Req() req: Request,
    @Param('id', ParseUUIDPipe) id: string,
    @Query('email') email?: string,
  ) {
    const user = (req as Request & { user?: AuthUser }).user;
    return this.checkout.findForCustomer(id, user?.type === 'customer' ? user.id : undefined, email);
  }

  /** Histórico de pedidos do cliente logado. */
  @Get('orders')
  async list(@Req() req: Request) {
    const user = (req as Request & { user?: AuthUser }).user;
    if (user?.type !== 'customer') throw new UnauthorizedException('Login necessário');
    return this.checkout.listForCustomer(user.id);
  }
}
