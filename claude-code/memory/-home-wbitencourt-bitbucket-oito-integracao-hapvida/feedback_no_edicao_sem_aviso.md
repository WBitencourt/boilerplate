---
name: feedback-no-edicao-sem-aviso
description: Nunca editar código reflexivamente em resposta a um erro — sempre avisar o usuário e propor antes de aplicar
metadata: 
  node_type: memory
  type: feedback
  originSessionId: 3bbbe854-20dc-4a7b-b3f6-352950a2cace
---

Nunca sair editando arquivos de código imediatamente ao ver uma mensagem de erro. Sempre avisar o usuário sobre a mudança proposta antes de aplicá-la (ou usar plan mode / perguntar) — mesmo quando a correção parecer óbvia.

**Why:** Durante a investigação dos campos `capturar_push`/`capturar` e `criterio_classificacao_processo` em [[migracao_id_para_nome]], fiquei alternando reflexivamente entre duas hipóteses (nome do campo, string vs ID resolvido) a cada nova evidência parcial — sem parar para reconciliar o quadro completo. O usuário teve que interromper e pedir explicitamente para parar, pensar, e nunca mais editar sem avisar antes. O erro de validação retornado pela API (via mensagem `"property X should not exist"`, `"Y must be a string"`) é a fonte de verdade mais direta sobre o contrato do DTO — inferências a partir de XML de resposta de *outros* endpoints (ex: consulta/listagem) podem ter nomes de campo e tipos diferentes do DTO de criação, e levar a correções erradas em loop.

**How to apply:** Antes de editar código em resposta a um erro ou payload retornado, parar e explicar a causa raiz encontrada e a mudança proposta ao usuário primeiro. Só editar depois de confirmação (ou quando o usuário já autorizou explicitamente edição autônoma para aquela tarefa). Vale para qualquer sessão de debug iterativo neste projeto, especialmente ao lidar com contratos de API externos (Projuris/everest-prod-external_api-v2) onde o schema real só é conhecido por tentativa/erro.
