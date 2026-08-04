# ⚠️ AVISO IMPORTANTE — LEIA ANTES DE USAR

**Este documento é um RASCUNHO de apoio, elaborado por um desenvolvedor, e NÃO é
peça jurídica.** Ele não substitui a análise de um advogado.

Antes de assinar:

1. **Contrate um advogado** para revisar e adaptar o texto à sua realidade
   (regime tributário, região, porte das partes, riscos específicos).
2. Confirme com seu **contador** o enquadramento fiscal da prestação de serviço
   e a emissão da nota fiscal de serviço (NFS-e).
3. Preencha **todos os campos entre [colchetes]** e apague as notas de rodapé
   marcadas com 💡 antes de enviar ao cliente.
4. As cláusulas de **LGPD** e de **propriedade intelectual** são as que mais
   geram disputa — dê atenção especial a elas com o advogado.

---

# CONTRATO DE PRESTAÇÃO DE SERVIÇOS DE DESENVOLVIMENTO E MANUTENÇÃO DE SISTEMA

## QUALIFICAÇÃO DAS PARTES

**CONTRATADO(A):** [Nome completo ou Razão Social], [nacionalidade], [estado
civil], [profissão], inscrito(a) no [CPF/CNPJ] sob o nº [número], com endereço
em [endereço completo], e-mail [e-mail], doravante denominado(a) **CONTRATADO**.

**CONTRATANTE:** [Razão Social], pessoa jurídica de direito privado, inscrita no
CNPJ sob o nº [número], com sede em [endereço completo], neste ato representada
por [nome do representante legal], [qualificação], portador do CPF nº [número],
e-mail [e-mail], doravante denominada **CONTRATANTE**.

As partes acima qualificadas têm entre si justo e contratado o presente
instrumento, que se regerá pelas cláusulas seguintes.

---

## CLÁUSULA 1 — DO OBJETO

**1.1.** O presente contrato tem por objeto a prestação, pelo CONTRATADO, dos
serviços de **desenvolvimento, implantação e manutenção** de plataforma de
comércio eletrônico destinada à venda de produtos íntimos, lingerie e
cosméticos, para público adulto (18 anos ou mais), doravante denominada
**SISTEMA**, composta por:

- **a)** Loja virtual acessível ao consumidor final;
- **b)** Painel administrativo para gestão interna da CONTRATANTE;
- **c)** Serviço de aplicação (API) que sustenta os itens anteriores.

**1.2.** O SISTEMA será disponibilizado no endereço eletrônico
[domínio do cliente], de titularidade da CONTRATANTE.

---

## CLÁUSULA 2 — DO ESCOPO DOS SERVIÇOS

### 2.1. Funcionalidades incluídas na implantação

**2.1.1. Loja virtual:**
- **a)** Catálogo de produtos com categorias, busca, filtros e variações
  (tamanho, cor, volume);
- **b)** Verificação de maioridade (18+) processada no servidor;
- **c)** Carrinho de compras com possibilidade de compra sem cadastro prévio;
- **d)** Processo de finalização de compra com endereço, cálculo de frete por
  região e aplicação de cupom de desconto;
- **e)** Meios de pagamento: PIX, boleto bancário e cartão de crédito parcelado;
- **f)** Lista de favoritos e avaliações de produtos submetidas a moderação;
- **g)** Acompanhamento de pedido pelo consumidor;
- **h)** Recursos de discrição: imagem de capa discreta, botão de saída rápida,
  descritor neutro na fatura e comunicação de embalagem neutra.

**2.1.2. Painel administrativo:**
- **a)** Indicadores gerais (pedidos, receita, estoque baixo);
- **b)** Cadastro e publicação de produtos, com controle de preço e estoque;
- **c)** Gestão de pedidos e respectivas transições de status;
- **d)** Criação e gestão de cupons de desconto;
- **e)** Moderação de avaliações;
- **f)** Registro de auditoria das ações realizadas pela equipe interna;
- **g)** Acesso protegido por autenticação em duas etapas.

