import * as Joi from 'joi';

/**
 * Validação estrita das variáveis de ambiente (§8/§10).
 * A aplicação não sobe com config inválida — falha rápido.
 */
export const envValidationSchema = Joi.object({
  NODE_ENV: Joi.string().valid('development', 'test', 'production').default('development'),
  API_PORT: Joi.number().port().default(3333),
  WEB_URL: Joi.string().uri().default('http://localhost:3000'),
  ADMIN_URL: Joi.string().uri().default('http://localhost:3001'),

  DATABASE_URL: Joi.string().uri({ scheme: ['postgresql', 'postgres'] }).required(),
  REDIS_URL: Joi.string().uri({ scheme: ['redis', 'rediss'] }).default('redis://localhost:6379'),

  JWT_ACCESS_SECRET: Joi.string().min(32).required(),
  JWT_REFRESH_SECRET: Joi.string().min(32).required(),
  JWT_ACCESS_TTL: Joi.number().default(900),
  JWT_REFRESH_TTL: Joi.number().default(1209600),

  // Chave AES-256-GCM (base64, 32 bytes) para colunas de PII sensível (§1.2/§8)
  COLUMN_ENCRYPTION_KEY: Joi.string().required(),

  BILLING_STATEMENT_DESCRIPTOR: Joi.string().default('CLS*COMPRAS'),
  DISCREET_SENDER_NAME: Joi.string().default('CLS Distribuidora'),
}).unknown(true);
