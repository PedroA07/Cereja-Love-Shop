import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { createHash, randomBytes, timingSafeEqual } from 'node:crypto';
import { RedisService } from '../../../infra/redis/redis.service';

export type PrincipalType = 'customer' | 'staff';

export interface AccessTokenPayload {
  sub: string;
  type: PrincipalType;
  email: string;
  permissions?: string[];
}

export interface IssuedTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

/**
 * Emissão de tokens (§6.1):
 *  - Access: JWT curto (~15 min).
 *  - Refresh: token opaco de alta entropia, guardado (só o hash) no Redis com
 *    rotação e revogação. O segredo nunca é persistido em claro.
 *
 * Formato do refresh entregue ao cliente: `{tokenId}.{secret}`.
 */
@Injectable()
export class TokenService {
  private readonly accessSecret: string;
  private readonly accessTtl: number;
  private readonly refreshTtl: number;

  constructor(
    private readonly jwt: JwtService,
    private readonly redis: RedisService,
    config: ConfigService,
  ) {
    this.accessSecret = config.get<string>('security.jwt.accessSecret')!;
    this.accessTtl = config.get<number>('security.jwt.accessTtl') ?? 900;
    this.refreshTtl = config.get<number>('security.jwt.refreshTtl') ?? 1209600;
  }

  async issue(payload: AccessTokenPayload): Promise<IssuedTokens> {
    const accessToken = await this.signAccess(payload);
    const refreshToken = await this.createRefresh(payload.type, payload.sub);
    return { accessToken, refreshToken, expiresIn: this.accessTtl };
  }

  signAccess(payload: AccessTokenPayload): Promise<string> {
    return this.jwt.signAsync(payload, { secret: this.accessSecret, expiresIn: this.accessTtl });
  }

  get accessTtlSeconds(): number {
    return this.accessTtl;
  }

  async verifyAccess(token: string): Promise<AccessTokenPayload> {
    try {
      return await this.jwt.verifyAsync<AccessTokenPayload>(token, { secret: this.accessSecret });
    } catch {
      throw new UnauthorizedException('Token inválido ou expirado');
    }
  }

  /** Valida e ROTACIONA o refresh: invalida o antigo e devolve um novo. */
  async rotate(
    presented: string,
    expectedType: PrincipalType,
  ): Promise<{ userId: string; refreshToken: string }> {
    const parsed = this.parse(presented);
    if (!parsed) throw new UnauthorizedException('Refresh token inválido');
    const { tokenId, secret } = parsed;

    const key = this.key(tokenId);
    const stored = await this.redis.client.get(key);
    if (!stored) throw new UnauthorizedException('Sessão expirada');

    const record = JSON.parse(stored) as { userId: string; type: PrincipalType; hash: string };
    if (record.type !== expectedType || !this.hashMatches(secret, record.hash)) {
      throw new UnauthorizedException('Refresh token inválido');
    }

    // Rotação: remove o antigo antes de emitir o novo.
    await this.redis.client.del(key);
    await this.redis.client.srem(this.userSet(record.type, record.userId), tokenId);
    const refreshToken = await this.createRefresh(record.type, record.userId);
    return { userId: record.userId, refreshToken };
  }

  async revoke(presented: string): Promise<void> {
    const parsed = this.parse(presented);
    if (!parsed) return;
    const stored = await this.redis.client.get(this.key(parsed.tokenId));
    await this.redis.client.del(this.key(parsed.tokenId));
    if (stored) {
      const record = JSON.parse(stored) as { userId: string; type: PrincipalType };
      await this.redis.client.srem(this.userSet(record.type, record.userId), parsed.tokenId);
    }
  }

  /** Revoga todas as sessões de um titular (ex.: exclusão de conta). */
  async revokeAll(type: PrincipalType, userId: string): Promise<void> {
    const setKey = this.userSet(type, userId);
    const ids = await this.redis.client.smembers(setKey);
    if (ids.length) {
      await this.redis.client.del(...ids.map((id) => this.key(id)));
    }
    await this.redis.client.del(setKey);
  }

  private async createRefresh(type: PrincipalType, userId: string): Promise<string> {
    const tokenId = randomBytes(16).toString('hex');
    const secret = randomBytes(32).toString('hex');
    const record = { userId, type, hash: this.sha256(secret) };
    await this.redis.client.set(this.key(tokenId), JSON.stringify(record), 'EX', this.refreshTtl);
    await this.redis.client.sadd(this.userSet(type, userId), tokenId);
    await this.redis.client.expire(this.userSet(type, userId), this.refreshTtl);
    return `${tokenId}.${secret}`;
  }

  private parse(token: string): { tokenId: string; secret: string } | null {
    const [tokenId, secret] = token.split('.');
    if (!tokenId || !secret) return null;
    return { tokenId, secret };
  }

  private sha256(value: string): string {
    return createHash('sha256').update(value).digest('hex');
  }

  private hashMatches(secret: string, expectedHash: string): boolean {
    const a = Buffer.from(this.sha256(secret));
    const b = Buffer.from(expectedHash);
    return a.length === b.length && timingSafeEqual(a, b);
  }

  private key(tokenId: string): string {
    return `refresh:${tokenId}`;
  }

  private userSet(type: PrincipalType, userId: string): string {
    return `refresh:user:${type}:${userId}`;
  }
}
