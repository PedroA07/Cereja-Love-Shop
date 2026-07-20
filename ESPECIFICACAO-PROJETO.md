# ESPECIFICAÇÃO DE PROJETO — Cereja Love Shop
### E-commerce adulto (18+) · Documento de contexto para implementação assistida (Claude Code)

> **Instrução ao agente:** este é o documento-fonte único e autocontido do projeto. Todas as decisões técnicas aqui são **definitivas** — não são opções a escolher. Antes de divergir de qualquer decisão, **pergunte**. Implemente na ordem da seção 11 (Milestones). Trate a seção 8 (Segurança) e a seção 1.2 (Restrições inegociáveis) como requisitos rígidos, não sugestões.

---

## 1. Visão geral

### 1.1 Produto
**Cereja Love Shop** — plataforma de e-commerce para venda de lingerie, cosméticos e produtos íntimos para **público adulto (18+)**, mercado **brasileiro**. Inclui loja (cliente) e painel administrativo (operação interna).

**Identidade visual:** a marca e o design system devem seguir a referência em `assets/brand-reference/` (imagens `ref-01`…`ref-12`) e os tokens de cor em `assets/brand-reference/IDENTIDADE-VISUAL.md` — paleta cereja/vinho + neutros nude/creme, estética elegante e sensual porém não apelativa. Ver seção 6.9.

### 1.2 Restrições inegociáveis (hard constraints)
Estas três forças moldam cada decisão. Violá-las é bug, não trade-off:

1. **Idade 18+** — verificação obrigatória em camadas (entrada, cadastro, checkout). Validação de maioridade **sempre no servidor**.
2. **Discrição** — embalagem neutra, descritor de cobrança neutro na fatura, e-mails com assunto neutro, botão de saída rápida, opção de não salvar histórico. É requisito de negócio.
3. **LGPD com dado sensível** — histórico de compra infere comportamento sexual. CPF, data de nascimento e dados derivados de preferência ficam **criptografados em coluna**; perfilamento exige consentimento explícito; direito de exclusão automatizado (soft-delete + anonimização, preservando o que a lei fiscal obriga).

Conformidade adicional: **CDC** (direito de arrependimento de 7 dias — mas produtos íntimos abertos **não são devolvíveis** por regra sanitária, e isso deve ser explícito), **NF-e** obrigatória, **PCI-DSS SAQ-A**.

---

## 2. Stack tecnológica (definitiva)

| Camada | Tecnologia |
|---|---|
| Monorepo | **Turborepo** + pnpm |
| Frontend | **Next.js (App Router) + React + TypeScript**, PWA, Tailwind CSS |
| Backend | **NestJS + TypeScript** (monólito modular) |
| ORM / DB | **Prisma** + **PostgreSQL** (o schema-alvo está na seção 5) |
| Cache/sessão/filas | **Redis** (ioredis) + **BullMQ** |
| Busca | **Meilisearch** |
| Object storage | **S3-compatible** (MinIO em dev), URLs assinadas |
| Auth | **JWT** (access curto + refresh httpOnly), **Argon2id**, **TOTP** (2FA) |
| Pagamentos | **Interface `PaymentGateway`** + adaptador (PIX, boleto, cartão parcelado) |
| Testes | **Jest** + supertest (backend), Playwright (e2e front) |
| Infra dev | **Docker Compose** (postgres, redis, meilisearch, minio) |
| Observabilidade | **OpenTelemetry** + Sentry (PII mascarada) |

> **Pagamentos:** implementar como **porta/adaptador**. Definir a interface `PaymentGateway` (createPixCharge, createBoleto, tokenizeCard, chargeCard, handleWebhook) e um adaptador concreto (ex.: Mercado Pago **ou** Pagar.me — validar aceitação de segmento adulto). Dados de cartão **nunca** trafegam pelo backend: usar campos hospedados/tokenização do provedor (escopo SAQ-A).

---

## 3. Arquitetura & bounded contexts

Monólito modular. Cada módulo NestJS tem fronteira nítida (controller → service → repository), permitindo extração futura para serviço próprio.

