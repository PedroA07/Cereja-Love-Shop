# 🍒 Cereja Love Shop

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

# 4. Banco: gerar client e aplicar migrações
pnpm db:generate
pnpm db:migrate

# 5. Subir tudo
pnpm dev            # turbo: web (3000), admin (3001), api (3333)
```

Healthcheck da API: `GET http://localhost:3333/health` e `/health/ready`.

## Princípios inegociáveis

1. **18+** — maioridade validada **sempre no servidor** (via `birth_date`).
2. **Discrição** — cobrança, remetente e e-mails neutros; saída rápida; thumbnails discretos.
3. **LGPD** — CPF/nascimento/telefone criptografados em coluna (AES-256-GCM); perfilamento só com consentimento; exclusão anonimiza.
4. **PCI SAQ-A** — dados de cartão nunca tocam o backend.
5. **Concorrência** — estoque e cupons via operações atômicas no banco.

## Milestones

- [x] **M0 — Fundação**: monorepo, infra Docker, NestJS + Prisma (schema §5), Next.js base, tokens da marca, healthcheck
- [ ] M1 — Identity (cadastro 18+, JWT, RBAC, LGPD, age gate)
- [ ] M2 — Catalog (produtos, estoque ledger, Meilisearch, vitrine)
- [ ] M3 — Cart & Checkout
- [ ] M4 — Payments (gateway porta/adaptador)
- [ ] M5 — Coupons
- [ ] M6 — Shipping & NF-e
- [ ] M7 — Back-office & BI
- [ ] M8 — Engagement & hardening
