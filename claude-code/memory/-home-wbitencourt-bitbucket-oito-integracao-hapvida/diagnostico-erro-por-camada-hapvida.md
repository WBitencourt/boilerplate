---
name: diagnostico-erro-por-camada-hapvida
description: "como saber em que camada (integracao-hapvida, external API, Cloudflare/Projuris) um erro de /hapvida/* nasceu, e onde está o log de auditoria"
metadata:
  node_type: memory
  type: reference
  originSessionId: 69bf7f01-cf74-4b71-a96e-7b72b13bf558
  modified: 2026-10-19T23:40:05.331Z
---

Caminho: integracao-hapvida (axios 120s, `localhost:3000`) → everest-prod-external_api-v2 (axios 90s, SOAP) → **Cloudflare** → Projuris (`hapvida.projuris.com.br` responde `server: cloudflare`).

- Erro com status/mensagem (502, 520, `timeout of 90000ms exceeded`, `aborted`, `read ECONNRESET` no corpo) = veio do Projuris/Cloudflare e a external API repassou. 520 é código exclusivo do Cloudflare (origem devolveu resposta vazia/inválida).
- `read ECONNRESET` **sem status e sem corpo** na integração = a external API fechou o socket sem responder. Não é o Projuris. Suspeita principal: o processo da external API cai/reinicia (commit 971b2ff, 14/07/2026, "logs para identificar pq o container está caindo").
- "já há um processo sendo incluído" em processo/criar = trava de concorrência do Projuris. A integração consome 1 mensagem por vez, então a outra inclusão é de outro usuário/sistema.
- Log de auditoria da external API: tabela Postgres `infraestrutura.external_api` (pk = trace_id, path, request, response, status_code). É dela que dá para cruzar trace IDs. Não é log do Projuris.
- Logs dos containers não estão no CloudWatch; precisa ser no host EC2 (docker logs / inspect).

Análise de 2026-10-19 (77 falhas, 17/09–13/10): 48 na external API, 29 no Projuris. Ver [[reference_everest_external_api_repo]].
