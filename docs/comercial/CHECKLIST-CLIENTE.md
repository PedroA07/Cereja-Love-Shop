# Checklist do cliente — o que precisa ser providenciado

> Envie este documento ao cliente. São itens que **só ele pode resolver**, porque
> dependem do CNPJ e da conta bancária dele. Sem eles a loja não pode vender de
> verdade — mesmo com o sistema 100% pronto.

---

## Etapa 1 — Empresa (pré-requisito de tudo)

- [ ] **CNPJ ativo**
  - CNAE sugerido para o ramo: `4789-0/99` (comércio varejista de outros produtos)
  - ⚠️ Confirmar com o contador: o CNAE influencia impostos e a aprovação no
    gateway de pagamento
- [ ] **Conta bancária PJ** (em nome do CNPJ)
- [ ] **Contador** definido (será necessário para NF-e e impostos)

---

## Etapa 2 — Recebimento de pagamentos

- [ ] Escolher o gateway: **Mercado Pago**, **Pagar.me**, PagBank ou Asaas
- [ ] **Antes de abrir a conta, perguntar ao gateway:**
  1. A atividade **sex shop / produtos íntimos** é aceita? Há restrição de MCC/CNAE?
  2. Vocês permitem **descritor de cobrança personalizado/neutro** na fatura do
     cliente? *(essencial — é o que garante a discrição da compra)*
  3. Quais as taxas de PIX, boleto e cartão (à vista e parcelado)?
  4. Qual o prazo de repasse? Há reserva financeira (retenção)?
  5. Fornecem **tokenização / campos hospedados** para o cartão?
- [ ] Abrir a conta **em nome do CNPJ**
- [ ] Conceder acesso de desenvolvedor ao responsável técnico

> ℹ️ O ramo é legal no Brasil, mas o setor é classificado como "alto risco" pelo
> mercado de pagamentos (por causa de estornos). Perguntar antes evita perder
> tempo com um provedor que vai recusar depois.

---

## Etapa 3 — Nota fiscal (NF-e)

- [ ] **Certificado digital A1** (arquivo `.pfx` + senha) — comprado via
      certificadora (Serasa, Certisign, etc.), com ajuda do contador
- [ ] **Inscrição Estadual** (necessária para venda de mercadoria)
- [ ] Definir o emissor de NF-e com o contador
- [ ] Informar ao desenvolvedor: regime tributário, CFOP e NCM dos produtos
      *(o contador fornece)*

---

## Etapa 4 — Identidade e conteúdo

- [ ] **Domínio** (ex.: `cerejaloveshop.com.br`) — registrado no registro.br em
      nome do cliente
- [ ] **Fotos dos produtos** (idealmente fundo neutro, boa resolução)
- [ ] **Descrições, preços e estoque** de cada produto
- [ ] **Textos legais** (podem ser revisados por advogado):
  - Política de privacidade (LGPD)
  - Termos de uso
  - Política de troca e devolução — deve constar a exceção sanitária:
    produtos íntimos abertos não são devolvíveis

---

## Etapa 5 — Operação

- [ ] Definir **quem embala e envia** os pedidos
- [ ] Confirmar a **embalagem discreta** (caixa neutra, sem identificação do
      conteúdo, remetente neutro)
- [ ] Contratar frete: Correios (contrato PJ) ou transportadora
- [ ] Definir **quem atende o cliente** (WhatsApp, e-mail)

---

## Acessos a conceder ao desenvolvedor

O cliente cria as contas (com e-mail e cartão dele) e adiciona o desenvolvedor
como colaborador:

- [ ] Vercel (hospedagem da loja e do painel)
- [ ] Render (ou host da API)
- [ ] Supabase (banco de dados)
- [ ] Gateway de pagamento (acesso de desenvolvedor)
- [ ] Registro.br (ou apenas apontar o DNS informado)

> 🔒 O desenvolvedor **não precisa** de senha de banco, cartão de crédito ou
> acesso ao Gov.br. Não conceda.

---

## Resumo: o que trava o quê

| Sem isto… | …não funciona |
|---|---|
| CNPJ | Gateway, NF-e, conta PJ |
| Gateway aprovado | Receber pagamento de verdade |
| Certificado A1 + IE | Emitir nota fiscal |
| Fotos e preços | Vitrine com produtos reais |
| Embalagem discreta definida | Promessa de discrição da marca |

**O sistema já está pronto e testado** — inclusive pagamentos em modo simulação.
Assim que o gateway do cliente for aprovado, a troca para o ambiente real é uma
configuração, não um novo desenvolvimento.