| Módulo | Responsabilidade |
|---|---|
| `identity` | Cadastro, auth, verificação 18+, RBAC, consentimentos LGPD |
| `catalog` | Produtos, variantes/SKU, categorias, mídia, estoque (ledger) |
| `cart` | Carrinho (convidado em Redis, logado persistido) |
| `checkout` | Fluxo de compra, ciclo de vida do pedido, NF-e |
| `payments` | Gateway (porta/adaptador), transações, webhooks idempotentes |
| `shipping` | Cálculo de frete, fulfillment discreto, rastreio |
| `coupons` | Cupons/descontos (motor de regras + concorrência atômica) |
| `engagement` | Wishlist, avaliações moderadas, notificações |
| `content` | CMS: banners, blog, guias de segurança de materiais |
| `admin` | Back-office, BI, gestão de usuários internos |

---

## 4. Estrutura de pastas (criar)

```
ecommerce-adulto/
├── apps/
│   ├── web/                     # Next.js (loja + PWA)
│   │   ├── app/                 # rotas (App Router)
│   │   ├── components/
│   │   ├── features/            # age-gate, carrinho, checkout, conta...
│   │   └── lib/
│   ├── admin/                   # painel back-office (Next.js)
│   └── api/                     # NestJS
│       ├── prisma/              # schema.prisma + migrations
│       └── src/
│           ├── modules/
│           │   ├── identity/
│           │   ├── catalog/
│           │   ├── cart/
│           │   ├── checkout/
│           │   ├── payments/
│           │   ├── shipping/
│           │   ├── coupons/
│           │   ├── engagement/
│           │   ├── content/
│           │   └── admin/
│           ├── common/          # guards, interceptors, filters, decorators
│           ├── config/
│           └── infra/           # prisma, redis, storage, queues, telemetry
├── packages/
│   ├── shared-types/            # DTOs/contratos front↔back
│   ├── ui/                      # design system
│   └── config/                  # eslint, tsconfig, prettier
└── infra/
    ├── docker-compose.yml       # postgres, redis, meilisearch, minio
    └── README.md
```

Anatomia de cada módulo: `*.controller.ts`, `*.service.ts`, `*.repository.ts`, `dto/`, `entities/`, `events/`.

---

## 5. Modelo de dados (schema-alvo)

DDL canônico abaixo. **Modelar em `schema.prisma`** e versionar via Prisma Migrate. Regras gerais: **UUID** como id público; **valores monetários em centavos (BIGINT)**; `TIMESTAMPTZ`; PII sensível em colunas criptografadas na aplicação; *soft-delete* onde indicado.

