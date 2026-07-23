---
name: fixture-soft-erika-campos-obrigatorios
description: "fixtures/sqs/soft-erika.json lista os campos obrigatórios do payload; o que não está lá é opcional — mas \"opcional\" não significa \"A INFORMAR\" em todo lugar"
metadata: 
  node_type: memory
  type: project
  originSessionId: a152127e-6b31-4c62-848c-32660ea0666c
  modified: 2026-07-21T16:52:27.165Z
---

Em `integracao-hapvida/fixtures/sqs/soft-erika.json`, os campos presentes são exatamente os obrigatórios do payload da fila. Qualquer campo que não apareça nesse fixture é opcional.

**Why:** o usuário definiu essa fixture como a referência canônica de obrigatoriedade (2026-07-20), separada da validação do DTO (`class-validator`), que pode marcar como opcional campos que a Projuris na prática exige (ou vice-versa).

**How to apply** — quando um campo ausente no payload causa erro na Projuris/everest, checar `soft-erika.json` primeiro pra confirmar que é opcional por design, e então escolher a correção certa conforme o TIPO de campo (aprendido com casos reais em 2026-07-20/21, trace_id `1cc7cbb2-375e-4d02-864b-ab4e75b1a78f`):

1. **Campo de lookup/id custom (ex.: `economia_financeira` → `id_economia_custom`)**: NÃO forçar uma consulta com `"A INFORMAR"` — não existe garantia de que esse valor exista na tabela custom da Projuris (`LtEconomiaCustomWS` não tinha). A correção certa é deixar o campo genuinamente opcional fim-a-fim: `integracao-hapvida` não consulta e não manda a key quando ausente (`|| undefined`, removido do JSON por `JSON.stringify`); no `everest`, o DTO (`desdobramento.dto.ts`) precisa de `@IsOptional()` no campo (senão dá 400 "should not be empty" mesmo sem mandar nada); e o builder do XML SOAP (`api_service.service.ts`) precisa montar a tag condicionalmente (`dados.campo ? \`<tag>...\`</tag>\` : ''`), senão quebra em `.toString()` de `undefined`. Ver padrão já usado ali pra outros campos opcionais (`idUnidadeNegocioCustom`, `idObjetoPadraoCustom`, etc.) — replicar o mesmo estilo.
2. **Campo booleano char(1) T/F (ex.: `incluir_esocial`, `responsabilidade_compartilhada`, `continua_pagando_escritorio`)**: aqui NÃO dá pra usar `paraTfOuAInformar` (que resolve pra `'A'` quando ausente) — o Postgres da Projuris tem CHECK CONSTRAINT na coluna (ex.: `ck_m_processo_incluir_esocial`, `ck_m_processo_continua_pagando_escritorio`) que só aceita `'T'`/`'F'`, e `'A'` quebra a inserção com erro 500 de violação de integridade. A correção é usar `paraTf({ valor: campo ?? false })` (ou o default de negócio correto — **sempre confirmar com o usuário qual default faz sentido**, não assumir; foi confirmado `'F'` pros três campos acima, 2026-07-20 e 2026-07-21). Os outros campos T/F/A do mesmo arquivo que **ainda não quebraram** em teste real (`provisionar`, `pedido_liminar`, `capturar`, `monitorar_oystr`, `processo_sob_patrocinio_externo`) continuam usando `paraTfOuAInformar` — mas isso não é garantia de que estão OK, só que ninguém testou ainda o caso desses campos virem ausentes. A constraint do banco é por coluna, não geral — só trocar quando o erro 500 de constraint aparecer de fato pra aquele campo específico, mas não assumir que os que sobraram são "seguros" — provavelmente vão quebrar do mesmo jeito quando testados sem o campo preenchido.

Arquivos envolvidos nos dois casos: `integracao-hapvida/src/cadastro-juridico/referencia-resolver.service.ts`, `integracao-hapvida/src/cadastro-juridico/desdobramento.service.ts`, `everest-prod-external_api-v2/src/hapvida/dto/desdobramento.dto.ts`, `everest-prod-external_api-v2/src/hapvida/api_service.service.ts`. Ver também [[feedback_no_edicao_sem_aviso]] (sempre confirmar o default de negócio antes de aplicar) e [[reference_everest_external_api_repo]].
