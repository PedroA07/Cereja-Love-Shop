import { IsIn, IsInt, IsOptional, IsString, MaxLength, Min } from 'class-validator';
import { StockMovementType } from '@cereja/shared-types';

/** Ajuste de estoque via ledger (§6.2). Quantidade sempre positiva; o tipo
 *  define se soma (entrada/ajuste+) ou subtrai (saida). */
export class AdjustStockDto {
  @IsIn([StockMovementType.Entrada, StockMovementType.Saida, StockMovementType.Ajuste])
  type!: 'entrada' | 'saida' | 'ajuste';

  @IsInt()
  @Min(1)
  quantity!: number;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  reason?: string;
}
