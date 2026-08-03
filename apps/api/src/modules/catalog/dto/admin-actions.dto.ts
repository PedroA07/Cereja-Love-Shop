import { IsIn, IsInt, IsOptional, IsUrl, Min } from 'class-validator';
import { ProductStatus } from '@cereja/shared-types';

export class ChangeStatusDto {
  @IsIn(Object.values(ProductStatus))
  status!: string;
}

export class AddMediaDto {
  @IsUrl({ require_tld: false }, { message: 'url inválida' })
  url!: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  position?: number;
}
