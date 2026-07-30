---
name: processo-vs-desdobramento-ws
description: "No everest-prod-external_api-v2, 'processo/criar' usa a ProcessoWS (cria o processo inteiro) e 'desdobramento/criar' usa a DesdobramentoWS de verdade (adiciona um desdobramento a um processo já existente) — não confundir os dois"
metadata: 
  node_type: memory
  type: project
  originSessionId: 7be1a4ff-27ff-48ae-b863-aba0a56d273c
  modified: 2026-07-23T19:26:50.824Z
---

Até 2026-07-23, o endpoint `desdobramento/criar` no `everest-prod-external_api-v2`
estava **nomeado errado**: ele na verdade chamava a `ProcessoWS` (criava o
processo inteiro, com todos os campos de `dados_gerais`/`outras_informacoes`/
etc.), não a `DesdobramentoWS`. O usuário corrigiu isso:

- **`processo/criar`** (nome novo, correto) = `ProcessoWS` = cria o processo
  inteiro. DTO `HapvidaCriarProcessoDto`, service `hapvidaService.criarProcesso`,
  builder de XML `generateRequestCriarProcesso` (em `api_service.service.ts`).
  No `integracao-hapvida`: `ProjurisGateway.processoCriar()`, tipo
  `CriarProcessoRequest` (em `projuris-api.types.ts`), usado por
  `DesdobramentoService.criar()` (chamado a partir de `resolver()`).
- **`desdobramento/criar`** (endpoint novo, criado do zero) = `DesdobramentoWS`
  de verdade = adiciona um desdobramento a um processo **já existente** (recebe
  `id_processo` + um subconjunto pequeno de campos: `data_inicio`,
  `numero_processo_formatado`, `numeracao_cnj`, `id_fase`, `id_tribunal`,
  `id_foro`, `ordinal_da_jurisdicao`, `tipo_acao_instancias`, `id_jurisdicao`,
  `id_uf`, `id_cidade`, `entidade_escritorio_nome`, `id_advogado_adverso`,
  `id_tipo_custom`, `id_juiz`, `capturar`, `monitorar_oystr`,
  `nota_desdobramento`). DTO `HapvidaCriarDesdobramentoDto`, service
  `hapvidaService.criarDesdobramento`, builder `generateRequestCriarDesdobramento`.
  No `integracao-hapvida`: `ProjurisGateway.desdobramentoCriar()`, tipo
  `CriarDesdobramentoRequest` (bem menor que antes — não confundir com o tipo
  antigo do mesmo nome, que virou `CriarProcessoRequest`).

**Why:** nome errado (`desdobramento/criar` fazendo o trabalho de
`processo/criar`) gerava confusão constante — inclusive eu mesmo, em sessões
anteriores, tratei o `CriarDesdobramentoRequest` antigo (o gigante) como se
fosse "o" desdobramento. O nome novo reflete o WS real por trás de cada rota.

**How to apply:**
- `desdobramento/consultar` (= `DesdobramentoConsultarRequest`,
  `desdobramentoConsultar()` no gateway) **não mudou** — continua sendo só
  consulta por `numero_processo`, retorna `id-processo`/`id-processo-desdobramento`.
- Ao mexer em qualquer fluxo que crie/atualize processo: se for criar o
  processo do zero, é `processoCriar`/`CriarProcessoRequest`. Se for
  adicionar um desdobramento a um processo que já existe, é
  `desdobramentoCriar`/`CriarDesdobramentoRequest` (o pequeno). Nunca supor
  que "desdobramento" no nome da rota antiga significava a coisa pequena —
  isso só passou a ser verdade depois dessa correção.
- Esse `desdobramento/criar` real é a base do futuro fluxo `tipo_payload:
  "Desdobramento"` em `integracao-hapvida` (ainda não implementado em
  2026-07-23 — só o `Atualizacao` foi feito nessa leva). Ver
  [[migracao-id-para-nome]] pra contexto geral de outras mudanças de contrato
  Projuris feitas na mesma época.
