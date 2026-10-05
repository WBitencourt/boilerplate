---
name: dados-gerais-campos-legados-e-novos
description: de-para de nomes antigos de dados_gerais (pipeline ainda manda os antigos) + mapeamento dos campos novos assunto2/tipo_classificacao_civel/tipo_solicitacao2/listar_como_andamento
metadata:
  node_type: memory
  type: project
  originSessionId: d7ebbbd6-a82d-44d1-b7e7-3eb53872e343
  modified: 2026-10-05T20:13:17.626Z
---

Desde 2026-10-05 o DTO de `dados_gerais` usa os nomes novos; os antigos são convertidos ao receber (`converterCamposLegadosDadosGerais`, roda pra TODA origem, antes do adapter do pipeline). Nome novo tem prioridade quando vierem os dois:
- tipo_solicitacao → causa_raiz_n1 · assunto → causa_raiz_n2 · especialidade_medica → causa_raiz_n3
- empresa_beneficiario → empresa_contabilidade · tipo_evento_gerador → tipo_fato_gerador

Todos os fixtures de cadastro (pipeline e não-pipeline) têm, a pedido do usuário, o nome antigo e logo abaixo o nome novo com o mesmo valor.

Campos novos (descobertos pelo valor no processo 329983 em Dev):
- dados_gerais.assunto2 → `id-assunto-custom` (LtAssuntoCustomWS, endpoint `assunto_custom/consultar`)
- dados_gerais.tipo_classificacao_civel → `id-tipo-civel-custom` (LtTipoCivelCustomWS, `tipo_civel_custom/consultar`)
- dados_gerais.tipo_solicitacao2 → `id-tipo-solicitacao-custom` (LtTipoSolicitacaoCustomWS, `tipo_solicitacao_custom/consultar`)
- eventos[].listar_como_andamento → `listar-andamento` (T/F) — nome confirmado pelo usuário (tela: "Listar como andamento")

Os três Lt*CustomWS filtram de verdade por `f:"NOME"` (diferente de [[projuris-filtro-nome-generico-ignorado]]).

**Why:** a equipe Projuris adicionou campos nas telas; o usuário só garante os obrigatórios e mapeia os novos sob demanda.

**How to apply:** "tipo_solicitacao" no payload antigo ≠ "tipo_solicitacao2" (este é LtTipoSolicitacaoCustomWS; aquele é causa raiz N1). Não confundir.
