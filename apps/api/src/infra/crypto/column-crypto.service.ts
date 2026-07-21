import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  createCipheriv,
  createDecipheriv,
  createHash,
  randomBytes,
  type CipherGCM,
  type DecipherGCM,
} from 'node:crypto';

/**
 * Criptografia de coluna para PII sensível (§1.2/§8): CPF, birth_date, telefone
 * e dados que inferem preferência. AES-256-GCM autenticado.
 *
 * Layout do blob armazenado (BYTEA): [ iv(12) | authTag(16) | ciphertext ].
 * A chave vem de COLUMN_ENCRYPTION_KEY (base64, 32 bytes) — nunca no código.
 */
@Injectable()
export class ColumnCryptoService {
  private readonly logger = new Logger(ColumnCryptoService.name);
  private readonly key: Buffer;
  private static readonly IV_LEN = 12;
  private static readonly TAG_LEN = 16;
  private static readonly ALGO = 'aes-256-gcm';

  constructor(config: ConfigService) {
    const raw = config.get<string>('security.columnEncryptionKey') ?? '';
    this.key = ColumnCryptoService.deriveKey(raw);
  }

  /**
   * Deriva a chave AES-256 (32 bytes) a partir de COLUMN_ENCRYPTION_KEY:
   * aceita base64/hex de 32 bytes direto, ou deriva de qualquer segredo forte
   * via SHA-256. Assim o host (ex.: Render) pode gerar a variável sozinho.
   */
  static deriveKey(raw: string): Buffer {
    const value = raw?.trim() ?? '';
    if (value.length < 16) {
      throw new Error('COLUMN_ENCRYPTION_KEY ausente ou muito curta (mínimo 16 caracteres).');
    }
    const asBase64 = Buffer.from(value, 'base64');
    if (asBase64.length === 32) return asBase64;
    if (/^[0-9a-fA-F]{64}$/.test(value)) return Buffer.from(value, 'hex');
    return createHash('sha256').update(value, 'utf8').digest();
  }

  encrypt(plaintext: string): Buffer {
    const iv = randomBytes(ColumnCryptoService.IV_LEN);
    const cipher = createCipheriv(ColumnCryptoService.ALGO, this.key, iv) as CipherGCM;
    const ciphertext = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
    const authTag = cipher.getAuthTag();
    return Buffer.concat([iv, authTag, ciphertext]);
  }

  decrypt(input: Uint8Array): string {
    try {
      const blob = Buffer.from(input);
      const iv = blob.subarray(0, ColumnCryptoService.IV_LEN);
      const authTag = blob.subarray(
        ColumnCryptoService.IV_LEN,
        ColumnCryptoService.IV_LEN + ColumnCryptoService.TAG_LEN,
      );
      const ciphertext = blob.subarray(ColumnCryptoService.IV_LEN + ColumnCryptoService.TAG_LEN);
      const decipher = createDecipheriv(ColumnCryptoService.ALGO, this.key, iv) as DecipherGCM;
      decipher.setAuthTag(authTag);
      return Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString('utf8');
    } catch {
      // Nunca vazar detalhe criptográfico ao chamador (§10)
      this.logger.error('Falha ao descriptografar coluna de PII');
      throw new InternalServerErrorException('Erro ao processar dado protegido');
    }
  }
}
