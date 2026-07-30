---
name: feedback-checar-branch-antes-de-assumir-ambiente
description: Sempre checar o branch/contexto atual (git branch --show-current) antes de assumir valores de ambiente (dev/prod) neste repo — nunca reaproveitar valores de uma parte anterior da conversa sem confirmar o estado atual.
metadata: 
  node_type: memory
  type: feedback
  originSessionId: ddacea9b-60f5-4eb9-910b-971e70ce099f
  modified: 2026-07-30T23:04:43.152Z
---

Ao recriar/editar arquivos sensíveis a ambiente (como `.env`) neste repo,
sempre rodar `git branch --show-current` (ou equivalente) primeiro, em vez de
reaproveitar valores "dev"/"prod" vistos anteriormente na conversa.

**Why:** recriei o `.env` do usuário usando valores de "dev" (vistos num
print de docker-compose bem antes na conversa) sem checar que ele já tinha
avisado "troquei de branch" — o branch atual (`main`) era de produção, e os
valores corretos eram outros (`NODE_ENV=production`, filas `EverestProd...`,
API `https://everest.oito.srv.br/prod/external_api/v2`). O usuário teve que
corrigir manualmente.

**How to apply:** qualquer tarefa que dependa de "qual ambiente/branch
estamos" (recriar `.env`, decidir tag de imagem Docker, etc.) deve confirmar
o branch/contexto atual primeiro, especialmente depois que o usuário mencionar
uma troca de branch. Ver também [[feedback-nao-alarmar-sem-necessidade]].
