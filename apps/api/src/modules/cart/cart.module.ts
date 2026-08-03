import { Module } from '@nestjs/common';
import { CartController } from './cart.controller';
import { CartService } from './cart.service';
import { CartRepository } from './cart.repository';

/** Bounded context de carrinho (§3/§6.3): convidado no Redis, logado no banco. */
@Module({
  controllers: [CartController],
  providers: [CartService, CartRepository],
  exports: [CartService],
})
export class CartModule {}
