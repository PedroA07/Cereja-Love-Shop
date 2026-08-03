import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { OptionalJwtAuthGuard } from '../../common/auth/optional-jwt-auth.guard';
import type { AuthUser } from '../../common/auth/auth-user';
import { CartService, type CartContext } from './cart.service';
import { AddCartItemDto, UpdateCartItemDto } from './dto/cart.dto';
import { CART_COOKIE, clearCartCookie, newCartToken, setCartCookie } from './cart.cookie';

@Controller('cart')
@UseGuards(OptionalJwtAuthGuard)
export class CartController {
  constructor(private readonly cart: CartService) {}

  /**
   * Resolve o contexto do carrinho. Cliente logado → carrinho no banco; e se
   * houver carrinho de convidado pendente, mescla automaticamente e limpa o
   * cookie (§6.3). Visitante → carrinho de convidado (cria token se preciso).
   */
  private async context(req: Request, res: Response): Promise<CartContext> {
    const user = (req as Request & { user?: AuthUser }).user;
    if (user?.type === 'customer') {
      const guestToken = req.cookies?.[CART_COOKIE] as string | undefined;
      if (guestToken) {
        await this.cart.mergeGuestIntoUser(guestToken, user.id);
        clearCartCookie(res);
      }
      return { userId: user.id };
    }
    let token = req.cookies?.[CART_COOKIE] as string | undefined;
    if (!token) {
      token = newCartToken();
      setCartCookie(res, token);
    }
    return { guestToken: token };
  }

  @Get()
  async view(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    return this.cart.view(await this.context(req, res));
  }

  @Post('items')
  async add(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
    @Body() dto: AddCartItemDto,
  ) {
    return this.cart.add(await this.context(req, res), dto.variantId, dto.quantity);
  }

  @Patch('items/:variantId')
  async update(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
    @Param('variantId', ParseUUIDPipe) variantId: string,
    @Body() dto: UpdateCartItemDto,
  ) {
    return this.cart.setQuantity(await this.context(req, res), variantId, dto.quantity);
  }

  @Delete('items/:variantId')
  async remove(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
    @Param('variantId', ParseUUIDPipe) variantId: string,
  ) {
    return this.cart.setQuantity(await this.context(req, res), variantId, 0);
  }

  @Delete()
  @HttpCode(HttpStatus.NO_CONTENT)
  async clear(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    await this.cart.clear(await this.context(req, res));
  }
}
