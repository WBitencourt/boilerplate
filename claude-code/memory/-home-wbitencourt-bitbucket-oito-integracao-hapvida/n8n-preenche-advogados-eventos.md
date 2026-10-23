---
name: n8n-preenche-advogados-eventos
description: "eventos[].advogados é preenchido por um fluxo n8n antes de a mensagem chegar na fila; a integração não tem fallback"
metadata:
  node_type: memory
  type: project
  originSessionId: f513078e-a91d-4082-bb02-4adbda43262e
  modified: 2026-10-23T17:01:15.051Z
---

Um fluxo no n8n preenche `eventos[].advogados` antes de enviar o payload pra fila da integracao-hapvida. A integração não tem preenchimento padrão: o `pipeline.adapter.ts` só converte string → array (`garantirArray`), e não faz nada se o campo estiver ausente. `EventoInputDto.advogados` é obrigatório, então um evento sem advogados reprova a mensagem inteira em `validacao_payload`, inclusive `arquivos_processo`.

**Why:** em 2026-10-23, um payload de Atualizacao (processo 0214985-64.2026.8.05.0001, origem pipeline) chegou sem advogados nos eventos e o documento não foi cadastrado. Gastei tempo procurando um adapter no código que não existe; o preenchimento fica fora do repo.

**How to apply:** quando um payload vier sem `eventos[].advogados`, olhar primeiro a execução do fluxo n8n daquela mensagem (se ele rodou e por que não preencheu), em vez de procurar a regra no código. Ver também [[terminologia-adapter-vs-fluxo-normal]].
