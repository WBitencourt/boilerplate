---
name: picpaycadastro-natureza-classificacao
description: PicPayCadastro (DJE/Citação) agora classifica natureza do processo no nascimento da demanda; pendências de follow-up combinadas com o usuário
metadata: 
  node_type: memory
  type: project
  originSessionId: 46a7beb3-31b7-490a-a383-2b995319b95a
  modified: 2026-09-21T20:44:43.614Z
---

Implementado (2026-09-21): `DjeBusnessLogicPicPayService.executaRotinaFinal` e `CitacaoBusnessLogicPicPayService.executaRotinaFinal` (em `src/integracao_everest/dje/` e `src/integracao_everest/citacao/`) agora usam o helper `classificaNaturezaProcesso` (`src/integracao_everest/clientes/picpaycadastro/classificacaoNaturezaProcesso.ts`) para desviar demandas com natureza Trabalhista/Societário/Criminal/Tributário/Cível-Recuperação de Crédito direto para o fluxo de e-mail automático (`PosAuditoriaOito`) já no nascimento da demanda, em vez de depender só da rotina a cada 30min do `everest-scheduled` (`PicpayCadastroRotinasPeriodicas.isProcessoEmailAutomatico`) pra corrigir depois.

**Decisão de escopo:** fluxo **Distribuídos** (`distribuido_business_logic_picpaycadastro.service.ts`) ficou de fora — quando `processoExistente=true` lá, a demanda já vira `Atualização Jurídico`+`Inativo` e nunca passa por `PosAuditoriaOito`, então não tinha o mesmo risco de corrida. Usuário optou por não mexer nesse branch por ora.

**Why:** demandas nascidas como "Cadastro/Atualização Jurídico" sem essa classificação podiam, se o scheduled job do `everest-scheduled` não alcançasse a tempo, ser processadas erroneamente no Projuris (via `everest-prod-worker-posauditoria`) em vez de irem para e-mail — o `processaDemanda` de lá não reavalia natureza para esses tipos.

**Pendências combinadas com o usuário, para retomar depois (não implementadas ainda):**
1. `case 'Citação/Intimação'` dentro de `processaDemanda` no repo `everest-prod-worker-posauditoria` (método `citacaoIntimacao()`) — hoje decide Cadastro vs Atualização Jurídico sozinho e manda pra `EsteiraOito`; avaliar se deve considerar natureza também.
2. Tratamento de erro nos fluxos de e-mail automático (`enviaParaConsultaApi`/`notificacaoProconOutro`, também em `everest-prod-worker-posauditoria`) — hoje não há caminho claro pra mandar essas falhas para exceção (`ExcecaoOito`).

**How to apply:** ao retomar trabalho em PicPayCadastro/DJE/Citação/Distribuídos ou no `everest-prod-worker-posauditoria`, verificar essas duas pendências antes de assumir que o fluxo está fechado.
