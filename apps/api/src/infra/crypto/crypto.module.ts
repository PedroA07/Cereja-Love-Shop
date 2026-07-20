import { Global, Module } from '@nestjs/common';
import { ColumnCryptoService } from './column-crypto.service';

@Global()
@Module({
  providers: [ColumnCryptoService],
  exports: [ColumnCryptoService],
})
export class CryptoModule {}
