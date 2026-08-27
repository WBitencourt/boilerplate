---
name: correlacao-md-desatualiza-apos-renomeacoes
description: Campos_Projuris_Cadastro_Regras_Hapvida_Correlacao.md não é atualizado automaticamente quando o código é renomeado/ganha campos novos — precisa auditoria manual periódica contra o hard-cadastro.json
metadata: 
  node_type: memory
  type: project
  originSessionId: 7fc0453e-7c51-4930-8979-768d5af673b2
  modified: 2026-08-27T12:21:20.546Z
---

`material-apoio/projuris/planilhas/Campos_Projuris_Cadastro_Regras_Hapvida_Correlacao.md`
é um documento estático — quando um campo do payload é renomeado ou um DTO
ganha campos novos, ninguém volta nesse arquivo pra atualizar. Já achei dois
tipos de drift em auditorias (2026-08-27): (1) campo renomeado no código mas
a tabela ainda com o nome antigo (`contrato_plano` → devia ser
`tipo_contrato`); (2) seção inteira reescrita no código (rename de 2026-07-24,
ver [[lista-pedidos-contingenciamento-mapeamento]]) mas a tabela `lista_pedidos[]`
continuava com os nomes de campo de antes do rename, sem nenhum dos ~20
campos novos. Também achei 2 campos de `dados_gerais` sem linha nenhuma
(`classificacao_processo`, `parametro_data_fator_gerador`) e ~20 campos de
`outras_informacoes` faltando (a maioria tem label na planilha-fonte, seção
"OUTRAS INFORMAÇÕES" / NATUREZA TRABALHISTA-TRIBUTÁRIA, mas nunca foi
colocado na correlação).

**Why:** o arquivo é mantido manualmente; sessões anteriores editaram o
código (renomes, campos novos) sem propagar pra essa tabela de auditoria.

**How to apply:** quando o usuário pedir pra checar/atualizar esse .md, não
confiar que ele reflete o estado atual — comparar campo a campo contra um
fixture completo (`fixtures/sqs/cadastro/dev/hard-cadastro.json` pra
Cadastro) e contra o DTO (`src/contracts/inputs/*.ts`) antes de responder.
Pra achar a tag XML de um campo novo, procurar em
`referencia-resolver.service.ts`/`desdobramento.service.ts` (lado
integracao-hapvida) e depois confirmar a tag exata gerada em
`api_service.service.ts` (everest-prod-external_api-v2). Pra saber se existe
label na planilha, grepar por palavras-chave (não pelo nome do campo) em
`Campos_Projuris_Cadastro_Regras_Hapvida.md`, já que os campos de
seções trabalhistas/tributárias ficam fora do escopo cível mas ainda têm
linha na planilha-fonte.
