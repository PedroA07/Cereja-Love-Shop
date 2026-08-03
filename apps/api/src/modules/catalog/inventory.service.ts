import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { StockMovementType } from '@cereja/shared-types';
import { PrismaService } from '../../infra/prisma/prisma.service';

export interface StockResult {
  variantId: string;
  quantity: number;
  reserved: number;
  available: number;
  version: number;
}

/**
 * Estoque como ledger imutável com lock otimista (§6.2). Nunca sobrescreve a
 * quantidade "na mão": toda mudança é um UPDATE condicional atômico + um
 * registro em stock_movements, na mesma transação. Sob concorrência, o saldo
 * nunca fica negativo.
 */
@Injectable()
export class InventoryService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Aplica uma movimentação. `type` entrada/ajuste soma; saida subtrai.
   * O UPDATE usa `version` para detectar concorrência e `quantity >= delta`
   * para nunca deixar o saldo negativo.
   */
  async adjust(
    variantId: string,
    type: 'entrada' | 'saida' | 'ajuste',
    quantity: number,
    reason?: string,
    staffId?: string,
  ): Promise<StockResult> {
    if (quantity <= 0) throw new BadRequestException('Quantidade deve ser positiva');
    const delta = type === StockMovementType.Saida ? -quantity : quantity;

    return this.prisma.$transaction(async (tx) => {
      // UPDATE condicional atômico (§6.2): o lock de linha do Postgres serializa
      // as concorrentes e a condição `quantity + delta >= 0` impede saldo
      // negativo — sem falhas espúrias de concorrência.
      const affected = await tx.$executeRaw`
        UPDATE inventory
           SET quantity = quantity + ${delta}, version = version + 1
         WHERE variant_id = ${variantId}::uuid
           AND quantity + ${delta} >= 0`;

      if (affected === 0) {
        const inv = await tx.inventory.findUnique({ where: { variantId } });
        if (!inv) throw new NotFoundException('Variante sem registro de estoque');
        throw new BadRequestException('Estoque insuficiente para a saída');
      }

      await tx.stockMovement.create({
        data: { variantId, type, quantity, reason: reason ?? null, staffId: staffId ?? null },
      });

      const fresh = await tx.inventory.findUniqueOrThrow({ where: { variantId } });
      return {
        variantId,
        quantity: fresh.quantity,
        reserved: fresh.reserved,
        available: fresh.quantity - fresh.reserved,
        version: fresh.version,
      };
    });
  }

  async get(variantId: string): Promise<StockResult> {
    const inv = await this.prisma.inventory.findUnique({ where: { variantId } });
    if (!inv) throw new NotFoundException('Estoque não encontrado');
    return {
      variantId,
      quantity: inv.quantity,
      reserved: inv.reserved,
      available: inv.quantity - inv.reserved,
      version: inv.version,
    };
  }

  listMovements(variantId: string) {
    return this.prisma.stockMovement.findMany({
      where: { variantId },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
  }
}
