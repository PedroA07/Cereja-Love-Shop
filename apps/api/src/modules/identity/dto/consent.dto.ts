import { IsBoolean, IsIn, IsString } from 'class-validator';
import { ConsentPurpose } from '@cereja/shared-types';

export class ConsentDto {
  @IsIn(Object.values(ConsentPurpose))
  purpose!: ConsentPurpose;

  @IsBoolean()
  granted!: boolean;
}

export class VerifyEmailDto {
  @IsString()
  token!: string;
}

export class ConfirmTotpDto {
  @IsString()
  code!: string;
}
