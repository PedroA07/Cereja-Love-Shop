import { Module } from '@nestjs/common';
import { EngagementAdminController, EngagementController } from './engagement.controller';
import { EngagementService } from './engagement.service';

/** Bounded context de engajamento (§3/§6.8): wishlist e avaliações moderadas. */
@Module({
  controllers: [EngagementController, EngagementAdminController],
  providers: [EngagementService],
  exports: [EngagementService],
})
export class EngagementModule {}
