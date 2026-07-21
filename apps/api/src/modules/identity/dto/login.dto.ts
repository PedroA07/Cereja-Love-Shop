import { IsEmail, IsOptional, IsString, Length, MaxLength } from 'class-validator';

export class LoginDto {
  @IsEmail()
  @MaxLength(320)
  email!: string;

  @IsString()
  @MaxLength(128)
  password!: string;

  /** Código TOTP de 6 dígitos, se o cliente tiver 2FA ativo. */
  @IsOptional()
  @IsString()
  @Length(6, 6)
  totp?: string;
}
