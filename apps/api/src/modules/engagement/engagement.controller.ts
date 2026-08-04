import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, Min } from 'class-validator';
import { AuthType, CurrentUser, Public, RequirePermissions } from '../../common/auth/decorators';
import { JwtAuthGuard } from '../../common/auth/jwt-auth.guard';
import { PermissionsGuard } from '../../common/auth/permissions.guard';
import { AuditInterceptor } from '../../common/audit/audit.interceptor';
import type { AuthUser } from '../../common/auth/auth-user';
import { EngagementService } from './engagement.service';
import { AddWishlistItemDto, CreateReviewDto, ModerateReviewDto } from './dto/engagement.dto';

class PageQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;
}

/** Lista de desejos e avaliações do cliente (§6.8). */
@Controller('engagement')
@UseGuards(JwtAuthGuard)
@AuthType('customer')
export class EngagementController {
  constructor(private readonly engagement: EngagementService) {}

  @Get('wishlist')
  wishlist(@CurrentUser() user: AuthUser) {
    return this.engagement.listWishlist(user.id);
  }

  @Post('wishlist')
  addWishlist(@CurrentUser() user: AuthUser, @Body() dto: AddWishlistItemDto) {
    return this.engagement.addToWishlist(user.id, dto.productId);
  }

  @Delete('wishlist/:productId')
  removeWishlist(
    @CurrentUser() user: AuthUser,
    @Param('productId', ParseUUIDPipe) productId: string,
  ) {
    return this.engagement.removeFromWishlist(user.id, productId);
  }

  @Post('reviews')
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  createReview(@CurrentUser() user: AuthUser, @Body() dto: CreateReviewDto) {
    return this.engagement.createReview(user.id, dto.productId, dto.rating, dto.comment);
  }

  @Get('reviews/mine')
  myReviews(@CurrentUser() user: AuthUser) {
    return this.engagement.listMyReviews(user.id);
  }

  /** Avaliações aprovadas — público (exibidas na página do produto). */
  @Public()
  @Get('products/:productId/reviews')
  productReviews(@Param('productId', ParseUUIDPipe) productId: string) {
    return this.engagement.listApprovedReviews(productId);
  }
}

/** Moderação de avaliações no back-office (§6.8). */
@Controller('engagement/admin')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@UseInterceptors(AuditInterceptor)
@AuthType('staff')
export class EngagementAdminController {
  constructor(private readonly engagement: EngagementService) {}

  @Get('reviews/pending')
  @RequirePermissions('content:manage')
  pending(@Query() query: PageQueryDto) {
    return this.engagement.listPendingReviews(query.page ?? 1);
  }

  @Post('reviews/:id/moderate')
  @RequirePermissions('content:manage')
  moderate(@Param('id', ParseUUIDPipe) id: string, @Body() dto: ModerateReviewDto) {
    return this.engagement.moderateReview(id, dto.status);
  }
}
