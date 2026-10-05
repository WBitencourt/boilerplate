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

- outras_informacoes.data_recebimento_liminar_iso/_br → `data-receb-liminar-custom` (processo 329984, 01/11/2026)

Campos de multa/obrigação em outras_informacoes (processo 329984, 2026-10-05) — ATENÇÃO aos formatos de flag diferentes:
- pedido_obrigacao_fazer → `pedido-obrigacao-fazer-custom` **S/N** (prioridade sobre o antigo dados_gerais.pedido_obrigacao_fazer, que virou fallback)
- tem_aplicacao_multa → `tem-aplicacao-multa-custom` **T/F**
- tem_teto_multa → `tem-teto-multa-custom` **S/N**
- valor_maximo_multa → `valor-maximo-multa-custom` (número com vírgula, igual valor_multa)
- status_operacional_obrigacao_fazer → `id-status-oper-obrig-custom` via LtStatusOperacionalObrigacaoCustomWS; contexto da requisição precisa ser `lt-status-operacional-obrigacao-custom` (o curto lt-status-oper-obrig-custom é aceito na request mas a resposta vem como lt-status-operacional-obrigacao-custom-response, e o formatResponse procura <contexto>-response → data vazio)

**formulario_referencia NÃO funciona (2026-10-05):** campo real na Projuris é `id-formul-rio-custom` (BELO DENTE = 54, visto no processo 329983), mas a external API manda `<id-formulario-custom>` e o endpoint `formulario_referencia/consultar` é SIMULADO (sempre id 1). Nome do WS de consulta desconhecido: LtFormularioCustomWS (URL no .env) e variações (LtFORMULARIOCustomWS, LtFormulRioCustomWS etc.) respondem "PJ002 sessão inválida" = WS inexistente. Não corrigir só a tag enquanto o endpoint for simulado (gravaria formulário id 1 errado). Precisa do nome do WS com a equipe Projuris.

Os três Lt*CustomWS filtram de verdade por `f:"NOME"` (diferente de [[projuris-filtro-nome-generico-ignorado]]).

**Why:** a equipe Projuris adicionou campos nas telas; o usuário só garante os obrigatórios e mapeia os novos sob demanda.

**How to apply:** "tipo_solicitacao" no payload antigo ≠ "tipo_solicitacao2" (este é LtTipoSolicitacaoCustomWS; aquele é causa raiz N1). Não confundir.
