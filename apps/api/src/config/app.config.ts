import { registerAs } from '@nestjs/config';

/** Config tipada da aplicação, agrupada por namespace. */
export const appConfig = registerAs('app', () => ({
  env: process.env.NODE_ENV ?? 'development',
  port: parseInt(process.env.API_PORT ?? '3333', 10),
  webUrl: process.env.WEB_URL ?? 'http://localhost:3000',
  adminUrl: process.env.ADMIN_URL ?? 'http://localhost:3001',
  discreet: {
    billingDescriptor: process.env.BILLING_STATEMENT_DESCRIPTOR ?? 'CLS*COMPRAS',
    senderName: process.env.DISCREET_SENDER_NAME ?? 'CLS Distribuidora',
  },
}));

export const securityConfig = registerAs('security', () => ({
  columnEncryptionKey: process.env.COLUMN_ENCRYPTION_KEY ?? '',
  jwt: {
    accessSecret: process.env.JWT_ACCESS_SECRET ?? '',
    refreshSecret: process.env.JWT_REFRESH_SECRET ?? '',
    accessTtl: parseInt(process.env.JWT_ACCESS_TTL ?? '900', 10),
    refreshTtl: parseInt(process.env.JWT_REFRESH_TTL ?? '1209600', 10),
  },
}));