```sql
-- =========================== IDENTITY ===========================
CREATE TABLE users (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email           CITEXT UNIQUE NOT NULL,
    name            TEXT NOT NULL,
    cpf_encrypted   BYTEA NOT NULL,
    birth_date      DATE NOT NULL,            -- validação 18+ na aplicação
    phone_encrypted BYTEA,
    status          TEXT NOT NULL DEFAULT 'pending_verification', -- pending|active|suspended
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at      TIMESTAMPTZ
);
CREATE TABLE auth_credentials (
    user_id       UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    password_hash TEXT NOT NULL,             -- Argon2id
    totp_secret   BYTEA,
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE user_addresses (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID REFERENCES users(id) ON DELETE CASCADE,
    zip_code    TEXT NOT NULL, street TEXT, number TEXT, complement TEXT,
    district    TEXT, city TEXT, state CHAR(2), is_default BOOLEAN DEFAULT false
);
CREATE TABLE user_consents (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id        UUID REFERENCES users(id) ON DELETE CASCADE,
    purpose        TEXT NOT NULL,            -- marketing | profiling | ...
    granted        BOOLEAN NOT NULL,
    policy_version TEXT NOT NULL,
    created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Identidades internas (SEPARADAS das de clientes; 2FA obrigatório)
CREATE TABLE staff_users (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email         CITEXT UNIQUE NOT NULL,
    name          TEXT NOT NULL,
    password_hash TEXT NOT NULL,
    totp_secret   BYTEA NOT NULL,
    is_active     BOOLEAN NOT NULL DEFAULT true,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE permissions ( id SERIAL PRIMARY KEY, code TEXT UNIQUE NOT NULL ); -- 'product:create'
CREATE TABLE staff_roles ( id SERIAL PRIMARY KEY, name TEXT UNIQUE NOT NULL );
CREATE TABLE role_permissions (
    role_id INT REFERENCES staff_roles(id) ON DELETE CASCADE,
    permission_id INT REFERENCES permissions(id) ON DELETE CASCADE,
    PRIMARY KEY (role_id, permission_id)
);
CREATE TABLE staff_user_roles (
    staff_id UUID REFERENCES staff_users(id) ON DELETE CASCADE,
    role_id  INT REFERENCES staff_roles(id),
    PRIMARY KEY (staff_id, role_id)
);

-- =========================== CATALOG ===========================
CREATE TABLE categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    parent_id UUID REFERENCES categories(id),
    name TEXT NOT NULL, slug TEXT UNIQUE NOT NULL
);
CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL, slug TEXT UNIQUE NOT NULL, description TEXT, brand TEXT,
    attributes JSONB DEFAULT '{}',           -- material, dimensões, voltagem...
    is_sensitive_media BOOLEAN DEFAULT true, -- thumbnail discreto por padrão
    status TEXT NOT NULL DEFAULT 'draft',    -- draft|review|published|archived
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE product_variants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    sku TEXT UNIQUE NOT NULL, options JSONB DEFAULT '{}',
    price_cents BIGINT NOT NULL, sale_price_cents BIGINT, barcode TEXT
);
CREATE TABLE inventory (
    variant_id UUID PRIMARY KEY REFERENCES product_variants(id) ON DELETE CASCADE,
    quantity INT NOT NULL DEFAULT 0,
    reserved INT NOT NULL DEFAULT 0,
    version  INT NOT NULL DEFAULT 0           -- lock otimista
);
CREATE TABLE stock_movements (               -- ledger imutável
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    variant_id UUID NOT NULL REFERENCES product_variants(id),
    type TEXT NOT NULL,                       -- entrada|saida|ajuste|reserva|liberacao|transferencia
    quantity INT NOT NULL, reason TEXT,
    order_id UUID, staff_id UUID REFERENCES staff_users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE product_media (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    url TEXT NOT NULL, position INT DEFAULT 0
);

-- =========================== CART / ORDERS ===========================
CREATE TABLE carts (                         -- carrinho persistido (logado); convidado em Redis
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE cart_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cart_id UUID REFERENCES carts(id) ON DELETE CASCADE,
    variant_id UUID REFERENCES product_variants(id),
    quantity INT NOT NULL
);
CREATE TABLE orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),       -- NULL em convidado
    guest_email CITEXT,
    status TEXT NOT NULL DEFAULT 'created',   -- ver máquina de estados (seção 7)
    subtotal_cents BIGINT NOT NULL, shipping_cents BIGINT NOT NULL,
    discount_cents BIGINT NOT NULL DEFAULT 0, total_cents BIGINT NOT NULL,
    shipping_snapshot JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CHECK (user_id IS NOT NULL OR guest_email IS NOT NULL)
);
CREATE TABLE order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
    variant_id UUID REFERENCES product_variants(id),
    name_snapshot TEXT NOT NULL, unit_price_cents BIGINT NOT NULL, quantity INT NOT NULL
);
CREATE TABLE order_status_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
    status TEXT NOT NULL, created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =========================== PAYMENTS ===========================
CREATE TABLE payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
    method TEXT NOT NULL,                     -- pix|boleto|credit_card
    status TEXT NOT NULL DEFAULT 'pending',   -- pending|authorized|paid|failed|refunded
    gateway_token TEXT,                       -- token do gateway (nunca o cartão)
    amount_cents BIGINT NOT NULL, installments INT DEFAULT 1,
    idempotency_key TEXT UNIQUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =========================== COUPONS ===========================
CREATE TABLE coupons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT UNIQUE, name TEXT,
    discount_type TEXT NOT NULL,              -- percent|fixed|free_shipping
    value BIGINT NOT NULL DEFAULT 0,          -- % (ex.:15) ou centavos, conforme tipo
    max_discount_cents BIGINT, min_order_cents BIGINT,
    scope TEXT NOT NULL DEFAULT 'cart',       -- cart|products|categories
    first_purchase_only BOOLEAN NOT NULL DEFAULT false,
    combinable BOOLEAN NOT NULL DEFAULT false,
    usage_limit INT, usage_limit_per_user INT NOT NULL DEFAULT 1,
    used_count INT NOT NULL DEFAULT 0,        -- contador atômico
    valid_from TIMESTAMPTZ, valid_until TIMESTAMPTZ,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_by UUID REFERENCES staff_users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE coupon_scopes (
    coupon_id UUID NOT NULL REFERENCES coupons(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id), category_id UUID REFERENCES categories(id),
    CHECK (product_id IS NOT NULL OR category_id IS NOT NULL)
);
CREATE TABLE coupon_redemptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    coupon_id UUID NOT NULL REFERENCES coupons(id),
    order_id UUID NOT NULL REFERENCES orders(id),
    user_id UUID REFERENCES users(id), guest_email CITEXT,
    discount_cents BIGINT NOT NULL,
    redeemed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =========================== ENGAGEMENT / AUDIT ===========================
CREATE TABLE reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id),
    rating SMALLINT CHECK (rating BETWEEN 1 AND 5), comment TEXT,
    status TEXT NOT NULL DEFAULT 'pending',   -- moderação obrigatória
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE wishlists (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE
);
CREATE TABLE wishlist_items (
    wishlist_id UUID REFERENCES wishlists(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id),
    PRIMARY KEY (wishlist_id, product_id)
);
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    actor_id UUID, action TEXT NOT NULL,
    entity TEXT, entity_id UUID, metadata JSONB,   -- sem PII/cartão
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =========================== ÍNDICES ===========================
CREATE INDEX idx_orders_user       ON orders(user_id);
CREATE INDEX idx_orders_status     ON orders(status);
CREATE INDEX idx_variant_product   ON product_variants(product_id);
CREATE INDEX idx_stock_mov_variant ON stock_movements(variant_id, created_at);
CREATE INDEX idx_reviews_product   ON reviews(product_id) WHERE status = 'approved';
CREATE INDEX idx_redemptions_user  ON coupon_redemptions(user_id);
CREATE INDEX idx_redemptions_email ON coupon_redemptions(guest_email);
```

