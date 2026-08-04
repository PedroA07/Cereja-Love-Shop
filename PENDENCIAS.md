# Pendências externas (dependem de decisão ou cadastro fora do código)

Itens que **não bloqueiam** o desenvolvimento, mas precisam ser resolvidos antes
da loja operar de verdade. Atualize o status conforme forem sendo resolvidos.

---

## 1. Gateway de pagamento real — PENDENTE

**Situação:** os pagamentos funcionam em modo **sandbox** (adaptador de simulação).
O fluxo completo — PIX, boleto, cartão, webhooks — está implementado e testado,
mas **não movimenta dinheiro real**.

**O que falta:**

1. Ter **CNPJ** (necessário para PIX/boleto empresarial e emissão de NF-e).
   CNAE comum no ramo: `4789-0/99`. Confirmar com contador.
2. Abrir conta em **Mercado Pago**, **Pagar.me** (ou PagBank/Asaas) e
   **confirmar antes** que aceitam o segmento adulto — o setor é classificado
   como "alto risco" e as políticas não são públicas, são caso a caso.
3. Perguntar obrigatoriamente:
   - Atividade é aceita? Restrição de MCC/CNAE?
   - Oferecem **descritor de cobrança neutro** na fatura? (requisito §1.2)
   - Taxas (PIX/boleto/cartão parcelado), prazo de repasse, reserva financeira
   - Fornecem **tokenização/campos hospedados** (para manter PCI SAQ-A, §8)

**Quando aprovado, o que muda no código:** apenas escrever o adaptador concreto
em `apps/api/src/modules/payments/gateway/` implementando a interface
`PaymentGateway`, e trocar o provider em `payments.module.ts`. O domínio não muda.

**Variáveis a configurar no Render:**
`PAYMENT_PROVIDER`, `PAYMENT_API_KEY`, `PAYMENT_PUBLIC_KEY`, `PAYMENT_WEBHOOK_SECRET`
**URL do webhook a cadastrar no provedor:**
`https://<sua-api>.onrender.com/api/v1/payments/webhook`

---

## 2. Seed em produção — PENDENTE

Os produtos de demonstração e o usuário administrador ainda não foram criados no
banco de produção (Supabase).

**Como fazer (sem terminal):** no Render → serviço da API → **Environment** →
`RUN_SEED=true` → Save (redeploy automático) → conferir nos **Logs** o e-mail,
senha e **secret TOTP do admin** (guardar!) → voltar `RUN_SEED` para `false`.

---

## 3. Emissão de NF-e — NÃO INICIADO (M6)

Requer certificado digital (A1) e integração com emissor. Planejado para o M6.

---

## 4. Busca com Meilisearch — ADIADO

A busca da vitrine usa PostgreSQL (funcional). O Meilisearch exige mais um
serviço hospedado; entra quando o catálogo crescer ou houver orçamento.

---

## 5. Plano da Vercel — ATENÇÃO

O plano Hobby é para uso **não comercial**. Quando a loja começar a vender de
verdade, migrar para o plano Pro.
