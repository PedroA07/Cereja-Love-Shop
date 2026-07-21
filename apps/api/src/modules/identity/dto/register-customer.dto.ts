import {
  IsBoolean,
  IsEmail,
  IsISO8601,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';
import { IsCpf } from '../validators/is-cpf.validator';
import { IsAdult } from '../validators/is-adult.validator';

/** Cadastro mínimo de cliente (§6.1). Endereço só no checkout. */
export class RegisterCustomerDto {
  @IsEmail({}, { message: 'E-mail inválido' })
  @MaxLength(320)
  email!: string;

  @IsString()
  @MinLength(10, { message: 'A senha deve ter ao menos 10 caracteres' })
  @MaxLength(128)
  password!: string;

  @IsString()
  @MinLength(2)
  @MaxLength(120)
  name!: string;

  @IsCpf()
  cpf!: string;

  @IsISO8601({ strict: true }, { message: 'Data de nascimento inválida (use AAAA-MM-DD)' })
  @IsAdult()
  birthDate!: string;

  @IsOptional()
  @IsString()
  @Matches(/^\+?[0-9\s()-]{8,20}$/, { message: 'Telefone inválido' })
  phone?: string;

  /** Consentimento obrigatório com os termos e a política de privacidade. */
  @IsBoolean()
  acceptedTerms!: boolean;

  /** Opt-in explícito de marketing (LGPD, §1.2) — padrão desligado. */
  @IsOptional()
  @IsBoolean()
  marketingConsent?: boolean;

  /** Opt-in explícito de perfilamento (LGPD) — só com consentimento. */
  @IsOptional()
  @IsBoolean()
  profilingConsent?: boolean;
}
