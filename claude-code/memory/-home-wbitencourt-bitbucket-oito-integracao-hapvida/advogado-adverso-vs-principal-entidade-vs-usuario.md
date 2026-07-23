---
name: advogado-adverso-vs-principal-entidade-vs-usuario
description: "no desdobramento/criar da Projuris, id_advogado_adverso exige EntidadeWS (m_entidade) e id_advogado_principal exige UsuarioWS (m_usuario) — não são intercambiáveis"
metadata: 
  node_type: memory
  type: project
  originSessionId: a152127e-6b31-4c62-848c-32660ea0666c
  modified: 2026-07-21T20:57:45.789Z
---

No payload `advogados` do `integracao-hapvida` (pós-rename: `autor_principal`/`autor_adicionais` = advogado **adverso**; `reu_principal`/`reu_adicionais` = advogado **principal/cliente**), os dois lados resolvem para tabelas diferentes na Projuris:

- `advogados.autor_principal`/`autor_adicionais` → `id_advogado_adverso`/`ids_advogado_adverso_dual` no `desdobramento/criar` → FK aponta pra **`m_entidade`** (EntidadeWS). Resolvido via `entidadeResolverService.resolver()` (consulta por documento, cria se não existir).
- `advogados.reu_principal`/`reu_adicionais` → `id_advogado_principal`/`ids_advogado` → FK aponta pra **`m_usuario`** (UsuarioWS). Resolvido via `entidadeResolverService.resolverUsuarioPorNome()`/`resolverUsuariosPorNome()` (consulta por nome, **sem** fallback de criação — não existe endpoint `usuario/criar` no everest).

**Why:** faz sentido de negócio — o advogado **adverso** (da parte contrária) é só um registro de quem está envolvido no processo, não alguém com acesso ao Projuris. Já o advogado **principal/do cliente** (Hapvida) é de fato um usuário logado no sistema. Descoberto em 2026-07-20/21 depois de dois erros de FK opostos no Postgres (`fk_m_processo_id_advogado_principal` esperando `m_usuario`, depois `fk_m_processo_id_advogado_adverso` esperando `m_entidade`) ao testar com trace_id `1cc7cbb2-375e-4d02-864b-ab4e75b1a78f`.

**How to apply:** nunca trocar os dois lados pro mesmo mecanismo de resolução. Se `advogados.reu_principal` não existir como usuário no Projuris, não tem como criar via API — é erro de negócio real (nome tem que bater com um usuário já cadastrado), diferente de `advogados.autor_principal`, que sempre pode ser criado como entidade nova. Ver `cadastro-juridico-orchestrator.service.ts` (`idAdvogadoAutor`/`idsAdvogadoAutorAdicionais` via `resolver()`+`resolverEntidadesAdicionais`; `idAdvogadoReu`/`idsAdvogadoReuAdicionais` via `resolverUsuarioPorNome()`+`resolverUsuariosPorNome()`) e `entidade-resolver.service.ts`. Relacionado a [[projuris-campo-kebab-case]] e [[fixture-soft-erika-campos-obrigatorios]].

**Campos efetivamente usados (2026-07-21):** `advogados.reu_principal`/`reu_adicionais` são tipados como `EntidadeInputDto` (mesmo DTO do lado `autor_*`), mas na resolução via `UsuarioWS` só o campo `nome` é lido (`cadastro-juridico-orchestrator.service.ts:185,194` extraem `entidade.nome` antes de chamar `resolverUsuarioPorNome`/`resolverUsuariosPorNome`, que só recebem `{ trace_id, environment, nome }`). Os demais campos do objeto (`documento`, `tipo_documento`, `advogado`, `adverso`, `juiz`, `cliente`, `depositario`, `emissor`, `outorgante`, `fornecedor`, `outorgado`, `quotista`, `procurador`, `assinante`, `interlocutor`, `beneficiario`, `operadora`) não são lidos em nenhum ponto do fluxo pra esse par de campos — apesar disso, `EntidadeInputDto` (`entidade-input.dto.ts`) exige `documento` e `tipo_documento` como `@IsNotEmpty()`, então a validação de entrada obriga o cliente a mandar valores que acabam não sendo usados. Se um dia simplificarem o contrato de `reu_principal`/`reu_adicionais`, um DTO enxuto (`{ nome: string }`) seria suficiente pro código atual — mas confirmar com o time antes de reduzir o schema, já que outros consumidores do payload podem depender dos campos extras.
