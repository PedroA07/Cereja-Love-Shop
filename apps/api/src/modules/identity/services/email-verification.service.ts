import { Injectable } from '@nestjs/common';
import { randomBytes } from 'node:crypto';
import { RedisService } from '../../../infra/redis/redis.service';

/**
 * Tokens de verificação de e-mail (§6.1). Efêmeros no Redis (TTL 24h). O envio
 * do e-mail (assunto neutro, §1.2) entra na infra de notificações adiante; por
 * ora o token é retornado apenas em ambiente de desenvolvimento.
 */
@Injectable()
export class EmailVerificationService {
  private readonly ttl = 60 * 60 * 24;

  constructor(private readonly redis: RedisService) {}

  async issue(userId: string): Promise<string> {
    const token = randomBytes(32).toString('hex');
    await this.redis.client.set(this.key(token), userId, 'EX', this.ttl);
    return token;
  }

  /** Consome o token (uso único) e devolve o userId, ou null se inválido. */
  async consume(token: string): Promise<string | null> {
    const key = this.key(token);
    const userId = await this.redis.client.get(key);
    if (userId) await this.redis.client.del(key);
    return userId;
  }

  private key(token: string): string {
    return `email-verify:${token}`;
  }
}
