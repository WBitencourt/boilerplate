---
name: bug-juiz-a-informar-homonimo-projuris
description: "Investigação do bug onde o juiz virou \"A INFORMAR - CRM AM003070\" no Projuris em vez de só \"A INFORMAR\" — hipótese de homônimo sem filtro por tipo_entidade"
metadata: 
  node_type: memory
  type: project
  originSessionId: 235d4f84-7f98-47cd-9e66-7ab69edc8109
  modified: 2026-09-10T13:56:25.727Z
---

Em 2026-09-10, um cadastro trabalhista (Dev) enviou `desdobramento_inicial.juiz = "A INFORMAR"`, mas o Projuris salvou o juiz como **"A INFORMAR - CRM AM003070"** — um sufixo que não veio do payload.

Fluxo rastreado (sem alterar código, só investigação):
1. [cadastro-juridico-orchestrator.use-case.ts:214-220](../../../../../bitbucket/oito/integracao-hapvida/src/application/use-cases/demanda/cadastro-juridico-orchestrator.use-case.ts) chama `entidadeResolverService.resolverPorNome({ nome: "A INFORMAR" })`.
2. `resolverPorNome` ([entidade-resolver.service.ts:176-188](../../../../../bitbucket/oito/integracao-hapvida/src/application/services/demanda/entidade-resolver.service.ts)) busca no Projuris via `entidade/consultar` filtrando **só por NOME**, sem checar `tipo_entidade` (juiz=true) nem validar o nome retornado. Comentário no código já avisa: "sem fallback de criação".
3. No `everest-prod-external_api-v2` ([hapvida.service.ts:1205](../../../../../bitbucket/oito/everest-prod-external_api-v2/src/hapvida/hapvida.service.ts)), o filtro usado é `f:"NOME",o:"=",vc:"A INFORMAR"` — parâmetro `vc` (não `v1`, que é o usado em outras consultas "exatas" documentadas no README). Não confirmado se `vc` = igualdade estrita ou "contains" no DSL do Projuris.
4. `extrairIdEntidade` ([entidade-resolver.service.ts:310+](../../../../../bitbucket/oito/integracao-hapvida/src/application/services/demanda/entidade-resolver.service.ts)) pega cegamente o primeiro `id_entidade` da resposta, sem validar se o nome bate.

**Hipótese principal:** "A INFORMAR" é usado como placeholder padrão em vários campos do payload inteiro (não só juiz), e o Projuris não garante nome único de entidade. Provavelmente existem várias entidades literalmente chamadas "A INFORMAR" no banco (uma para juiz sem documento, outra criada em outro fluxo/matéria como placeholder de médico com CRM). O sufixo "- CRM AM003070" na tela é o próprio Projuris concatenando nome+documento pra diferenciar homônimos na combo — não veio do nosso payload. `resolverPorNome` não filtra por `tipo_entidade` nem valida o match, então pode pegar a entidade errada quando há homônimos.

**Hipótese secundária (não descartada):** o parâmetro `vc` pode fazer match por substring (LIKE) em vez de igualdade exata, batendo em qualquer nome que contenha "A INFORMAR".

**Gap encontrado:** não existe teste unitário cobrindo `resolverPorNome` no repo — esse caminho de ambiguidade nunca foi validado.

**Decisão do usuário (2026-09-10):** por ora, só registrar o achado — não mexer em código. Ver [[migracao_id_para_nome]] e [[projuris-filtro-nome-generico-ignorado]] (padrão relacionado de filtro genérico mal resolvido pela Projuris) e [[terminologia-adapter-vs-fluxo-normal]] pra contexto de nomenclatura do pipeline.

**Como aplicar:** se o bug se repetir ou o usuário pedir pra corrigir, os candidatos de fix discutidos foram: (a) confirmar manualmente no Projuris quantas entidades "A INFORMAR" existem e o que cada uma tem de documento/tipo; (b) fazer `resolverPorNome` exigir `juiz=true` na entidade retornada; (c) validar que o `NOME` retornado bate exatamente com o buscado, rejeitando quando vier com sufixo/diferença.