**2.1.3. Requisitos técnicos implementados:**
- **a)** Controle de estoque com operações atômicas, impedindo venda de
  quantidade superior à disponível mesmo sob acessos simultâneos;
- **b)** Resgate de cupons com controle atômico de limite de uso;
- **c)** Criptografia de dados pessoais sensíveis (CPF, data de nascimento e
  telefone) em banco de dados;
- **d)** Arquitetura em que os dados de cartão de crédito não trafegam nem são
  armazenados no servidor do SISTEMA (padrão PCI-DSS SAQ-A);
- **e)** Funcionalidades de atendimento à LGPD: registro de consentimento,
  exportação e exclusão de dados do titular.

**2.1.4. Serviços complementares:**
- **a)** Publicação do SISTEMA em ambiente de produção;
- **b)** Treinamento de uso do painel administrativo, com duração de até
  [2] horas, realizado de forma [remota/presencial];
- **c)** Documentação técnica de operação.

### 2.2. Itens NÃO incluídos (orçados separadamente)

Os itens abaixo **não integram** o escopo desta contratação e, se solicitados,
serão objeto de orçamento específico e aprovação prévia por escrito:

- **a)** Desenvolvimento de novas funcionalidades não descritas na Cláusula 2.1;
- **b)** Redesenho da identidade visual ou da estrutura de navegação;
- **c)** Integração com sistemas de terceiros não previstos (ERP, marketplaces,
  automação de marketing, chatbots);
- **d)** Cadastro de produtos, redação de descrições, tratamento ou produção de
  fotografias;
- **e)** Criação de textos legais (política de privacidade, termos de uso,
  política de trocas);
- **f)** Serviços de marketing digital, SEO avançado, tráfego pago ou gestão de
  redes sociais;
- **g)** Emissão operacional de notas fiscais e obrigações contábeis;
- **h)** Suporte a usuários finais (consumidores) da CONTRATANTE.

**2.2.1.** A hora técnica avulsa, para serviços fora do escopo, fica fixada em
**R$ [valor]** (【valor por extenso】).

---

## CLÁUSULA 3 — DOS PRAZOS, DA ENTREGA E DA HOMOLOGAÇÃO

**3.1.** O CONTRATADO disponibilizará o SISTEMA para homologação em até
**[X] dias corridos**, contados do **último** dos seguintes eventos:
- **a)** Assinatura deste contrato;
- **b)** Confirmação do pagamento da primeira parcela (Cláusula 4.2, "a");
- **c)** Entrega, pela CONTRATANTE, dos acessos e materiais previstos na
  Cláusula 5.

**3.2. Homologação.** Disponibilizado o SISTEMA, a CONTRATANTE terá
**[7] dias corridos** para testar e apontar, por escrito e de forma
discriminada, eventuais divergências em relação ao escopo da Cláusula 2.1.

**3.2.1.** Não havendo manifestação no prazo, o SISTEMA será considerado
**tacitamente aceito**.

**3.2.2.** Apontamentos que digam respeito a itens efetivamente previstos na
Cláusula 2.1 serão corrigidos pelo CONTRATADO **sem custo adicional**, em prazo
razoável. Solicitações que configurem alteração ou ampliação de escopo seguirão
o disposto na Cláusula 2.2.

**3.3. Entrada em produção.** A entrada em operação comercial do SISTEMA depende
de providências de responsabilidade exclusiva da CONTRATANTE (Cláusula 5),
notadamente a **aprovação da conta junto ao provedor de pagamentos**.

**3.3.1.** As partes reconhecem expressamente que o segmento de atuação da
CONTRATANTE é classificado como de "alto risco" pelo mercado de meios de
pagamento, e que **a aprovação da conta não está sob controle do CONTRATADO**.
Eventual recusa, atraso ou imposição de condições pelo provedor de pagamentos
**não caracteriza inadimplemento do CONTRATADO** nem enseja devolução de valores
relativos a serviços já executados.

