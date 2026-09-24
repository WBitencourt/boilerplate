---
name: advogado-interno-custom-nao-e-usuario
description: "id-advogado-interno-custom vem de LtAdvogadoInternoCustomWS (tabela custom), não de UsuarioWS, mesmo o nome sendo de um usuário"
metadata:
  node_type: memory
  type: project
  originSessionId: 70c041ef-77fa-4063-9fc6-a699a9cda94c
  modified: 2026-09-24T21:41:28.748Z
---

O campo "Advogado Interno Responsável" do processo (tag `id-advogado-interno-custom`) aponta para a tabela custom `LtAdvogadoInternoCustomWS` (contexto `lt-advogado-interno-custom`), com ids próprios. Não é o id de `UsuarioWS`, mesmo com o nome sendo idêntico ao do usuário. Confirmado em 2026-09-24: DANIEL HENRIQUE ANGELINI é o usuário 2265 em `id-advogado`, mas o advogado interno 18.

**Why:** a primeira implementação resolvia via `usuario/consultar` e mandaria o id errado (erro de premissa: "é usuário, então usa UsuarioWS").

**How to apply:**
- A busca é pelo endpoint `advogado_interno_custom/consultar` da external API, via Obtem com `f:"NOME"`. O usuário aceitou conscientemente pegar o primeiro registro encontrado (exceção à regra de [[projuris-filtro-nome-generico-ignorado]]).
- O payload traz `advogado.reu.interno_responsavel.nome`, que é opcional; não encontrado = campo em branco, sem erro. Vale só no Cadastro.
- Na origem pipeline, o adapter preenche esse campo com o **primeiro** item de `advogado.reu.adicionais`, mesmo havendo vários (exceção aceita só aqui). O item continua em `adicionais`.
- Antes de assumir que um campo `*-custom` usa o id de outra entidade, comparar com o XML de um processo em que o campo foi preenchido manualmente.
