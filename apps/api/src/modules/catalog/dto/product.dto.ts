import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsInt,
  IsObject,
  IsOptional,
  IsPositive,
  IsString,
  Matches,
  MaxLength,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';

export class CreateVariantDto {
  @IsString()
  @MinLength(1)
  @MaxLength(64)
  sku!: string;

  /** Preço em centavos (inteiro, §10). */
  @IsInt()
  @IsPositive()
  priceCents!: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  salePriceCents?: number;

  @IsOptional()
  @IsObject()
  options?: Record<string, unknown>;

  /** Estoque inicial (entrada no ledger). */
  @IsOptional()
  @IsInt()
  @Min(0)
  initialStock?: number;

  @IsOptional()
  @IsString()
  @MaxLength(64)
  barcode?: string;
}

export class CreateProductDto {
  @IsString()
  @MinLength(2)
  @MaxLength(160)
  name!: string;

  @IsString()
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, { message: 'slug deve ser kebab-case' })
  @MaxLength(180)
  slug!: string;

  @IsOptional()
  @IsString()
  @MaxLength(4000)
  description?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  brand?: string;

  @IsOptional()
  @IsObject()
  attributes?: Record<string, unknown>;

  /** Slug da categoria (§5 não tem FK; guardamos como faceta em attributes). */
  @IsOptional()
  @IsString()
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, { message: 'categorySlug deve ser kebab-case' })
  categorySlug?: string;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreateVariantDto)
  variants!: CreateVariantDto[];
}

export class UpdateProductDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(160)
  name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(4000)
  description?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  brand?: string;

  @IsOptional()
  @IsObject()
  attributes?: Record<string, unknown>;
}
