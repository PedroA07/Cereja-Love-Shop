import { Injectable } from '@nestjs/common';
import type { User } from '@prisma/client';
import { PrismaService } from '../../infra/prisma/prisma.service';

/** Converte Buffer → Uint8Array<ArrayBuffer> para as colunas Bytes do Prisma. */
function toBytes(buf: Buffer): Uint8Array<ArrayBuffer> {
  const out = new Uint8Array(buf.byteLength);
  out.set(buf);
  return out;
}

export type UserWithCredentials = User & {
  credentials: { passwordHash: string; totpSecret: Buffer | null } | null;
};

/** Versão da política de privacidade vigente (consentimentos versionados, §6.1). */
export const POLICY_VERSION = '2026-07-01';

export interface CreateCustomerInput {
  email: string;
  name: string;
  cpfEncrypted: Buffer;
  birthDate: Date;
  phoneEncrypted: Buffer | null;
  passwordHash: string;
  consents: { purpose: string; granted: boolean }[];
}

/** Acesso a dados de identidade (controller → service → repository, §3). */
@Injectable()
export class IdentityRepository {
  constructor(private readonly prisma: PrismaService) {}

  findActiveByEmail(email: string): Promise<UserWithCredentials | null> {
    return this.prisma.user.findFirst({
      where: { email, deletedAt: null },
      include: { credentials: true },
    }) as Promise<UserWithCredentials | null>;
  }

  findById(id: string): Promise<UserWithCredentials | null> {
    return this.prisma.user.findFirst({
      where: { id, deletedAt: null },
      include: { credentials: true },
    }) as Promise<UserWithCredentials | null>;
  }

  emailExists(email: string): Promise<boolean> {
    return this.prisma.user
      .findFirst({ where: { email, deletedAt: null }, select: { id: true } })
      .then((u) => u !== null);
  }

  async createCustomer(input: CreateCustomerInput): Promise<User> {
    return this.prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email: input.email,
          name: input.name,
          cpfEncrypted: toBytes(input.cpfEncrypted),
          birthDate: input.birthDate,
          phoneEncrypted: input.phoneEncrypted ? toBytes(input.phoneEncrypted) : null,
          status: 'pending_verification',
          credentials: { create: { passwordHash: input.passwordHash } },
          consents: {
            create: input.consents.map((c) => ({
              purpose: c.purpose,
              granted: c.granted,
              policyVersion: POLICY_VERSION,
            })),
          },
        },
      });
      return user;
    });
  }

  recordConsent(userId: string, purpose: string, granted: boolean): Promise<unknown> {
    return this.prisma.userConsent.create({
      data: { userId, purpose, granted, policyVersion: POLICY_VERSION },
    });
  }

  listConsents(userId: string) {
    return this.prisma.userConsent.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  setStatus(userId: string, status: string): Promise<User> {
    return this.prisma.user.update({ where: { id: userId }, data: { status } });
  }

  setTotpSecret(userId: string, secret: Buffer | null): Promise<unknown> {
    return this.prisma.authCredential.update({
      where: { userId },
      data: { totpSecret: secret ? toBytes(secret) : null, updatedAt: new Date() },
    });
  }

  loadForExport(userId: string) {
    return this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        addresses: true,
        consents: true,
        orders: { select: { id: true, status: true, totalCents: true, createdAt: true } },
      },
    });
  }

  /**
   * Exclusão LGPD (§1.2): soft-delete + anonimização, preservando pedidos por
   * obrigação fiscal. Remove credenciais e zera PII do titular.
   */
  async anonymize(userId: string, anonymizedEmail: string, tombstone: Buffer): Promise<void> {
    await this.prisma.$transaction([
      this.prisma.authCredential.deleteMany({ where: { userId } }),
      this.prisma.userAddress.deleteMany({ where: { userId } }),
      this.prisma.user.update({
        where: { id: userId },
        data: {
          email: anonymizedEmail,
          name: 'Titular removido',
          cpfEncrypted: toBytes(tombstone),
          phoneEncrypted: null,
          status: 'suspended',
          deletedAt: new Date(),
        },
      }),
    ]);
  }

  findStaffByEmail(email: string) {
    return this.prisma.staffUser.findFirst({
      where: { email, isActive: true },
      include: { roles: { include: { role: { include: { permissions: true } } } } },
    });
  }

  findStaffById(id: string) {
    return this.prisma.staffUser.findFirst({ where: { id, isActive: true } });
  }

  async loadStaffPermissions(staffId: string): Promise<string[]> {
    const rows = await this.prisma.rolePermission.findMany({
      where: { role: { staff: { some: { staffId } } } },
      include: { permission: true },
    });
    return [...new Set(rows.map((r) => r.permission.code))];
  }
}
