---
name: projuris-natureza-busca-insensivel-acento
description: natureza/consultar na Projuris ignora acento e caixa (id 21, cadastrado "Civel"); fixtures usam "Civel" e o adapter (caso 6) também passou a ignorar acento
metadata:
  node_type: memory
  type: project
  originSessionId: 5572f49c-5deb-46ac-9e06-657c5b1d3c5d
  modified: 2026-10-05T17:01:25.846Z
---

Confirmado em 2026-10-05 (Dev, via external API local): `natureza/consultar` com "Cível", "Civel" e "CIVEL" retornam todos o id 21, cadastrado na Projuris como "Civel". Ou seja, essa busca na Projuris não diferencia acento nem maiúsculas/minúsculas, mesmo com `o:"="`.

**Why:** o pipeline.adapter.ts (caso 6) comparava com `'Cível'` exato e nunca preenchia `valor_perda_possivel` para "Civel". Em 2026-10-05 o usuário decidiu manter "Civel" nos fixtures, como aparece na tela da Projuris, e pediu que o adapter aceitasse as duas grafias. Agora `ehNaturezaCivel` normaliza (NFD + remove acento + trim + lowercase).

**How to apply:** nos fixtures, usar "Civel". Comparações de natureza no código devem ignorar acento e caixa. Não presumir que outros endpoints `*/consultar` também ignoram acento, porque cada contexto precisa ser testado (ver [[projuris-tribunal-espaco-sobrando-dado-sujo]]). Também em Dev: "DANIEL HENRIQUE ANGELINI" não existe em `advogado_interno_custom` nem em `usuario` (ver [[advogado-interno-custom-nao-e-usuario]]). Nomes de usuário costumam ter sufixo, por exemplo "WENDELL GEORGE BITENCOURT - OITO".