**3.4.** Os prazos ficam automaticamente suspensos enquanto pendente informação,
material, acesso ou aprovação a cargo da CONTRATANTE, retomando-se a contagem a
partir do atendimento.

---

## CLÁUSULA 4 — DO VALOR E DA FORMA DE PAGAMENTO

### 4.1. Valor da implantação

Pela implantação do SISTEMA, a CONTRATANTE pagará ao CONTRATADO o valor total de
**R$ [valor]** (【valor por extenso】).

### 4.2. Parcelamento da implantação

| Parcela | Percentual | Valor | Vencimento |
|---|---|---|---|
| 1ª | 40% | R$ [valor] | Na assinatura deste contrato |
| 2ª | 30% | R$ [valor] | Na disponibilização para homologação (Cl. 3.1) |
| 3ª | 30% | R$ [valor] | Na entrada em produção ou no aceite tácito |

**4.2.1.** A entrega dos acessos administrativos definitivos e, quando aplicável,
a cessão de direitos prevista na Cláusula 7 ficam **condicionadas à quitação
integral** dos valores de implantação.

### 4.3. Mensalidade de manutenção

**4.3.1.** Pelos serviços continuados, a CONTRATANTE pagará mensalmente
**R$ [valor]** (【valor por extenso】), com vencimento todo dia **[X]** de cada
mês, iniciando-se no mês subsequente à entrada em produção.

**4.3.2.** A mensalidade compreende:
- **a)** Monitoramento e manutenção corretiva do SISTEMA;
- **b)** Correção de falhas de funcionamento (bugs), sem custo adicional;
- **c)** Até **[4] horas mensais** de ajustes de pequeno porte, não cumulativas
  entre meses;
- **d)** Atualizações de segurança das dependências do SISTEMA;
- **e)** Suporte técnico por [WhatsApp/e-mail], em dias úteis, das [9h] às [18h],
  com resposta em até **[2] dias úteis**.

**4.3.3.** A mensalidade **não compreende** os itens da Cláusula 2.2, nem os
custos de terceiros da Cláusula 5.5.

### 4.4. Forma de pagamento e encargos

**4.4.1.** Os pagamentos serão realizados por [PIX / transferência / boleto] em
favor do CONTRATADO, mediante emissão da respectiva nota fiscal de serviço.

**4.4.2.** O atraso no pagamento sujeitará a CONTRATANTE a **multa de [2]%**
sobre o valor em aberto, **juros de mora de [1]% ao mês** e correção pelo
[IPCA/IGP-M], calculados *pro rata die*.

**4.4.3.** Verificado atraso superior a **[15] dias**, o CONTRATADO poderá,
mediante aviso prévio de [5] dias, **suspender** a prestação dos serviços de
manutenção e suporte, sem prejuízo da cobrança dos valores devidos. A suspensão
não implica exclusão de dados, observada a Cláusula 8.7.

---

## CLÁUSULA 5 — DAS OBRIGAÇÕES DA CONTRATANTE

**5.1. Habilitação empresarial e fiscal.** É de responsabilidade exclusiva da
CONTRATANTE providenciar e manter:
- **a)** CNPJ ativo, com atividade econômica (CNAE) compatível;
- **b)** Conta bancária de titularidade da própria CONTRATANTE;
- **c)** Inscrição Estadual, quando exigida;
- **d)** Certificado digital A1 válido, para emissão de nota fiscal eletrônica;
- **e)** Profissional de contabilidade responsável.

**5.2. Meios de pagamento.** A CONTRATANTE abrirá e manterá, **em seu próprio
nome e CNPJ**, a conta junto ao provedor de pagamentos, concedendo ao CONTRATADO
apenas os acessos técnicos necessários à integração.

