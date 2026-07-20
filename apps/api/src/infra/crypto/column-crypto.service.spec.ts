import { ConfigService } from '@nestjs/config';
import { randomBytes } from 'node:crypto';
import { ColumnCryptoService } from './column-crypto.service';

function makeService(key?: string): ColumnCryptoService {
  const config = {
    get: () => key ?? randomBytes(32).toString('base64'),
  } as unknown as ConfigService;
  return new ColumnCryptoService(config);
}

describe('ColumnCryptoService', () => {
  it('cifra e decifra CPF de ida e volta', () => {
    const svc = makeService();
    const cpf = '390.533.447-05';
    const blob = svc.encrypt(cpf);
    expect(blob.equals(Buffer.from(cpf))).toBe(false);
    expect(svc.decrypt(blob)).toBe(cpf);
  });

  it('gera blobs diferentes para o mesmo plaintext (IV aleatório)', () => {
    const svc = makeService();
    const a = svc.encrypt('1990-04-12');
    const b = svc.encrypt('1990-04-12');
    expect(a.equals(b)).toBe(false);
  });

  it('rejeita blob adulterado (GCM autenticado)', () => {
    const svc = makeService();
    const blob = svc.encrypt('segredo');
    blob.writeUInt8(blob.readUInt8(blob.length - 1) ^ 0xff, blob.length - 1);
    expect(() => svc.decrypt(blob)).toThrow();
  });

  it('recusa chave com tamanho inválido', () => {
    expect(() => makeService(Buffer.from('curta').toString('base64'))).toThrow(
      /COLUMN_ENCRYPTION_KEY/,
    );
  });
});