---

## 6. Requisitos funcionais por módulo

### 6.1 identity
- Cadastro mínimo: email, senha, nome, CPF (validado), data de nascimento, telefone. Endereço só no checkout.
- **Verificação 18+ em camadas**: age gate na entrada (cookie curto) + maioridade calculada no servidor a partir de `birth_date`. Bloqueio duro se < 18.
- Auth: JWT access (~15 min) + refresh em cookie `httpOnly`/`Secure`/`SameSite=Strict`, com rotação e revogação via Redis. Hash **Argon2id**. Verificação de e-mail. 2FA (TOTP) opcional para cliente, **obrigatório para staff**.
- Checagem de senha vazada via HaveIBeenPwned (k-anonymity).
- **RBAC baseado em permissões** (`recurso:ação`): guard que valida permissão por rota. Papéis são conjuntos de permissões (seção de matriz no doc de back-office).
- LGPD: registro de consentimento versionado; endpoints de acesso/portabilidade/exclusão (soft-delete + anonimização).

### 6.2 catalog
- CRUD de produtos e variantes; categorias hierárquicas; mídia com flag de sensibilidade.
- **Workflow de publicação**: draft → review → published → archived.
- **Estoque como ledger**: toda mudança de saldo gera `stock_movements`; nunca sobrescrever quantidade "na mão". Saldo em `inventory` com `version` (lock otimista).
- Alertas de estoque baixo (limiar por SKU) via fila.
- Operações em lote (import/export CSV) — pode entrar em milestone posterior.
- Indexação de produtos publicados no Meilisearch para busca facetada.

### 6.3 cart
- Convidado: carrinho em Redis (TTL). Logado: persistido (`carts`/`cart_items`) e mesclado no login.
- Validar disponibilidade ao exibir; **reservar estoque só no checkout** (não ao adicionar).

### 6.4 checkout
- Fluxo: revisão → identificação (convidado/login) → endereço + frete → pagamento → revisão/termos → processamento → confirmação.
- **Checkout de convidado é first-class** (só e-mail + dados da compra).
- Reserva de estoque na criação do pedido; liberação por timeout se não pago (job BullMQ).
- Snapshots de nome/preço/endereço no pedido.
- Emissão de **NF-e** (fila) após pagamento confirmado; descrição discreta onde permitido.
- Política de devolução explícita (arrependimento 7 dias + exceção sanitária de íntimos).

