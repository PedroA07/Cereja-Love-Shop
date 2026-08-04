# Guia de precificação — como cobrar e manter lucro

> Referências de mercado brasileiro (2026) para desenvolvimento sob medida.
> Ajuste conforme sua experiência, região e o porte do cliente.

---

## 1. Primeiro: saiba seu custo real

Antes de dar preço, some o que **sai do seu bolso todo mês** se você mantiver
esse sistema no ar:

| Item | Custo mensal aproximado |
|---|---|
| Vercel Pro (obrigatório p/ uso comercial) | ~US$ 20 (~R$ 110) |
| Render / host da API (plano pago, sem "dormir") | ~US$ 7–25 (~R$ 40–140) |
| Banco Postgres (Supabase/Neon pago, quando crescer) | ~US$ 25 (~R$ 140) |
| Redis (Upstash pago) | ~US$ 10 (~R$ 55) |
| Domínio .com.br | ~R$ 40/ano |
| **Total de infraestrutura** | **~R$ 350–450/mês** |

**Regra de ouro:** a infraestrutura deve estar **na conta do cliente** (ver
`RESPONSABILIDADES.md`). Se estiver na sua, sua mensalidade tem que cobrir isso
com folga — senão você está financiando o negócio dele.

E some seu custo de hora: se você cobra R$ 80/h e o projeto levou 120h, seu piso
técnico é R$ 9.600 — abaixo disso você pagou para trabalhar.

---

## 2. Modelos de cobrança

### Modelo A — Setup + Mensalidade (RECOMENDADO)

O mais equilibrado e o mais comum no mercado.

| Componente | Faixa sugerida | O que cobre |
|---|---|---|
| **Setup (entrega do sistema)** | R$ 6.000 – R$ 18.000 | Desenvolvimento, deploy, treinamento |
| **Mensalidade** | R$ 600 – R$ 1.800/mês | Hospedagem, manutenção, suporte, correções, pequenos ajustes |

**Por que mensalidade é essencial:** sem ela, você entrega, recebe uma vez e
depois vira suporte gratuito eterno. Todo sistema no ar gera trabalho: bug,
atualização de segurança, dúvida do cliente, mudança de regra do gateway.

**O que incluir na mensalidade (defina limites):**
- Hospedagem e monitoramento
- Correção de bugs (sem custo)
- Até X horas/mês de pequenos ajustes (ex.: 4h)
- Suporte em horário comercial, resposta em até 2 dias úteis

**O que NÃO incluir** (cobrar à parte, por hora ou orçamento):
- Funcionalidades novas
- Redesign
- Integrações novas
- Cadastro de produtos em massa (isso é trabalho do cliente pelo painel)

---

### Modelo B — Projeto fechado (sem recorrência)

Só faz sentido se você **não quer** manter o sistema depois.

- Valor: R$ 10.000 – R$ 25.000
- Entrega o código, treina, e encerra
- **Deixe explícito no contrato:** suporte após entrega é cobrado por hora
  (ex.: R$ 120–200/h) e a hospedagem é 100% responsabilidade do cliente

Risco: o cliente vai te procurar meses depois esperando ajuda de graça. O
contrato tem que fechar essa porta.

---

### Modelo C — Percentual sobre vendas (EVITE no começo)

Ex.: 3–5% do faturamento, com mensalidade mínima.

- **Vantagem:** se a loja crescer muito, você ganha muito
- **Risco alto:** se a loja vender pouco (o mais provável no início), você
  trabalha de graça. E você fica dependente da gestão do cliente, que não
  controla.
- Se usar: **sempre** com um piso mensal fixo que cubra seus custos.

---

## 3. Faixa sugerida para ESTE projeto

Este sistema não é uma loja de template. Ele tem: catálogo com controle de
estoque à prova de venda duplicada, checkout com convidado, pagamentos
(PIX/boleto/cartão) com webhooks idempotentes, motor de cupons com resgate
atômico, painel administrativo com 2FA e auditoria, e conformidade LGPD com
criptografia de dados sensíveis.

Considerando o porte do cliente (loja de bairro / Instagram, começando online):

| Cenário | Setup | Mensalidade |
|---|---|---|
| **Conservador** (cliente pequeno, primeiro projeto seu) | R$ 6.000 | R$ 600 |
| **Equilibrado** (recomendado) | R$ 10.000 | R$ 900 |
| **Valorizado** (você tem portfólio/experiência) | R$ 15.000+ | R$ 1.200+ |

**Parcelamento sugerido do setup:** 40% na assinatura + 30% na entrega da loja
funcionando + 30% na entrada em produção. Nunca entregue 100% do sistema antes
de receber a maior parte.

---

## 4. Como defender o preço (o cliente vai comparar com Shopify)

O cliente vai dizer: *"mas a Nuvemshop custa R$ 100 por mês"*. Argumentos reais:

1. **Comissão por venda.** Plataformas prontas cobram ~2% sobre cada venda.
   Uma loja que fatura R$ 30.000/mês paga **R$ 600/mês só de comissão** — além
   da mensalidade. Em 12 meses são R$ 7.200 que ficam com a plataforma.

2. **O sistema é dele.** Sem refém de plataforma, sem aumento de preço unilateral,
   sem risco de a plataforma banir a loja por ser segmento adulto — isso acontece.

3. **Feito para o segmento.** Embalagem discreta, descritor neutro na fatura,
   thumbnail discreto, verificação 18+ no servidor, saída rápida. Plataforma
   genérica não tem nada disso.

4. **Conformidade.** LGPD com criptografia de CPF, auditoria de ações internas,
   PCI SAQ-A no cartão. Se vazar dado de cliente numa loja de produtos íntimos,
   o dano à reputação é grave.

---

## 5. Erros que dão prejuízo (evite)

- ❌ Cobrar só o setup e "dar" o suporte → suporte eterno de graça
- ❌ Pagar a hospedagem do bolso e não repassar → prejuízo mensal silencioso
- ❌ Escopo aberto ("qualquer ajuste") → o projeto nunca termina
- ❌ Entregar o sistema completo antes do pagamento final
- ❌ Receber as vendas na sua conta → risco fiscal sério
- ❌ Não ter contrato assinado

---

> ⚠️ Valores são referências de mercado, não garantia. **Não é consultoria
> financeira ou jurídica.** Contrato e enquadramento fiscal devem passar por
> advogado e contador.
