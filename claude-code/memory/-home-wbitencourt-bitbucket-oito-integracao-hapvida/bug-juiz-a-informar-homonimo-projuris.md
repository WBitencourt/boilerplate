---
name: bug-juiz-a-informar-homonimo-projuris
description: "Investigação do bug onde o juiz virou \"A INFORMAR - CRM AM003070\" no Projuris em vez de só \"A INFORMAR\" — hipótese de homônimo sem filtro por tipo_entidade"
metadata: 
  node_type: memory
  type: project
  originSessionId: 235d4f84-7f98-47cd-9e66-7ab69edc8109
  modified: 2026-09-10T14:33:44.581Z
---

Em 2026-09-10, um cadastro trabalhista (Dev) enviou `desdobramento_inicial.juiz = "A INFORMAR"`, mas o Projuris salvou o juiz como **"A INFORMAR - CRM AM003070"** — um sufixo que não veio do payload.

Fluxo rastreado (sem alterar código, só investigação):
1. [cadastro-juridico-orchestrator.use-case.ts:214-220](../../../../../bitbucket/oito/integracao-hapvida/src/application/use-cases/demanda/cadastro-juridico-orchestrator.use-case.ts) chama `entidadeResolverService.resolverPorNome({ nome: "A INFORMAR" })`.
2. `resolverPorNome` ([entidade-resolver.service.ts:176-188](../../../../../bitbucket/oito/integracao-hapvida/src/application/services/demanda/entidade-resolver.service.ts)) busca no Projuris via `entidade/consultar` filtrando **só por NOME**, sem checar `tipo_entidade` (juiz=true) nem validar o nome retornado. Comentário no código já avisa: "sem fallback de criação".
3. No `everest-prod-external_api-v2` ([hapvida.service.ts:1205](../../../../../bitbucket/oito/everest-prod-external_api-v2/src/hapvida/hapvida.service.ts)), o filtro usado é `f:"NOME",o:"=",vc:"A INFORMAR"` — parâmetro `vc` (não `v1`, que é o usado em outras consultas "exatas" documentadas no README). Não confirmado se `vc` = igualdade estrita ou "contains" no DSL do Projuris.
4. `extrairIdEntidade` ([entidade-resolver.service.ts:310+](../../../../../bitbucket/oito/integracao-hapvida/src/application/services/demanda/entidade-resolver.service.ts)) pega cegamente o primeiro `id_entidade` da resposta, sem validar se o nome bate.

**Hipótese principal:** "A INFORMAR" é usado como placeholder padrão em vários campos do payload inteiro (não só juiz), e o Projuris não garante nome único de entidade. Provavelmente existem várias entidades literalmente chamadas "A INFORMAR" no banco (uma para juiz sem documento, outra criada em outro fluxo/matéria como placeholder de médico com CRM). O sufixo "- CRM AM003070" na tela é o próprio Projuris concatenando nome+documento pra diferenciar homônimos na combo — não veio do nosso payload. `resolverPorNome` não filtra por `tipo_entidade` nem valida o match, então pode pegar a entidade errada quando há homônimos.

**CONFIRMADO em 2026-09-10** pelo usuário com o XML real da chamada `entidade` "Obtem" (não "Listar"/"Consultar" paginado): a Projuris devolveu `id-entidade=1106733`, `nome="A INFORMAR"`, `juiz="F"`, `tipo-documento-principal="CRM"`, `numero-documento-principal="CRM AM003070"`, `id-categoria-cliente-adverso-categoria-cliente-adverso="MÉDICO(A) ENVOLVIDO"`. Ou seja: existe mesmo um homônimo "A INFORMAR" cadastrado como placeholder de médico (não juiz), e o método "Obtem" da Projuris devolve só o 1º registro que bate no filtro, sem garantir qual — exatamente a hipótese principal. A hipótese secundária (vc = LIKE) fica sem relevância prática, já que o problema é homônimo real, não substring.

**Fix aplicado (2026-09-10):** por decisão do usuário, a correção foi feita no **adaptador de origem "pipeline"** ([pipeline.adapter.ts](../../../../../bitbucket/oito/integracao-hapvida/src/adapters/pipeline.adapter.ts)), não no `EntidadeResolverService` — pra não "sujar" o integrador com uma regra específica de uma origem. Adicionada `converterAInformarParaNull` + entrada em `CAMINHOS_CAMPO_ANINHADO` pra `desdobramento_inicial.juiz`: quando o valor chega como literal `"A INFORMAR"`, vira `null` antes da validação. Como `idJuiz` no orchestrator só resolve quando `payload.desdobramento_inicial.juiz` é truthy, `null` faz pular a chamada `resolverPorNome` inteira — nunca mais tenta resolver esse placeholder por nome. Testes cobrindo o caso adicionados em `pipeline.adapter.spec.ts`. **Escopo:** só `desdobramento_inicial.juiz` — `desdobramento_adicional[].juiz` tem o mesmo campo/risco mas não foi pedido nem alterado ainda.

Relacionado: [[migracao_id_para_nome]], [[projuris-filtro-nome-generico-ignorado]] (mesmo padrão de filtro genérico mal resolvido pela Projuris), [[terminologia-adapter-vs-fluxo-normal]].