### 6.5 payments
- Interface `PaymentGateway` + adaptador concreto. **Cartão via tokenização/campos hospedados** (SAQ-A) — cartão nunca no backend.
- PIX, boleto, cartão parcelado. Confirmação **assíncrona por webhook assinado e idempotente** (`idempotency_key`).
- Máquina de status de pagamento: pending → authorized → paid → (failed|refunded).

### 6.6 shipping
- Cálculo de frete (Correios/transportadora) e prazo; regras de frete grátis.
- **Embalagem e remetente discretos** (comunicado ao cliente).
- Rastreamento e atualização de status.

### 6.7 coupons
- CRUD (admin, `coupon:manage`) + geração de código único ou lote exclusivo.
- Motor de regras: validade, mínimo, escopo, primeira compra, limites (global e por cliente), combinabilidade (padrão off), teto em percentuais.
- **Concorrência (CRÍTICO):** resgatar via `UPDATE` condicional atômico:
  ```sql
  UPDATE coupons SET used_count = used_count + 1
   WHERE id = :id AND is_active = true
     AND (usage_limit IS NULL OR used_count < usage_limit)
  RETURNING used_count;   -- 0 linhas = esgotado
  ```
  Limite por cliente = contagem de `coupon_redemptions` por user/email na mesma transação. Reserva na criação do pedido; libera (`used_count - 1`) no cancelamento/expiração.

### 6.8 admin (back-office + BI)
- Painel isolado em subdomínio (`admin.*`), 2FA obrigatório, sessões curtas, toda ação em `audit_logs`.
- Gestão de catálogo/estoque/pedidos/cupons conforme permissões.
- **BI: separar OLTP de OLAP.** Não rodar analytics no banco transacional. MVP: read replica + Metabase/Superset. Evolução: Data Warehouse + ELT (dbt/CDC) + modelos de tendência (previsão de demanda, produtos em alta) — respeitando privacidade (dados agregados/pseudonimizados).

---

### 6.9 Identidade visual & design system (Cereja Love Shop)
- Fonte da verdade visual: `assets/brand-reference/` — as imagens `ref-01…ref-12` são a referência de estilo; a UI deve conversar com elas.
- **Paleta** (extraída das referências, tokens completos em `IDENTIDADE-VISUAL.md`): Cereja `#A80C0C` (primária), Vinho `#540000` (profunda), Terracota `#A83C24`, Rosé `#9C6054`, Nude `#C0A890`, Creme `#E4D8B4`, Off-white `#FCFCFC`, Tinta `#242418`.
- Implementar os tokens no `packages/ui` (CSS variables) e estender o `tailwind.config` com as cores da marca.
- Base clara com cereja como acento e vinho para profundidade; tipografia elegante (serifada para títulos + sans limpa para texto); cantos suaves e respiro generoso.
- **Coerência com a discrição:** vitrine e cards usam thumbnail discreto por padrão (`products.is_sensitive_media`), com toggle "mostrar imagens".

---

## 7. Máquina de estados do pedido

```
created → awaiting_payment → paid → processing → shipped → delivered → completed
                          ↘ canceled                     
paid → refunded ;  processing → canceled
```
Cada transição grava em `order_status_history` e emite evento de domínio (notificação discreta ao cliente).

---

## 8. Segurança (requisitos rígidos)

- **Transporte:** TLS 1.3, HSTS. **Headers:** CSP, X-Frame-Options, Referrer-Policy, Permissions-Policy.
- **PCI SAQ-A:** cartão nunca toca o backend (tokenização/campos hospedados).
- **Criptografia em repouso** para PII; **coluna criptografada** para CPF, `birth_date`, telefone e dados que inferem preferência.
- **OWASP:** queries via ORM (anti-SQLi), output encoding (anti-XSS), CSRF tokens, validação estrita por DTO, rate limiting (login, recuperação de senha, aplicação de cupom), CAPTCHA após N falhas.
- **Discrição técnica:** descritor de cobrança neutro, remetente neutro, e-mails/push neutros por padrão, botão de saída rápida, modo sem histórico.
- **Segredos** em variável de ambiente/secrets manager — nunca no código. **Logs** com PII/cartão mascarados.
- **Staff:** identidades separadas, 2FA obrigatório, menor privilégio, segregação de funções, auditoria total.
- **CI/CD:** SAST + SCA (Dependabot) + testes obrigatórios.

