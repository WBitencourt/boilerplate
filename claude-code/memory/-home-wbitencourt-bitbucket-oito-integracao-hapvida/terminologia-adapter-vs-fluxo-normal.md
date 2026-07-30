---
name: terminologia-adapter-vs-fluxo-normal
description: "no repo integracao-hapvida, 'adapter'/'adapter do pipeline' = normalização de JSON da origem pipeline (src/adapters/pipeline.adapter.ts); 'aplicação'/'fluxo normal' = tudo o resto, sem esse adapter"
metadata: 
  node_type: memory
  type: feedback
  originSessionId: ddacea9b-60f5-4eb9-910b-971e70ce099f
  modified: 2026-07-29T13:16:34.420Z
---

Quando o usuário diz **"adapter"** ou **"adapter do pipeline"** neste repositório
(`integracao-hapvida`), ele está se referindo especificamente à camada de
normalização do JSON bruto recebido de mensagens com `metadados.origem ===
"pipeline"` — hoje implementada em `src/adapters/pipeline.adapter.ts`
(`adaptarPayloadPipeline`). Essa camada ajusta o payload pra caber no formato
que a validação (`class-validator`/`class-transformer`) exige, ANTES da
validação rodar.

Quando ele diz **"aplicação"** ou **"fluxo normal"**, está se referindo a
tudo o que roda independente da origem — DTOs de validação, orchestrators,
services (`EntidadeResolverService`, `ReferenciaResolverService`,
`DesdobramentoService`, etc.), gateways.

**Why:** o usuário pediu explicitamente pra eu guardar essa distinção, pra
não misturar os dois contextos — um ajuste que é "só pro pipeline" deve ficar
isolado em `pipeline.adapter.ts`, nunca vazar pra DTOs/services que servem
qualquer origem. Um ajuste "de aplicação"/"fluxo normal" é o oposto: deve
valer pra qualquer payload, não só o vindo do pipeline.

**How to apply:** antes de editar em resposta a um pedido de ajuste, checar
qual das duas palavras o usuário usou pra saber se a mudança é: (a) dentro de
`src/adapters/pipeline.adapter.ts` (normalização condicionada a `origem ===
"pipeline"`), ou (b) nos DTOs/services/use-cases que valem pra qualquer
payload. Não misturar os dois numa mesma alteração sem o usuário pedir
explicitamente. Ver [[migracao_id_para_nome]] e memórias de projeto
relacionadas ao adapter (ex.: normalização de `adicionais`/`principal`/
`ordinal_juizo`/`lista_pedidos`) — todas essas já seguem esse recorte.
