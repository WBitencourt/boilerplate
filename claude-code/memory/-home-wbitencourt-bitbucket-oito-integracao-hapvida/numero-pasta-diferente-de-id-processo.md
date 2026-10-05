---
name: numero-pasta-diferente-de-id-processo
description: "Na Projuris, \"pasta\" (número exibido na tela) ≠ \"id-processo\" (id interno); output da fila de cadastro devolve os dois + id_processo_desdobramento"
metadata:
  node_type: memory
  type: project
  originSessionId: d7ebbbd6-a82d-44d1-b7e7-3eb53872e343
  modified: 2026-10-05T17:45:19.918Z
---

Confirmado em Dev em 2026-10-05: `id-processo`=329983 e `pasta`=537519 no mesmo processo. O usuário inicialmente achou que pasta = id do processo, mas não é.

Output de Cadastro (`ResultadoCadastroJuridicoPayload`) agora devolve `id_processo` (id-processo), `id_processo_desdobramento` (id-processo-desdobramento) e `numero_pasta` (pasta). A pasta é lida do `desdobramento/consultar` (`consultarExistente`), que retorna o campo `pasta` (string), então funciona também quando o processo já existia e a criação foi pulada.

**Why:** a equipe que consome a fila de output precisa guardar o número da pasta (o que o usuário vê na tela), não só o id interno.

**How to apply:** se pedirem "número da pasta" em outro fluxo (Atualizacao/Desdobramento ainda não devolvem), usar `numeroPasta` de `consultarExistente`; não confundir com `id_processo`. Ver [[fluxo-atualizacao-dispatch-tipo-payload]].
