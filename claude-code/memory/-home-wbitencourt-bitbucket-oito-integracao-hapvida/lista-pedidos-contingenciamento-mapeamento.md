---
name: lista-pedidos-contingenciamento-mapeamento
description: "lista_pedidos passou a mapear todos os campos da tela Contingenciamento (Dados Gerais + Informações Financeiras) do Projuris pro SOAP objeto_processo/criar, com resolução de listas e endpoint novo objeto_principal"
metadata: 
  node_type: memory
  type: project
  originSessionId: 14740a67-db13-414c-a24e-2fb92f1d1223
  modified: 2026-07-24T15:36:21.606Z
---

Em 2026-07-24, `lista_pedidos` (payload de Cadastro) deixou de mapear só 7
campos e passou a cobrir toda a tela "Contingenciamento" do Projuris (prints
em `material-apoio/projuris/telas-projuris/contigenciamento/`), casada campo a
campo com um XML de consulta real (`objeto-processo-response`) fornecido pelo
usuário. Trabalho validado só no item `descricao: "ABSTENÇÃO DE COBRANÇA"` do
fixture `fixtures/sqs/cadastro/soft-wendell-v2.json`, mas o código é genérico.

**Why:** o SOAP `objeto_processo/criar` só enviava um subconjunto mínimo de
tags — o usuário queria fechar a lacuna entre o que a tela do Projuris
permite editar e o que a integração de fato cria.

**How to apply:**
- Novo contrato em `src/contracts/inputs/pedido-input.dto.ts` — todos os
  campos novos são `@IsOptional()`.
- `ObjetoProcessoService.cadastrarObjetos` (`objeto-processo.service.ts`)
  resolve **id_adverso automaticamente** (parte com `cliente === 'F'`, igual
  ao `id_cliente` só que invertido — não é campo de `lista_pedidos`, é
  derivado do processo). Resolve `unidade_de_controle` e `objeto_principal`
  condicionalmente (só se o pedido informar o nome).
- **Endpoint novo ponta a ponta**: `objeto_principal/consultar` +
  `/listar` (WS Projuris real = `LtObjetoPrincipalCustomWS`, filtro por
  `NOME`, informado pelo próprio usuário) — espelha exatamente o padrão de
  `objeto_fundamento_custom` no `everest-prod-external_api-v2`
  (`src/hapvida/dto/objeto-principal-custom.dto.ts` novo). **Requer variáveis
  de ambiente novas** `{ENV}_BASE_URL_HAPVIDA_LTOBJETOPRINCIPALCUSTOM` (Prod
  e Dev) apontando pra `.../LtObjetoPrincipalCustomWS` — não configuradas
  ainda, são infra/segredo, precisam ser setadas manualmente antes de
  funcionar em qualquer ambiente.
- **2 fallbacks descobertos no XML de resposta real** (não são bugs, são o
  comportamento default da Projuris quando a aba "Informações Financeiras"
  não é preenchida): `valor_perda_possivel` cai pra `valor_pedido` quando
  ausente; `data_base_atualizacao_juros` cai pra `data_base_atualizacao`
  quando ausente. Implementado tanto em `objeto-processo.service.ts` quanto
  como segunda camada de defesa em `generateRequestCriarObjetoProcesso`
  (`api_service.service.ts`, everest-prod-external_api-v2).
- **Incerteza não validada em produção**: o agrupamento de
  `valor_perda_provavel` dentro de `<id-processo-objeto-parcela>` (junto com
  `valor_pedido`/`valor_perda_possivel`/datas) é uma inferência baseada nos
  sufixos `-rule`/`sum-` do XML de resposta — os demais campos financeiros
  novos foram colocados na raiz de `<objeto-processo>`. Se o WS Projuris (Dev)
  rejeitar algum campo, o aninhamento precisa ser ajustado — ver plano salvo
  em `~/.claude/plans/eu-adicionei-no-json-delightful-sphinx.md` pra tabela
  completa tela→campo→tag XML.

Ver também [[processo-vs-desdobramento-ws]] e
[[fluxo-atualizacao-dispatch-tipo-payload]] pra contexto geral do fluxo de
Cadastro.

**Atualização 2026-07-24 (mesmo dia):** os 4 campos antigos de
`PedidoInputDto` que não batiam com o label da tela Contingenciamento foram
renomeados pra ficar igual à interface visual (mesmo padrão pedido pelo
usuário pros campos novos): `descricao`→`objeto`, `grau_risco`→`prognostico`,
`valor`→`valor_risco`, `data_base_atualizacao_iso`/`_br`→`data_base_cm_iso`/
`_br`. Rename propagado em `pedido-input.dto.ts`,
`objeto-processo.service.ts`, fixtures ativos (`soft-wendell-v2.json`,
`bruto-test.json`) e o espelho `fixtures/sqs/cadastro/interface.ts`/`.d.ts`.
Se aparecer outro fixture ou teste com `lista_pedidos` usando os nomes
antigos, é sinal de que ficou pra trás nesse rename.

**Atualização 2026-07-24 (2ª mudança, mesmo dia):** `PedidoInputDto` deixou
de ser flat — agora agrupa em 3 blocos, espelhando as 3 abas da tela
Contingenciamento (mesmo padrão de agrupamento de
[[entidade-tipo-entidade-agrupamento]]):
- `dados_gerais: DadosGeraisPedidoInputDto` (novo arquivo
  `dados-gerais-pedido-input.dto.ts`) — objeto, principal, prognostico,
  metodo_atualizacao, justificativa_contingencia_inicial, objeto_principal,
  id_gerencial_geral, id_gerencial, detalhamento_objeto, unidade_de_controle.
- `informacoes_financeiras: InformacoesFinanceirasPedidoInputDto` (novo
  arquivo `informacoes-financeiras-pedido-input.dto.ts`) — natureza_financeira
  + valor_risco + todos os campos financeiros/datas. A validação cruzada
  `DataIsoOuBrObrigatoria('data_base_cm_iso', 'data_base_cm_br')` migrou pro
  campo `natureza_financeira` desse DTO (antes ficava em `objeto`, mas as
  datas moraram sempre em Informações Financeiras, nunca em Dados Gerais).
- `pedidos?: unknown[]` — placeholder pra 3ª aba da tela ("Pedidos"), ainda
  **não mapeada**. Só existe a chave; quando for implementá-la, checar se o
  usuário já tem prints/XML de referência antes de tipar o array.

`ObjetoProcessoService.cadastrarObjetos` desestrutura
`{ dados_gerais: dadosGerais, informacoes_financeiras: informacoesFinanceiras }`
no início do loop do `lista_pedidos`.
