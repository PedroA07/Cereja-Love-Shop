import { Module } from '@nestjs/common';
import { CartModule } from '../cart/cart.module';
import { CouponsAdminController, CouponsController } from './coupons.controller';
import { CouponsService } from './coupons.service';

/** Bounded context de cupons (§3/§6.7): motor de regras + resgate atômico. */
@Module({
  imports: [CartModule],
  controllers: [CouponsController, CouponsAdminController],
  providers: [CouponsService],
  exports: [CouponsService],
})
export class CouponsModule {}
