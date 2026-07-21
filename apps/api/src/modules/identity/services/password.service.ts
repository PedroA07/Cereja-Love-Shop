import { Injectable, Logger, UnprocessableEntityException } from '@nestjs/common';
import * as argon2 from 'argon2';
import { createHash } from 'node:crypto';

/**
 * Hash de senha com Argon2id (§6.1/§8) e checagem de vazamento via
 * HaveIBeenPwned por k-anonymity (envia só os 5 primeiros caracteres do
 * SHA-1; a senha nunca sai da aplicação).
 */
@Injectable()
export class PasswordService {
  private readonly logger = new Logger(PasswordService.name);

  private readonly options = {
    type: argon2.argon2id as 2,
    memoryCost: 19456, // 19 MiB (OWASP)
    timeCost: 2,
    parallelism: 1,
  };

  hash(plain: string): Promise<string> {
    return argon2.hash(plain, this.options);
  }

  async verify(hash: string, plain: string): Promise<boolean> {
    try {
      return await argon2.verify(hash, plain);
    } catch {
      return false;
    }
  }

  /** Lança 422 se a senha aparece em vazamentos conhecidos. */
  async assertNotPwned(plain: string): Promise<void> {
    const count = await this.pwnedCount(plain);
    if (count > 0) {
      throw new UnprocessableEntityException(
        'Esta senha aparece em vazamentos públicos. Escolha outra.',
      );
    }
  }

  private async pwnedCount(plain: string): Promise<number> {
    const sha1 = createHash('sha1').update(plain).digest('hex').toUpperCase();
    const prefix = sha1.slice(0, 5);
    const suffix = sha1.slice(5);
    try {
      const res = await fetch(`https://api.pwnedpasswords.com/range/${prefix}`, {
        headers: { 'Add-Padding': 'true' },
      });
      if (!res.ok) return 0;
      const body = await res.text();
      for (const line of body.split('\n')) {
        const [hashSuffix, countStr] = line.trim().split(':');
        if (hashSuffix === suffix) return parseInt(countStr ?? '0', 10);
      }
      return 0;
    } catch {
      // Fail-open: não bloqueia o cadastro se o HIBP estiver indisponível.
      this.logger.warn('HaveIBeenPwned indisponível — checagem de senha ignorada');
      return 0;
    }
  }
}
