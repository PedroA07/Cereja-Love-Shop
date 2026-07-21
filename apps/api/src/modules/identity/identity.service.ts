import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ConsentPurpose } from '@cereja/shared-types';
import { ColumnCryptoService } from '../../infra/crypto/column-crypto.service';
import { RedisService } from '../../infra/redis/redis.service';
import { CreateCustomerInput, IdentityRepository } from './identity.repository';
import { RegisterCustomerDto } from './dto/register-customer.dto';
import { LoginDto } from './dto/login.dto';
import { EmailVerificationService } from './services/email-verification.service';
import { PasswordService } from './services/password.service';
import { TokenService } from './services/token.service';
import { TotpService } from './services/totp.service';
import { isAdult } from './utils/age.util';
import { maskCpf, normalizeCpf } from './utils/cpf.util';

export interface CustomerSummary {
  id: string;
  email: string;
  name: string;
  status: string;
  twoFactorEnabled: boolean;
}

@Injectable()
export class IdentityService {
  private readonly logger = new Logger(IdentityService.name);
  private readonly isDev: boolean;

  constructor(
    private readonly repo: IdentityRepository,
    private readonly passwords: PasswordService,
    private readonly tokens: TokenService,
    private readonly totp: TotpService,
    private readonly crypto: ColumnCryptoService,
    private readonly emailVerification: EmailVerificationService,
    private readonly redis: RedisService,
    config: ConfigService,
  ) {
    this.isDev = (config.get<string>('app.env') ?? 'development') !== 'production';
  }

  async register(dto: RegisterCustomerDto) {
    if (!dto.acceptedTerms) {
      throw new BadRequestException('É necessário aceitar os termos e a política de privacidade');
    }

    // Verificação de maioridade autoritativa no servidor (§1.2) — defesa em
    // profundidade além do validador de DTO.
    const birthDate = new Date(dto.birthDate);
    if (!isAdult(birthDate)) {
      throw new ForbiddenException('Cadastro permitido apenas para maiores de 18 anos');
    }

    if (await this.repo.emailExists(dto.email)) {
      throw new ConflictException('E-mail já cadastrado');
    }

    await this.passwords.assertNotPwned(dto.password);
    const passwordHash = await this.passwords.hash(dto.password);

    const cpf = normalizeCpf(dto.cpf);
    const consents: CreateCustomerInput['consents'] = [
      { purpose: 'terms', granted: true },
      { purpose: ConsentPurpose.Marketing, granted: dto.marketingConsent ?? false },
      { purpose: ConsentPurpose.Profiling, granted: dto.profilingConsent ?? false },
    ];

    const user = await this.repo.createCustomer({
      email: dto.email,
      name: dto.name,
      cpfEncrypted: this.crypto.encrypt(cpf),
      birthDate,
      phoneEncrypted: dto.phone ? this.crypto.encrypt(dto.phone) : null,
      passwordHash,
      consents,
    });

    this.logger.log(`Cliente cadastrado ${user.id} (CPF ${maskCpf(cpf)})`);

    const verificationToken = await this.emailVerification.issue(user.id);
    const issued = await this.tokens.issue({ sub: user.id, type: 'customer', email: user.email });

    return {
      user: this.summary(user),
      tokens: issued,
      // Em produção o token vai por e-mail (assunto neutro); em dev retornamos.
      ...(this.isDev ? { devVerificationToken: verificationToken } : {}),
    };
  }

  async login(dto: LoginDto) {
    const generic = new UnauthorizedException('E-mail ou senha inválidos');
    const user = await this.repo.findActiveByEmail(dto.email);
    if (!user?.credentials) throw generic;

    const ok = await this.passwords.verify(user.credentials.passwordHash, dto.password);
    if (!ok) throw generic;

    if (user.credentials.totpSecret) {
      if (!dto.totp) {
        throw new UnauthorizedException({ message: 'Código 2FA obrigatório', needsTotp: true });
      }
      const secret = this.crypto.decrypt(user.credentials.totpSecret);
      if (!this.totp.verify(dto.totp, secret)) throw new UnauthorizedException('Código 2FA inválido');
    }

    const tokens = await this.tokens.issue({ sub: user.id, type: 'customer', email: user.email });
    return { user: this.summary(user), tokens };
  }

