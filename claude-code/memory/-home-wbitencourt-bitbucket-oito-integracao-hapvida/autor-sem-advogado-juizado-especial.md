---
name: autor-sem-advogado-juizado-especial
description: advogados.autor_principal pode legitimamente vir nulo/ausente (autor sem advogado) — não é erro de payload
metadata: 
  node_type: memory
  type: project
  originSessionId: a152127e-6b31-4c62-848c-32660ea0666c
  modified: 2026-07-21T21:32:37.472Z
---

`advogados.autor_principal` pode vir `null`/ausente de forma legítima quando o autor não tem advogado conhecido no processo — comum em eventos de Juizado Especial Cível (ex.: `"evento": "JE1.1..."`, `desdobramento_inicial.jurisdicao: "Juizado Especial Cível"`), onde a parte pode litigar sem advogado (jus postulandi) até certo valor de causa.

**Why:** Antes disso, `advogados.autor_principal` era obrigatório no DTO e alimentava campos tidos como obrigatórios no SOAP `desdobramento/criar` (`entidade_escritorio_nome`, `id_advogado_adverso`, `ids_advogado_adverso_dual`) tanto no `integracao-hapvida` quanto no `everest-prod-external_api-v2`. Um payload real de Juizado Especial chegou com `autor_principal: null` e quebrou a validação.

**How to apply:** `AdvogadosInputDto.autor_principal` é `@IsOptional()`. No orchestrator, só resolve a entidade do advogado do autor quando presente (senão `idAdvogadoAutor` fica `undefined`). Em `DesdobramentoService`, `id_advogado_adverso`/`ids_advogado_adverso_dual` ficam ausentes do request quando não há advogado do autor, e `entidade_escritorio_nome` cai para o nome do advogado do réu (`advogados.reu_principal.nome`) ou `"A INFORMAR"` como último fallback. No `everest`, os mesmos dois campos são opcionais no DTO e as tags XML (`<id-advogado-adverso>`, `<id-advogado-adverso-dual>`, ambas ocorrências no `generateRequestCriarDesdobramento`) são condicionais.

Ainda não confirmado em produção se a Projuris de fato aceita `desdobramento/criar` sem nenhum advogado adverso — combinado com o usuário: se der erro lá, reavaliar (reverter ou achar outra saída) quando o erro real aparecer.

Relacionado: [[advogado-adverso-vs-principal-entidade-vs-usuario]] — `reu_principal`/`reu_adicionais` de `advogados` já usam `AdvogadoUsuarioInputDto` (só `nome`, sem `documento`), consistente com resolução via `UsuarioWS` por nome.