**5.2.1.** As partes ajustam expressamente que **os valores das vendas serão
recebidos diretamente pela CONTRATANTE**, em conta de sua titularidade, não
cabendo ao CONTRATADO, em nenhuma hipótese, intermediar, receber, custodiar ou
repassar valores decorrentes das operações comerciais realizadas no SISTEMA.

**5.3. Infraestrutura.** As contas dos serviços de hospedagem, banco de dados e
domínio serão criadas **em nome da CONTRATANTE**, que arcará diretamente com os
respectivos custos, concedendo ao CONTRATADO acesso na condição de colaborador.

💡 *Se as contas de infraestrutura ficarem em nome do CONTRATADO, substitua esta
cláusula e inclua o repasse dos custos na mensalidade — do contrário o
CONTRATADO custeará a operação da CONTRATANTE.*

**5.4. Conteúdo e operação.** Compete à CONTRATANTE:
- **a)** Fornecer fotografias, descrições, preços e quantidades de estoque,
  respondendo pela veracidade, legalidade e titularidade dos direitos sobre
  esse conteúdo;
- **b)** Providenciar os textos legais da loja (política de privacidade, termos
  de uso e política de trocas e devoluções);
- **c)** Realizar a expedição dos pedidos, assegurando a **embalagem neutra e o
  remetente discreto** anunciados ao consumidor;
- **d)** Prestar atendimento aos consumidores e observar o Código de Defesa do
  Consumidor, inclusive quanto ao direito de arrependimento e suas exceções
  sanitárias;
- **e)** Emitir as notas fiscais das vendas e cumprir as obrigações tributárias;
- **f)** Assegurar que os produtos comercializados sejam lícitos e destinados a
  público adulto, não sendo permitido o uso do SISTEMA para conteúdo ilícito.

**5.5. Custos de terceiros.** Correm por conta exclusiva da CONTRATANTE os
custos de hospedagem, domínio, certificado digital, taxas do provedor de
pagamentos, fretes e demais serviços de terceiros.

**5.6.** A CONTRATANTE fornecerá, em tempo hábil, os acessos, informações e
aprovações necessários à execução dos serviços.

---

## CLÁUSULA 6 — DAS OBRIGAÇÕES DO CONTRATADO

**6.1.** Desenvolver e implantar o SISTEMA conforme o escopo da Cláusula 2.1,
empregando boas práticas técnicas e de segurança.

**6.2.** Realizar a manutenção corretiva e prestar o suporte contratados, nos
termos da Cláusula 4.3.

**6.3.** Manter sigilo sobre as informações da CONTRATANTE, nos termos da
Cláusula 9.

**6.4.** Comunicar à CONTRATANTE, com antecedência razoável, alterações técnicas
relevantes ou situações que possam afetar o funcionamento do SISTEMA.

**6.5.** Prestar as informações necessárias à transição, ao término do contrato,
nos termos da Cláusula 10.5.

**6.6.** As obrigações do CONTRATADO são de **meio**, e não de resultado
comercial. O CONTRATADO **não garante** volume de vendas, faturamento,
posicionamento em mecanismos de busca ou aprovação junto a terceiros
(provedores de pagamento, certificadoras, transportadoras).

---

## CLÁUSULA 7 — DA PROPRIEDADE INTELECTUAL

💡 *Escolha UMA das opções abaixo e apague a outra.*

### ▸ Opção A — Cessão de direitos após quitação

**7.1.** Quitado integralmente o valor de implantação (Cláusula 4.1), o
CONTRATADO **cede à CONTRATANTE**, de forma total, definitiva e irrevogável, os
direitos patrimoniais sobre o código-fonte desenvolvido especificamente para o
SISTEMA, podendo a CONTRATANTE usá-lo, modificá-lo e contratar terceiros para
sua manutenção.

**7.2.** A cessão **não alcança**: (i) componentes de terceiros e bibliotecas de
código aberto, que permanecem regidos por suas respectivas licenças; e (ii)
ferramentas, bibliotecas internas e conhecimentos técnicos preexistentes do
CONTRATADO, sobre os quais fica concedida à CONTRATANTE licença de uso não
exclusiva, perpétua e limitada ao SISTEMA.