---

## 9. Requisitos não-funcionais

- Backend **stateless** (sessão/refresh no Redis) → escala horizontal.
- p95 de API < 300 ms; cache de catálogo (Redis/CDN).
- Idempotência em webhooks; retries com backoff; circuit breaker no gateway.
- Acessibilidade **WCAG 2.1 AA**; Core Web Vitals verdes; **mobile-first/PWA**.
- Testes: unitários nos services, integração nos fluxos de checkout/pagamento/cupom.

---

## 10. Convenções de código

- TypeScript **strict**. ESLint + Prettier (config em `packages/config`).
- Nomes de arquivo em kebab-case; classes em PascalCase.
- DTOs validados com **class-validator**; contratos compartilhados em `packages/shared-types`.
- Commits pequenos e lógicos (Conventional Commits). Cada módulo com testes antes de seguir.
- Dinheiro **sempre em centavos (inteiro)**; datas em `TIMESTAMPTZ`/ISO 8601.
- Erros de domínio tipados; nunca vazar stack trace ao cliente.

---

## 11. Ordem de implementação (Milestones)

Implementar **nesta ordem**. Concluir e testar cada milestone antes do próximo.

- **M0 — Fundação:** monorepo (Turborepo/pnpm), `docker-compose` (postgres, redis, meilisearch, minio), NestJS + Prisma inicial, Next.js base, ESLint/Prettier/tsconfig, healthcheck. Migração inicial com o schema da seção 5. **Configurar os tokens de marca (seção 6.9) em `packages/ui` + `tailwind.config`.**
- **M1 — Identity:** cadastro (com validação 18+ e CPF), auth JWT + refresh, Argon2id, RBAC baseado em permissões (guards), seed de papéis/permissões e usuário admin, consentimento LGPD. Age gate no front.
- **M2 — Catalog:** CRUD de produtos/variantes/categorias/mídia, workflow de publicação, estoque com ledger + lock otimista, indexação no Meilisearch, vitrine e página de produto no front (com thumbnail discreto).
- **M3 — Cart & Checkout:** carrinho (Redis convidado + persistido logado), checkout com convidado first-class, reserva de estoque + liberação por timeout, snapshots, máquina de estados do pedido.
- **M4 — Payments:** interface `PaymentGateway` + adaptador (PIX/boleto/cartão tokenizado), webhooks idempotentes, integração com o estado do pedido.
- **M5 — Coupons:** motor de regras + resgate atômico + `coupon_redemptions`, tela de criação no admin.
- **M6 — Shipping & NF-e:** frete/prazo, embalagem discreta, emissão de NF-e (fila), rastreio.
- **M7 — Back-office & BI:** painel admin isolado (2FA), gestão completa, auditoria, dashboards (read replica + Metabase/Superset).
- **M8 — Engagement & hardening:** wishlist, avaliações moderadas, notificações discretas, revisão de segurança (headers, rate limits, mascaramento de logs), testes e2e.

---

## 12. Critérios de aceite (amostra)

- Nenhum usuário menor de 18 (por `birth_date`) consegue concluir cadastro/checkout.
- Nenhuma rota administrativa é acessível sem a permissão correspondente; toda ação de staff aparece em `audit_logs`.
- Dados de cartão nunca chegam ao backend (verificável nos logs/rede).
- Cupom com `usage_limit` esgotado **não** é resgatado mesmo sob requisições concorrentes (teste de carga).
- Estoque nunca fica negativo sob concorrência (teste de reserva simultânea).
- Fatura/e-mails/remetente usam identificação neutra.
- CPF/`birth_date` estão criptografados em repouso; exclusão de conta anonimiza o titular preservando obrigações fiscais.

---

**Fim da especificação.** Em caso de ambiguidade, priorizar as restrições da seção 1.2 e os requisitos da seção 8, e perguntar antes de assumir.
