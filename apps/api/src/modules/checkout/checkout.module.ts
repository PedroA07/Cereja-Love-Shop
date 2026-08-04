import { Module } from '@nestjs/common';
import { CatalogModule } from '../catalog/catalog.module';
import { CartModule } from '../cart/cart.module';
import { CouponsModule } from '../coupons/coupons.module';
import { CheckoutController } from './checkout.controller';
import { CheckoutService } from './checkout.service';
import { ReservationCleanupJob } from './reservation-cleanup.job';

/**
 * Bounded context de checkout (§3/§6.4): ciclo de vida do pedido, reserva
 * atômica de estoque e liberação por timeout.
 */
@Module({
  imports: [CatalogModule, CartModule, CouponsModule],
  controllers: [CheckoutController],
  providers: [CheckoutService, ReservationCleanupJob],
  exports: [CheckoutService],
})
export class CheckoutModule {}
