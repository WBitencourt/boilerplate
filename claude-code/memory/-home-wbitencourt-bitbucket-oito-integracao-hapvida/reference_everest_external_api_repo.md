---
name: reference-everest-external-api-repo
description: Repositório local com a fonte de verdade do contrato REST/SOAP que o ProjurisGateway deste projeto consome
metadata: 
  node_type: memory
  type: reference
  originSessionId: 3bbbe854-20dc-4a7b-b3f6-352950a2cace
---

O repositório `everest-prod-external_api-v2` está disponível localmente em
`/home/wbitencourt/bitbucket/oito/everest-prod-external_api-v2`. É a API
REST que traduz pra SOAP e que o `ProjurisGateway`
(`src/gateways/http/projuris.gateway.ts` deste projeto) chama via
`/hapvida/*`.

Quando surgir dúvida sobre o contrato exato de um endpoint (nome de
campo, tipo esperado, se resolve nome→ID internamente ou faz passthrough
puro), **ler o código-fonte desse repo é mais confiável que inferir a
partir de XML de resposta de outros endpoints de consulta/listagem**:
- DTOs de entrada: `src/hapvida/dto/*.dto.ts` (decorators
  `class-validator` mostram tipo/obrigatoriedade exatos).
- Lógica de tradução REST→SOAP: `src/hapvida/api_service.service.ts`
  (mostra pra qual tag SOAP cada campo do DTO é mapeado, e se há
  resolução/transformação no meio ou só passthrough).

Ver [[feedback_no_edicao_sem_aviso]] — o caso que motivou essa descoberta
foi justamente `criterio_classificacao_processo` (o DTO externo faz
passthrough puro da string pra tag `<id-criterio-processo-custom>`, sem
resolver nome→ID, apesar da descrição do Swagger sugerir o contrário) e
`capturar_push` (chave JSON do DTO REST, mapeada internamente pra tag
SOAP `<capturar>` — nomes diferentes em cada camada).
