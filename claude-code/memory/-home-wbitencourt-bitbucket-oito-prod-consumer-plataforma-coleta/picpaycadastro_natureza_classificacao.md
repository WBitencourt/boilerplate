---
name: picpaycadastro-natureza-classificacao
description: PicPayCadastro (DJE/Citação) agora classifica natureza do processo no nascimento da demanda; pendências de follow-up combinadas com o usuário
metadata: 
  node_type: memory
  type: project
  originSessionId: 46a7beb3-31b7-490a-a383-2b995319b95a
  modified: 2026-09-21T21:42:31.670Z
---

Implementado (2026-09-21): `DjeBusnessLogicPicPayService.executaRotinaFinal` e `CitacaoBusnessLogicPicPayService.executaRotinaFinal` (em `src/integracao_everest/dje/` e `src/integracao_everest/citacao/`, repo `prod-consumer-plataforma_coleta`) agora usam o helper `classificaNaturezaProcesso` (`src/integracao_everest/clientes/picpaycadastro/classificacaoNaturezaProcesso.ts`) para desviar demandas com natureza Trabalhista/Societário/Criminal/Tributário/Cível-Recuperação de Crédito direto para o fluxo de e-mail automático (`PosAuditoriaOito`) já no nascimento da demanda, em vez de depender só da rotina a cada 30min do `everest-scheduled` (`PicpayCadastroRotinasPeriodicas.isProcessoEmailAutomatico`) pra corrigir depois.

Implementado também (mesmo dia, follow-up #1 abaixo resolvido): `citacaoIntimacao()` em `src/clientes/PicPayCadastro/picpaycadastro.pos_auditoria_oito.service.ts` (repo **`everest-prod-worker-posauditoria`**, fora do `prod-consumer-plataforma_coleta`) recebeu a mesma lógica — quando o processo já existe no Projuris (`desdobramento.idProcesso`), agora consulta `processoBrutoByIdProcessoConsulta`, checa `id-encerramento-ws` (→ `Processo encerrado`/`AguardandoProcessoEncerrado`) e roda o mesmo `classificaNaturezaProcesso` (helper local equivalente, criado em `src/clientes/PicPayCadastro/projuris/classificacaoNaturezaProcesso.ts` — repos diferentes, sem pacote compartilhado, então o helper foi duplicado lá) antes de decidir. Quando a natureza indica e-mail automático/polo ativo, chama `PicPayPosAuditoriaOito.enviaParaConsultaApi({ pkService })` (via `new Everest2DemandaService({ pk }).getStatus()`) em vez de mandar a demanda de volta pra `EsteiraOito` como `Atualização Jurídico`. `salvarDocumentosDoProjuris` só roda no fallback (natureza Cível/não reconhecida), mesma precedência do DJE.

**Decisão de escopo:** fluxo **Distribuídos** (`distribuido_business_logic_picpaycadastro.service.ts`) ficou de fora — quando `processoExistente=true` lá, a demanda já vira `Atualização Jurídico`+`Inativo` e nunca passa por `PosAuditoriaOito`, então não tinha o mesmo risco de corrida. Usuário optou por não mexer nesse branch por ora.

**Why:** demandas nascidas/reclassificadas como "Cadastro/Atualização Jurídico" sem essa classificação podiam, se o scheduled job do `everest-scheduled` não alcançasse a tempo, ser processadas erroneamente no Projuris em vez de irem para e-mail — o `processaDemanda` do `everest-prod-worker-posauditoria` não reavalia natureza para esses tipos (só `cadastroAtualizacao` reconfere encerramento).

**Pendências combinadas com o usuário, para retomar depois (não implementadas ainda):**
1. ~~`case 'Citação/Intimação'` dentro de `processaDemanda` no repo `everest-prod-worker-posauditoria`~~ — **feito** (ver acima).
2. Tratamento de erro nos fluxos de e-mail automático (`enviaParaConsultaApi`/`notificacaoProconOutro`, também em `everest-prod-worker-posauditoria`) — hoje não há caminho claro pra mandar essas falhas para exceção (`ExcecaoOito`).

**How to apply:** ao retomar trabalho em PicPayCadastro/DJE/Citação/Distribuídos ou no `everest-prod-worker-posauditoria`, verificar a pendência #2 antes de assumir que o fluxo está fechado. Se a regra de natureza mudar (ex: nova natureza divertida para e-mail), lembrar que existem **duas cópias** do helper `classificaNaturezaProcesso` (uma em cada repositório) — precisam ser atualizadas juntas.
