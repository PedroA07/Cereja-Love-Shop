# Cereja Love Shop

E-commerce adulto (18+) para o mercado brasileiro — lingerie, cosméticos e bem-estar íntimo, com **discrição** e **privacidade** como requisitos de negócio.

> Fonte única de verdade: [`ESPECIFICACAO-PROJETO.md`](./ESPECIFICACAO-PROJETO.md). Identidade visual: [`assets/brand-reference/`](./assets/brand-reference/IDENTIDADE-VISUAL.md).

## Estrutura (Turborepo + pnpm)

```
apps/
  web/       Loja (Next.js App Router + Tailwind + PWA)      → :3000
  admin/     Painel back-office (Next.js)                    → :3001
  api/       API (NestJS, monólito modular + Prisma)         → :3333
packages/
  ui/        Design system (tokens da marca + Tailwind preset)
  shared-types/  Contratos e enums compartilhados front↔back
  config/    tsconfig / eslint / prettier compartilhados
infra/       docker-compose (postgres, redis, meilisearch, minio)
```

## Como rodar (dev)

Pré-requisitos: Node ≥ 20.11, pnpm ≥ 10, Docker.

```bash
# 1. Dependências
pnpm install

# 2. Infra local (Postgres, Redis, Meilisearch, MinIO)
pnpm infra:up

# 3. Variáveis de ambiente
cp .env.example apps/api/.env
# gere a chave de criptografia de coluna e cole em COLUMN_ENCRYPTION_KEY:
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"

# 4. Banco: gerar client, aplicar migrações e semear (permissões + admin)
pnpm db:generate
pnpm db:migrate
pnpm --filter @cereja/api db:seed   # imprime e-mail/senha/2FA do admin

# 5. Subir tudo
pnpm dev            # turbo: web (3000), admin (3001), api (3333)
```

O seed mostra no console o **secret TOTP** do admin — cadastre num app
autenticador (Google Authenticator, Authy) para conseguir logar no staff.

Healthcheck da API: `GET http://localhost:3333/health` e `/health/ready`.

## Rotas de identidade (M1) — prefixo `/api/v1`

| Método | Rota | Descrição |
|---|---|---|
| POST | `/auth/register` | Cadastro de cliente (bloqueia < 18 no servidor) |
| POST | `/auth/login` | Login (access token + refresh cookie); pede TOTP se ativo |
| POST | `/auth/refresh` | Rotaciona a sessão via refresh cookie |
| POST | `/auth/logout` | Revoga a sessão |
| POST | `/auth/verify-email` | Confirma e-mail por token |
| GET | `/auth/me` | Perfil do cliente autenticado |
| POST | `/auth/2fa/setup` · `/auth/2fa/confirm` | Ativa 2FA (TOTP) do cliente |
| GET/POST | `/account/consents` | Lista/atualiza consentimentos (LGPD) |
| GET | `/account/export` | Portabilidade dos dados do titular |
| DELETE | `/account` | Exclusão (anonimização) |
| POST | `/staff/auth/login` | Login de staff (senha + 2FA obrigatório) |
| GET | `/staff/auth/me` | Perfil + permissões (RBAC) |

## Princípios inegociáveis

1. **18+** — maioridade validada **sempre no servidor** (via `birth_date`).
2. **Discrição** — cobrança, remetente e e-mails neutros; saída rápida; thumbnails discretos.
3. **LGPD** — CPF/nascimento/telefone criptografados em coluna (AES-256-GCM); perfilamento só com consentimento; exclusão anonimiza.
4. **PCI SAQ-A** — dados de cartão nunca tocam o backend.
5. **Concorrência** — estoque e cupons via operações atômicas no banco.

## Deploy

**Fronts na Vercel** (um projeto Vercel por app, mesmo repositório):

| Projeto | Root Directory | Observações |
|---|---|---|
| loja | `apps/web` | domínio principal |
| admin | `apps/admin` | subdomínio `admin.*` (§6.8) |

- A Vercel detecta pnpm workspaces + Next.js automaticamente; o `vercel.json` de cada app usa `turbo-ignore` para só rebuildar quando o app (ou suas dependências internas) mudar.
- Variáveis de ambiente dos fronts (ex.: `NEXT_PUBLIC_API_URL`) entram no painel da Vercel quando o M1+ precisar delas.

**API NestJS fora da Vercel**: a API é um processo persistente (filas BullMQ, webhooks de pagamento, conexões Redis) — hospedar em Railway, Render ou Fly.io, com Postgres/Redis/Meilisearch/S3 gerenciados. O CORS da API já restringe origem a `WEB_URL`/`ADMIN_URL` (configurar com os domínios da Vercel).

## Milestones

- [x] **M0 — Fundação**: monorepo, infra Docker, NestJS + Prisma (schema §5), Next.js base, tokens da marca, healthcheck
- [x] **M1 — Identity**: cadastro 18+ (validação no servidor) + CPF, Argon2id + HIBP, JWT + refresh rotativo (Redis), 2FA TOTP, RBAC por permissões, LGPD (consentimento/portabilidade/exclusão), telas de login/cadastro
- [ ] M2 — Catalog (produtos, estoque ledger, Meilisearch, vitrine)
- [ ] M3 — Cart & Checkout
- [ ] M4 — Payments (gateway porta/adaptador)
- [ ] M5 — Coupons
- [ ] M6 — Shipping & NF-e
- [ ] M7 — Back-office & BI
- [ ] M8 — Engagement & hardening
