import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsEmail,
  IsIn,
  IsOptional,
  IsString,
  Length,
  MaxLength,
  MinLength,
  ValidateNested,
} from 'class-validator';

export class AddressDto {
  @IsString()
  @Length(8, 9)
  zipCode!: string;

  @IsString()
  @MinLength(2)
  @MaxLength(160)
  street!: string;

  @IsString()
  @MaxLength(20)
  number!: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  complement?: string;

  @IsString()
  @MaxLength(80)
  district!: string;

  @IsString()
  @MaxLength(80)
  city!: string;

  @IsString()
  @Length(2, 2)
  state!: string;

  @IsString()
  @MinLength(2)
  @MaxLength(120)
  recipientName!: string;
}

/** Checkout de convidado é first-class (§6.4): só e-mail + dados da compra. */
export class CreateOrderDto {
  @IsOptional()
  @IsEmail()
  @MaxLength(320)
  guestEmail?: string;

  @ValidateNested()
  @Type(() => AddressDto)
  address!: AddressDto;

  @IsIn(['standard', 'express'])
  shippingCode!: string;

  /** Aceite da política de devolução (arrependimento + exceção sanitária). */
  @IsBoolean()
  acceptedReturnPolicy!: boolean;
}
