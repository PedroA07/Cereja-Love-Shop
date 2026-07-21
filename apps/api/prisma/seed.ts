/**
 * Seed inicial (M1): matriz de permissões, papéis de staff e um usuário
 * administrador com 2FA obrigatório (§6.1/§6.8).
 *
 * Uso: pnpm --filter @cereja/api db:seed
 * Requer no ambiente: DATABASE_URL e COLUMN_ENCRYPTION_KEY.
 */
import { PrismaClient } from '@prisma/client';
import * as argon2 from 'argon2';
import { authenticator } from 'otplib';
import { createCipheriv, createHash, randomBytes } from 'node:crypto';

const prisma = new PrismaClient();

// Deriva a chave AES-256 igual ao ColumnCryptoService (base64/hex de 32 bytes,
// ou SHA-256 de qualquer segredo forte).
function deriveKey(raw: string): Buffer {
  const value = (raw ?? '').trim();
  if (value.length < 16) {
    throw new Error('COLUMN_ENCRYPTION_KEY ausente ou muito curta (mínimo 16 caracteres).');
  }
  const asBase64 = Buffer.from(value, 'base64');
  if (asBase64.length === 32) return asBase64;
  if (/^[0-9a-fA-F]{64}$/.test(value)) return Buffer.from(value, 'hex');
  return createHash('sha256').update(value, 'utf8').digest();
}

// Criptografia de coluna (mesmo formato do ColumnCryptoService): iv|tag|ct
function encryptColumn(plaintext: string): Uint8Array<ArrayBuffer> {
  const key = deriveKey(process.env.COLUMN_ENCRYPTION_KEY ?? '');
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', key, iv);
  const ct = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const blob = Buffer.concat([iv, cipher.getAuthTag(), ct]);
  const out = new Uint8Array(blob.byteLength);
  out.set(blob);
  return out;
}

// Matriz de permissões `recurso:ação` (§6.8)
const PERMISSIONS = [
  'product:create',
  'product:update',
  'product:publish',
  'product:archive',
  'inventory:manage',
  'order:read',
  'order:update',
  'order:refund',
  'coupon:manage',
  'user:read',
  'user:manage',
  'content:manage',
  'report:read',
];

const ROLES: Record<string, string[]> = {
  super_admin: PERMISSIONS, // todas
  catalog_manager: [
    'product:create',
    'product:update',
    'product:publish',
    'product:archive',
    'inventory:manage',
  ],
  order_manager: ['order:read', 'order:update', 'order:refund', 'coupon:manage'],
  support: ['order:read', 'user:read'],
};

async function main(): Promise<void> {
  // 1) Permissões
  for (const code of PERMISSIONS) {
    await prisma.permission.upsert({ where: { code }, update: {}, create: { code } });
  }
  const permByCode = new Map(
    (await prisma.permission.findMany()).map((p) => [p.code, p.id] as const),
  );

  // 2) Papéis + vínculo de permissões
  for (const [name, codes] of Object.entries(ROLES)) {
    const role = await prisma.staffRole.upsert({ where: { name }, update: {}, create: { name } });
    for (const code of codes) {
      const permissionId = permByCode.get(code)!;
      await prisma.rolePermission.upsert({
        where: { roleId_permissionId: { roleId: role.id, permissionId } },
        update: {},
        create: { roleId: role.id, permissionId },
      });
    }
  }

  // 3) Usuário admin (staff) com 2FA obrigatório
  const adminEmail = process.env.SEED_ADMIN_EMAIL ?? 'admin@cerejaloveshop.local';
  const adminPassword = process.env.SEED_ADMIN_PASSWORD ?? 'Cereja#Admin2026';
  const totpSecret = authenticator.generateSecret();

  const existing = await prisma.staffUser.findFirst({ where: { email: adminEmail } });
  if (!existing) {
    const admin = await prisma.staffUser.create({
      data: {
        email: adminEmail,
        name: 'Administrador',
        passwordHash: await argon2.hash(adminPassword, { type: argon2.argon2id }),
        totpSecret: encryptColumn(totpSecret),
      },
    });
    const superAdmin = await prisma.staffRole.findUniqueOrThrow({ where: { name: 'super_admin' } });
    await prisma.staffUserRole.create({
      data: { staffId: admin.id, roleId: superAdmin.id },
    });

    const otpauth = authenticator.keyuri(adminEmail, 'Cereja Love Shop', totpSecret);
    // eslint-disable-next-line no-console
    console.log('\n=== ADMIN CRIADO (guarde o 2FA agora) ===');
    // eslint-disable-next-line no-console
    console.log(`  e-mail:      ${adminEmail}`);
    // eslint-disable-next-line no-console
    console.log(`  senha:       ${adminPassword}`);
    // eslint-disable-next-line no-console
    console.log(`  TOTP secret: ${totpSecret}`);
    // eslint-disable-next-line no-console
    console.log(`  otpauth URL: ${otpauth}\n`);
  } else {
    // eslint-disable-next-line no-console
    console.log(`Admin ${adminEmail} já existe — mantido.`);
  }

  // eslint-disable-next-line no-console
  console.log(`Seed concluído: ${PERMISSIONS.length} permissões, ${Object.keys(ROLES).length} papéis.`);
}

main()
  .catch((err) => {
    // eslint-disable-next-line no-console
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