**7.3.** O CONTRATADO poderá utilizar o projeto em seu portfólio, [com/sem]
menção ao nome da CONTRATANTE, mediante [autorização prévia / livremente].

### ▸ Opção B — Licença de uso durante a vigência

**7.1.** O código-fonte do SISTEMA permanece de titularidade exclusiva do
CONTRATADO, que concede à CONTRATANTE **licença de uso não exclusiva e
intransferível**, válida enquanto vigente este contrato e adimplidas as
obrigações financeiras.

**7.2.** Encerrado o contrato, cessa a licença, ressalvada a exportação dos
dados prevista na Cláusula 8.7.

**7.3.** A conversão desta licença em cessão definitiva poderá ser negociada
mediante pagamento de valor a ser ajustado entre as partes.

---

**7.4.** Independentemente da opção adotada, **os dados de negócio** (cadastro
de clientes, pedidos, produtos e conteúdo inserido) são de **titularidade
exclusiva da CONTRATANTE**.

---

## CLÁUSULA 8 — DA PROTEÇÃO DE DADOS PESSOAIS (LGPD)

**8.1. Papéis das partes.** Para os fins da Lei nº 13.709/2018 (LGPD), as partes
reconhecem que:
- **a)** A **CONTRATANTE** é a **CONTROLADORA** dos dados pessoais tratados no
  SISTEMA, competindo-lhe as decisões referentes ao tratamento e a
  responsabilidade perante os titulares e a ANPD;
- **b)** O **CONTRATADO** é o **OPERADOR**, realizando o tratamento **em nome e
  segundo as instruções documentadas** da CONTRATANTE.

**8.2. Natureza dos dados.** As partes reconhecem que a atividade envolve dados
que podem revelar aspectos da **vida sexual dos titulares**, classificados como
**dados pessoais sensíveis** (art. 5º, II, da LGPD), exigindo grau elevado de
proteção e finalidade estritamente vinculada à execução do contrato de consumo.

**8.3. Obrigações do CONTRATADO (operador).** O CONTRATADO obriga-se a:
- **a)** Tratar os dados pessoais **exclusivamente** para as finalidades deste
  contrato, não os utilizando para fins próprios, comerciais ou de qualquer
  outra natureza;
- **b)** Manter medidas técnicas e administrativas de segurança, incluindo
  criptografia de dados sensíveis, controle de acesso por permissão,
  autenticação em duas etapas para acessos internos e registro de auditoria;
- **c)** Não compartilhar dados com terceiros sem instrução ou autorização da
  CONTRATANTE, ressalvados os suboperadores da Cláusula 8.5 e as hipóteses
  legais;
- **d)** Comunicar à CONTRATANTE, em até **[24] horas** da ciência, qualquer
  incidente de segurança que possa acarretar risco ou dano aos titulares,
  prestando as informações necessárias à comunicação à ANPD;
- **e)** Auxiliar a CONTRATANTE no atendimento a requisições de titulares
  (acesso, correção, portabilidade e exclusão) e a determinações de autoridades;
- **f)** Assegurar que pessoas sob sua responsabilidade que tenham acesso aos
  dados estejam vinculadas a dever de confidencialidade.

**8.4. Obrigações da CONTRATANTE (controladora).** Compete à CONTRATANTE:
- **a)** Definir as finalidades e bases legais do tratamento;
- **b)** Manter políticas de privacidade e termos de uso adequados e atualizados;
- **c)** Instruir o CONTRATADO por escrito quanto ao tratamento;
- **d)** Responder às solicitações dos titulares e à ANPD;
- **e)** Não inserir no SISTEMA dados pessoais desnecessários à finalidade.

**8.5. Suboperadores.** A CONTRATANTE autoriza o uso de provedores de
infraestrutura (hospedagem, banco de dados, meios de pagamento e serviços
correlatos) como suboperadores, comprometendo-se o CONTRATADO a selecionar
fornecedores que ofereçam padrão adequado de segurança.

