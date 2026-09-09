---
name: projuris-tribunal-espaco-sobrando-dado-sujo
description: "'Tribunal Regional do Trabalho da 20ª Região' está cadastrado na LtTribunalWS (Projuris Dev) com um espaço sobrando no final do nome — busca exata (f:'TRIBUNAL', o:'=') só bate incluindo esse espaço"
metadata: 
  node_type: memory
  type: project
  originSessionId: 7fc0453e-7c51-4930-8979-768d5af673b2
  modified: 2026-09-09T19:06:43.453Z
---

Investigando um 500 em `/hapvida/tribunal/consultar` (achado real, corrigido:
ver [[formatresponsetribunal-indexacao-fault-bug]] se existir, ou o bug de
indexação `[0]` faltando na checagem de fault de `formatResponseTribunal`),
o usuário descobriu a causa de fundo de um "Consulta não retornou registros."
que parecia errado pro tribunal "Tribunal Regional do Trabalho da 20ª
Região": o registro cadastrado na Projuris (ambiente Dev) tem um **espaço
sobrando no final do nome**. Só bate a busca exata
(`f:"TRIBUNAL",o:"=",vc:"...Região "` — com espaço) — sem o espaço, dá "não
encontrado", mesmo o texto estando visualmente idêntico.

**Why:** typo de quem cadastrou o registro na Projuris (dado sujo), não bug
de código — o campo de filtro (`TRIBUNAL`) e o mecanismo (match exato) sempre
estiveram corretos. Confirmado por teste direto no SOAP: `f:"NOME"` (que
parecia funcionar num teste do Postman) na verdade é campo inválido pra essa
lista e a Projuris ignora o filtro silenciosamente, devolvendo sempre o mesmo
registro errado (id 4009, "Ordem dos Advogados do Brasil") — não usar esse
campo, é uma armadilha.

**How to apply:** decisão tomada (2026-09-02): não mexer no código por causa
desse caso pontual — é dado sujo específico desse registro, não um padrão
sistemático confirmado. Se aparecer outro "tribunal não encontrado"
suspeito (nome parece certo mas dá 404), suspeitar de espaço sobrando (ou
outro caractere invisível) no cadastro da Projuris antes de assumir que é
erro no payload ou no código. Se isso se repetir com frequência, vale
reconsiderar a estratégia de busca (ver a opção descartada de investigar
`tribunal/listar` pra ver se é sistemático na base).

**Atualização (2026-09-09):** o padrão se repetiu — confirmado como
sistemático, não mais só "dado sujo pontual". `cargo_processo/consultar`
(`LtCargoProcessoWS`) também usa `f:"NOME"` genérico e sofre exatamente o
mesmo bug: filtro ignorado silenciosamente, sempre devolve o mesmo registro
fixo errado ("Administrador de Contratos" em vez do cargo buscado). Campo
correto: `NOME_CARGO_PROCESSO`. Ver detalhes em
[[projuris-filtro-nome-generico-ignorado]]. Vale agora auditar todas as
ocorrências de `f:"NOME"` em `hapvida.service.ts` proativamente — não é mais
caso isolado.
