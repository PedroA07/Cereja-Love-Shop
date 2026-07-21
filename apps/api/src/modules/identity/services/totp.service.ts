import { Injectable } from '@nestjs/common';
import { authenticator } from 'otplib';

/**
 * TOTP (2FA) — opcional para cliente, obrigatório para staff (§6.1/§6.8).
 * O segredo é guardado criptografado em coluna (ColumnCryptoService).
 */
@Injectable()
export class TotpService {
  private readonly issuer = 'Cereja Love Shop';

  generateSecret(): string {
    return authenticator.generateSecret();
  }

  /** URI otpauth:// para QR code no app autenticador. */
  keyUri(accountEmail: string, secret: string): string {
    return authenticator.keyuri(accountEmail, this.issuer, secret);
  }

  verify(code: string, secret: string): boolean {
    try {
      return authenticator.verify({ token: code, secret });
    } catch {
      return false;
    }
  }
}
