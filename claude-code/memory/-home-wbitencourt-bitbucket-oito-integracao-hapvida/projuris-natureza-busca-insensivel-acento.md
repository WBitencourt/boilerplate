---
name: projuris-natureza-busca-insensivel-acento
description: "natureza/consultar na Projuris ignora acento e caixa (\"Cível\"/\"Civel\"/\"CIVEL\" → id 21, cadastrado \"Civel\"); o adapter compara com 'Cível' exato"
metadata:
  node_type: memory
  type: project
  originSessionId: 5572f49c-5deb-46ac-9e06-657c5b1d3c5d
  modified: 2026-10-05T17:01:25.846Z
---

Confirmado em 2026-10-05 (Dev, via external API local): `natureza/consultar` com "Cível", "Civel" e "CIVEL" retornam todos o id 21, cadastrado na Projuris como "Civel". Ou seja, essa busca na Projuris não diferencia acento nem maiúsculas/minúsculas, mesmo com `o:"="`.

**Why:** o pipeline.adapter.ts (caso 6, `NATUREZA_CIVEL = 'Cível'`) compara a string de forma exata. Os fixtures mandavam "Civel", então o preenchimento de `valor_perda_possivel` nunca acontecia. O usuário preferiu corrigir os fixtures JSON para "Cível" em vez de alterar o adapter.

**How to apply:** nos fixtures/payloads, usar "Cível" (com acento): resolve na Projuris e aciona o adapter. Não presumir que outros endpoints `*/consultar` também ignoram acento, porque cada contexto precisa ser testado (ver [[projuris-tribunal-espaco-sobrando-dado-sujo]]). Também em Dev: "DANIEL HENRIQUE ANGELINI" não existe em `advogado_interno_custom` nem em `usuario` (ver [[advogado-interno-custom-nao-e-usuario]]). Nomes de usuário costumam ter sufixo, por exemplo "WENDELL GEORGE BITENCOURT - OITO".
