import { IsEmail, IsIn, IsInt, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';
import { PaymentMethod } from '@cereja/shared-types';

export class CreatePaymentDto {
  @IsIn(Object.values(PaymentMethod))
  method!: PaymentMethod;

  /** Convidado: e-mail usado no pedido (autoriza a operação). */
  @IsOptional()
  @IsEmail()
  guestEmail?: string;

  /** Cartão: token opaco gerado no browser (PCI SAQ-A) — nunca o número. */
  @IsOptional()
  @IsString()
  @MaxLength(200)
  cardToken?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(12)
  installments?: number;
}