**8.6. Transferência internacional.** As partes reconhecem que os provedores de
infraestrutura podem operar servidores fora do território nacional, o que é
admitido nos termos dos arts. 33 e seguintes da LGPD.

**8.7. Destino dos dados ao término do contrato.** Encerrado o contrato, o
CONTRATADO:
- **a)** Disponibilizará à CONTRATANTE, em até **[15] dias**, cópia integral dos
  dados em formato estruturado e de uso comum;
- **b)** Após a confirmação do recebimento e decorridos **[30] dias**, eliminará
  os dados pessoais existentes em ambientes sob seu controle direto, salvo os
  que deva conservar por obrigação legal;
- **c)** Prestará, mediante solicitação, declaração de eliminação.

**8.8.** A responsabilidade perante os titulares e a autoridade nacional observa
a repartição legal entre controlador e operador, respondendo o CONTRATADO nos
limites do art. 42, §1º, II, da LGPD.

---

## CLÁUSULA 9 — DA CONFIDENCIALIDADE

**9.1.** Cada parte obriga-se a manter sigilo sobre informações comerciais,
técnicas, financeiras e estratégicas da outra a que tiver acesso, não as
divulgando nem utilizando para fins estranhos a este contrato.

**9.2.** A obrigação de sigilo subsiste por **[5] anos** após o término do
contrato, por qualquer motivo.

**9.3.** Não se consideram confidenciais as informações públicas, as já
conhecidas anteriormente sem violação de dever de sigilo, ou aquelas cuja
divulgação seja exigida por lei ou ordem de autoridade competente.

---

## CLÁUSULA 10 — DA VIGÊNCIA, DO REAJUSTE E DA RESCISÃO

**10.1. Vigência.** O contrato vigora a partir da assinatura, por prazo
**indeterminado** quanto aos serviços de manutenção, observado o prazo mínimo de
**[12] meses** contados da entrada em produção.

**10.2. Reajuste.** A mensalidade será reajustada **anualmente**, na data de
aniversário do contrato, pela variação acumulada do **[IPCA/IGP-M]** no período,
ou por outro índice que venha a substituí-lo.

**10.2.1.** Alterações relevantes nos custos de infraestrutura ou no volume de
uso do SISTEMA poderão ensejar revisão da mensalidade, mediante negociação e
aviso prévio de **[60] dias**.

**10.3. Rescisão imotivada.** Qualquer das partes poderá rescindir o contrato
mediante **aviso prévio por escrito de [30] dias**, permanecendo devidos os
valores relativos aos serviços prestados até a data efetiva do encerramento.

**10.3.1.** Ocorrendo a rescisão pela CONTRATANTE **antes do prazo mínimo** da
Cláusula 10.1, será devida multa correspondente a **[50]% das mensalidades
remanescentes** até o termo final do período mínimo.

**10.4. Rescisão motivada.** O contrato poderá ser rescindido de imediato,
independentemente de aviso prévio, em caso de:
- **a)** Descumprimento de obrigação contratual não sanado em **[10] dias** após
  notificação por escrito;
- **b)** Atraso de pagamento superior a **[30] dias**;
- **c)** Utilização do SISTEMA para finalidade ilícita ou em desacordo com a
  legislação aplicável;
- **d)** Decretação de falência, recuperação judicial ou insolvência.

**10.5. Transição.** Encerrado o contrato, o CONTRATADO prestará informações
técnicas razoáveis para a transição a outro prestador, pelo período de até
**[15] dias**, sem custo. Atividades de transição que excedam esse período serão
remuneradas pela hora técnica da Cláusula 2.2.1.

---

## CLÁUSULA 11 — DA LIMITAÇÃO DE RESPONSABILIDADE

