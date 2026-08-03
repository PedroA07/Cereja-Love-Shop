import { IsOptional, IsString, IsUUID, Matches, MaxLength, MinLength } from 'class-validator';

export class CreateCategoryDto {
  @IsString()
  @MinLength(2)
  @MaxLength(80)
  name!: string;

  @IsString()
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
    message: 'slug deve ser kebab-case (ex.: lingerie-plus-size)',
  })
  @MaxLength(100)
  slug!: string;

  @IsOptional()
  @IsUUID()
  parentId?: string;
}
