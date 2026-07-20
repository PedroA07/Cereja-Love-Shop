# Cereja Love Shop — Guia para o agente

Leia **`ESPECIFICACAO-PROJETO.md`** por completo antes de codar. É a fonte única de verdade; as decisões nele são definitivas. **Pergunte antes de divergir.**

## Não-negociáveis (repetindo o essencial)
- **18+**: validação de maioridade sempre no servidor (via `birth_date`).
- **Discrição**: cobrança/remetente/e-mails neutros, botão de saída rápida, thumbnail discreto por padrão.
- **LGPD**: CPF e `birth_date` criptografados em coluna; perfilamento só com consentimento; exclusão anonimiza preservando obrigação fiscal.
- **PCI SAQ-A**: dados de cartão nunca no backend (tokenização/campos hospedados).
- **Concorrência**: estoque e cupons usam operações atômicas no banco (ver seções 6.7 e 6.2). Nunca ler-comparar-gravar limites em memória.

## Stack
Turborepo + pnpm · Next.js (App Router) + Tailwind · NestJS · Prisma + PostgreSQL · Redis + BullMQ · Meilisearch · S3/MinIO · JWT + Argon2id + TOTP.

## Identidade visual
Referência em `assets/brand-reference/` (imagens `ref-01…12` + `IDENTIDADE-VISUAL.md`). Paleta cereja/vinho + nude/creme. Implementar tokens em `packages/ui` e `tailwind.config`.

## Processo
- Implemente na ordem dos Milestones (seção 11). Conclua e teste um antes do próximo.
- Commits pequenos e lógicos (Conventional Commits); testes antes de avançar.
- Dinheiro sempre em centavos (inteiro). TypeScript strict. DTOs validados com class-validator.
- Ao concluir cada milestone, pare e mostre o que foi feito e como rodar localmente.