**11.1.** A responsabilidade do CONTRATADO limita-se aos danos diretos
comprovadamente causados por sua culpa, e **não excederá, no total acumulado, o
valor equivalente às últimas [12] mensalidades** efetivamente pagas pela
CONTRATANTE.

**11.2.** O CONTRATADO **não responde** por:
- **a)** Indisponibilidade, falha, alteração de política ou descontinuidade de
  serviços de terceiros (hospedagem, provedor de pagamentos, transportadoras,
  certificadoras);
- **b)** Recusa, suspensão ou encerramento da conta da CONTRATANTE junto ao
  provedor de pagamentos;
- **c)** Danos decorrentes de informações incorretas, conteúdo inadequado ou
  ilícito inserido pela CONTRATANTE;
- **d)** Uso indevido do painel administrativo por pessoas autorizadas pela
  CONTRATANTE, inclusive compartilhamento de credenciais;
- **e)** Lucros cessantes, perda de oportunidade comercial ou danos indiretos;
- **f)** Descumprimento, pela CONTRATANTE, de obrigações fiscais, consumeristas
  ou de proteção de dados que lhe caibam;
- **g)** Eventos de caso fortuito ou força maior, incluindo ataques cibernéticos
  que superem o estado da técnica das medidas de segurança adotadas.

**11.3.** A CONTRATANTE é responsável por manter cópias de segurança de suas
informações comerciais, sem prejuízo das rotinas mantidas pelo CONTRATADO.

**11.4.** As limitações desta cláusula não se aplicam a casos de dolo ou culpa
grave, nem afastam responsabilidades inafastáveis por lei.

---

## CLÁUSULA 12 — DAS DISPOSIÇÕES GERAIS

**12.1. Independência das partes.** Este contrato não estabelece vínculo
empregatício, societário, de representação ou de exclusividade entre as partes,
respondendo cada uma por seus encargos trabalhistas, previdenciários e fiscais.

**12.2. Comunicações.** As comunicações entre as partes serão válidas quando
realizadas por escrito, para os e-mails indicados na qualificação, presumindo-se
recebidas em **[2] dias úteis** do envio.

**12.3. Alterações.** Qualquer alteração deste contrato somente terá validade se
formalizada por escrito e assinada por ambas as partes, admitida a assinatura
eletrônica.

**12.4. Novação e tolerância.** A tolerância quanto ao descumprimento de
qualquer obrigação não implica novação, renúncia ou alteração do contrato.

**12.5. Independência das cláusulas.** A eventual nulidade de qualquer cláusula
não afetará a validade das demais.

**12.6. Foro.** Fica eleito o foro da comarca de **[cidade/UF]** para dirimir as
controvérsias oriundas deste contrato, com renúncia a qualquer outro.

---

E, por estarem justas e contratadas, as partes assinam o presente instrumento,
admitida a assinatura eletrônica, para que produza seus efeitos legais.

**[Cidade]**, **[dia]** de **[mês]** de **[ano]**.

<br>

|                                        |                                        |
|----------------------------------------|----------------------------------------|
| ______________________________________ | ______________________________________ |
| **CONTRATADO**                         | **CONTRATANTE**                        |
| [Nome] — [CPF/CNPJ]                    | [Razão Social] — CNPJ [número]         |

<br>

**Testemunhas:**

|                                        |                                        |
|----------------------------------------|----------------------------------------|
| ______________________________________ | ______________________________________ |
| Nome: [nome]                           | Nome: [nome]                           |
| CPF: [número]                          | CPF: [número]                          |

---

## Anexos que devem acompanhar o contrato

- **Anexo I** — Proposta comercial aprovada (`PROPOSTA-MODELO.md`)
- **Anexo II** — Checklist de responsabilidades do cliente (`CHECKLIST-CLIENTE.md`)

---

> 🔁 **Lembrete final:** revise com advogado antes de assinar. As Cláusulas 7
> (propriedade intelectual), 8 (LGPD) e 11 (limitação de responsabilidade) são
> as que mais exigem adaptação ao caso concreto.
