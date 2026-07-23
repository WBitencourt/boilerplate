---
name: entidade-tipo-entidade-agrupamento
description: "EntidadeInputDto agrupou as 15 flags booleanas (advogado, adverso, juiz, cliente, ...) dentro de uma chave aninhada tipo_entidade, em vez de campos soltos"
metadata: 
  node_type: memory
  type: project
  originSessionId: e3d4ce85-b696-4475-ac24-091c352901de
  modified: 2026-07-21T23:28:47.351Z
---

Em 2026-07-21, `EntidadeInputDto` (`integracao-hapvida/src/payload/dto/entidade-input.dto.ts`) deixou de ter as 15 flags booleanas (`advogado`, `adverso`, `juiz`, `cliente`, `depositario`, `emissor`, `outorgante`, `fornecedor`, `outorgado`, `quotista`, `procurador`, `assinante`, `interlocutor`, `beneficiario`, `operadora`) como campos soltos e passou a agrupá-las em `tipo_entidade?: TipoEntidadeInputDto` (novo arquivo `tipo-entidade-input.dto.ts`).

**Why:** pedido do usuário — os campos "soltos" na raiz de `reu.principal`/`autor.principal`/`advogado.autor.principal`/`outros.parte.medicos[]` ficavam poluindo o objeto; agrupar deixa o JSON de entrada mais organizado.

**How to apply:**
- O agrupamento é só no **payload de entrada** (nosso contrato). O contrato da API externa Projuris (`EntidadeCriarRequest` em `src/gateways/http/projuris-api.types.ts`) continua **flat** — não mexer nele, é o formato que a Projuris espera.
- Quem lê os valores é `EntidadeResolverService.resolver()` (`entidade-resolver.service.ts`), que agora acessa `entidade.tipo_entidade?.advogado ?? false` etc. e achata na hora de chamar `projurisGateway.entidadeCriar`.
- Fixtures ativas atualizadas para o novo formato: `fixtures/sqs/soft-erika-v2.json`, `fixtures/sqs/bruto-test.json`, `fixtures/sqs/soft-thiago-v2.json`, e o mirror `fixtures/sqs/interface.ts`. A pasta `fixtures/old/` (arquivos antigos/históricos) foi deixada como está — não é o contrato ativo.
- Ver também [[fixture-soft-erika-campos-obrigatorios]] — nota que esse memory referencia `soft-erika.json` (sem `-v2`), que não existe mais no repo hoje; o fixture ativo atual é `soft-erika-v2.json`.
