---
name: projuris-campo-kebab-case
description: "A API everest-prod-external_api-v2 (módulo /hapvida/*) devolve os campos de resposta em kebab-case na maioria dos endpoints, não snake_case"
metadata: 
  node_type: memory
  type: project
  originSessionId: 3bbbe854-20dc-4a7b-b3f6-352950a2cace
---

Descoberto em sessão extensa de testes manuais (worker `integracao-hapvida`
rodando, mensagens coladas na fila SQS de entrada, respostas inspecionadas
via log/debug temporário): os campos de resposta JSON da API
`everest-prod-external_api-v2` (que traduz SOAP↔REST pro módulo `/hapvida/*`)
vêm majoritariamente em **kebab-case** (`id-jurisdicao`, `id-natureza`,
`id-uf`, `id-municipio`, `id-fase`, `id-procedimento`, `id-tipo-acao`,
`id-foro-cnj`, `id-processo`, `id-processo-desdobramento`, `id-objeto`,
`id-processo-parte`, `id-entidade`, `id-evento`, `id-processo-evento`,
`id-tipo-documento-processo`, `id-grau-risco`, `id-metodo-atualizacao`,
`id-unidade-organizacional`), **não** snake_case como o código
originalmente assumia (deixado com `// TODO: confirmar nome exato do
campo` em vários serviços).

**Excações confirmadas** (vêm em snake_case mesmo): `id_tribunal` (resposta
de `tribunal/consultar`) e os campos do endpoint `requisicao/consultar`
(`id_requisicao`, `id_tipo_requisicao`, `numero_requisicao`,
`id_processo_requisicao`, `status` — todos snake_case nesse endpoint
específico).

**Como aplicar:** ao implementar/depurar um novo endpoint desse módulo,
assumir kebab-case por padrão. Se a extração falhar silenciosamente (id
`undefined` sem nenhum log de erro HTTP), o request provavelmente teve
sucesso (200) mas o nome do campo usado na extração está errado — instrumentar
com um `console.log` temporário do corpo bruto da resposta antes de tentar
outro palpite de nome (várias rodadas de "chutar e testar" foram
desperdiçadas nesta sessão antes de perceber o padrão).

Ver [[migracao-id-para-nome]] pra iniciativa em andamento que depende desse
padrão pra novos campos de resolução.
