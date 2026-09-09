---
name: projuris-filtro-nome-generico-ignorado
description: "Filtro SOAP genérico f:\"NOME\" é ignorado silenciosamente pela Projuris; cada webservice Lt*WS tem seu próprio nome de campo interno"
metadata: 
  node_type: memory
  type: project
  originSessionId: 54c72f48-6162-48f5-a606-ee3e5d57e35e
  modified: 2026-09-09T19:06:50.088Z
---

Confirmado em 2026-09-09 (dev): o webservice `LtCargoProcessoWS` da Projuris **ignora silenciosamente** o filtro quando o campo usado em `f:"..."` não é o nome interno correto do campo — não dá erro, apenas devolve um registro fixo/default da base (no caso, sempre "Administrador de Contratos", independente do nome buscado).

Teste via Postman provou:
- `f:"NOME"` (usado atualmente em `everest-prod-external_api-v2/src/hapvida/hapvida.service.ts` nas funções `consultarCargoProcesso`/`listarCargoProcesso`, ~linha 5049) → retorna sempre o mesmo registro errado, independente do valor buscado.
- `f:"NOME_CARGO_PROCESSO"` → retorna corretamente `id-cargo-processo=655` para "Auxiliar de Serviços Gerais".

Esse é o mesmo padrão de bug já corrigido para `tribunal`: o filtro usava `f:"NOME"` e foi corrigido para `f:"TRIBUNAL"` (também trocando a chave de `vc` para `v1`) em `consultarTribunal`. Ver [[projuris-tribunal-espaco-sobrando-dado-sujo]].

**Why:** cada `Lt*WS` da Projuris tem seu próprio schema interno de campos filtráveis; não existe um campo genérico "NOME" universal. Usar `f:"NOME"` por padrão/copy-paste em qualquer novo endpoint de consulta é uma armadilha silenciosa — não gera erro, gera dado errado.

**How to apply:** antes de confiar em qualquer consulta `Lt*WS` nova ou existente que usa `f:"NOME"` no everest-prod-external_api-v2, validar via Postman/SOAP direto qual é o nome real do campo (geralmente `NOME_<ENTIDADE>` em maiúsculas, ex: `NOME_CARGO_PROCESSO`, `TRIBUNAL`). Ao propor correção, avisar antes de editar (ver [[feedback_no_edicao_sem_aviso]]) e verificar se `listarCargoProcesso` (ou equivalente "listar" de outras entidades) usa o mesmo filtro genérico e merece a mesma correção. Vale auditar outras ocorrências de `f:"NOME"` no arquivo para achar bugs análogos ainda não descobertos.
