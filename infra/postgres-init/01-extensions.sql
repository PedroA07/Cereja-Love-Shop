-- Extensões exigidas pelo schema (§5): citext p/ e-mails, pgcrypto p/ gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS citext;
CREATE EXTENSION IF NOT EXISTS pgcrypto;
