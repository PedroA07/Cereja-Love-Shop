# Infra de desenvolvimento

Serviços locais via Docker Compose: **PostgreSQL 16**, **Redis 7**, **Meilisearch v1.12** e **MinIO** (S3-compatible).

## Subir

```bash
pnpm infra:up          # na raiz do repo
# ou: docker compose -f infra/docker-compose.yml up -d
```

## Endpoints

| Serviço | URL | Credenciais (dev) |
|---|---|---|
| PostgreSQL | `postgresql://localhost:5432/cereja` | `cereja` / `cereja` |
| Redis | `redis://localhost:6379` | — |
| Meilisearch | http://localhost:7700 | master key `dev_meili_master_key_change_me` |
| MinIO (S3) | http://localhost:9000 | `minioadmin` / `minioadmin` |
| MinIO Console | http://localhost:9001 | `minioadmin` / `minioadmin` |

O init do Postgres habilita as extensões `citext` e `pgcrypto` (necessárias ao schema).
O job `minio-init` cria o bucket `cereja-media` automaticamente.

## Derrubar

```bash
pnpm infra:down
# volumes persistem; para zerar: docker compose -f infra/docker-compose.yml down -v
```

> Credenciais acima são **apenas de desenvolvimento local**. Em produção, tudo via secrets manager (§8).
