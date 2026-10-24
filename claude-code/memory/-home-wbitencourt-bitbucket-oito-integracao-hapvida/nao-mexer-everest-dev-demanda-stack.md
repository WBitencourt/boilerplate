---
name: nao-mexer-everest-dev-demanda-stack
description: "o repo everest-dev-demanda-stack não deve ser alterado, buildado nem ter deploy por mim, de jeito nenhum"
metadata:
  node_type: memory
  type: feedback
  originSessionId: f513078e-a91d-4082-bb02-4adbda43262e
  modified: 2026-10-24T18:27:35.876Z
---

Não mexer no repositório `everest-dev-demanda-stack` (workspace henriqueserraoito) de jeito nenhum: nada de editar arquivos, commitar, rodar build/deploy (`cdk deploy`) ou scripts dele.

**Why:** pedido explícito do usuário em 2026-10-24, durante a correção dos CVEs do Node.js, mesmo esse repo tendo Lambdas em `NODEJS_20_X` em uso (EverestDevDemandaGravaLog). Motivo não informado.

**How to apply:** se uma tarefa envolver esse repo (ex.: migrar runtime das Lambdas), parar e avisar o usuário em vez de alterar; leitura só se ele pedir. Ver também [[fluxo-build-sh-everest-dev]].
