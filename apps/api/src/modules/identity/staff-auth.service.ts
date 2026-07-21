import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ColumnCryptoService } from '../../infra/crypto/column-crypto.service';
import { IdentityRepository } from './identity.repository';
import { StaffLoginDto } from './dto/staff-login.dto';
import { PasswordService } from './services/password.service';
import { TokenService } from './services/token.service';
import { TotpService } from './services/totp.service';

export interface StaffSummary {
  id: string;
  email: string;
  name: string;
  permissions: string[];
}

/**
 * Autenticação de staff (§6.8): identidades separadas das de clientes e 2FA
 * (TOTP) obrigatório. As permissões vão embutidas no access token para o RBAC.
 */
@Injectable()
export class StaffAuthService {
  constructor(
    private readonly repo: IdentityRepository,
    private readonly passwords: PasswordService,
    private readonly tokens: TokenService,
    private readonly totp: TotpService,
    private readonly crypto: ColumnCryptoService,
  ) {}

  async login(dto: StaffLoginDto) {
    const generic = new UnauthorizedException('Credenciais inválidas');
    const staff = await this.repo.findStaffByEmail(dto.email);
    if (!staff) throw generic;

    const ok = await this.passwords.verify(staff.passwordHash, dto.password);
    if (!ok) throw generic;

    // 2FA obrigatório para staff.
    const secret = this.crypto.decrypt(staff.totpSecret);
    if (!this.totp.verify(dto.totp, secret)) throw new UnauthorizedException('Código 2FA inválido');

    const permissions = await this.repo.loadStaffPermissions(staff.id);
    const tokens = await this.tokens.issue({
      sub: staff.id,
      type: 'staff',
      email: staff.email,
      permissions,
    });
    return {
      staff: { id: staff.id, email: staff.email, name: staff.name, permissions },
      tokens,
    };
  }

  async refresh(presentedRefresh: string) {
    const { userId, refreshToken } = await this.tokens.rotate(presentedRefresh, 'staff');
    const staff = await this.repo.findStaffById(userId);
    if (!staff) throw new UnauthorizedException('Sessão inválida');
    const permissions = await this.repo.loadStaffPermissions(staff.id);
    const accessToken = await this.tokens.signAccess({
      sub: staff.id,
      type: 'staff',
      email: staff.email,
      permissions,
    });
    return { accessToken, refreshToken, expiresIn: this.tokens.accessTtlSeconds };
  }

  async logout(presentedRefresh: string | undefined): Promise<void> {
    if (presentedRefresh) await this.tokens.revoke(presentedRefresh);
  }

  async me(staffId: string): Promise<StaffSummary> {
    const staff = await this.repo.findStaffById(staffId);
    if (!staff) throw new UnauthorizedException('Sessão inválida');
    const permissions = await this.repo.loadStaffPermissions(staff.id);
    return { id: staff.id, email: staff.email, name: staff.name, permissions };
  }
}
