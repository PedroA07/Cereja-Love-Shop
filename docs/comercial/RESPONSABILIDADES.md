# Divisão de responsabilidades — Desenvolvedor × Cliente

> Documento de alinhamento. O objetivo é deixar explícito que **todas as contas
> financeiras e fiscais ficam em nome do cliente**, e que o desenvolvedor atua
> como prestador de serviço técnico.

## Princípio central

**Tudo que envolve dinheiro, CNPJ ou responsabilidade legal fica no nome do
cliente.** O desenvolvedor configura, integra e mantém — mas nunca é o titular
das contas de recebimento nem o responsável fiscal pelas vendas.

Por quê:
- Receber pagamentos de terceiros na sua conta configura risco fiscal e pode
  caracterizar atividade financeira irregular.
- A NF-e da venda é emitida pelo CNPJ que vende — não pelo desenvolvedor.
- Se a loja for autuada, o titular responde. Não pode ser você.

---

## Tabela de responsabilidades

| Item | Titular / Responsável | Quem configura |
|---|---|---|
| CNPJ e inscrições | **Cliente** | Contador do cliente |
| Conta bancária / recebimento | **Cliente** | Cliente |
| Gateway de pagamento (Mercado Pago, Pagar.me…) | **Cliente** | Dev (com acesso concedido) |
| Certificado digital A1 (NF-e) | **Cliente** | Contador / Dev |
| Emissão de NF-e | **Cliente** (obrigação fiscal) | Dev integra o emissor |
| Domínio (ex.: cerejaloveshop.com.br) | **Cliente** | Dev configura DNS |
| Hospedagem (Vercel, Render, banco) | Conta do **cliente**¹ | Dev |
| Código-fonte | Ver contrato (cessão ou licença) | Dev |
| Conteúdo (fotos, descrições, preços) | **Cliente** | Cliente (pelo painel) |
| Atendimento ao consumidor / trocas | **Cliente** | — |
| LGPD: controlador dos dados | **Cliente** | Dev implementa os requisitos |
| LGPD: operador | **Dev** (enquanto presta serviço) | — |

¹ **Recomendação forte:** as contas de hospedagem devem ser criadas com e-mail
do cliente e cartão do cliente. Você recebe acesso como colaborador. Isso evita
que você fique pagando infraestrutura do negócio de outra pessoa — e evita que o
cliente fique refém se a relação terminar.

---

## O que você precisa receber do cliente (acessos)

Peça que o cliente **crie as contas** e te adicione como colaborador/admin:

1. **Gateway de pagamento** — acesso de desenvolvedor (chaves de API)
2. **Vercel** — convite como membro do time
3. **Render** (ou host da API) — convite
4. **Supabase / banco** — convite
5. **Registro.br** (domínio) — ou o cliente configura o DNS que você passar
6. **Certificado digital A1** — apenas o arquivo + senha, para a integração de NF-e

> Nunca peça senha de banco, cartão ou acesso ao Gov.br do cliente. Você não
> precisa disso e assumir essa custódia é risco desnecessário para os dois lados.

---

## LGPD: controlador × operador

Isso precisa estar no contrato (Art. 39 da LGPD):

- **Controlador = cliente.** É quem decide o que fazer com os dados dos
  compradores e responde perante a ANPD.
- **Operador = você**, enquanto opera o sistema em nome dele.
- O contrato deve prever: finalidade do tratamento, medidas de segurança,
  obrigação de sigilo e o que acontece com os dados no fim do contrato.

O sistema já implementa os requisitos técnicos (criptografia de PII,
consentimento versionado, exportação e exclusão) — mas a responsabilidade
jurídica é do controlador.

---

> ⚠️ Este documento é um guia técnico-comercial, **não é parecer jurídico ou
> contábil**. Contrato e enquadramento fiscal devem ser revisados por advogado
> e contador.
