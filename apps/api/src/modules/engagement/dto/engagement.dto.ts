import { IsIn, IsInt, IsOptional, IsString, IsUUID, Max, MaxLength, Min } from 'class-validator';
import { ReviewStatus } from '@cereja/shared-types';

export class AddWishlistItemDto {
  @IsUUID()
  productId!: string;
}

export class CreateReviewDto {
  @IsUUID()
  productId!: string;

  @IsInt()
  @Min(1)
  @Max(5)
  rating!: number;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  comment?: string;
}

export class ModerateReviewDto {
  @IsIn([ReviewStatus.Approved, ReviewStatus.Rejected])
  status!: string;
}
