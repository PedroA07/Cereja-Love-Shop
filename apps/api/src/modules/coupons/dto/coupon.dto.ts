import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsIn,
  IsInt,
  IsISO8601,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  MaxLength,
  Min,
} from 'class-validator';
import { CouponDiscountType, CouponScope } from '@cereja/shared-types';

export class CreateCouponDto {
  /** Código digitado pelo cliente (case-insensitive, guardado em maiúsculas). */
  @IsString()
  @Matches(/^[A-Za-z0-9_-]{3,32}$/, { message: 'Código deve ter 3–32 caracteres alfanuméricos' })
  code!: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  name?: string;

  @IsIn(Object.values(CouponDiscountType))
  discountType!: string;

  /** Percentual (ex.: 15) ou centavos, conforme o tipo. */
  @IsInt()
  @Min(0)
  value!: number;

  /** Teto do desconto em percentuais (§6.7). */
  @IsOptional()
  @IsInt()
  @Min(0)
  maxDiscountCents?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  minOrderCents?: number;

  @IsOptional()
  @IsIn(Object.values(CouponScope))
  scope?: string;

  /** Produtos ou categorias no escopo (quando scope != cart). */
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  productIds?: string[];

  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  categoryIds?: string[];

  @IsOptional()
  @IsBoolean()
  firstPurchaseOnly?: boolean;

  @IsOptional()
  @IsBoolean()
  combinable?: boolean;

  /** Limite global de usos. Ausente = ilimitado. */
  @IsOptional()
  @IsInt()
  @Min(1)
  usageLimit?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  usageLimitPerUser?: number;

  @IsOptional()
  @IsISO8601()
  validFrom?: string;

  @IsOptional()
  @IsISO8601()
  validUntil?: string;
}

export class PreviewCouponDto {
  @IsString()
  @MaxLength(32)
  code!: string;

  /** Convidado: e-mail usado para checar limite por pessoa. */
  @IsOptional()
  @IsString()
  @MaxLength(320)
  guestEmail?: string;
}

export class ListCouponsQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;
}