  async refresh(presentedRefresh: string) {
    const { userId, refreshToken } = await this.tokens.rotate(presentedRefresh, 'customer');
    const user = await this.repo.findById(userId);
    if (!user) throw new UnauthorizedException('Sessão inválida');
    const accessToken = await this.tokens.signAccess({
      sub: user.id,
      type: 'customer',
      email: user.email,
    });
    return { accessToken, refreshToken, expiresIn: this.tokens.accessTtlSeconds };
  }

  async logout(presentedRefresh: string | undefined): Promise<void> {
    if (presentedRefresh) await this.tokens.revoke(presentedRefresh);
  }

  async verifyEmail(token: string): Promise<void> {
    const userId = await this.emailVerification.consume(token);
    if (!userId) throw new BadRequestException('Token de verificação inválido ou expirado');
    await this.repo.setStatus(userId, 'active');
  }

  async me(userId: string): Promise<CustomerSummary> {
    const user = await this.repo.findById(userId);
    if (!user) throw new NotFoundException('Usuário não encontrado');
    return this.summary(user);
  }

  async recordConsent(userId: string, purpose: string, granted: boolean) {
    await this.repo.recordConsent(userId, purpose, granted);
    return this.repo.listConsents(userId);
  }

  listConsents(userId: string) {
    return this.repo.listConsents(userId);
  }

  /** Portabilidade LGPD (§6.1): dados do titular, incluindo PII descriptografada. */
  async exportData(userId: string) {
    const data = await this.repo.loadForExport(userId);
    if (!data) throw new NotFoundException('Usuário não encontrado');
    return {
      profile: {
        id: data.id,
        email: data.email,
        name: data.name,
        cpf: this.crypto.decrypt(data.cpfEncrypted),
        birthDate: data.birthDate.toISOString().slice(0, 10),
        phone: data.phoneEncrypted ? this.crypto.decrypt(data.phoneEncrypted) : null,
        status: data.status,
        createdAt: data.createdAt,
      },
      addresses: data.addresses,
      consents: data.consents,
      orders: data.orders.map((o) => ({ ...o, totalCents: o.totalCents.toString() })),
    };
  }

  /** Direito de exclusão (§1.2): anonimiza e revoga sessões; pedidos preservados. */
  async deleteAccount(userId: string): Promise<void> {
    const anonymizedEmail = `deleted+${userId}@anonimizado.cerejaloveshop.local`;
    const tombstone = this.crypto.encrypt('REMOVIDO');
    await this.repo.anonymize(userId, anonymizedEmail, tombstone);
    await this.tokens.revokeAll('customer', userId);
    this.logger.log(`Conta anonimizada ${userId}`);
  }

  async beginTwoFactor(userId: string, email: string) {
    const secret = this.totp.generateSecret();
    await this.redis.client.set(`2fa:pending:${userId}`, secret, 'EX', 600);
    return { secret, otpauthUrl: this.totp.keyUri(email, secret) };
  }

  async confirmTwoFactor(userId: string, code: string): Promise<void> {
    const secret = await this.redis.client.get(`2fa:pending:${userId}`);
    if (!secret) throw new BadRequestException('Nenhuma ativação de 2FA pendente');
    if (!this.totp.verify(code, secret)) throw new BadRequestException('Código 2FA inválido');
    await this.repo.setTotpSecret(userId, this.crypto.encrypt(secret));
    await this.redis.client.del(`2fa:pending:${userId}`);
  }

  async disableTwoFactor(userId: string): Promise<void> {
    await this.repo.setTotpSecret(userId, null);
  }

  private summary(user: {
    id: string;
    email: string;
    name: string;
    status: string;
    credentials?: { totpSecret: Buffer | null } | null;
  }): CustomerSummary {
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      status: user.status,
      twoFactorEnabled: Boolean(user.credentials?.totpSecret),
    };
  }
}
