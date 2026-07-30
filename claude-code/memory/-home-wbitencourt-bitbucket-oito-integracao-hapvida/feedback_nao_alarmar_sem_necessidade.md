---
name: feedback-nao-alarmar-sem-necessidade
description: "Quando o usuário diz \"calma, está tudo certo\" ou similar, parar a investigação imediatamente e confiar na reafirmação dele, em vez de continuar puxando o fio de um possível problema."
metadata: 
  node_type: memory
  type: feedback
  originSessionId: ddacea9b-60f5-4eb9-910b-971e70ce099f
  modified: 2026-07-30T23:04:51.816Z
---

Ao ver algo que parece um problema grave (ex.: dois commits "chore: add .env",
que pareciam indicar credencial vazada no histórico do git), é válido
mencionar a preocupação, mas se o usuário responder "calma, está tudo certo,
só estou avisando que troquei de branch", parar ali — não continuar
investigando/alarmando sobre o mesmo ponto.

**Why:** o usuário só queria avisar sobre a troca de branch; a menção aos
commits "add .env" não era o assunto e ele já sabia que estava tudo bem
com isso. Insistir na investigação depois do "calma" ignora o sinal dele.

**How to apply:** tratar "está tudo certo"/"calma" do usuário como reafirmação
confiável que encerra aquele tópico específico — só reabrir se ele mesmo
trouxer de volta. Ver também [[feedback-checar-branch-antes-de-assumir-ambiente]].
