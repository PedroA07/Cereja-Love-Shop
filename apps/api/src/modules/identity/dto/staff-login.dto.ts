import { IsEmail, IsString, Length, MaxLength } from 'class-validator';

/** Login de staff — 2FA (TOTP) é obrigatório (§6.8). */
export class StaffLoginDto {
  @IsEmail()
  @MaxLength(320)
  email!: string;

  @IsString()
  @MaxLength(128)
  password!: string;

  @IsString()
  @Length(6, 6)
  totp!: string;
}
